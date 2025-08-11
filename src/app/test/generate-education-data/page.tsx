'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function GenerateEducationDataPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notification, setNotification] = useState<string>('');

  const router = useRouter();

  // Áreas educacionais essenciais
  const educationAreas = [
    'Atendimento ao Aluno',
    'Infraestrutura', 
    'Qualidade do Ensino',
    'Segurança',
    'Limpeza e Higiene'
  ];

  // Comentários simples e diretos
  const comments = [
    'Excelente escola, muito satisfeito.',
    'Boa qualidade de ensino.',
    'Professores dedicados e competentes.',
    'Infraestrutura adequada.',
    'Ambiente seguro e limpo.',
    'Atendimento eficiente.',
    'Comunicação clara com os pais.',
    'Atividades bem organizadas.',
    'Recursos educacionais adequados.',
    'Escola recomendada.'
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const generateRandomRating = (): number => {
    const rand = Math.random();
    if (rand < 0.7) return Math.floor(Math.random() * 2) + 4; // 70% 4-5
    if (rand < 0.9) return 3; // 20% 3
    return Math.floor(Math.random() * 2) + 1; // 10% 1-2
  };

  const generateRandomDate = (): Date => {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 180); // Últimos 6 meses
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  const createEducationData = async () => {
    if (!user) return;
    
    setGenerating(true);
    setProgress(0);
    setNotification('');
    
    try {
      // Criar áreas educacionais
      const createdAreas: any[] = [];
      
      for (let i = 0; i < educationAreas.length; i++) {
        const areaData = {
          name: educationAreas[i],
          description: `Área de ${educationAreas[i].toLowerCase()}`,
          userId: user.uid,
          createdAt: new Date(),
          qrCodeUrl: `https://pesquisou.com/qr/${i + 1}`
        };
        
        const docRef = await addDoc(collection(db, 'areas'), areaData);
        createdAreas.push({ id: docRef.id, ...areaData });
        setProgress((i + 1) / educationAreas.length * 30);
      }
      
      // Gerar 200 feedbacks
      const totalFeedbacks = 200;
      const feedbacksPerArea = Math.floor(totalFeedbacks / createdAreas.length);
      
      for (let i = 0; i < createdAreas.length; i++) {
        const area = createdAreas[i];
        const areaFeedbacks = i === createdAreas.length - 1 
          ? totalFeedbacks - (i * feedbacksPerArea)
          : feedbacksPerArea;
        
        for (let j = 0; j < areaFeedbacks; j++) {
          const feedback = {
            areaId: area.id,
            rating: generateRandomRating(),
            comment: comments[Math.floor(Math.random() * comments.length)],
            createdAt: generateRandomDate(),
            isAnonymous: Math.random() > 0.2
          };
          
          await addDoc(collection(db, 'feedbacks'), feedback);
          
          const currentProgress = 30 + ((i * feedbacksPerArea + j + 1) / totalFeedbacks * 70);
          setProgress(currentProgress);
        }
      }
      
      setNotification('✅ 200 avaliações educacionais criadas com sucesso!');
      
    } catch (error) {
      console.error('Erro:', error);
      setNotification('❌ Erro ao gerar dados. Tente novamente.');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const clearAllData = async () => {
    if (!user || !confirm('Excluir TODOS os dados? Não pode ser desfeito.')) return;
    
    setGenerating(true);
    
    try {
      // Excluir áreas e feedbacks
      const areasQuery = query(collection(db, 'areas'), where('userId', '==', user.uid));
      const areasSnapshot = await getDocs(areasQuery);
      
      for (const areaDoc of areasSnapshot.docs) {
        const feedbacksQuery = query(collection(db, 'feedbacks'), where('areaId', '==', areaDoc.id));
        const feedbacksSnapshot = await getDocs(feedbacksQuery);
        
        for (const feedbackDoc of feedbacksSnapshot.docs) {
          await deleteDoc(feedbackDoc.ref);
        }
        
        await deleteDoc(areaDoc.ref);
      }
      
      setNotification('🗑️ Todos os dados foram excluídos.');
      
    } catch (error) {
      console.error('Erro:', error);
      setNotification('❌ Erro ao excluir dados.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Simples */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎓 Gerador de Dados</h1>
          <p className="text-gray-600">Cria 200 avaliações para 5 áreas educacionais</p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Áreas */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">📚 Áreas Criadas:</h3>
            <div className="space-y-2">
              {educationAreas.map((area, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">{area}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="space-y-4">
            <button
              onClick={createEducationData}
              disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Gerar 200 Avaliações</span>
                </>
              )}
            </button>
            
            <button
              onClick={clearAllData}
              disabled={generating}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🗑️ Limpar Todos os Dados
            </button>
          </div>

          {/* Progresso */}
          {generating && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progresso</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Notificação */}
          {notification && (
            <div className={`mt-4 p-3 rounded-lg text-center ${
              notification.includes('✅') 
                ? 'bg-green-100 text-green-700' 
                : notification.includes('❌')
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {notification}
            </div>
          )}
        </div>

        {/* Instruções Simples */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>• 5 áreas educacionais essenciais</p>
          <p>• 200 feedbacks distribuídos igualmente</p>
          <p>• 70% avaliações 4-5 estrelas (realista)</p>
          <p>• Datas dos últimos 6 meses</p>
        </div>
      </div>
    </div>
  );
}
