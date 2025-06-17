import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { websocketService } from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';

export interface Person {
  id: string;
  name: string;
  user_id: string;
}

export interface Chore {
  id: string;
  name: string;
  people: Person[];
  currentPersonIndex: number;
  createdBy: string;
  createdByName: string;
}

export const useChores = () => {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, token, user } = useAuth();

  // Convert backend format to frontend format
  const convertChore = (backendChore: any): Chore => ({
    id: backendChore.id,
    name: backendChore.name,
    people: backendChore.people,
    currentPersonIndex: backendChore.current_person_index,
    createdBy: backendChore.created_by,
    createdByName: backendChore.created_by_name,
  });

  // Check if current user is participant in a chore
  const isUserParticipant = (chore: Chore): boolean => {
    return user ? chore.people.some(person => person.user_id === user.id) : false;
  };

  // Load chores from API
  const loadChores = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedChores = await apiService.getAllChores();
      
      // Double-check filtering on frontend (backend should already filter)
      const userChores = fetchedChores
        .map(convertChore)
        .filter(chore => isUserParticipant(chore));
      
      setChores(userChores);
    } catch (err) {
      setError('Failed to load chores');
      console.error('Error loading chores:', err);
    } finally {
      setLoading(false);
    }
  };

  // Setup WebSocket listeners
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setChores([]);
      setLoading(false);
      return;
    }

    loadChores();
    
    // Connect to WebSocket
    websocketService.connect('ws://localhost:8000/ws');

    // Listen for real-time updates
    const handleChoreCreated = (data: any) => {
      const newChore = convertChore(data.chore);
      // Only add if current user is a participant
      if (isUserParticipant(newChore)) {
        setChores(prev => [...prev, newChore]);
      }
    };

    const handleChoreDeleted = (data: any) => {
      setChores(prev => prev.filter(chore => chore.id !== data.chore_id));
    };

    const handleChoreUpdated = (data: any) => {
      const updatedChore = convertChore(data.chore);
      
      setChores(prev => {
        // If user is no longer a participant, remove the chore
        if (!isUserParticipant(updatedChore)) {
          return prev.filter(chore => chore.id !== data.chore_id);
        }
        
        // If user is a participant, update or add the chore
        const existingIndex = prev.findIndex(chore => chore.id === data.chore_id);
        if (existingIndex >= 0) {
          const newChores = [...prev];
          newChores[existingIndex] = updatedChore;
          return newChores;
        } else {
          return [...prev, updatedChore];
        }
      });
    };

    websocketService.addEventListener('chore_created', handleChoreCreated);
    websocketService.addEventListener('chore_deleted', handleChoreDeleted);
    websocketService.addEventListener('person_added', handleChoreUpdated);
    websocketService.addEventListener('person_removed', handleChoreUpdated);
    websocketService.addEventListener('queue_advanced', handleChoreUpdated);

    return () => {
      websocketService.removeEventListener('chore_created', handleChoreCreated);
      websocketService.removeEventListener('chore_deleted', handleChoreDeleted);
      websocketService.removeEventListener('person_added', handleChoreUpdated);
      websocketService.removeEventListener('person_removed', handleChoreUpdated);
      websocketService.removeEventListener('queue_advanced', handleChoreUpdated);
      websocketService.disconnect();
    };
  }, [isAuthenticated, token, user]);

  const createChore = async (name: string) => {
    try {
      await apiService.createChore({ name });
      // WebSocket will handle updating the state
    } catch (err) {
      setError('Failed to create chore');
      throw err;
    }
  };

  const deleteChore = async (id: string) => {
    try {
      await apiService.deleteChore(id);
      // WebSocket will handle updating the state
    } catch (err) {
      setError('Failed to delete chore');
      throw err;
    }
  };

  const addPersonToChore = async (choreId: string, email: string) => {
    try {
      await apiService.addPersonToChore(choreId, { email });
      // WebSocket will handle updating the state
    } catch (err) {
      setError('Failed to add person');
      throw err;
    }
  };

  const removePersonFromChore = async (choreId: string, personId: string) => {
    try {
      await apiService.removePersonFromChore(choreId, personId);
      // WebSocket will handle updating the state
    } catch (err) {
      setError('Failed to remove person');
      throw err;
    }
  };

  const advanceQueue = async (choreId: string) => {
    try {
      await apiService.advanceQueue(choreId);
      // WebSocket will handle updating the state
    } catch (err) {
      setError('Failed to advance queue');
      throw err;
    }
  };

  const leaveChore = async (choreId: string) => {
    try {
      await apiService.leaveChore(choreId);
      // WebSocket will handle updating the state
    } catch (err) {
      setError('Failed to leave chore');
      throw err;
    }
  };

  const joinChore = async (choreId: string) => {
    try {
      await apiService.joinChore({ chore_id: choreId });
      // Refresh chores after joining
      await loadChores();
    } catch (err) {
      setError('Failed to join chore');
      throw err;
    }
  };

  const getChoreById = (id: string) => {
    return chores.find(chore => chore.id === id);
  };

  return {
    chores,
    loading,
    error,
    createChore,
    deleteChore,
    addPersonToChore,
    removePersonFromChore,
    advanceQueue,
    leaveChore,
    joinChore,
    getChoreById,
    refreshChores: loadChores,
  };
};