import React, { createContext, ReactNode, useContext } from 'react';
import { useChores } from '../hooks/useChores';

type ChoresContextType = ReturnType<typeof useChores>;

const ChoresContext = createContext<ChoresContextType | undefined>(undefined);

export function ChoresProvider({ children }: { children: ReactNode }) {
  const choresHook = useChores();
  return (
    <ChoresContext.Provider value={choresHook}>
      {children}
    </ChoresContext.Provider>
  );
}

export function useChoresContext() {
  const context = useContext(ChoresContext);
  if (context === undefined) {
    throw new Error('useChoresContext must be used within a ChoresProvider');
  }
  return context;
}