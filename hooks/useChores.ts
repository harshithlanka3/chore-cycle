import { useState } from 'react';

export interface Person {
  id: string;
  name: string;
}

export interface Chore {
  id: string;
  name: string;
  createdAt: Date;
  people: Person[];
  currentPersonIndex: number;
}

export const useChores = () => {
  const [chores, setChores] = useState<Chore[]>([]);

  const createChore = (name: string) => {
    const newChore: Chore = {
      id: Date.now().toString(),
      name: name.trim(),
      createdAt: new Date(),
      people: [],
      currentPersonIndex: 0,
    };
    setChores(prev => [...prev, newChore]);
  };

  const deleteChore = (id: string) => {
    setChores(prev => prev.filter(chore => chore.id !== id));
  };

  const addPersonToChore = (choreId: string, personName: string) => {
    setChores(prev => prev.map(chore => {
      if (chore.id === choreId) {
        const newPerson: Person = {
          id: Date.now().toString(),
          name: personName.trim(),
        };
        return {
          ...chore,
          people: [...chore.people, newPerson],
        };
      }
      return chore;
    }));
  };

  const removePersonFromChore = (choreId: string, personId: string) => {
  setChores(prev => prev.map(chore => {
    if (chore.id === choreId) {
      const removedPersonIndex = chore.people.findIndex(person => person.id === personId);
      const newPeople = chore.people.filter(person => person.id !== personId);
      
      let newCurrentIndex = chore.currentPersonIndex;
      
      if (removedPersonIndex < chore.currentPersonIndex) {
        newCurrentIndex = chore.currentPersonIndex - 1;
      } else if (removedPersonIndex === chore.currentPersonIndex) {

        if (newCurrentIndex >= newPeople.length && newPeople.length > 0) {
          newCurrentIndex = 0; // Wrap around to the beginning
        }
      }
      
      if (newPeople.length === 0) {
        newCurrentIndex = 0;
      } else if (newCurrentIndex >= newPeople.length) {
        newCurrentIndex = 0;
      }
      
      return {
        ...chore,
        people: newPeople,
        currentPersonIndex: newCurrentIndex,
      };
    }
    return chore;
  }));
};

  const advanceQueue = (choreId: string) => {
    setChores(prev => prev.map(chore => {
      if (chore.id === choreId && chore.people.length > 0) {
        return {
          ...chore,
          currentPersonIndex: (chore.currentPersonIndex + 1) % chore.people.length,
        };
      }
      return chore;
    }));
  };

  const getChoreById = (id: string) => {
    return chores.find(chore => chore.id === id);
  };

  const reorderPeopleInChore = (choreId: string, newPeople: Person[], newCurrentIndex: number) => {
    setChores(prev => prev.map(chore => {
      if (chore.id === choreId) {
        return {
          ...chore,
          people: newPeople,
          currentPersonIndex: newCurrentIndex,
        };
      }
      return chore;
    }));
  };

  return {
    chores,
    createChore,
    deleteChore,
    addPersonToChore,
    removePersonFromChore,
    advanceQueue,
    getChoreById,
    reorderPeopleInChore,
  };
};