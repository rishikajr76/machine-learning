import { create } from 'zustand';
import { 
  Review, 
  AgentStatus, 
  AgentResult, 
  ReasoningStep, 
  PullRequest,
  AppSettings
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
}));
