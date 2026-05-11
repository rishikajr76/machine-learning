import type { Metrics, PullRequest, Review, MemoryEntry, AppSettings } from "@/types";

export const mockBuggyCode = `// auth-service.ts — JWT Token Validation
import jwt from 'jsonwebtoken';
import { db } from './database';

export async function validateToken(token: string) {
  // BUG: No try-catch — throws unhandled exception on invalid token
  const decoded = jwt.verify(token, process.env.SECRET_KEY);
  const userId = decoded.userId;
  const user = await db.users.findOne({ id: userId });
  return user;
}

export async function refreshToken(oldToken: string) {
  const user = await validateToken(oldToken);
  const newToken = jwt.sign(
    { userId: user.id },
    process.env.SECRET_KEY,
    // BUG: No expiry set — token never expires
  );
  return newToken;
}`;

export const mockFixedCode = `// auth-service.ts — JWT Token Validation (PATCHED)
import jwt from 'jsonwebtoken';
import { db } from './database';

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) throw new Error('SECRET_KEY env var is not set');

interface JwtPayload { userId: string; iat: number; exp: number; }

export async function validateToken(token: string) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    if (!decoded?.userId) throw new Error('Invalid token payload');
    const user = await db.users.findOne({ id: decoded.userId });
    if (!user) throw new Error('User not found');
    if (user.banned) throw new Error('User account is suspended');
    return user;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) throw new Error('Token has expired');
    if (error instanceof jwt.JsonWebTokenError) throw new Error('Invalid token');
    throw error;
  }
}

export async function refreshToken(oldToken: string) {
  const user = await validateToken(oldToken);
  return jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '7d', algorithm: 'HS256' });
}`;

export const mockMetrics: Metrics = {
  totalReviews: 1247,
  bugsDetected: 3891,
  fixSuccessRate: 94.2,
  avgRefinementLoops: 2.3,
  criticalVulnerabilitiesPrevented: 187,
  reviewActivity: [
    { date: "Apr 25", reviews: 42, fixes: 38, rejections: 4 },
    { date: "Apr 27", reviews: 55, fixes: 48, rejections: 7 },
    { date: "Apr 29", reviews: 61, fixes: 57, rejections: 4 },
    { date: "May 01", reviews: 83, fixes: 79, rejections: 4 },
    { date: "May 03", reviews: 91, fixes: 87, rejections: 4 },
    { date: "May 05", reviews: 102, fixes: 96, rejections: 6 },
    { date: "May 07", reviews: 115, fixes: 109, rejections: 6 },
  ],
  bugCategories: [
    { name: "Null Pointer", value: 28, color: "hsl(270,80%,65%)" },
    { name: "Array Bounds", value: 22, color: "hsl(220,80%,60%)" },
    { name: "Race Condition", value: 18, color: "hsl(190,70%,60%)" },
    { name: "SQL Injection", value: 12, color: "hsl(0,70%,60%)" },
    { name: "Memory Leak", value: 11, color: "hsl(140,60%,55%)" },
    { name: "Logic Error", value: 9, color: "hsl(340,70%,60%)" },
  ],
  agentPerformance: [
    { agent: "Proposer", accuracy: 87, speed: 92, confidence: 84 },
    { agent: "Critic", accuracy: 91, speed: 78, confidence: 88 },
    { agent: "Evaluator", accuracy: 95, speed: 85, confidence: 93 },
  ],
};

export const mockReview: Review = {
  id: "rev_01",
  status: "approved",
  createdAt: "2026-05-11T06:00:00Z",
  updatedAt: "2026-05-11T06:04:22Z",
  totalIterations: 2,
  riskScore: 87,
  files: [{ path: "src/auth-service.ts", language: "typescript", content: mockBuggyCode, additions: 0, deletions: 8 }],
  securityWarnings: [
    { id: "s1", type: "security", severity: "critical", line: 7, message: "Unhandled jwt.verify exception leaks stack trace", suggestion: "Wrap in try-catch" },
    { id: "s2", type: "security", severity: "critical", line: 6, message: "SECRET_KEY may be undefined", suggestion: "Validate env var at startup" },
  ],
  proposer: {
    agentId: "proposer", status: "done", confidence: 82, iterationCount: 2, durationMs: 4120,
    thoughts: {
      observation: "validateToken calls jwt.verify without try-catch. SECRET_KEY is unvalidated.",
      hypothesis: "Attacker can crash the server by sending a malformed JWT; undefined SECRET_KEY silently fails.",
      plan: "1. Add startup SECRET_KEY guard. 2. Wrap jwt.verify in typed try-catch. 3. Validate payload shape. 4. Add user ban check. 5. Set token expiry.",
      code: mockFixedCode,
    },
    reasoning: [
      { id: "r1", label: "Scanning", content: "Analyzing 28 lines of auth-service.ts...", timestamp: Date.now() - 4000 },
      { id: "r2", label: "Issue Found", content: "Line 7: jwt.verify without error handling.", timestamp: Date.now() - 3000 },
      { id: "r3", label: "Issue Found", content: "process.env.SECRET_KEY not validated before use.", timestamp: Date.now() - 2200 },
      { id: "r4", label: "Patch Ready", content: "Generated fix covering 5 vulnerabilities.", timestamp: Date.now() - 800 },
    ],
    patch: mockFixedCode,
  },
  critic: {
    agentId: "critic", status: "done", confidence: 91, iterationCount: 1, durationMs: 2880,
    thoughts: {
      observation: "Reviewing the Proposer's patch for edge cases...",
      hypothesis: "Main flow is correct. Must verify 5 adversarial scenarios.",
      plan: "Test: expired token, undefined SECRET_KEY, banned user, missing userId, concurrent refresh.",
      code: "// All 5 edge cases handled after v2 patch.",
    },
    reasoning: [
      { id: "c1", label: "Test 1", content: "Expired token → jwt.TokenExpiredError caught ✓", timestamp: Date.now() - 2600 },
      { id: "c2", label: "Test 2", content: "Undefined SECRET_KEY → startup guard throws ✓", timestamp: Date.now() - 2000 },
      { id: "c3", label: "Test 3", content: "Banned user token → 'User account is suspended' ✓", timestamp: Date.now() - 1400 },
      { id: "c4", label: "Race Check", content: "No shared mutable state — concurrent refresh safe ✓", timestamp: Date.now() - 700 },
    ],
    issues: [{ id: "ci1", type: "logic", severity: "medium", line: 24, message: "Caller should handle TokenExpiredError explicitly" }],
  },
  evaluator: {
    agentId: "evaluator", status: "done", confidence: 96, iterationCount: 1, durationMs: 1540, verdict: "approve",
    thoughts: {
      observation: "Cross-referencing Proposer v2 patch with Critic adversarial tests.",
      hypothesis: "All 5 tests pass. One minor documentation note.",
      plan: "Approve with caller-level error handling note.",
      code: "// VERDICT: APPROVE",
    },
    reasoning: [
      { id: "e1", label: "Cross-Reference", content: "All 5 Critic adversarial tests pass against patch v2 ✓", timestamp: Date.now() - 1400 },
      { id: "e2", label: "Risk Score", content: "Risk score reduced from 87 → 12 after patch.", timestamp: Date.now() - 800 },
      { id: "e3", label: "Verdict", content: "APPROVE — Patch is production-ready.", timestamp: Date.now() - 100 },
    ],
  },
  finalPatch: mockFixedCode,
};

export const mockPullRequests: PullRequest[] = [
  {
    id: "pr_01", number: 247,
    title: "feat: Add JWT token refresh with sliding expiry",
    description: "Implements secure token refresh. Addresses security audit feedback.",
    author: { name: "Alex Chen", avatar: "", username: "alexchen" },
    branch: { head: "feat/jwt-refresh", base: "main" },
    status: "approved", createdAt: "2026-05-11T04:30:00Z", updatedAt: "2026-05-11T06:04:22Z",
    labels: ["security", "backend"], files: mockReview.files, review: mockReview, comments: [],
  },
  {
    id: "pr_02", number: 246,
    title: "fix: Resolve race condition in payment processing queue",
    description: "Adds mutex lock around payment state machine transitions.",
    author: { name: "Sara Malik", avatar: "", username: "smalik" },
    branch: { head: "fix/payment-race", base: "main" },
    status: "needs_refinement", createdAt: "2026-05-10T14:00:00Z", updatedAt: "2026-05-11T05:10:00Z",
    labels: ["critical", "payments"], files: [], comments: [],
  },
  {
    id: "pr_03", number: 245,
    title: "refactor: Migrate user data layer to repository pattern",
    description: "Decouples ORM from business logic for testability.",
    author: { name: "Jordan Lee", avatar: "", username: "jlee" },
    branch: { head: "refactor/repo-pattern", base: "main" },
    status: "in_progress", createdAt: "2026-05-10T09:20:00Z", updatedAt: "2026-05-10T18:45:00Z",
    labels: ["refactor"], files: [], comments: [],
  },
  {
    id: "pr_04", number: 244,
    title: "security: Sanitize all user inputs in search API",
    description: "Prevents SQL injection and XSS via input sanitization middleware.",
    author: { name: "Maya Patel", avatar: "", username: "mpatel" },
    branch: { head: "security/sanitize-inputs", base: "main" },
    status: "pending", createdAt: "2026-05-09T11:00:00Z", updatedAt: "2026-05-09T11:00:00Z",
    labels: ["security", "critical"], files: [], comments: [],
  },
];

export const mockMemoryEntries: MemoryEntry[] = [
  { id: "m1", title: "JWT Secret Key Null Guard", description: "Validate SECRET_KEY before use", bugPattern: "process.env.SECRET_KEY without null check", fix: "Add startup guard: if (!SECRET_KEY) throw...", language: "TypeScript", tags: ["security","jwt"], createdAt: "2026-04-20T10:00:00Z", usageCount: 14 },
  { id: "m2", title: "Array Bounds Off-By-One", description: "Loop condition uses <= instead of <", bugPattern: "for (let i=0; i<=arr.length; i++)", fix: "Change <= to <", language: "JavaScript", tags: ["logic","arrays"], createdAt: "2026-04-18T08:30:00Z", usageCount: 31 },
  { id: "m3", title: "Async Missing Error Boundary", description: "Async Express handler without try-catch", bugPattern: "app.get('/r', async(req,res)=>{ await riskyFn(); })", fix: "Add asyncHandler or try-catch", language: "JavaScript", tags: ["async","express"], createdAt: "2026-04-15T14:00:00Z", usageCount: 22 },
  { id: "m4", title: "Race Condition in Shared State", description: "Non-atomic read-modify-write", bugPattern: "counter++; // in concurrent callbacks", fix: "Use Atomics.add() or mutex queue", language: "TypeScript", tags: ["concurrency","race"], createdAt: "2026-04-12T09:00:00Z", usageCount: 9 },
  { id: "m5", title: "SQL Injection via Concatenation", description: "User input in raw SQL", bugPattern: "db.query('SELECT * FROM users WHERE id = '+id)", fix: "Use parameterized queries", language: "JavaScript", tags: ["security","sql"], createdAt: "2026-04-10T11:30:00Z", usageCount: 18 },
  { id: "m6", title: "Memory Leak in Event Listeners", description: "Listener added without cleanup", bugPattern: "window.addEventListener('resize', fn)", fix: "return () => window.removeEventListener('resize', fn)", language: "React/TS", tags: ["memory","react"], createdAt: "2026-04-08T16:00:00Z", usageCount: 27 },
];

export const defaultSettings: AppSettings = {
  proposer: { model: "gpt-4o", temperature: 0.3, maxTokens: 4096, loopDepth: 3, criticAggressiveness: 7 },
  critic: { model: "claude-3-5-sonnet", temperature: 0.5, maxTokens: 2048, loopDepth: 3, criticAggressiveness: 9 },
  evaluator: { model: "gpt-4o", temperature: 0.1, maxTokens: 1024, loopDepth: 1, criticAggressiveness: 5 },
  theme: "cyberpunk", streamingEnabled: true, autoRefine: true,
};
