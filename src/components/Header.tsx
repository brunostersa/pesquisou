'use client';

import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import ThemeSwitcher from './ThemeSwitcher';

export default function Header() {
  const [user] = useAuthState(auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-theme-card border-b border-theme-primary shadow-theme-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="text-xl font-bold text-theme-primary">Pesquisou</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme Switcher */}
            <ThemeSwitcher />
            
            {/* User Profile */}
            {user && (
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-theme-secondary transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <span className="text-theme-primary font-medium hidden sm:block">
                    {user.displayName || 'Usuário'}
                  </span>
                  <svg
                    className={`w-4 h-4 text-theme-secondary transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-theme-card border border-theme-primary rounded-lg shadow-theme-lg z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-theme-primary">
                        <p className="text-sm font-medium text-theme-primary">
                          {user.displayName || 'Usuário'}
                        </p>
                        <p className="text-xs text-theme-secondary">
                          {user.email}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => auth.signOut()}
                        className="w-full text-left px-4 py-2 text-sm text-theme-secondary hover:bg-theme-secondary transition-colors"
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
      </div>
    </header>
  );
} 