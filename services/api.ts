import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000';

export interface Person {
  id: string;
  name: string;
  user_id?: string; // NEW: Track which user this person represents
}

export interface Chore {
  id: string;
  name: string;
  owner_id: string;
  shared_with: string[];
  people: Person[];
  current_person_index: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateChoreRequest {
  name: string;
}

export interface AddPersonRequest {
  name: string;
}

export interface JoinChoreRequest {
  chore_id: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Token management
export const tokenManager = {
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },
};

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  const token = await tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await tokenManager.removeToken();
    }
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

export const authApi = {
  register: async (request: RegisterRequest): Promise<User> => {
    const response = await api.post('/auth/register', request);
    return response.data;
  },

  login: async (request: LoginRequest): Promise<{ access_token: string; token_type: string }> => {
    const response = await api.post('/auth/jwt/login', request, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/jwt/logout');
    } catch (error) {
      // Even if logout fails on server, we should still clear local token
      console.warn('Server logout failed:', error);
    }
    // Always clear the local token
    await tokenManager.removeToken();
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const choreApi = {
  getAllChores: async (): Promise<Chore[]> => {
    const response = await api.get('/api/chores/');
    return response.data;
  },

  getChore: async (choreId: string): Promise<Chore> => {
    const response = await api.get(`/api/chores/${choreId}`);
    return response.data;
  },

  createChore: async (request: CreateChoreRequest): Promise<Chore> => {
    const response = await api.post('/api/chores/', request);
    return response.data;
  },

  deleteChore: async (choreId: string): Promise<void> => {
    await api.delete(`/api/chores/${choreId}`);
  },

  // NEW: Join a chore by ID
  joinChore: async (request: JoinChoreRequest): Promise<Chore> => {
    const response = await api.post('/api/chores/join', request);
    return response.data;
  },

  // NEW: Leave a chore
  leaveChore: async (choreId: string): Promise<void> => {
    await api.post(`/api/chores/${choreId}/leave`);
  },

  addPerson: async (choreId: string, request: AddPersonRequest): Promise<Chore> => {
    const response = await api.post(`/api/chores/${choreId}/people`, request);
    return response.data;
  },

  removePerson: async (choreId: string, personId: string): Promise<Chore> => {
    const response = await api.delete(`/api/chores/${choreId}/people/${personId}`);
    return response.data;
  },

  advanceQueue: async (choreId: string): Promise<Chore> => {
    const response = await api.post(`/api/chores/${choreId}/advance`);
    return response.data;
  },
};