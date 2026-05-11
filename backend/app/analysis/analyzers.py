"""
Static analysis pipeline — runs pylint, bandit, and mypy against
a code snippet by writing it to a temp file and invoking the tools
as subprocess calls (non-blocking via asyncio.create_subprocess_exec).
"""
from __future__ import annotations

import asyncio
import os
import tempfile
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class AnalysisIssue:
    tool: str
    severity: str     # error | warning | info
    message: str
    line: Optional[int] = None
    column: Optional[int] = None
    code: Optional[str] = None


@dataclass
class AnalysisResult:
    success: bool
    issues: List[AnalysisIssue] = field(default_factory=list)
    raw_output: Dict[str, str] = field(default_factory=dict)
    error: Optional[str] = None


async def _run_subprocess(cmd: List[str], cwd: Optional[str] = None) -> tuple[int, str, str]:
    """Run a command and return (returncode, stdout, stderr)."""
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=cwd,
    )
    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=60)
    return proc.returncode, stdout.decode(errors="replace"), stderr.decode(errors="replace")


async def run_pylint(file_path: str) -> List[AnalysisIssue]:
    """Run pylint and parse JSON output."""
    _, stdout, _ = await _run_subprocess(
        ["pylint", "--output-format=json", "--score=no", file_path]
    )
    issues: List[AnalysisIssue] = []
    try:
        import json
        data = json.loads(stdout) if stdout.strip() else []
        for item in data:
            issues.append(AnalysisIssue(
                tool="pylint",
                severity=_pylint_severity(item.get("type", "info")),
                message=item.get("message", ""),
                line=item.get("line"),
                column=item.get("column"),
                code=item.get("message-id"),
            ))
    except Exception:
        pass
    return issues


async def run_bandit(file_path: str) -> List[AnalysisIssue]:
    """Run bandit security scanner and parse JSON output."""
    _, stdout, _ = await _run_subprocess(
        ["bandit", "-f", "json", "-q", file_path]
    )
    issues: List[AnalysisIssue] = []
    try:
        import json
        data = json.loads(stdout) if stdout.strip() else {}
        for result in data.get("results", []):
            issues.append(AnalysisIssue(
                tool="bandit",
                severity=result.get("issue_severity", "medium").lower(),
                message=result.get("issue_text", ""),
                line=result.get("line_number"),
                code=result.get("test_id"),
            ))
    except Exception:
        pass
    return issues


async def run_mypy(file_path: str) -> List[AnalysisIssue]:
    """Run mypy type checker."""
    _, stdout, _ = await _run_subprocess(
        ["mypy", "--no-error-summary", "--show-column-numbers", file_path]
    )
    issues: List[AnalysisIssue] = []
    for line in stdout.splitlines():
        parts = line.split(":", 3)
        if len(parts) >= 4:
            try:
                lineno = int(parts[1].strip())
                col = int(parts[2].strip())
                rest = parts[3].strip()
                sev, msg = rest.split(":", 1) if ":" in rest else ("error", rest)
                issues.append(AnalysisIssue(
                    tool="mypy",
                    severity=sev.strip(),
                    message=msg.strip(),
                    line=lineno,
                    column=col,
                ))
            except (ValueError, IndexError):
                pass
    return issues


async def analyze_code(code: str, language: str = "python") -> AnalysisResult:
    """
    Run the full static analysis suite on a code snippet.

    Currently supports Python (pylint + bandit + mypy).
    For other languages, returns an empty result.
    """
    if language.lower() != "python":
        return AnalysisResult(success=True, issues=[], error="Static analysis only supports Python currently")

    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False, encoding="utf-8") as f:
        f.write(code)
        tmp_path = f.name

    try:
        pylint_issues, bandit_issues, mypy_issues = await asyncio.gather(
            run_pylint(tmp_path),
            run_bandit(tmp_path),
            run_mypy(tmp_path),
            return_exceptions=True,
        )

        all_issues: List[AnalysisIssue] = []
        for result in (pylint_issues, bandit_issues, mypy_issues):
            if isinstance(result, list):
                all_issues.extend(result)

        return AnalysisResult(success=True, issues=all_issues)
    except Exception as exc:
        return AnalysisResult(success=False, error=str(exc))
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def _pylint_severity(pylint_type: str) -> str:
    return {
        "error": "error",
        "warning": "warning",
        "convention": "info",
        "refactor": "info",
        "fatal": "error",
    }.get(pylint_type, "info")
