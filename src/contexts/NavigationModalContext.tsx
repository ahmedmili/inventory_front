'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type NavigationModalType = 'suppliers' | null;

interface NavigationModalContextType {
  openModal: (type: NavigationModalType) => void;
  closeModal: () => void;
  currentModal: NavigationModalType;
}

const NavigationModalContext = createContext<NavigationModalContextType | undefined>(undefined);

export function NavigationModalProvider({ children }: { children: ReactNode }) {
  const [currentModal, setCurrentModal] = useState<NavigationModalType>(null);

  const openModal = (type: NavigationModalType) => {
    setCurrentModal(type);
  };

  const closeModal = () => {
    setCurrentModal(null);
  };

  return (
    <NavigationModalContext.Provider value={{ openModal, closeModal, currentModal }}>
      {children}
    </NavigationModalContext.Provider>
  );
}

export function useNavigationModal() {
  const context = useContext(NavigationModalContext);
  if (context === undefined) {
    throw new Error('useNavigationModal must be used within a NavigationModalProvider');
  }
  return context;
}
