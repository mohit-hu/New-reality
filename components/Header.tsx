import React from 'react';
import { SparklesIcon } from './Icons';

interface HeaderProps {
    showSignOut: boolean;
    onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ showSignOut, onSignOut }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-8 h-8 text-brand-primary" />
            <h1 className="text-xl font-bold text-brand-dark tracking-tight">New Reality</h1>
          </div>
           {showSignOut && (
             <button
               onClick={onSignOut}
               className="px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
                Sign Out
            </button>
           )}
        </div>
      </div>
    </header>
  );
};
