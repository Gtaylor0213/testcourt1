import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

// API helper functions
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-76218beb`;

export interface User {
  id: string;
  email: string;
  fullName: string;
  userType: 'player' | 'admin';
  preferences?: {
    notifications: boolean;
    timezone: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  address?: string;
  courts: Array<{
    name: string;
    type: 'tennis' | 'pickleball';
  }>;
  createdAt?: string;
  status?: string;
}

export interface Booking {
  id: string;
  userId: string;
  facilityId: string;
  court: string;
  date: string;
  time: string;
  duration: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  session?: any;
  user: User;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
    ...options,
  };

  console.log(`API Request: ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new ApiError(response.status, errorData.error || 'Request failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('API Request failed:', error);
    throw new ApiError(500, 'Network request failed');
  }
}

// Health check function
export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiRequest('/health');
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Authentication functions
export const auth = {
  async register(email: string, password: string, fullName: string, userType: 'player' | 'admin' = 'player'): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, userType }),
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getProfile(token: string): Promise<{ user: User }> {
    return apiRequest<{ user: User }>('/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async updateProfile(token: string, updates: Partial<User>): Promise<{ user: User }> {
    return apiRequest<{ user: User }>('/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getSession() {
    return await supabase.auth.getSession();
  }
};

// Facilities functions
export const facilities = {
  async getAll(token: string): Promise<{ facilities: Facility[] }> {
    return apiRequest<{ facilities: Facility[] }>('/facilities', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async create(token: string, facility: Omit<Facility, 'id' | 'createdAt' | 'status'>): Promise<{ facility: Facility }> {
    return apiRequest<{ facility: Facility }>('/facilities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(facility),
    });
  },
};

// Bookings functions
export const bookings = {
  async getUserBookings(token: string): Promise<{ bookings: Booking[] }> {
    return apiRequest<{ bookings: Booking[] }>('/bookings', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async create(token: string, booking: Omit<Booking, 'id' | 'userId' | 'status' | 'createdAt'>): Promise<{ booking: Booking }> {
    return apiRequest<{ booking: Booking }>('/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(booking),
    });
  },

  async getFacilityBookings(token: string, facilityId: string, date: string): Promise<{ bookings: Booking[] }> {
    return apiRequest<{ bookings: Booking[] }>(`/facilities/${facilityId}/bookings/${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

export { ApiError };