// components/Settings.tsx
import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeOption {
  id: ThemeMode;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'light',
    name: 'Light Mode',
    icon: <FiSun className="w-5 h-5" />,
    description: 'Always use light theme'
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    icon: <FiMoon className="w-5 h-5" />,
    description: 'Always use dark theme'
  },
  {
    id: 'system',
    name: 'System Mode',
    icon: <FiMonitor className="w-5 h-5" />,
    description: 'Follow system preference'
  }
];

export const Settings: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('system');

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const applyTheme = (theme: ThemeMode) => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      // Remove theme classes and let system preference take over
      root.classList.remove('light', 'dark');
      
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.add('light');
      }
    } else {
      // Apply specific theme
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
  };

  const handleThemeChange = (theme: ThemeMode) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Settings</h2>
        <p className="text-gray-600 dark:text-gray-300">Customize your app appearance</p>
      </div>

      {/* Theme Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Theme Mode
        </h3>
        
        <div className="space-y-3">
          {themeOptions.map((option) => (
            <div
              key={option.id}
              className={`
                relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${currentTheme === option.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }
              `}
              onClick={() => handleThemeChange(option.id)}
            >
              {/* Radio Button */}
              <div className="flex items-center">
                <div className={`
                  w-4 h-4 rounded-full border-2 mr-4
                  ${currentTheme === option.id
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300 dark:border-gray-600'
                  }
                `}>
                  {currentTheme === option.id && (
                    <div className="w-2 h-2 rounded-full bg-white m-0.5"></div>
                  )}
                </div>
                
                {/* Icon */}
                <div className={`
                  mr-4 
                  ${currentTheme === option.id 
                    ? 'text-blue-500' 
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}>
                  {option.icon}
                </div>
                
                {/* Text */}
                <div className="flex-1">
                  <h4 className={`
                    font-medium 
                    ${currentTheme === option.id 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-gray-800 dark:text-white'
                    }
                  `}>
                    {option.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Theme Display */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Theme:
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {currentTheme} mode
            </span>
            <div className="text-blue-500">
              {themeOptions.find(opt => opt.id === currentTheme)?.icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
