import axios from 'axios';

// Configure your backend URL - change this to your computer's IP for mobile testing
const API_BASE_URL = 'http://localhost:8000/api';

export interface Person {
  id: string;
  name: string;
}

export interface Chore {
  id: string;
  name: string;
  people: Person[];
  current_person_index: number; // Backend uses snake_case
}

export interface CreateChoreRequest {
  name: string;
}

export interface AddPersonRequest {
  name: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

export const choreApi = {
  // Get all chores
  getAllChores: async (): Promise<Chore[]> => {
    const response = await api.get('/chores/');
    return response.data;
  },

  // Get specific chore
  getChore: async (choreId: string): Promise<Chore> => {
    const response = await api.get(`/chores/${choreId}`);
    return response.data;
  },

  // Create new chore
  createChore: async (request: CreateChoreRequest): Promise<Chore> => {
    const response = await api.post('/chores/', request);
    return response.data;
  },

  // Delete chore
  deleteChore: async (choreId: string): Promise<void> => {
    await api.delete(`/chores/${choreId}`);
  },

  // Add person to chore
  addPerson: async (choreId: string, request: AddPersonRequest): Promise<Chore> => {
    const response = await api.post(`/chores/${choreId}/people`, request);
    return response.data;
  },

  // Remove person from chore
  removePerson: async (choreId: string, personId: string): Promise<Chore> => {
    const response = await api.delete(`/chores/${choreId}/people/${personId}`);
    return response.data;
  },

  // Advance queue
  advanceQueue: async (choreId: string): Promise<Chore> => {
    const response = await api.post(`/chores/${choreId}/advance`);
    return response.data;
  },
};