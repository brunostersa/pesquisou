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
    const body = document.body;
    
    console.log('🔧 Aplicando tema:', newTheme);
    
    if (newTheme === 'dark') {
      html.classList.add('dark');
      body.classList.add('dark');
      body.style.backgroundColor = '#111827';
      body.style.color = '#f9fafb';
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#111827';
    }
    
    console.log('🔧 HTML classes:', html.className);
    console.log('🔧 Body classes:', body.className);
    
    setThemeState(newTheme);
  };

  // Função para definir o tema
  const setTheme = (newTheme: Theme) => {
    console.log('🔧 setTheme chamado com:', newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    console.log('🔧 ThemeProvider useEffect executando');
    
    // Forçar tema claro inicialmente
    const html = document.documentElement;
    const body = document.body;
    
    // Remover qualquer classe dark existente
    html.classList.remove('dark');
    body.classList.remove('dark');
    
    // Aplicar tema claro
    body.style.backgroundColor = '#ffffff';
    body.style.color = '#111827';
    
    // Verificar localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      console.log('🔧 Tema salvo encontrado:', savedTheme);
      applyTheme(savedTheme);
    } else {
      console.log('🔧 Aplicando tema padrão: light');
      applyTheme('light');
    }
    
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