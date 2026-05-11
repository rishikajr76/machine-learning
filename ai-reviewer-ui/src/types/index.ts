// ============================================================
// Core Domain Types for the AI Code Review System
// ============================================================

export type AgentStatus = "idle" | "thinking" | "streaming" | "done" | "error";
export type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";
export type ReviewStatus = "pending" | "in_progress" | "approved" | "rejected" | "needs_refinement";
export type ModelProvider = "gpt-4o" | "claude-3-5-sonnet" | "deepseek-coder" | "codellama";

// ============================================================
// Agent Types
// ============================================================

export interface ReasoningStep {
  id: string;
  label: string;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface AgentThought {
  observation: string;
  hypothesis: string;
  plan: string;
  code: string;
}

export interface AgentResult {
  agentId: "proposer" | "critic" | "evaluator";
  status: AgentStatus;
  thoughts: AgentThought;
  reasoning: ReasoningStep[];
  patch?: string;
  confidence: number; // 0-100
  issues?: DetectedIssue[];
  verdict?: "approve" | "refine" | "reject";
  iterationCount: number;
  durationMs: number;
}

// ============================================================
// Code Review Types
// ============================================================

export interface DetectedIssue {
  id: string;
  type: "bug" | "security" | "performance" | "style" | "logic";
  severity: SeverityLevel;
  line: number;
  column?: number;
  message: string;
  suggestion?: string;
}

export interface CodeFile {
  path: string;
  language: string;
  content: string;
  additions?: number;
  deletions?: number;
  issues?: DetectedIssue[];
}

export interface GitDiff {
  oldContent: string;
  newContent: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: "add" | "remove" | "context";
  content: string;
  lineNumber: number;
}

export interface Review {
  id: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  files: CodeFile[];
  proposer: AgentResult;
  critic: AgentResult;
  evaluator: AgentResult;
  finalPatch?: string;
  totalIterations: number;
  riskScore: number; // 0-100
  securityWarnings: DetectedIssue[];
}

// ============================================================
// Pull Request Types
// ============================================================

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  branch: {
    head: string;
    base: string;
  };
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  files: CodeFile[];
  review?: Review;
  labels: string[];
  comments: PRComment[];
}

export interface PRComment {
  id: string;
  author: string;
  content: string;
  line?: number;
  filePath?: string;
  type: "review" | "inline" | "suggestion";
  severity?: SeverityLevel;
  createdAt: string;
}

// ============================================================
// Analytics / Metrics Types
// ============================================================

export interface Metrics {
  totalReviews: number;
  bugsDetected: number;
  fixSuccessRate: number; // percentage
  avgRefinementLoops: number;
  criticalVulnerabilitiesPrevented: number;
  reviewActivity: ReviewActivityPoint[];
  bugCategories: BugCategoryData[];
  agentPerformance: AgentPerformanceData[];
}

export interface ReviewActivityPoint {
  date: string;
  reviews: number;
  fixes: number;
  rejections: number;
}

export interface BugCategoryData {
  name: string;
  value: number;
  color: string;
}

export interface AgentPerformanceData {
  agent: string;
  accuracy: number;
  speed: number;
  confidence: number;
}

// ============================================================
// Memory / Vector DB Types
// ============================================================

export interface MemoryEntry {
  id: string;
  title: string;
  description: string;
  bugPattern: string;
  fix: string;
  language: string;
  tags: string[];
  similarity?: number; // 0-1 when searching
  createdAt: string;
  usageCount: number;
}

// ============================================================
// Settings Types
// ============================================================

export interface AgentSettings {
  model: ModelProvider;
  temperature: number;
  maxTokens: number;
  loopDepth: number;
  criticAggressiveness: number; // 1-10
}

export interface AppSettings {
  proposer: AgentSettings;
  critic: AgentSettings;
  evaluator: AgentSettings;
  theme: "dark" | "cyberpunk";
  streamingEnabled: boolean;
  autoRefine: boolean;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface StreamingToken {
  type: "token" | "reasoning_step" | "patch" | "done" | "error";
  content: string;
  agentId?: "proposer" | "critic" | "evaluator";
  stepId?: string;
}

export interface ReviewRequest {
  files: CodeFile[];
  prNumber?: number;
  context?: string;
  settings?: Partial<AppSettings>;
}
