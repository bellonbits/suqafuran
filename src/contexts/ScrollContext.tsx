import React, { createContext, useContext, useCallback, useState } from 'react';

interface ScrollContextType {
  savePosition: (key: string, x: number, y: number) => void;
  getPosition: (key: string) => { x: number; y: number } | null;
  clearPosition: (key: string) => void;
  clearAll: () => void;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  const savePosition = useCallback((key: string, x: number, y: number) => {
    setPositions(prev => ({
      ...prev,
      [key]: { x, y }
    }));
    // Also save to sessionStorage for persistence across page reloads
    sessionStorage.setItem(`scroll-context-${key}`, JSON.stringify({ x, y }));
  }, []);

  const getPosition = useCallback((key: string) => {
    return positions[key] || null;
  }, [positions]);

  const clearPosition = useCallback((key: string) => {
    setPositions(prev => {
      const newPositions = { ...prev };
      delete newPositions[key];
      return newPositions;
    });
    sessionStorage.removeItem(`scroll-context-${key}`);
  }, []);

  const clearAll = useCallback(() => {
    setPositions({});
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('scroll-context-')) {
        sessionStorage.removeItem(key);
      }
    });
  }, []);

  const value: ScrollContextType = {
    savePosition,
    getPosition,
    clearPosition,
    clearAll,
  };

  return (
    <ScrollContext.Provider value={value}>
      {children}
    </ScrollContext.Provider>
  );
};

/**
 * Hook to use scroll context
 */
export function useScrollContext() {
  const context = useContext(ScrollContext);
  if (context === undefined) {
    throw new Error('useScrollContext must be used within a ScrollProvider');
  }
  return context;
}
