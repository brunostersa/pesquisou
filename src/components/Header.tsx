'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminMode } from '@/contexts/AdminModeContext';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
  title: string;
  user?: any;
  userProfile?: any;
  onLogout: () => void;
}

export default function Header({ title, user, userProfile, onLogout }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const { isAdminMode, toggleAdminMode } = useAdminMode();

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleProfileEdit = () => {
    setIsProfileOpen(false);
    router.push('/profile');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Title and Admin Mode Toggle */}
        <div className="flex items-center">
          {/* Admin Mode Toggle */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
            <button
              onClick={toggleAdminMode}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isAdminMode ? 'Desativar Modo Admin' : 'Ativar Modo Admin'}
            >
              <div className={`w-6 h-6 rounded-full border-2 ${isAdminMode ? 'bg-green-500 border-green-600' : 'bg-gray-400 border-gray-500'}`}></div>
            </button>
          )}
          
          <h1 className="ml-3 text-2xl font-bold text-gray-900">{title}</h1>
        </div>

        {/* Right side - User Profile and Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Switcher */}
          <ThemeSwitcher />
          
          {/* User Profile */}
          {user && (
            <div className="relative">
              <button
                onClick={handleProfileClick}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {userProfile?.name?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {userProfile?.name || user?.displayName || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userProfile?.company || 'Empresa'}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                  <div className="py-2">
                    <button
                      onClick={handleProfileEdit}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Configurações
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 