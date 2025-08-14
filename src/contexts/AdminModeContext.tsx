'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminModeContextType {
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  setAdminMode: (mode: boolean) => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Carregar estado inicial do localStorage
  useEffect(() => {
    if (!isInitialized) {
      try {
        const savedMode = localStorage.getItem('adminMode');
        if (savedMode !== null) {
          setIsAdminMode(savedMode === 'true');
        }
      } catch (error) {
        console.error('Erro ao carregar modo admin:', error);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const toggleAdminMode = () => {
    const newMode = !isAdminMode;
    setIsAdminMode(newMode);
    try {
      localStorage.setItem('adminMode', newMode.toString());
    } catch (error) {
      console.error('Erro ao salvar modo admin:', error);
    }
  };

  const setAdminMode = (mode: boolean) => {
    setIsAdminMode(mode);
    try {
      localStorage.setItem('adminMode', mode.toString());
    } catch (error) {
      console.error('Erro ao salvar modo admin:', error);
    }
  };

  // Log para debug
  useEffect(() => {
    if (isInitialized) {
      console.log('AdminMode Context:', { isAdminMode, isInitialized });
    }
  }, [isAdminMode, isInitialized]);

  // Log para debug quando o estado muda
  useEffect(() => {
    console.log('AdminMode State Changed:', { isAdminMode });
  }, [isAdminMode]);

  return (
    <AdminModeContext.Provider value={{ isAdminMode, toggleAdminMode, setAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (context === undefined) {
    throw new Error('useAdminMode must be used within a AdminModeProvider');
  }
  return context;
} 