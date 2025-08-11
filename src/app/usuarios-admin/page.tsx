'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Card, { CardHeader, CardContent, CardAction } from '@/components/Card';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useActiveTab } from '@/hooks/useActiveTab';
interface UserData {
  uid: string;
  email: string;
  name?: string;
  company?: string;
  role?: 'user' | 'admin' | 'super_admin';
  plan?: 'free' | 'starter' | 'professional';
  createdAt?: Date;
  areasCount?: number;
}

export default function AdminUsersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'company' | 'role' | 'plan' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [updating, setUpdating] = useState<string | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);

  const router = useRouter();
  const activeTab = useActiveTab();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadUserProfile(user.uid);
        loadAllUsers();
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

  const loadAllUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const areasSnapshot = await getDocs(collection(db, 'areas'));
      
      const areas = areasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      const usersData = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        const areasCount = areas.filter(area => area.userId === doc.id).length;
        
        return {
          uid: doc.id,
          email: userData.email || '',
          name: userData.name || '',
          company: userData.company || '',
          role: userData.role || 'user',
          plan: userData.plan || 'free',
          createdAt: userData.createdAt?.toDate() || new Date(),
          areasCount
        };
      });

      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  // Função para filtrar e ordenar usuários
  const filterAndSortUsers = useCallback(() => {
    let filtered = users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.name?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.company?.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower) ||
        user.plan?.toLowerCase().includes(searchLower)
      );
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // Tratamento especial para datas
      if (sortBy === 'createdAt') {
        aValue = aValue?.getTime() || 0;
        bValue = bValue?.getTime() || 0;
      }

      // Tratamento para valores undefined/null
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

      // Comparação
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, sortBy, sortOrder]);

  // Aplicar filtro e ordenação quando mudar
  useEffect(() => {
    filterAndSortUsers();
  }, [filterAndSortUsers]);

  // Função para formatar data
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'super_admin') => {
    try {
      setUpdating(userId);
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, { role: newRole });
      
      // Atualizar estado local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.uid === userId ? { ...user, role: newRole } : user
        )
      );
      
      console.log(`Role do usuário ${userId} atualizado para ${newRole}`);
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
    } finally {
      setUpdating(null);
    }
  };

  const updateUserPlan = async (userId: string, newPlan: 'free' | 'starter' | 'professional') => {
    try {
      setUpdatingPlan(userId);
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, { plan: newPlan });
      
      // Atualizar estado local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.uid === userId ? { ...user, plan: newPlan } : user
        )
      );
      
      console.log(`Plano do usuário ${userId} atualizado para ${newPlan}`);
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
    } finally {
      setUpdatingPlan(null);
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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Sidebar 
          user={user} 
          userProfile={userProfile} 
          onLogout={handleLogout}
          onTabChange={(tab) => router.push(`/${tab}`)}
          activeTab={activeTab}
        />
        
        <div className="lg:ml-80 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Usuários</h1>
              <p className="text-gray-600 dark:text-gray-400">Controle de permissões e roles dos usuários</p>
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-400/30 rounded-lg">
                <p className="text-sm text-blue-200 dark:text-blue-300">
                  <strong>🔒 Segurança:</strong> O role &quot;Super Admin&quot; só pode ser alterado diretamente no Firestore por questões de segurança.
                </p>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-6 mb-8">
              <Card>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredUsers.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Filtrados</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredUsers.filter(u => u.role === 'user').length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Usuários</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredUsers.filter(u => u.role === 'admin').length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredUsers.filter(u => u.role === 'super_admin').length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Super Admins</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredUsers.filter(u => u.plan === 'free').length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gratuito</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredUsers.filter(u => u.plan === 'starter').length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Starter</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredUsers.filter(u => u.plan === 'professional').length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Professional</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controles de Busca e Ordenação */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Busca */}
                <div className="flex-1 w-full lg:w-96">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    🔍 Buscar Usuários
                  </label>
                  <input
                    type="text"
                    id="search"
                    placeholder="Buscar por nome, email, empresa, role ou plano..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Ordenação */}
                <div className="flex gap-2 items-end">
                  <div>
                    <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                      📊 Ordenar por
                    </label>
                    <select
                      id="sortBy"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="createdAt">Data de Criação</option>
                      <option value="name">Nome</option>
                      <option value="email">Email</option>
                      <option value="company">Empresa</option>
                      <option value="role">Role</option>
                      <option value="plan">Plano</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                      🔄 Ordem
                    </label>
                    <select
                      id="sortOrder"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="desc">Decrescente</option>
                      <option value="asc">Crescente</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Resultados da busca */}
              <div className="mt-4 text-sm text-gray-600">
                {searchTerm && (
                  <p>
                    📋 Mostrando {filteredUsers.length} de {users.length} usuários
                    {searchTerm && ` para "${searchTerm}"`}
                  </p>
                )}
              </div>
            </div>

            {/* Lista de Usuários */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Lista de Usuários</h3>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Áreas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plano
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Criação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <div className="text-4xl mb-2">🔍</div>
                              <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                              <p className="text-sm">
                                {searchTerm 
                                  ? `Nenhum resultado para "${searchTerm}". Tente outros termos.`
                                  : 'Não há usuários cadastrados no sistema.'
                                }
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((userData) => (
                          <tr key={userData.uid}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{userData.email}</div>
                              <div className="text-sm text-gray-500">{userData.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{userData.company}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {userData.areasCount}
                            </span>
                          </td>
                                                  <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userData.role === 'super_admin' 
                              ? 'bg-red-100 text-red-800'
                              : userData.role === 'admin'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {userData.role === 'super_admin' ? 'Super Admin' :
                             userData.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userData.plan === 'professional' 
                              ? 'bg-purple-100 text-purple-800'
                              : userData.plan === 'starter'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userData.plan === 'professional' ? 'Professional' :
                             userData.plan === 'starter' ? 'Starter' : 'Gratuito'}
                                                      </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(userData.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <select
                              value={userData.role}
                              onChange={(e) => updateUserRole(userData.uid, e.target.value as any)}
                              disabled={updating === userData.uid || userData.role === 'super_admin'}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="user">Usuário</option>
                              <option value="admin">Admin</option>
                              {userData.role === 'super_admin' && (
                                <option value="super_admin">Super Admin</option>
                              )}
                            </select>
                            {updating === userData.uid && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            )}
                            {userData.role === 'super_admin' && (
                              <div className="text-xs text-gray-500 italic">
                                🔒 Apenas via Firestore
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <select
                              value={userData.plan}
                              onChange={(e) => updateUserPlan(userData.uid, e.target.value as any)}
                              disabled={updatingPlan === userData.uid}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="free">Gratuito</option>
                              <option value="starter">Starter</option>
                              <option value="professional">Professional</option>
                            </select>
                            {updatingPlan === userData.uid && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            )}
                          </div>
                        </td>
                        </tr>
                      ))
                    )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 