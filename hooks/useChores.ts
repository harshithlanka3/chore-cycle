import { useState, useEffect } from 'react';
import { choreApi, tokenManager } from '../services/api';
import { websocketService } from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';

export interface Person {
  id: string;
  name: string;
  user_id?: string;
}

export interface Chore {
  id: string;
  name: string;
  owner_id: string;
  shared_with: string[];
  people: Person[];
  currentPersonIndex: number;
}

export const useChores = () => {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const convertChore = (backendChore: any): Chore => ({
    id: backendChore.id,
    name: backendChore.name,
    owner_id: backendChore.owner_id,
    shared_with: backendChore.shared_with || [],
    people: backendChore.people,
    currentPersonIndex: backendChore.current_person_index,
  });

  const loadChores = async () => {
    if (!user) {
      setChores([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedChores = await choreApi.getAllChores();
      console.log('Loaded chores:', fetchedChores.length);
      setChores(fetchedChores.map(convertChore));
    } catch (err) {
      setError('Failed to load chores');
      console.error('Error loading chores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    loadChores();
    
    // Connect with authentication
    const connectWithAuth = async () => {
      const token = await tokenManager.getToken();
      websocketService.connect('ws://localhost:8000/ws', token || undefined, user.id);
    };
    
    connectWithAuth();

    const handleChoreCreated = (data: any) => {
      console.log('WebSocket: Chore created', data);
      // Only add if current user is owner or member
      if (data.user_id === user.id || data.chore.shared_with?.includes(user.id)) {
        const newChore = convertChore(data.chore);
        setChores(prev => {
          console.log('Adding new chore, current count:', prev.length);
          return [...prev, newChore];
        });
      }
    };

    const handleChoreDeleted = (data: any) => {
      console.log('WebSocket: Chore deleted', data);
      // Always remove from current user's list if it exists
      setChores(prev => {
        const filtered = prev.filter(chore => chore.id !== data.chore_id);
        console.log('Removed chore, new count:', filtered.length);
        return filtered;
      });
    };

    const handleChoreUpdated = (data: any) => {
      console.log('WebSocket: Chore updated', data.type, data);
      
      // Check if current user should see this update
      const updatedChore = convertChore(data.chore);
      const isOwner = updatedChore.owner_id === user.id;
      const isMember = updatedChore.shared_with.includes(user.id);
      
      if (!isOwner && !isMember) {
        console.log('User not authorized to see this chore update');
        return;
      }
      
      setChores(prev => {
        const updated = prev.map(chore => 
          chore.id === data.chore_id ? updatedChore : chore
        );
        console.log('Updated chore in list, total count:', updated.length);
        return updated;
      });
    };

    const handleUserJoined = (data: any) => {
      console.log('WebSocket: User joined', data);
      
      // Always update if the current user is involved in any way
      const updatedChore = convertChore(data.chore);
      
      setChores(prev => {
        const choreIndex = prev.findIndex(chore => chore.id === data.chore_id);
        
        if (choreIndex >= 0) {
          // Update existing chore
          const newChores = [...prev];
          newChores[choreIndex] = updatedChore;
          return newChores;
        } else {
          // Check if current user should see this chore
          const isOwner = updatedChore.owner_id === user.id;
          const isSharedWith = updatedChore.shared_with.includes(user.id);
          
          if (isOwner || isSharedWith) {
            return [...prev, updatedChore];
          } else {
            return prev;
          }
        }
      });
    };

    const handleUserLeft = (data: any) => {
      console.log('WebSocket: User left', data);
      if (data.user_id === user.id) {
        console.log('Current user left, removing chore from list');
        setChores(prev => prev.filter(chore => chore.id !== data.chore_id));
      } else {
        console.log('Other user left, updating chore');
        const updatedChore = convertChore(data.chore);
        const isOwner = updatedChore.owner_id === user.id;
        const isMember = updatedChore.shared_with.includes(user.id);
        
        if (isOwner || isMember) {
          setChores(prev => prev.map(chore => 
            chore.id === data.chore_id ? updatedChore : chore
          ));
        } else {
          // User no longer has access, remove from list
          setChores(prev => prev.filter(chore => chore.id !== data.chore_id));
        }
      }
    };

    const handleUserRemoved = (data: any) => {
      console.log('WebSocket: User removed', data);
      
      // If current user was removed, remove chore from their list
      if (data.removed_person?.user_id === user.id) {
        console.log('Current user was removed, removing chore from list');
        setChores(prev => prev.filter(chore => chore.id !== data.chore_id));
      } else {
        // Just update the chore if user still has access
        const updatedChore = convertChore(data.chore);
        const isOwner = updatedChore.owner_id === user.id;
        const isMember = updatedChore.shared_with.includes(user.id);
        
        if (isOwner || isMember) {
          setChores(prev => prev.map(chore => 
            chore.id === data.chore_id ? updatedChore : chore
          ));
        } else {
          // User no longer has access, remove from list
          setChores(prev => prev.filter(chore => chore.id !== data.chore_id));
        }
      }
    };

    // Add generic message handler for debugging
    const handleGenericMessage = (data: any) => {
      console.log('WebSocket: Received message', data.type, data);
    };

    websocketService.addEventListener('chore_created', handleChoreCreated);
    websocketService.addEventListener('chore_deleted', handleChoreDeleted);
    websocketService.addEventListener('person_added', handleChoreUpdated);
    websocketService.addEventListener('person_removed', handleChoreUpdated);
    websocketService.addEventListener('queue_advanced', handleChoreUpdated);
    websocketService.addEventListener('user_joined', handleUserJoined);
    websocketService.addEventListener('user_left', handleUserLeft);
    websocketService.addEventListener('user_removed', handleUserRemoved);

    // Add listeners for debugging
    websocketService.addEventListener('message', handleGenericMessage);

    return () => {
      websocketService.removeEventListener('chore_created', handleChoreCreated);
      websocketService.removeEventListener('chore_deleted', handleChoreDeleted);
      websocketService.removeEventListener('person_added', handleChoreUpdated);
      websocketService.removeEventListener('person_removed', handleChoreUpdated);
      websocketService.removeEventListener('queue_advanced', handleChoreUpdated);
      websocketService.removeEventListener('user_joined', handleUserJoined);
      websocketService.removeEventListener('user_left', handleUserLeft);
      websocketService.removeEventListener('user_removed', handleUserRemoved);
      websocketService.removeEventListener('message', handleGenericMessage);
      websocketService.disconnect();
    };
  }, [user]);

  const createChore = async (name: string) => {
    try {
      await choreApi.createChore({ name });
    } catch (err) {
      setError('Failed to create chore');
      throw err;
    }
  };

  const deleteChore = async (id: string) => {
    const chore = getChoreById(id);
    if (!chore || chore.owner_id !== user?.id) {
      throw new Error('Only the chore owner can delete this chore');
    }
    
    try {
      await choreApi.deleteChore(id);
    } catch (err) {
      setError('Failed to delete chore');
      throw err;
    }
  };

  const joinChore = async (choreId: string) => {
    try {
      console.log('Attempting to join chore:', choreId);
      await choreApi.joinChore({ chore_id: choreId });
      console.log('Join chore API call successful');
    } catch (err) {
      console.error('Join chore failed:', err);
      setError('Failed to join chore');
      throw err;
    }
  };

  const leaveChore = async (choreId: string) => {
    const chore = getChoreById(choreId);
    if (chore && chore.owner_id === user?.id) {
      throw new Error('Owner cannot leave chore. Delete the chore instead.');
    }
    
    try {
      await choreApi.leaveChore(choreId);
    } catch (err) {
      setError('Failed to leave chore');
      throw err;
    }
  };

  const addPersonToChore = async (choreId: string, personName: string) => {
    const chore = getChoreById(choreId);
    if (!chore || (chore.owner_id !== user?.id && !chore.shared_with.includes(user?.id || ''))) {
      throw new Error('You do not have permission to add people to this chore');
    }
    
    try {
      await choreApi.addPerson(choreId, { name: personName });
    } catch (err) {
      setError('Failed to add person');
      throw err;
    }
  };

  const removePersonFromChore = async (choreId: string, personId: string) => {
    const chore = getChoreById(choreId);
    if (!chore || chore.owner_id !== user?.id) {
      throw new Error('Only the chore owner can remove people from this chore');
    }
    
    try {
      await choreApi.removePerson(choreId, personId);
    } catch (err) {
      setError('Failed to remove person');
      throw err;
    }
  };

  const advanceQueue = async (choreId: string) => {
    const chore = getChoreById(choreId);
    if (!chore || (chore.owner_id !== user?.id && !chore.shared_with.includes(user?.id || ''))) {
      throw new Error('You do not have permission to advance the queue for this chore');
    }
    
    try {
      await choreApi.advanceQueue(choreId);
    } catch (err) {
      setError('Failed to advance queue');
      throw err;
    }
  };

  const getChoreById = (id: string) => {
    const chore = chores.find(chore => chore.id === id);
    console.log('Getting chore by ID:', id, 'Found:', !!chore);
    return chore;
  };

  const reorderPeopleInChore = (choreId: string, newPeople: Person[], newCurrentIndex: number) => {
    console.warn('Reorder functionality not implemented in backend yet');
  };

  return {
    chores,
    loading,
    error,
    createChore,
    deleteChore,
    joinChore,
    leaveChore,
    addPersonToChore,
    removePersonFromChore,
    advanceQueue,
    getChoreById,
    reorderPeopleInChore,
    refreshChores: loadChores,
  };
};