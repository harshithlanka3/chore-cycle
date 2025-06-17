import React, { createContext, useContext, useState, ReactNode } from 'react';

type Screen = 'home' | 'chore-detail';

interface NavigationContextType {
  currentScreen: Screen;
  currentChoreId: string | null;
  navigateToHome: () => void;
  navigateToChore: (choreId: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [currentChoreId, setCurrentChoreId] = useState<string | null>(null);

  const navigateToHome = () => {
    setCurrentScreen('home');
    setCurrentChoreId(null);
  };

  const navigateToChore = (choreId: string) => {
    setCurrentScreen('chore-detail');
    setCurrentChoreId(choreId);
  };

  return (
    <NavigationContext.Provider value={{
      currentScreen,
      currentChoreId,
      navigateToHome,
      navigateToChore,
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}