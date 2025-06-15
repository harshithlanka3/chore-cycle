import { useState } from 'react';

export interface Chore {
  id: string;
  name: string;
  createdAt: Date;
}

export const useChores = () => {
  const [chores, setChores] = useState<Chore[]>([]);

  const createChore = (name: string) => {
    const newChore: Chore = {
      id: Date.now().toString(),
      name: name.trim(),
      createdAt: new Date(),
    };
    setChores(prev => [...prev, newChore]);
  };

  const deleteChore = (id: string) => {
    setChores(prev => prev.filter(chore => chore.id !== id));
  };

  return {
    chores,
    createChore,
    deleteChore,
  };
};