'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
  const [user, setUser] = useState<User | null>(null);

  // Função para aplicar o tema no HTML
  const applyTheme = (newTheme: Theme) => {
    if (typeof document === 'undefined') return;
    
    const html = document.documentElement;
    
    if (newTheme === 'dark') {
      html.classList.add('dark');
      console.log('🌙 ThemeProvider: Tema escuro aplicado, classe .dark adicionada ao HTML');
    } else {
      html.classList.remove('dark');
      console.log('☀️ ThemeProvider: Tema claro aplicado, classe .dark removida do HTML');
    }
    
    setThemeState(newTheme);
  };

  // Função para definir o tema
  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Função para carregar tema do usuário do Firestore
  const loadUserTheme = async (currentUser: User) => {
    try {
      console.log('🔧 ThemeProvider: Carregando tema do usuário:', currentUser.uid);
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userTheme = userData.theme as Theme;
        
        if (userTheme) {
          console.log('🔧 ThemeProvider: Tema encontrado no Firestore:', userTheme);
          applyTheme(userTheme);
          localStorage.setItem('theme', userTheme);
          return;
        }
      }
      
      console.log('🔧 ThemeProvider: Nenhum tema salvo no Firestore, usando localStorage');
      
      // Fallback para localStorage
      const savedTheme = localStorage.getItem('theme') as Theme;
      const initialTheme = savedTheme || 'light';
      applyTheme(initialTheme);
      
    } catch (error) {
      console.error('🔧 ThemeProvider: Erro ao carregar tema do usuário:', error);
      
      // Fallback para localStorage em caso de erro
      const savedTheme = localStorage.getItem('theme') as Theme;
      const initialTheme = savedTheme || 'light';
      applyTheme(initialTheme);
    }
  };

  useEffect(() => {
    console.log('🔧 ThemeProvider: Iniciando...');
    
    // Listener para mudanças de autenticação
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Usuário logado - carregar tema do Firestore
        loadUserTheme(currentUser);
      } else {
        // Usuário não logado - usar localStorage
        console.log('🔧 ThemeProvider: Usuário não logado, usando localStorage');
        const savedTheme = localStorage.getItem('theme') as Theme;
        const initialTheme = savedTheme || 'light';
        applyTheme(initialTheme);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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