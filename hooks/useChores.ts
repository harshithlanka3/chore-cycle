import { useState, useEffect } from 'react';
import { choreApi } from '../services/api';
import { websocketService } from '../services/websocket';

export interface Person {
  id: string;
  name: string;
}

export interface Chore {
  id: string;
  name: string;
  people: Person[];
  currentPersonIndex: number; // Convert from current_person_index
}

export const useChores = () => {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert backend format to frontend format
  const convertChore = (backendChore: any): Chore => ({
    id: backendChore.id,
    name: backendChore.name,
    people: backendChore.people,
    currentPersonIndex: backendChore.current_person_index,
  });

  // Load chores from API
  const loadChores = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedChores = await choreApi.getAllChores();
      setChores(fetchedChores.map(convertChore));
    } catch (err) {
      setError('Failed to load chores');
      console.error('Error loading chores:', err);
    } finally {
      setLoading(false);
    }
  };

  // Setup WebSocket listeners
  useEffect(() => {
    loadChores();
    
    // Connect to WebSocket
    websocketService.connect();

    // Listen for real-time updates
    const handleChoreCreated = (data: any) => {
      const newChore = convertChore(data.chore);
      setChores(prev => [...prev, newChore]);
    };

    const handleChoreDeleted = (data: any) => {
      setChores(prev => prev.filter(chore => chore.id !== data.chore_id));
    };

    const handleChoreUpdated = (data: any) => {
      const updatedChore = convertChore(data.chore);
      setChores(prev => prev.map(chore => 
        chore.id === data.chore_id ? updatedChore : chore
      ));
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
  }, []);

  const createChore = async (name: string) => {
    try {
      await choreApi.createChore({ name });
      // WebSocket will handle updating the state
    } catch (err) {
      setError('Failed to create chore');
      throw err;
    }
  };

  const deleteChore = async (id: string) => {
    try {
      await choreApi.deleteChore(id);
      // WebSocket will handle updating the state
    } catch (err) {
      setError('Failed to delete chore');
      throw err;
    }
  };

  const addPersonToChore = async (choreId: string, personName: string) => {
    try {
      await choreApi.addPerson(choreId, { name: personName });
      // WebSocket will handle updating the state
    } catch (err) {
      setError('Failed to add person');
      throw err;
    }
  };

  const removePersonFromChore = async (choreId: string, personId: string) => {
    try {
      await choreApi.removePerson(choreId, personId);
      // WebSocket will handle updating the state
    } catch (err) {
      setError('Failed to remove person');
      throw err;
    }
  };

  const advanceQueue = async (choreId: string) => {
    try {
      await choreApi.advanceQueue(choreId);
      // WebSocket will handle updating the state
    } catch (err) {
      setError('Failed to advance queue');
      throw err;
    }
  };

  const getChoreById = (id: string) => {
    return chores.find(chore => chore.id === id);
  };

  // Note: reorderPeopleInChore is not implemented in the backend yet
  const reorderPeopleInChore = (choreId: string, newPeople: Person[], newCurrentIndex: number) => {
    // This would need a new backend endpoint
    console.warn('Reorder functionality not implemented in backend yet');
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
    getChoreById,
    reorderPeopleInChore,
    refreshChores: loadChores,
  };
};