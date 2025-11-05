import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-30">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <a href="#/" className="text-2xl font-extrabold text-primary-600 dark:text-primary-400 hover:opacity-80 transition-opacity">
              Thuê Đồ UI
            </a>
          </div>
          <div className="flex items-center">
            <a
              href="#/admin"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Quản trị viên
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};