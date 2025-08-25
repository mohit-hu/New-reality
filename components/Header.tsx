import React from 'react';
import { SparklesIcon, LogoutIcon, UserIcon, MenuIcon } from './Icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface HeaderProps {
  showSignOut?: boolean;
  onSignOut?: () => void;
  userName?: string;
  userAvatar?: string;
  onMenuToggle?: () => void;
  showMenu?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  showSignOut = false, 
  onSignOut,
  userName,
  userAvatar,
  onMenuToggle,
  showMenu = false
}) => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      if (onSignOut) onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Section - Logo & Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            {showMenu && (
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <MenuIcon size={20} />
              </button>
            )}
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-2">
                <SparklesIcon size={24} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">
                  LifeGuide
                </h1>
                <p className="text-xs text-gray-500">
                  Your Growth Assistant
                </p>
              </div>
            </div>
          </div>

          {/* Center Section - Greeting */}
          {userName && (
            <div className="hidden md:flex flex-col items-center">
              <span className="text-sm text-gray-600">
                {getGreeting()}, {userName.split(' ')[0]}! 👋
              </span>
              <span className="text-xs text-gray-400">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          )}

          {/* Right Section - User Menu */}
          <div className="flex items-center gap-3">
            
            {/* User Profile */}
            {(userName || userAvatar) && (
              <div className="flex items-center gap-2">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon size={16} className="text-gray-600" />
                  </div>
                )}
                
                {/* User Name (Desktop Only) */}
                <div className="hidden sm:block">
                  <span className="text-sm font-medium text-gray-700">
                    {userName || 'User'}
                  </span>
                </div>
              </div>
            )}

            {/* Sign Out Button */}
            {showSignOut && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-all duration-200"
                title="Sign Out"
              >
                <LogoutIcon size={16} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Greeting */}
      {userName && (
        <div className="md:hidden px-4 pb-2">
          <span className="text-sm text-gray-600">
            {getGreeting()}, {userName.split(' ')[0]}! 👋
          </span>
        </div>
      )}
    </header>
  );
};

// Alternative Simple Header for Login/Onboarding
export const SimpleHeader: React.FC = () => (
  <header className="bg-white border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center items-center h-16">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-2">
            <SparklesIcon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              LifeGuide AI
            </h1>
          </div>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
