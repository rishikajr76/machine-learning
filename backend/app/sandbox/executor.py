"""
Local Sandbox Executor — runs code snippets as local subprocesses.
WARNING: This is NOT secure. Code runs with the same permissions as the backend.
Use only for development or in a dedicated virtual machine.
"""
from __future__ import annotations

import asyncio
import os
import tempfile
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

# Language → executable
_LANG_EXE: Dict[str, str] = {
    "python": "python",
    "javascript": "node",
    "typescript": "ts-node",
    "go": "go",
}

# Language → file extension
_LANG_EXT: Dict[str, str] = {
    "python": "py",
    "javascript": "js",
    "typescript": "ts",
    "go": "go",
}

@dataclass
class SandboxResult:
    success: bool
    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool = False
    error: Optional[str] = None
    execution_time_ms: int = 0

class SandboxExecutor:
    """
    Executes code snippets locally as a subprocess.
    No isolation. No resource limits.
    """

    async def execute(
        self,
        code: str,
        language: str = "python",
        test_code: Optional[str] = None,
        timeout: Optional[int] = None,
    ) -> SandboxResult:
        lang = language.lower()
        if lang not in _LANG_EXE:
            return SandboxResult(
                success=False, stdout="", stderr=f"Unsupported language: {language}",
                exit_code=-1, error=f"Unsupported language: {language}"
            )

        exe = _LANG_EXE[lang]
        ext = _LANG_EXT[ext] if lang in _LANG_EXT else "txt"
        timeout_s = timeout or settings.SANDBOX_TIMEOUT

        combined = code
        if test_code:
            combined = f"{code}\n\n{test_code}"

        start = time.monotonic()
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", mode="w", delete=False, encoding="utf-8") as f:
            f.write(combined)
            tmp_path = f.name

        try:
            cmd = [exe, tmp_path]
            if lang == "go":
                cmd = ["go", "run", tmp_path]

            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(proc.communicate(), timeout=timeout_s)
                elapsed_ms = int((time.monotonic() - start) * 1000)
                
                stdout = stdout_bytes.decode(errors="replace")
                stderr = stderr_bytes.decode(errors="replace")
                
                return SandboxResult(
                    success=proc.returncode == 0,
                    stdout=stdout,
                    stderr=stderr,
                    exit_code=proc.returncode or 0,
                    execution_time_ms=elapsed_ms
                )
            except asyncio.TimeoutError:
                proc.kill()
                elapsed_ms = int((time.monotonic() - start) * 1000)
                return SandboxResult(
                    success=False, stdout="", stderr="Execution timed out",
                    exit_code=-1, timed_out=True, execution_time_ms=elapsed_ms
                )

        except Exception as exc:
            elapsed_ms = int((time.monotonic() - start) * 1000)
            return SandboxResult(
                success=False, stdout="", stderr=str(exc),
                exit_code=-1, error=str(exc), execution_time_ms=elapsed_ms
            )
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

sandbox_executor = SandboxExecutor()
