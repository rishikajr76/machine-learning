import { 
  Review, 
  PullRequest, 
  Metrics, 
  MemoryEntry,
  ReviewRequest
} from '@/types';
import { 
  mockReview, 
  mockPullRequests, 
  mockMetrics, 
  mockMemoryEntries 
} from '@/lib/mock-data';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  getMetrics: async (): Promise<Metrics> => {
    await delay(500);
    return mockMetrics;
  },

  getPullRequests: async (): Promise<PullRequest[]> => {
    await delay(800);
    return mockPullRequests;
  },

  getPullRequest: async (id: string): Promise<PullRequest | undefined> => {
    await delay(400);
    return mockPullRequests.find(pr => pr.id === id);
  },

  getReview: async (id: string): Promise<Review | undefined> => {
    await delay(600);
    return mockReview; // Returning mock for demo
  },

  startReview: async (request: ReviewRequest): Promise<Review> => {
    await delay(1000);
    return {
      ...mockReview,
      id: `rev_${Math.random().toString(36).substr(2, 9)}`,
      files: request.files,
      status: 'pending',
    };
  },

  searchMemory: async (query: string): Promise<MemoryEntry[]> => {
    await delay(700);
    return mockMemoryEntries.filter(entry => 
      entry.title.toLowerCase().includes(query.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }
};
