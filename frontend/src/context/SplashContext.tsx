import React, { createContext, useContext, useState } from 'react';

interface SplashContextType {
  showSplash: boolean;
  triggerSplash: () => void;
  closeSplash: () => void;
}

const SplashContext = createContext<SplashContextType | undefined>(undefined);

export const SplashProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showSplash, setShowSplash] = useState(true);

  const triggerSplash = () => setShowSplash(true);
  const closeSplash = () => setShowSplash(false);

  return (
    <SplashContext.Provider value={{ showSplash, triggerSplash, closeSplash }}>
      {children}
    </SplashContext.Provider>
  );
};

export const useSplash = (): SplashContextType => {
  const context = useContext(SplashContext);
  if (!context) {
    throw new Error('useSplash must be used within a SplashProvider');
  }
  return context;
};
