import axios from 'axios';

// Configure your backend URL - change this to your computer's IP for mobile testing
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api' 
  : 'http://your-computer-ip:8000/api';

export interface Person {
  id: string;
  name: string;
  user_id: string;
}

export interface Chore {
  id: string;
  name: string;
  people: Person[];
  current_person_index: number;
  created_by: string;
  created_by_name: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  chore_ids: string[];
}

export interface CreateChoreRequest {
  name: string;
}

export interface AddPersonRequest {
  email: string; // Changed from username to email
}

export interface RegisterRequest {
  email: string;
  full_name: string; // Removed username
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface JoinChoreRequest {
  chore_id: string;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  private get api() {
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      timeout: 15000,
    });
  }

  // Auth endpoints
  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post('/auth/register', request);
    return response.data;
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login', request);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async joinChore(request: JoinChoreRequest): Promise<User> {
    const response = await this.api.post('/auth/join-chore', request);
    return response.data;
  }

  // Chore endpoints
  async getAllChores(): Promise<Chore[]> {
    const response = await this.api.get('/chores/');
    return response.data;
  }

  async getChore(choreId: string): Promise<Chore> {
    const response = await this.api.get(`/chores/${choreId}`);
    return response.data;
  }

  async createChore(request: CreateChoreRequest): Promise<Chore> {
    const response = await this.api.post('/chores/', request);
    return response.data;
  }

  async deleteChore(choreId: string): Promise<void> {
    await this.api.delete(`/chores/${choreId}`);
  }

  async addPersonToChore(choreId: string, request: AddPersonRequest): Promise<Chore> {
    const response = await this.api.post(`/chores/${choreId}/people`, request);
    return response.data;
  }

  async removePersonFromChore(choreId: string, personId: string): Promise<Chore> {
    const response = await this.api.delete(`/chores/${choreId}/people/${personId}`);
    return response.data;
  }

  async advanceQueue(choreId: string): Promise<Chore> {
    const response = await this.api.post(`/chores/${choreId}/advance`);
    return response.data;
  }

  async leaveChore(choreId: string): Promise<void> {
    await this.api.post(`/chores/${choreId}/leave`);
  }
}

// Create singleton instance
export const apiService = new ApiService();