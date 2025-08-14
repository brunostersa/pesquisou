'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardContent, CardAction } from '@/components/Card';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import Notification from '@/components/Notification';
import Sidebar from '@/components/Sidebar';
import { Area } from '@/types/Area';
import { useActiveTab } from '@/hooks/useActiveTab';

export default function AreasPage() {
  const [user, setUser] = useState<User | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaDescription, setNewAreaDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const router = useRouter();
  const activeTab = useActiveTab();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadAreas(user.uid);
        loadUserProfile(user.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadAreas = (userId: string) => {
    const q = query(collection(db, 'areas'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const areasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Area[];
      setAreas(areasData);
    });

    return unsubscribe;
  };

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

  const handleCreateArea = async () => {
    if (!user || !newAreaName.trim()) return;

    // Verificar limite do plano
    const currentPlan = userProfile?.plan || 'free';
    const areaLimit = getAreaLimit(currentPlan);
    
    if (areas.length >= areaLimit) {
      setNotification({
        message: `Você atingiu o limite de ${areaLimit} áreas do seu plano gratuito. Faça upgrade para criar mais áreas!`,
        type: 'error'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'areas'), {
        name: newAreaName.trim(),
        description: newAreaDescription.trim(),
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setNewAreaName('');
      setNewAreaDescription('');
      setShowCreateForm(false);
      setNotification({
        message: 'Área criada com sucesso!',
        type: 'success'
      });
    } catch (error) {
      console.error('Erro ao criar área:', error);
      setNotification({
        message: 'Erro ao criar área. Tente novamente.',
        type: 'error'
      });
    }
  };

  // Função para obter limite de áreas baseado no plano
  const getAreaLimit = (plan: string) => {
    switch (plan) {
      case 'free':
        return 2;
      case 'starter':
        return 5;
      case 'professional':
        return 999; // Praticamente ilimitado
      default:
        return 2;
    }
  };

  // Função para verificar se pode criar mais áreas
  const canCreateMoreAreas = () => {
    if (!userProfile) return false;
    const currentPlan = userProfile.plan || 'free';
    const areaLimit = getAreaLimit(currentPlan);
    return areas.length < areaLimit;
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta área?')) return;

    try {
      await deleteDoc(doc(db, 'areas', areaId));
      setNotification({
        message: 'Área excluída com sucesso!',
        type: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir área:', error);
      setNotification({
        message: 'Erro ao excluir área. Tente novamente.',
        type: 'error'
      });
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Carregando...</p>
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
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Meu Painel
                </button>
              </li>
              <li>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li className="text-gray-900 dark:text-white font-medium">Áreas</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">📍 Gerenciar Áreas</h1>
            <p className="text-gray-600 dark:text-gray-400">Crie e gerencie as áreas da sua empresa para coletar opiniões</p>
          </div>

          {/* Create New Area Button */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <CardAction
                  onClick={() => setShowCreateForm(true)}
                  variant="primary"
                  size="lg"
                  disabled={!canCreateMoreAreas()}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  {canCreateMoreAreas() ? 'Criar Nova Área' : 'Limite Atingido'}
                </CardAction>
                
                {!canCreateMoreAreas() && (
                  <button
                    onClick={() => router.push('/planos')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Fazer Upgrade
                  </button>
                )}
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Áreas: {areas.length}/{getAreaLimit(userProfile?.plan || 'free')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Plano: {userProfile?.plan === 'free' ? 'Gratuito' : userProfile?.plan === 'starter' ? 'Starter' : 'Professional'}
                </p>
              </div>
            </div>
            
            {!canCreateMoreAreas() && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Limite atingido!</strong> Você atingiu o máximo de {getAreaLimit(userProfile?.plan || 'free')} áreas do seu plano gratuito. 
                    <button 
                      onClick={() => router.push('/planos')}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Faça upgrade para criar mais áreas!
                    </button>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Create Area Form */}
          {showCreateForm && (
            <Card variant="elevated" className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-semibold text-primary">Criar Nova Área</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Nome da Área *
                    </label>
                    <input
                      type="text"
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                      placeholder="Ex: Atendimento, Produtos, Ambiente..."
                      className="w-full px-3 py-2 border border-custom rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-color bg-card text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={newAreaDescription}
                      onChange={(e) => setNewAreaDescription(e.target.value)}
                      placeholder="Descreva brevemente esta área..."
                      rows={3}
                      className="w-full px-3 py-2 border border-custom rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-color bg-card text-primary"
                    />
                  </div>
                  <div className="flex gap-3">
                    <CardAction
                      onClick={handleCreateArea}
                      variant="primary"
                      disabled={!newAreaName.trim()}
                    >
                      Criar Área
                    </CardAction>
                    <CardAction
                      onClick={() => setShowCreateForm(false)}
                      variant="outline"
                    >
                      Cancelar
                    </CardAction>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Areas Grid */}
          {areas.length === 0 ? (
            <Card variant="elevated">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">📍</div>
                <h3 className="text-xl font-semibold text-primary mb-2">Nenhuma área criada</h3>
                <p className="text-secondary mb-6">
                  Crie sua primeira área para começar a coletar opiniões dos clientes
                </p>
                <CardAction
                  onClick={() => setShowCreateForm(true)}
                  variant="primary"
                  disabled={!canCreateMoreAreas()}
                >
                  {canCreateMoreAreas() ? 'Criar Primeira Área' : 'Limite Atingido'}
                </CardAction>
                
                {!canCreateMoreAreas() && (
                  <div className="mt-4">
                    <button
                      onClick={() => router.push('/planos')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Fazer Upgrade para Criar Mais Áreas
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areas.map((area) => (
                <Card key={area.id} variant="elevated" className="h-full">
                  <CardContent className="h-full flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-primary mb-1">
                            {area.name}
                          </h3>
                          {area.description && (
                            <p className="text-secondary text-sm">
                              {area.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteArea(area.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Excluir área"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>

                      <div className="mb-4">
                        <QRCodeGenerator
                          areaId={area.id}
                          areaName={area.name}
                          userProfile={userProfile}
                        />
                      </div>
                    </div>

                    <div className="mt-auto">
                      <CardAction
                        onClick={() => router.push(`/areas/${area.id}`)}
                        variant="secondary"
                        className="w-full"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        Ver Detalhes
                      </CardAction>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
} 