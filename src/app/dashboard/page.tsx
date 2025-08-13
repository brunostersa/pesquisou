'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useActiveTab } from '@/hooks/useActiveTab';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Area } from '@/types/Area';
import { Feedback } from '@/types/Feedback';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import DeleteAllFeedbacksModal from '@/components/DeleteAllFeedbacksModal';
import Notification from '@/components/Notification';
import Card, { CardHeader, CardContent, CardMetric, CardAction } from '@/components/Card';
import Sidebar from '@/components/Sidebar';
import KnowledgeBase from '@/components/KnowledgeBase';
import AIAgent from '@/components/AIAgent';
import FeedbackChart from '@/components/FeedbackChart';

export default function MeuPainelPage() {
  const [user, setUser] = useState<User | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaDescription, setNewAreaDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const activeTab = useActiveTab();
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name?: string;
    email?: string;
    company?: string;
    segment?: string;
    phone?: string;
    updatedAt?: unknown;
  } | null>(null);

  const router = useRouter();
  
  // Refs para armazenar os unsubscribes
  const areasUnsubscribeRef = useRef<(() => void) | null>(null);
  const feedbacksUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    console.log('🔍 Dashboard: Iniciando verificação de autenticação...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 Dashboard: Estado de autenticação mudou:', user ? 'Usuário logado' : 'Usuário não logado');
      
      if (user) {
        console.log('🔍 Dashboard: Usuário autenticado:', user.uid);
        setUser(user);
        
        try {
          // Carregar dados de forma assíncrona
          await Promise.all([
            loadUserProfile(user.uid),
            Promise.resolve(loadAreas(user.uid)) // loadAreas não é async, mas queremos aguardar
          ]);
          
          // Carregar feedbacks após áreas serem carregadas
          setTimeout(() => {
            loadAllFeedbacks(user.uid);
          }, 500);
          
          // Mostrar tutorial para novos usuários
          if (typeof window !== 'undefined') {
            const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
            if (!hasSeenTutorial) {
              setShowTutorial(true);
            }
          }
        } catch (error) {
          console.error('🔍 Dashboard: Erro ao carregar dados:', error);
        } finally {
          // Sempre finalizar o loading, mesmo em caso de erro
          console.log('🔍 Dashboard: Finalizando loading...');
          setLoading(false);
        }
      } else {
        console.log('🔍 Dashboard: Redirecionando para login...');
        router.push('/login');
      }
    });

    return () => {
      console.log('🔍 Dashboard: Removendo listener de autenticação');
      unsubscribe();
      
      // Limpar listeners do Firestore
      if (areasUnsubscribeRef.current) {
        areasUnsubscribeRef.current();
      }
      if (feedbacksUnsubscribeRef.current) {
        feedbacksUnsubscribeRef.current();
      }
    };
  }, [router]);

  // Remover useEffects problemáticos que causam loops
  // useEffect(() => {
  //   console.log('🔍 Dashboard: useEffect feedbacks - user?.uid:', user?.uid);
  //   if (user?.uid) {
  //     loadAllFeedbacks(user.uid);
  //   }
  // }, [user?.uid]);

  // useEffect(() => {
  //   console.log('🔍 Dashboard: useEffect áreas - user?.uid:', user?.uid, 'areas.length:', areas.length, 'feedbacks.length:', feedbacks.length);
  //   if (user?.uid && areas.length > 0 && feedbacks.length === 0) {
  //     loadAllFeedbacks(user.uid);
  //   }
  // }, [areas, user?.uid, feedbacks.length]);

  const loadAreas = (userId: string) => {
    // Verificar se o userId é válido antes de fazer a consulta
    if (!userId || userId.trim() === '') {
      console.warn('userId inválido:', userId);
      return;
    }

    // Evitar múltiplas consultas simultâneas
    if (areas.length > 0) {
      console.log('Áreas já carregadas, pulando consulta');
      return;
    }

    console.log('Carregando áreas para usuário:', userId);
    
    try {
      const q = query(collection(db, 'areas'), where('userId', '==', userId));
      
      // Limpar unsubscribe anterior se existir
      if (areasUnsubscribeRef.current) {
        areasUnsubscribeRef.current();
      }
      
      areasUnsubscribeRef.current = onSnapshot(q, (querySnapshot) => {
        const areasData: Area[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            areasData.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
            } as Area);
          }
        });
        console.log('Áreas carregadas:', areasData.length);
        setAreas(areasData);
      }, (error) => {
        console.error('Erro ao carregar áreas:', error);
        // Em caso de erro, definir áreas vazias para não travar
        setAreas([]);
      });
    } catch (error) {
      console.error('Erro ao configurar listener de áreas:', error);
      setAreas([]);
    }
  };

  const loadAllFeedbacks = (userId?: string) => {
    // Só carregar feedbacks se temos um usuário válido
    const currentUserId = userId || user?.uid;
    if (!currentUserId) return;

    // Evitar múltiplas consultas simultâneas
    if (feedbacks.length > 0) {
      console.log('Feedbacks já carregados, pulando consulta');
      return;
    }

    console.log('Carregando feedbacks para usuário:', currentUserId);
    
    try {
      const q = query(collection(db, 'feedbacks'));
      
      // Limpar unsubscribe anterior se existir
      if (feedbacksUnsubscribeRef.current) {
        feedbacksUnsubscribeRef.current();
      }
      
      feedbacksUnsubscribeRef.current = onSnapshot(q, (querySnapshot) => {
        const feedbacksData: Feedback[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Verificar se os dados são válidos antes de processar
          if (data && data.areaId) {
            const feedback = {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
            } as Feedback;
            
            // Adicionar todos os feedbacks - a filtragem será feita depois
            feedbacksData.push(feedback);
          }
        });
        console.log('Feedbacks carregados:', feedbacksData.length);
        setFeedbacks(feedbacksData);
      }, (error) => {
        console.error('Erro ao carregar feedbacks:', error);
        // Em caso de erro, definir feedbacks vazios para não travar
        setFeedbacks([]);
      });
    } catch (error) {
      console.error('Erro ao configurar listener de feedbacks:', error);
      setFeedbacks([]);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Dashboard: Carregando perfil do usuário:', userId);
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        console.log('🔍 Dashboard: Perfil encontrado:', userDoc.data());
        setUserProfile(userDoc.data());
      } else {
        console.log('🔍 Dashboard: Perfil não encontrado, criando perfil básico...');
        
        // Se o documento não existe, criar um perfil básico
        const basicProfile = {
          name: user?.displayName || 'Usuário',
          email: user?.email || '',
          company: 'Não informado',
          segment: 'Não informado',
          phone: 'Não informado',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('🔍 Dashboard: Criando perfil básico:', basicProfile);
        
        try {
          // Criar o documento no Firestore
          await setDoc(userRef, basicProfile);
          console.log('🔍 Dashboard: Perfil básico criado com sucesso!');
          setUserProfile(basicProfile);
        } catch (setDocError) {
          console.error('🔍 Dashboard: Erro ao criar perfil no Firestore:', setDocError);
          // Se falhar ao criar no Firestore, usar dados locais
          setUserProfile(basicProfile);
        }
      }
    } catch (error) {
      console.error('🔍 Dashboard: Erro ao carregar perfil:', error);
      
      // Em caso de erro, usar dados básicos sem tentar salvar no Firestore
      const fallbackProfile = {
        name: user?.displayName || 'Usuário',
        email: user?.email || '',
        company: 'Não informado',
        segment: 'Não informado',
        phone: 'Não informado'
      };
      
      console.log('🔍 Dashboard: Usando perfil de fallback:', fallbackProfile);
      setUserProfile(fallbackProfile);
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAreaName.trim()) return;

    try {
      const docRef = await addDoc(collection(db, 'areas'), {
        name: newAreaName.trim(),
        description: newAreaDescription.trim(),
        userId: user.uid,
        createdAt: new Date(),
      });

      // Atualizar com o QR Code URL usando o ID real
      await updateDoc(docRef, {
        qrCodeUrl: `/feedback/${docRef.id}`
      });

      setNewAreaName('');
      setNewAreaDescription('');
      setShowCreateForm(false);
      showNotification('Área criada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao criar área:', error);
      showNotification('Erro ao criar área. Tente novamente.', 'error');
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (confirm('Tem certeza que deseja excluir esta área?')) {
      try {
        await deleteDoc(doc(db, 'areas', areaId));
        showNotification('Área excluída com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao excluir área:', error);
        showNotification('Erro ao excluir área. Tente novamente.', 'error');
      }
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



  const handleDeleteAllFeedbacks = async () => {
    if (!user) return;

    try {
      // Buscar todos os feedbacks das áreas do usuário
      const userAreaIds = areas.map(area => area.id);
      
      // Excluir feedbacks em lotes
      const batch = writeBatch(db);
      let deletedCount = 0;

      for (const areaId of userAreaIds) {
        const feedbacksQuery = query(collection(db, 'feedbacks'), where('areaId', '==', areaId));
        const feedbacksSnapshot = await getDocs(feedbacksQuery);
        
        feedbacksSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
          deletedCount++;
        });
      }

      await batch.commit();
      
      showNotification(`${deletedCount} feedbacks excluídos com sucesso!`, 'success');
      setFeedbacks([]); // Limpar lista local
    } catch (error) {
      console.error('Erro ao excluir feedbacks:', error);
      showNotification('Erro ao excluir feedbacks. Tente novamente.', 'error');
      throw error; // Re-throw para o modal tratar
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };



  const getAreaMetrics = (areaId: string) => {
    // Filtrar feedbacks apenas das áreas do usuário
    const userAreaIds = areas.map(area => area.id);
    const userFeedbacks = feedbacks.filter(f => userAreaIds.includes(f.areaId));
    
    const areaFeedbacks = userFeedbacks.filter(f => f.areaId === areaId);
    const totalFeedbacks = areaFeedbacks.length;
    const averageRating = totalFeedbacks > 0 
      ? areaFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
      : 0;
    const recentFeedbacks = areaFeedbacks.filter(f => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return f.createdAt > oneWeekAgo;
    }).length;

    return {
      totalFeedbacks,
      averageRating,
      recentFeedbacks,
      areaFeedbacks
    };
  };

  const getFilteredFeedbacks = () => {
    // Filtrar apenas feedbacks das áreas do usuário
    const userAreaIds = areas.map(area => area.id);
    let filtered = feedbacks.filter(f => userAreaIds.includes(f.areaId));

    // Filtrar por área
    if (selectedAreaFilter && selectedAreaFilter.trim() !== '') {
      filtered = filtered.filter(feedback => feedback.areaId === selectedAreaFilter);
    }

    // Filtrar por rating
    if (selectedRatingFilter && selectedRatingFilter.trim() !== '') {
      const rating = parseInt(selectedRatingFilter);
      if (!isNaN(rating)) {
        filtered = filtered.filter(feedback => feedback.rating === rating);
      }
    }

    return filtered;
  };

  // Cálculos para métricas
  const userAreaIds = areas.map(area => area.id);
  const userFeedbacks = feedbacks.filter(f => userAreaIds.includes(f.areaId));
  
  const totalFeedbacks = userFeedbacks.length;
  const averageRating = totalFeedbacks > 0 
    ? userFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks 
    : 0;
  const recentFeedbacks = userFeedbacks.filter(f => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return f.createdAt > oneWeekAgo;
  }).length;



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600">Carregando meu painel...</p>
          <p className="text-sm text-theme-secondary mt-2">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Loading adicional para quando ainda não temos dados
  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-600">Carregando dados...</p>
          <p className="text-sm text-theme-secondary mt-2">Preparando seu painel...</p>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-theme-primary">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
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
            case 'base-conhecimento':
              router.push('/base-conhecimento');
              break;
            case 'agente-ia':
              router.push('/agente-ia');
              break;
            case 'pricing':
              router.push('/planos');
              break;
            case 'assinatura':
              router.push('/assinatura');
              break;
            default:
              router.push('/dashboard');
          }
        }}
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="lg:ml-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tutorial Button and Quick Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/areas')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Criar Nova Área
              </button>
              <button
                onClick={() => router.push('/feedbacks')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                Ver Feedbacks
              </button>
            </div>
            <button
              onClick={() => setShowTutorial(true)}
              className="text-purple-600 hover:text-blue-600 text-sm px-3 py-2 rounded-md hover:bg-theme-secondary transition-colors"
            >
              <span className="hidden sm:inline">Tutorial</span>
              <span className="sm:hidden">?</span>
            </button>
          </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card variant="elevated" hover>
                <CardMetric
                  value={areas.length}
                  label="Total de Áreas"
                />
              </Card>

              <Card variant="elevated" hover>
                <CardMetric
                  value={totalFeedbacks}
                  label="Total de Feedbacks"
                />
              </Card>

              <Card variant="elevated" hover>
                <CardMetric
                  value={averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                  label="Avaliação Média"
                />
              </Card>
            </div>



            {/* Gráfico e Atividade Recente */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Gráfico de Feedbacks - 60% */}
              <div className="lg:col-span-3">
                <FeedbackChart feedbacks={userFeedbacks} />
              </div>

              {/* Recent Activity - 40% */}
              <div className="lg:col-span-2">
                <Card variant="default" className="h-full">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-theme-primary">Atividade Recente</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-secondary">Feedbacks na última semana</span>
                        <span className="font-semibold text-primary">{recentFeedbacks}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-secondary">Áreas ativas</span>
                        <span className="font-semibold text-primary">{areas.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Boas Práticas para Pesquisa */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-primary mb-2">Descubra mais</h2>
                <p className="text-secondary">Boas práticas para fazer pesquisa com seus clientes</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Melhoria Contínua */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop&crop=face" 
                      alt="Profissional analisando dados" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">Melhoria Contínua</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Analise os feedbacks regularmente para identificar padrões e implementar melhorias que elevem a qualidade do seu serviço.
                    </p>
                  </div>
                </div>

                {/* Card 2: Aumento nas Vendas */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&crop=face" 
                      alt="Profissional de vendas" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">Aumento nas Vendas</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Use os insights dos clientes para otimizar produtos, serviços e estratégias que impulsionem suas vendas e receita.
                    </p>
                  </div>
                </div>

                {/* Card 3: Fidelização de Clientes */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=face" 
                      alt="Cliente satisfeito" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">Fidelização de Clientes</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Demonstre que você ouve e valoriza a opinião dos clientes, criando laços de confiança e lealdade duradouros.
                    </p>
                  </div>
                </div>

                {/* Card 4: Ouvir o Cliente */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop&crop=face" 
                      alt="Profissional ouvindo cliente" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">Ouvir o Cliente</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Crie canais abertos para feedback anônimo, permitindo que os clientes se expressem livremente sobre suas experiências.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Areas Tab */}
        {activeTab === 'areas' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Gerenciar Áreas</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                {showCreateForm ? 'Cancelar' : 'Nova Área'}
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Criar Nova Área</h3>
                <form onSubmit={handleCreateArea} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Área *
                      </label>
                      <input
                        type="text"
                        value={newAreaName}
                        onChange={(e) => setNewAreaName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                        placeholder="Ex: Recepção, Caixa, Sala de Espera"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição (opcional)
                      </label>
                      <input
                        type="text"
                        value={newAreaDescription}
                        onChange={(e) => setNewAreaDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                        placeholder="Descrição da área"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Criar Área
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {areas.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  Nenhuma área criada ainda
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                  Crie sua primeira área para começar a receber feedbacks!
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm sm:text-base"
                >
                  Criar Primeira Área
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {areas.map((area) => (
                  <div key={area.id} className="bg-white rounded-lg shadow-sm">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {area.name}
                          </h3>
                          {area.description && (
                            <p className="text-gray-600 text-sm mt-1">
                              {area.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteArea(area.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Excluir
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        <QRCodeGenerator 
                          areaId={area.id} 
                          areaName={area.name} 
                          userProfile={userProfile}
                        />
                        
                        {/* Botão Ver Detalhes */}
                        <div className="flex justify-center">
                          <button
                            onClick={() => router.push(`/areas/${area.id}`)}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:opacity-90 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Ver Detalhes</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedbacks Tab */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Todos os Feedbacks</h2>
              <div className="flex space-x-2">
                <select 
                  value={selectedAreaFilter}
                  onChange={(e) => setSelectedAreaFilter(e.target.value)}
                  className="px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-primary-color bg-card text-primary"
                >
                  <option value="">Todas as áreas</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
                <select 
                  value={selectedRatingFilter}
                  onChange={(e) => setSelectedRatingFilter(e.target.value)}
                  className="px-3 py-2 border border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-primary-color bg-card text-primary"
                >
                  <option value="">Todos os ratings</option>
                  <option value="5">5 estrelas</option>
                  <option value="4">4 estrelas</option>
                  <option value="3">3 estrelas</option>
                  <option value="2">2 estrelas</option>
                  <option value="1">1 estrela</option>
                </select>
                {feedbacks.length > 0 && (
                  <button
                    onClick={() => setShowDeleteAllModal(true)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    Excluir Todos
                  </button>
                )}
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm p-6">
              {feedbacks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum feedback recebido ainda
                  </h3>
                  <p className="text-gray-600">
                    Compartilhe os QR Codes para começar a receber feedbacks!
                  </p>
                </div>
              ) : (
                <>
                  {/* Contador de resultados */}
                  {(selectedAreaFilter || selectedRatingFilter) && (
                    <div className="mb-4 p-3 bg-tertiary rounded-lg">
                      <p className="text-sm text-secondary">
                        {getFilteredFeedbacks().length} feedback{getFilteredFeedbacks().length !== 1 ? 's' : ''} encontrado{getFilteredFeedbacks().length !== 1 ? 's' : ''}
                        {(selectedAreaFilter || selectedRatingFilter) && (
                          <span className="text-muted">
                            {' '}com os filtros aplicados
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Lista de feedbacks */}
                  {getFilteredFeedbacks().length === 0 ? (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-primary mb-2">
                        Nenhum feedback encontrado
                      </h3>
                      <p className="text-secondary">
                        {selectedAreaFilter || selectedRatingFilter 
                          ? 'Tente ajustar os filtros para ver mais resultados.'
                          : 'Compartilhe os QR Codes para começar a receber feedbacks!'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getFilteredFeedbacks().map((feedback) => (
                        <div key={feedback.id} className="border-b border-custom pb-4 last:border-b-0">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-2">
                              <span className="text-yellow-500 text-lg">
                                {'⭐'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating)}
                              </span>
                              <span className="text-sm text-secondary">
                                ({feedback.rating}/5)
                              </span>
                            </div>
                            <span className="text-xs text-muted">
                              {new Intl.DateTimeFormat('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(feedback.createdAt)}
                            </span>
                          </div>
                          <p className="text-primary mt-2">{feedback.comment}</p>
                          {feedback.isAnonymous && (
                            <span className="inline-block mt-2 text-xs text-muted bg-tertiary px-2 py-1 rounded">
                              Anônimo
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Base de Conhecimento Tab */}
        {activeTab === 'base-conhecimento' && (
          <div className="space-y-6">
            <KnowledgeBase userSegment={userProfile?.segment} />
          </div>
        )}

        {/* Agente de IA Tab */}
        {activeTab === 'agente-ia' && (
          <div className="space-y-6">
            <AIAgent 
              feedbacks={userFeedbacks} 
              userSegment={userProfile?.segment} 
              areas={areas}
              onClose={() => {}}
            />
          </div>
        )}
      </div>
    </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bem-vindo ao Pesquisou! 🎉</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p>1. <strong>Crie áreas</strong> da sua empresa (ex: Recepção, Caixa)</p>
              <p>2. <strong>Gere QR Codes</strong> para cada área automaticamente</p>
              <p>3. <strong>Compartilhe</strong> os QR Codes com seus clientes</p>
              <p>4. <strong>Receba feedbacks</strong> anônimos em tempo real</p>
              <p>5. <strong>Analise</strong> os resultados no meu painel</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowTutorial(false);
                  localStorage.setItem('hasSeenTutorial', 'true');
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Começar!
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Delete All Feedbacks Modal */}
      {showDeleteAllModal && (
        <DeleteAllFeedbacksModal
          onClose={() => setShowDeleteAllModal(false)}
          onConfirm={handleDeleteAllFeedbacks}
          totalFeedbacks={feedbacks.length}
        />
      )}

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
