import { create } from 'zustand';
import { 
  Review, 
  AgentStatus, 
  AgentResult, 
  ReasoningStep, 
  PullRequest,
  AppSettings,
  AgentThought
} from '@/types';
import { mockReview, mockPullRequests, defaultSettings } from '@/lib/mock-data';

interface ReviewState {
  activeReview: Review | null;
  pullRequests: PullRequest[];
  settings: AppSettings;
  isAnalyzing: boolean;
  
  // Actions
  setActiveReview: (review: Review | null) => void;
  updateAgentStatus: (agentId: 'proposer' | 'critic' | 'evaluator', status: AgentStatus) => void;
  addReasoningStep: (agentId: 'proposer' | 'critic' | 'evaluator', step: ReasoningStep) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // WebSocket event handlers
  handleWSEvent: (event: any) => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  activeReview: null,
  pullRequests: mockPullRequests,
  settings: defaultSettings,
  isAnalyzing: false,

  setActiveReview: (review) => set({ activeReview: review }),
  
  updateAgentStatus: (agentId, status) => set((state) => {
    if (!state.activeReview) return state;
    return {
      activeReview: {
        ...state.activeReview,
        [agentId]: {
          ...state.activeReview[agentId],
          status
        }
      }
    };
  }),

  addReasoningStep: (agentId, step) => set((state) => {
    if (!state.activeReview) return state;
    const agent = state.activeReview[agentId];
    return {
      activeReview: {
        ...state.activeReview,
        [agentId]: {
          ...agent,
          reasoning: [...agent.reasoning, step]
        }
      }
    };
  }),

  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),

  handleWSEvent: (event) => set((state) => {
    if (!state.activeReview) return state;
    
    const { type, iteration, ...payload } = event;
    
    // Map backend event types to frontend agent keys
    const agentMap: Record<string, 'proposer' | 'critic' | 'evaluator'> = {
      'propose': 'proposer',
      'critique': 'critic',
      'evaluate': 'evaluator'
    };

    const agentId = agentMap[type];
    if (!agentId) return state;

    const currentAgent = state.activeReview[agentId];
    
    const newStep: ReasoningStep = {
      id: Math.random().toString(36).substr(2, 9),
      label: type.toUpperCase(),
      content: payload.summary || payload.verdict || "Processing...",
      timestamp: Date.now()
    };

    return {
      activeReview: {
        ...state.activeReview,
        status: type === 'evaluate' ? (payload.verdict === 'PASS' ? 'approved' : 'needs_refinement') : 'in_progress',
        totalIterations: iteration || state.activeReview.totalIterations,
        [agentId]: {
          ...currentAgent,
          status: 'done',
          iterationCount: iteration || currentAgent.iterationCount,
          reasoning: [...currentAgent.reasoning, newStep],
          verdict: payload.verdict?.toLowerCase(),
          confidence: payload.quality_score || currentAgent.confidence
        }
      }
    };
  }),
}));
