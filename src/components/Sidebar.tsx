'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAdminMode } from '@/contexts/AdminModeContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  userProfile: any;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, onTabChange, user, userProfile, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { isAdminMode } = useAdminMode();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    // Menus básicos (modo usuário)
    { id: 'overview', label: 'Visão Geral', icon: '📊', path: '/dashboard' },
    { id: 'areas', label: 'Áreas', icon: '🏢', path: '/areas' },
    { id: 'feedbacks', label: 'Feedbacks', icon: '💬', path: '/feedbacks' },
    { id: 'base-conhecimento', label: 'Base de Conhecimento', icon: '📚', path: '/base-conhecimento' },
    { id: 'agente-ia', label: 'Agente IA', icon: '🤖', path: '/agente-ia' },
    { id: 'assinatura', label: 'Assinatura', icon: '💳', path: '/assinatura' },
    
    // Menus administrativos
    { id: 'escritorio', label: 'Escritório', icon: '🏛️', path: '/escritorio' },
    { id: 'usuarios-admin', label: 'Usuários Admin', icon: '👥', path: '/usuarios-admin' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    const isAdminItem = ['escritorio', 'usuarios-admin'].includes(item.id);
    const isBasicItem = !isAdminItem;
    
    if (isAdminMode) {
      // Modo admin: mostrar APENAS menus administrativos
      return isAdminItem;
    } else {
      // Modo usuário: mostrar menus básicos (excluir administrativos)
      return isBasicItem;
    }
  });

  // Debug: log do estado do modo admin
  console.log('Sidebar Debug:', { 
    isAdminMode, 
    totalMenuItems: menuItems.length, 
    filteredMenuItems: filteredMenuItems.length,
    filteredItems: filteredMenuItems.map(item => item.id)
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
          className="lg:hidden fixed inset-0 bg-theme-overlay z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-theme-card border-r border-theme-primary z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-theme-primary">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-theme-primary">Pesquisou</h1>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Beta</span>
            </div>
          </div>
          

        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsOpen(false);
                
                // Navegar para a página correspondente
                if (item.path) {
                  router.push(item.path);
                }
              }}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                ${activeTab === item.id
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                  : 'text-theme-secondary hover:bg-theme-secondary hover:text-theme-primary'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Seção de Perfil */}
        <div className="p-4 border-t border-theme-primary">
          {/* User Profile Card */}
          {user && (
            <div 
              className="mb-4 p-3 bg-theme-secondary rounded-lg cursor-pointer hover:bg-theme-tertiary transition-colors"
              onClick={() => window.location.href = '/profile'}
              title="Clique para gerenciar perfil"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {userProfile?.name?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-theme-primary truncate">
                    {userProfile?.name || user?.displayName || 'Usuário'}
                  </p>
                  <p className="text-xs text-theme-secondary truncate">
                    {userProfile?.company || 'Empresa'}
                  </p>
                </div>
                <div className="p-1 text-theme-secondary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-theme-secondary hover:bg-theme-secondary hover:text-theme-primary transition-colors"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
} 