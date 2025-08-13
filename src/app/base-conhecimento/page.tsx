'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import KnowledgeBase from '@/components/KnowledgeBase';
import Sidebar from '@/components/Sidebar';
import { useActiveTab } from '@/hooks/useActiveTab';
export default function KnowledgePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const activeTab = useActiveTab();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadUserProfile(user.uid);
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
        setUserProfile(userSnap.data());
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'overview') router.push('/dashboard');
          else if (tab === 'areas') router.push('/areas');
          else if (tab === 'feedbacks') router.push('/feedbacks');
          else if (tab === 'agente-ia') router.push('/agente-ia');
          else if (tab === 'base-conhecimento') router.push('/base-conhecimento');
          else if (tab === 'pricing') router.push('/planos');
          else if (tab === 'assinatura') router.push('/assinatura');
        }}
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      <div className="lg:ml-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <KnowledgeBase userSegment={userProfile?.segment} />
        </div>
      </div>
    </div>
  );
} 