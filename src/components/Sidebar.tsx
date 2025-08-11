'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminMode } from '@/contexts/AdminModeContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user?: any;
  userProfile?: any;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, onTabChange, user, userProfile, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { isAdminMode } = useAdminMode();

  const menuItems = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: '📊',
      description: 'Visão geral do negócio',
      path: '/dashboard',
      showAlways: true
    },
    {
      id: 'areas',
      label: 'Áreas',
      icon: '📍',
      description: 'Gerenciar áreas da empresa',
      path: '/areas',
      showAlways: true
    },
    {
      id: 'feedbacks',
      label: 'Opiniões',
      icon: '💬',
      description: 'Ver todas as opiniões',
      path: '/feedbacks',
      showAlways: true
    },
    {
      id: 'agente-ia',
      label: 'Agente IA',
      icon: '🤖',
      description: 'Análise inteligente de opiniões',
      path: '/agente-ia',
      showAlways: true,
      badge: 'Novo'
    },
    {
      id: 'escritorio',
      label: 'Escritório',
      icon: '⚙️',
      description: 'Controle administrativo',
      path: '/escritorio',
      showAlways: false,
      adminOnly: true,
      badge: 'Admin'
    },
    {
      id: 'usuarios-admin',
      label: 'Usuários Admin',
      icon: '👥',
      description: 'Controle de permissões',
      path: '/usuarios-admin',
      showAlways: false,
      superAdminOnly: true,
      badge: 'Super Admin'
    },
    {
      id: 'base-conhecimento',
      label: 'Base de Conhecimento',
      icon: '📚',
      description: 'Problemas frequentes por segmento',
      path: '/base-conhecimento',
      showAlways: true
    },
    {
      id: 'planos',
      label: 'Planos',
      icon: '💎',
      description: 'Escolha o plano ideal',
      path: '/planos',
      showAlways: true
    },
    {
      id: 'assinatura',
      label: 'Assinatura',
      icon: '💳',
      description: 'Visualize sua assinatura',
      path: '/assinatura',
      showAlways: true
    }
  ];

  const handleNavigation = (itemId: string) => {
    setIsOpen(false);
    
    // Chamar onTabChange para sincronizar com a página pai
    onTabChange(itemId);
    
    // Navegar para a URL
    const menuItem = menuItems.find(item => item.id === itemId);
    if (menuItem) {
      router.push(menuItem.path);
    }
  };

  // Filtrar itens do menu baseado no role e modo admin
  const filteredMenuItems = menuItems.filter(item => {
    const userRole = userProfile?.role || 'user';
    
    // Se for super admin e estiver no modo admin, mostrar apenas itens administrativos
    if (userRole === 'super_admin' && isAdminMode) {
      return item.adminOnly || item.superAdminOnly;
    }
    
    // Para outros casos, manter a lógica original
    if (item.showAlways) return true;
    
    if (item.adminOnly) {
      return isAdminMode && (userRole === 'admin' || userRole === 'super_admin');
    }
    
    if (item.superAdminOnly) {
      return isAdminMode && userRole === 'super_admin';
    }
    
    return false;
  });

  return (
    <>
      {/* Botão para abrir sidebar em mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Pesquisou</h1>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Beta</span>
            </div>
          </div>
          
          
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`
                w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 ease-in-out
                ${activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className={`text-xs ${activeTab === item.id ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'}`}>
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userProfile?.name || user?.displayName || 'Usuário'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {userProfile?.company || 'Empresa'}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push('/profile')}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                title="Configurações"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </button>
              
              <button
                onClick={onLogout}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                title="Sair"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Botão para fechar sidebar em mobile */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </>
  );
} 