import { 
  Review, 
  PullRequest, 
  Metrics, 
  MemoryEntry,
  ReviewRequest,
  ApiResponse
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Helper for authenticated requests
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Handle unauthorized - maybe redirect to login or clear token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
};

export const apiService = {
  // --- Auth ---
  login: async (credentials: any): Promise<{ access_token: string }> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    return data;
  },

  // --- Metrics ---
  getMetrics: async (): Promise<Metrics> => {
    // Backend health/metrics endpoint
    return fetchWithAuth('/metrics');
  },

  // --- Reviews ---
  getReviews: async (): Promise<Review[]> => {
    return fetchWithAuth('/reviews/');
  },

  getReview: async (id: string): Promise<Review> => {
    return fetchWithAuth(`/reviews/${id}`);
  },

  startReview: async (request: ReviewRequest): Promise<Review> => {
    // Mapping frontend request to backend ReviewCreate schema
    const backendPayload = {
      repository: "manual",
      branch: "main",
      code_snippet: request.files[0]?.content || "",
      error_description: request.context || ""
    };

    return fetchWithAuth('/reviews/', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    });
  },

  // --- Memory ---
  searchMemory: async (query: string): Promise<MemoryEntry[]> => {
    return fetchWithAuth('/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query, n_results: 5 }),
    });
  },

  getMemoryCount: async (): Promise<{ count: number }> => {
    return fetchWithAuth('/memory/count');
  }
};
