'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <div className="relative group">
      <button
        onClick={toggleTheme}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
      >
        {theme === 'light' ? (
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
        <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
          {theme === 'light' ? 'Escuro' : 'Claro'}
        </span>
      </button>

      {/* Tooltip */}
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[60] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
        <div className="p-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Clique para alternar entre tema claro e escuro
          </p>
        </div>
      </div>
    </div>
  );
} 