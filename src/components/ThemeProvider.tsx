'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [loading, setLoading] = useState(true);

  // Função para aplicar o tema no HTML
  const applyTheme = (newTheme: Theme) => {
    if (typeof document === 'undefined') return;
    
    const html = document.documentElement;
    
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    setThemeState(newTheme);
  };

  // Função para definir o tema
  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    console.log('🔧 ThemeProvider: Iniciando...');
    
    // Forçar tema claro sempre
    const html = document.documentElement;
    html.classList.remove('dark');
    console.log('🔧 ThemeProvider: Classe dark removida do HTML');
    
    // Verificar localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    console.log('🔧 ThemeProvider: Tema salvo no localStorage:', savedTheme);
    
    // Sempre aplicar tema claro, independente do localStorage
    console.log('🔧 ThemeProvider: Forçando tema claro');
    applyTheme('light');
    localStorage.setItem('theme', 'light');
    
    // Verificar se há classe dark no HTML
    console.log('🔧 ThemeProvider: Classes do HTML:', html.className);
    console.log('🔧 ThemeProvider: Classe dark presente:', html.classList.contains('dark'));
    
    setLoading(false);
  }, []);

  const value = {
    theme,
    setTheme,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
} 