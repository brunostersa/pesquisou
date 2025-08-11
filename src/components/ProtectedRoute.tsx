'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'super_admin';
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = 'user',
  fallback 
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadUserProfile(user.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadUserProfile = async (userId: string) => {
    try {
      const userDoc = doc(db, 'users', userId);
      const userSnap = await getDoc(userDoc);
      
      if (userSnap.exists()) {
        const profile = userSnap.data();
        setUserProfile(profile);
        
        // Verificar permissões
        const userRole = profile.role || 'user';
        const hasAccess = checkPermission(userRole, requiredRole);
        setHasPermission(hasAccess);
        
        if (!hasAccess) {
          console.warn('Acesso negado: usuário não tem permissão para esta rota');
        }
      } else {
        // Usuário não tem perfil, criar um básico
        setUserProfile({ role: 'user' });
        setHasPermission(requiredRole === 'user');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setHasPermission(false);
    }
  };

  const checkPermission = (userRole: string, requiredRole: string): boolean => {
    const roleHierarchy = {
      'user': 1,
      'admin': 2,
      'super_admin': 3
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 1;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 1;

    return userLevel >= requiredLevel;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você não tem permissão para acessar esta área. 
            Entre em contato com o administrador se acredita que isso é um erro.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Voltar ao Meu Painel
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 