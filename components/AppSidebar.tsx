// src/components/AppSidebar.tsx
import React, { 
  useEffect, 
  useState, 
  useCallback, 
  useMemo, 
  memo,
  useRef
} from "react";
import { 
  Sidebar, 
  SidebarItem, 
  SidebarItemGroup, 
  SidebarItems,
  Badge,
  Spinner,
  Avatar 
} from "flowbite-react";
import { 
  HiHome, 
  HiClipboardList, 
  HiChartBar, 
  HiLightBulb,
  HiCog,
  HiLogout,
  HiRefresh,
  HiTrendingUp,
  HiCalendar,
  HiUser
} from "react-icons/hi";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { 
  getPreviousDayTasksString,
  getUserData,
  getDailyPlan,
  healthCheck
} from "../services/firestoreService";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import Dashboard from "./Dashboard";
import GoalTrackingPage from "./GoalTrackingPage";
import AITrainerPage from "./AITrainerPage";




interface AppSidebarProps {
  userId: string;
  userName?: string;
  userAvatar?: string;
  onNavigate?: (path: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavigationItem {
  path: string;
  name: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
}

interface TaskHistoryItem {
  text: string;
  isCompleted: boolean;
  date: string;
}

interface SidebarState {
  currentPage: string;
  taskHistory: TaskHistoryItem[];
  loading: boolean;
  error: string | null;
  userStats: {
    totalTasks: number;
    completedTasks: number;
    streak: number;
    level: number;
  };
  systemHealth: 'healthy' | 'degraded' | 'unhealthy';
}


const useTaskHistory = (userId: string) => {
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, TaskHistoryItem[]>>(new Map());

  const fetchTaskHistory = useCallback(async (days: number = 7) => {
    if (!userId) return;

    const cacheKey = `${userId}-${days}`;
    const cached = cacheRef.current.get(cacheKey);
    
    if (cached) {
      setHistory(cached);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const today = new Date();
      const historyPromises = Array.from({ length: days }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (i + 1));
        const dateStr = date.toISOString().split("T")[0];
        
        return getPreviousDayTasksString(userId, dateStr)
          .then(data => ({ data, date: dateStr }))
          .catch(err => ({ data: null, date: dateStr, error: err }));
      });

      const results = await Promise.all(historyPromises);
      const parsedHistory: TaskHistoryItem[] = [];

      results.forEach(({ data, date }) => {
        if (data && data !== "No previous tasks recorded.") {
          const tasks = data.split('\n').filter(task => task.trim());
          tasks.forEach(task => {
            const isCompleted = task.includes('(Completed)');
            const text = task.replace(/\s*\((Completed|Not Completed)\)\s*$/, '').replace(/^-\s*/, '');
            
            if (text) {
              parsedHistory.push({
                text,
                isCompleted,
                date
              });
            }
          });
        }
      });

      parsedHistory.sort((a, b) => b.date.localeCompare(a.date));
      cacheRef.current.set(cacheKey, parsedHistory);
      setHistory(parsedHistory);
    } catch (err: any) {
      console.error('Error fetching task history:', err);
      setError(err.message || 'Failed to load task history');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { history, loading, error, fetchTaskHistory };
};

const useUserStats = (userId: string) => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    streak: 0,
    level: 1
  });
  
  const [loading, setLoading] = useState(false);

  const calculateStats = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayPlan = await getDailyPlan(userId, today);
      
      if (todayPlan) {
        const total = todayPlan.tasks.filter(t => !t.id.includes('quote')).length;
        const completed = todayPlan.tasks.filter(t => t.isCompleted && !t.id.includes('quote')).length;
        
        // Calculate level based on completed tasks (every 10 completed tasks = 1 level)
        const level = Math.floor(completed / 10) + 1;
        
        setStats({
          totalTasks: total,
          completedTasks: completed,
          streak: completed === total && total > 0 ? 1 : 0, // Simplified streak calculation
          level
        });
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return { stats, loading, refreshStats: calculateStats };
};

const useSystemHealth = () => {
  const [health, setHealth] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');
  
  const checkHealth = useCallback(async () => {
    try {
      const result = await healthCheck();
      setHealth(result.status === 'healthy' ? 'healthy' : 'degraded');
    } catch (error) {
      setHealth('unhealthy');
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, checkHealth };
};

// ===============================
// UTILITY COMPONENTS
// ===============================

const LoadingSkeleton = memo(() => (
  <div className="animate-pulse space-y-2">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-4 bg-gray-200 rounded"></div>
    ))}
  </div>
));

const TaskHistoryItem = memo<{ task: TaskHistoryItem; index: number }>(({ task, index }) => (
  <li 
    className={`text-xs p-2 rounded-lg transition-all duration-200 border ${
      task.isCompleted 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-gray-50 border-gray-200 text-gray-600'
    }`}
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <div className="flex items-start gap-2">
      <span className={`text-xs mt-0.5 ${task.isCompleted ? '✅' : '⏳'}`}>
        {task.isCompleted ? '✅' : '⏳'}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`font-medium leading-tight ${
          task.isCompleted ? 'line-through' : ''
        }`}>
          {task.text}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(task.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </div>
  </li>
));

const UserProfile = memo<{ 
  userName: string; 
  userAvatar?: string; 
  stats: any; 
  collapsed: boolean;
  onLogout: () => void;
}>(({ userName, userAvatar, stats, collapsed, onLogout }) => (
  <div className={`p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 ${
    collapsed ? 'px-2' : ''
  }`}>
    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
      <div className="relative">
        <Avatar
          img={userAvatar}
          size={collapsed ? "sm" : "md"}
          rounded
          className="ring-2 ring-blue-200"
        />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
      </div>
      
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 truncate text-sm">
            {userName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge color="purple" size="xs">
              Level {stats.level}
            </Badge>
            <span className="text-xs text-gray-500">
              {stats.completedTasks}/{stats.totalTasks} today
            </span>
          </div>
        </div>
      )}
    </div>
    
    {!collapsed && (
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/70 rounded-lg p-2">
          <div className="text-lg font-bold text-blue-600">{stats.streak}</div>
          <div className="text-xs text-gray-500">Streak</div>
        </div>
        <div className="bg-white/70 rounded-lg p-2">
          <div className="text-lg font-bold text-green-600">{stats.completedTasks}</div>
          <div className="text-xs text-gray-500">Done</div>
        </div>
        <div className="bg-white/70 rounded-lg p-2">
          <div className="text-lg font-bold text-purple-600">{stats.level}</div>
          <div className="text-xs text-gray-500">Level</div>
        </div>
      </div>
    )}
    
    {!collapsed && (
      <button
        onClick={onLogout}
        className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
        aria-label="Sign out"
      >
        <HiLogout />
        Sign Out
      </button>
    )}
  </div>
));

const SystemStatus = memo<{ 
  health: 'healthy' | 'degraded' | 'unhealthy';
  onRefresh: () => void;
  collapsed: boolean;
}>(({ health, onRefresh, collapsed }) => {
  const statusConfig = {
    healthy: { color: 'green', icon: '🟢', text: 'All systems operational' },
    degraded: { color: 'yellow', icon: '🟡', text: 'Some features may be slow' },
    unhealthy: { color: 'red', icon: '🔴', text: 'Service issues detected' }
  };

  const config = statusConfig[health];

  if (collapsed) {
    return (
      <div className="p-2 border-t">
        <button
          onClick={onRefresh}
          className="w-full flex justify-center p-2 hover:bg-gray-50 rounded-lg"
          title={config.text}
        >
          <span className="text-sm">{config.icon}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 border-t bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{config.icon}</span>
          <span className="text-xs text-gray-600">System Status</span>
        </div>
        <button
          onClick={onRefresh}
          className="p-1 hover:bg-gray-200 rounded"
          title="Refresh status"
        >
          <HiRefresh className="w-3 h-3 text-gray-500" />
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">{config.text}</p>
    </div>
  );
});

// ===============================

export const AppSidebar = memo<AppSidebarProps>(({ 
  userId, 
  userName = "User",
  userAvatar,
  onNavigate,
  collapsed = false,
  onToggleCollapse
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<SidebarState>({
    currentPage: "Dashboard",
    taskHistory: [],
    loading: false,
    error: null,
    userStats: {
      totalTasks: 0,
      completedTasks: 0,
      streak: 0,
      level: 1
    },
    systemHealth: 'healthy'
  });

  const { history, loading: historyLoading, error: historyError, fetchTaskHistory } = useTaskHistory(userId);
  const { stats, loading: statsLoading, refreshStats } = useUserStats(userId);
  const { health, checkHealth } = useSystemHealth();

  // Navigation items configuration
  const navigationItems: NavigationItem[] = useMemo(() => [
    {
      path: "/",
      name: "Dashboard",
      icon: HiHome,
      badge: stats.completedTasks > 0 ? stats.completedTasks : undefined
    },
    {
      path: "/tasks",
      name: "My Tasks",
      icon: HiClipboardList,
      badge: stats.totalTasks - stats.completedTasks > 0 ? stats.totalTasks - stats.completedTasks : undefined
    },
    {
      path: "/GoalTrackingPage",
      name: "Goal Tracking",
      icon: HiChartBar
    },
    {
      path: "/AITrainerPage",
      name: "AI Trainer",
      icon: HiLightBulb
    },
    {
      path: "/profile",
      name: "Profile",
      icon: HiUser
    },
    {
      path: "/settings",
      name: "Settings",
      icon: HiCog
    }
  ], [stats.completedTasks, stats.totalTasks]);

  // Page name mapping
  const pageNames: Record<string, string> = useMemo(() => 
    Object.fromEntries(navigationItems.map(item => [item.path, item.name]))
  , [navigationItems]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [navigate]);

  // Handle navigation
  const handleNavigation = useCallback((path: string) => {
    onNavigate?.(path);
    if (window.innerWidth < 768) {
      onToggleCollapse?.();
    }
  }, [onNavigate, onToggleCollapse]);

  // Update current page and fetch data
  useEffect(() => {
    const currentPageName = pageNames[location.pathname] || "Dashboard";
    setState(prev => ({ ...prev, currentPage: currentPageName }));
    
    if (userId) {
      fetchTaskHistory(7);
      refreshStats();
    }
  }, [location.pathname, userId, pageNames, fetchTaskHistory, refreshStats]);

  // Update state when data changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      taskHistory: history,
      loading: historyLoading || statsLoading,
      error: historyError,
      userStats: stats,
      systemHealth: health
    }));
  }, [history, historyLoading, statsLoading, historyError, stats, health]);

  // Cleanup
  useEffect(() => {
    return () => {
      // Cleanup any subscriptions or timers if needed
    };
  }, []);

  return (
    <div className={`h-full bg-white shadow-lg transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <Sidebar 
        aria-label="Application Navigation" 
        className="h-full"
        collapsed={collapsed}
      >
        {/* User Profile Section */}
        <UserProfile
          userName={userName}
          userAvatar={userAvatar}
          stats={state.userStats}
          collapsed={collapsed}
          onLogout={handleLogout}
        />

        {/* Current Page Header */}
        {!collapsed && (
          <div className="p-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-blue-600">📍</span>
                {state.currentPage}
              </h2>
              <button
                onClick={() => {
                  refreshStats();
                  fetchTaskHistory(7);
                  checkHealth();
                }}
                className="p-2 hover:bg-white/70 rounded-lg transition-colors duration-200"
                title="Refresh data"
              >
                <HiRefresh className={`w-4 h-4 text-gray-500 ${
                  state.loading ? 'animate-spin' : ''
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <SidebarItems>
          <SidebarItemGroup>
            {navigationItems.map((item) => (
              <SidebarItem
                key={item.path}
                as={Link}
                to={item.path} // ✅ Correct for React Router
                icon={item.icon}
                className={`transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500 font-semibold'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => handleNavigation(item.path)}
                disabled={item.disabled}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={collapsed ? 'sr-only' : ''}>{item.name}</span>
                  {item.badge && !collapsed && (
                    <Badge color="blue" size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </SidebarItem>
            ))}
          </SidebarItemGroup>
        </SidebarItems>

        {/* Task History Section */}
        {!collapsed && (
          <div className="border-t bg-gray-50 flex-1 flex flex-col">
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                  <span>📜</span>
                  Recent Tasks
                </h3>
                <Badge color="gray" size="xs">
                  {history.length}
                </Badge>
              </div>
              
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {state.loading ? (
                  <LoadingSkeleton />
                ) : state.error ? (
                  <div className="text-center py-4">
                    <p className="text-red-500 text-xs mb-2">Failed to load history</p>
                    <button
                      onClick={() => fetchTaskHistory(7)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : history.length > 0 ? (
                  <ul className="space-y-2">
                    {history.slice(0, 10).map((task, idx) => (
                      <TaskHistoryItem key={`${task.date}-${idx}`} task={task} index={idx} />
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-gray-500 text-xs">No recent tasks found</p>
                    <p className="text-gray-400 text-xs mt-1">Complete some tasks to see history</p>
                  </div>
                )}
              </div>
              
              {history.length > 10 && (
                <div className="mt-3 text-center">
                  <Link 
                    to="/tasks"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View all tasks →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Status */}
        <SystemStatus 
          health={state.systemHealth}
          onRefresh={checkHealth}
          collapsed={collapsed}
        />

        {/* Collapse Toggle Button */}
        {onToggleCollapse && (
          <div className="p-2 border-t">
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className={`transform transition-transform duration-200 ${
                collapsed ? 'rotate-180' : ''
              }`}>
                ←
              </span>
            </button>
          </div>
        )}
      </Sidebar>

      {/* Custom Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8);
        }
      `}</style>
    </div>
  );
});

// Performance optimizations
LoadingSkeleton.displayName = 'LoadingSkeleton';
TaskHistoryItem.displayName = 'TaskHistoryItem';
UserProfile.displayName = 'UserProfile';
SystemStatus.displayName = 'SystemStatus';
AppSidebar.displayName = 'AppSidebar';

export default AppSidebar;
