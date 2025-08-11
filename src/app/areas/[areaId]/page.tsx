'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Area } from '@/types/Area';
import { Feedback } from '@/types/Feedback';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import FeedbackList from '@/components/FeedbackList';
import Sidebar from '@/components/Sidebar';

export default function AreaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const areaId = params.areaId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadAreaData(areaId, user.uid);
        loadAreaFeedbacks(areaId);
        loadUserProfile(user.uid);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [areaId, router]);

  const loadUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const loadAreaData = async (areaId: string, userId: string) => {
    try {
      const areaDoc = await getDoc(doc(db, 'areas', areaId));
      
      if (areaDoc.exists()) {
        const areaData = areaDoc.data();
        // Verificar se a área pertence ao usuário
        if (areaData.userId === userId) {
          setArea({
            id: areaDoc.id,
            ...areaData,
            createdAt: areaData.createdAt?.toDate() || new Date(),
          } as Area);
          setError(''); // Limpar qualquer erro anterior
        } else {
          setError('Área não encontrada ou sem permissão de acesso');
        }
      } else {
        setError('Área não encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar área:', error);
      setError('Erro ao carregar dados da área');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const loadAreaFeedbacks = (areaId: string) => {
    // Verificar se o areaId é válido antes de fazer a consulta
    if (!areaId || areaId.trim() === '') {
      console.warn('areaId inválido:', areaId);
      return;
    }

    const q = query(collection(db, 'feedbacks'), where('areaId', '==', areaId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const feedbacksData: Feedback[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          feedbacksData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Feedback);
        }
      });
      setFeedbacks(feedbacksData);
    });

    return unsubscribe;
  };

  const handleDeleteArea = async () => {
    if (!area || !confirm('Tem certeza que deseja excluir esta área? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'areas', area.id));
      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao excluir área:', error);
      alert('Erro ao excluir área');
    }
  };

  const getAreaMetrics = () => {
    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
      : 0;
    const recentFeedbacks = feedbacks.filter(f => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return f.createdAt > oneWeekAgo;
    }).length;

    return {
      totalFeedbacks,
      averageRating,
      recentFeedbacks
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        {/* Header Skeleton */}
        <header className="bg-card shadow-sm border-b border-custom">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-secondary-color rounded-lg flex items-center justify-center mr-4">
                  <span className="text-inverse font-bold text-sm">P</span>
                </div>
                <h1 className="text-2xl font-bold text-primary">Pesquisou</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="mb-8">
            <div className="h-4 bg-tertiary rounded w-32 animate-pulse"></div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg shadow-sm p-6">
              <div className="h-8 bg-tertiary rounded w-48 mb-4 animate-pulse"></div>
              <div className="h-4 bg-tertiary rounded w-64 animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-lg shadow-sm p-6">
                  <div className="h-4 bg-tertiary rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-tertiary rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-card rounded-lg shadow-sm p-6">
                <div className="h-6 bg-tertiary rounded w-32 mb-4 animate-pulse"></div>
                <div className="h-64 bg-tertiary rounded animate-pulse"></div>
              </div>
              <div className="bg-card rounded-lg shadow-sm p-6">
                <div className="h-6 bg-tertiary rounded w-40 mb-4 animate-pulse"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-tertiary rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !initialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-card rounded-lg p-6 shadow-lg">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-primary mb-4">Área não encontrada</h1>
            <p className="text-secondary mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary px-6 py-2 rounded-lg"
            >
              Voltar ao Meu Painel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!area) {
    return null; // Não renderiza nada se não há área
  }

  const metrics = getAreaMetrics();
  const feedbackUrl = `${window.location.origin}/feedback/${area.id}`;

  return (
    <div className="min-h-screen bg-primary animate-in fade-in duration-300">
      {/* Sidebar */}
      <Sidebar
        activeTab="areas"
        onTabChange={(tab) => {
          // Navegar diretamente para as URLs
          switch (tab) {
            case 'overview':
              router.push('/dashboard');
              break;
            case 'areas':
              router.push('/areas');
              break;
            case 'feedbacks':
              router.push('/feedbacks');
              break;
            case 'agente-ia':
              router.push('/agente-ia');
              break;
            case 'base-conhecimento':
              router.push('/base-conhecimento');
              break;
            case 'planos':
              router.push('/planos');
              break;
            default:
              router.push('/dashboard');
          }
        }}
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      <div className="lg:ml-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-secondary">
              <li>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="hover:text-primary transition-colors"
                >
                  Meu Painel
                </button>
              </li>
              <li>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <button
                  onClick={() => router.push('/areas')}
                  className="hover:text-primary transition-colors"
                >
                  Áreas
                </button>
              </li>
              <li>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li className="text-primary font-medium">{area.name}</li>
            </ol>
          </nav>

          {/* Area Header */}
          <div className="bg-card rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">{area.name}</h1>
                {area.description && (
                  <p className="text-secondary text-lg">{area.description}</p>
                )}
                <p className="text-muted text-sm mt-2">
                  Criada em {area.createdAt.toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="mt-4 lg:mt-0">
                <a
                  href={feedbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-6 py-3 rounded-lg inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Abrir Formulário
                </a>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-color bg-opacity-10 rounded-lg">
                  <svg className="w-6 h-6 text-primary-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Total de Feedbacks</p>
                  <p className="text-2xl font-semibold text-primary">{metrics.totalFeedbacks}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent-color bg-opacity-10 rounded-lg">
                  <svg className="w-6 h-6 text-accent-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Avaliação Média</p>
                  <p className="text-2xl font-semibold text-primary">
                    {metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : '0.0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-secondary-color bg-opacity-10 rounded-lg">
                  <svg className="w-6 h-6 text-secondary-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Última Semana</p>
                  <p className="text-2xl font-semibold text-primary">{metrics.recentFeedbacks}</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code and Feedbacks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Section */}
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">QR Code</h2>
              <div className="text-center">
                <QRCodeGenerator areaId={area.id} areaName={area.name} />
                <p className="text-sm text-secondary mt-4">
                  Escaneie este QR Code para acessar o formulário de feedback
                </p>
              </div>
            </div>

            {/* Feedbacks Section */}
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">Feedbacks Recentes</h2>
              {feedbacks.length > 0 ? (
                <FeedbackList feedbacks={feedbacks.slice(0, 5)} showAreaName={false} />
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-secondary">Nenhum feedback ainda</p>
                  <p className="text-muted text-sm">Compartilhe o QR Code para começar a receber feedbacks</p>
                </div>
              )}
            </div>
          </div>

          {/* All Feedbacks */}
          {feedbacks.length > 5 && (
            <div className="mt-8 bg-card rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-primary mb-4">Todos os Feedbacks</h2>
              <FeedbackList feedbacks={feedbacks} showAreaName={false} />
            </div>
          )}

          {/* Área de Gerenciamento */}
          <div className="mt-8 bg-card rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <h2 className="text-xl font-semibold text-primary mb-4">Gerenciar Área</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-primary mb-2">Excluir Área</h3>
                <p className="text-secondary text-sm mb-4">
                  Esta ação irá excluir permanentemente a área &quot;{area.name}&quot; e todos os seus feedbacks. 
                  Esta ação não pode ser desfeita.
                </p>
                <button
                  onClick={handleDeleteArea}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Excluir Área Permanentemente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 