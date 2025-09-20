import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bars3Icon, 
  XMarkIcon, 
  SunIcon, 
  MoonIcon,
  HomeIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../hooks/useSocket';
// import { useToast } from '../hooks/useToast';
// import ToastContainer from './Toast';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  notifications?: any[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentPage, 
  onPageChange, 
  notifications = [] 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const { socket } = useSocket();
  // const { toasts, removeToast, success, error, warning, info } = useToast();

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Apply dark mode to document
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    // Count unread notifications
    const unread = notifications.filter(n => !n.read).length;
    setUnreadNotifications(unread);
  }, [notifications]);

  useEffect(() => {
    // Listen for new notifications
    if (socket) {
      socket.on('notification', () => {
        // Trigger notification animation
        const notificationBell = document.getElementById('notification-bell');
        if (notificationBell) {
          notificationBell.classList.add('animate-pulse-slow');
          setTimeout(() => {
            notificationBell.classList.remove('animate-pulse-slow');
          }, 2000);
        }
      });
    }
  }, [socket]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon, color: 'text-blue-500' },
    { id: 'payments', name: 'Payments', icon: ChartBarIcon, color: 'text-green-500' },
    { id: 'inventory', name: 'Inventory', icon: ShoppingCartIcon, color: 'text-purple-500' },
    { id: 'employees', name: 'Employees', icon: UserGroupIcon, color: 'text-orange-500' },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon, color: 'text-gray-500' },
  ];

  const sidebarVariants = {
    open: { 
      x: 0, 
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      } 
    },
    closed: { 
      x: "-100%", 
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      } 
    }
  };

  const overlayVariants = {
    open: { opacity: 1, transition: { duration: 0.2 } },
    closed: { opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="layout-container min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 transition-colors duration-300">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial="closed"
        animate={sidebarOpen ? "open" : "closed"}
        variants={sidebarVariants}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CF</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Cafe Admin
              </span>
            </motion.div>
            
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    onPageChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
              <span className="font-medium">
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="main-content lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-slate-900 dark:text-white"
              >
                {menuItems.find(item => item.id === currentPage)?.name || 'Dashboard'}
              </motion.h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <motion.button
                id="notification-bell"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <BellIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                {unreadNotifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                  >
                    {unreadNotifications}
                  </motion.span>
                )}
              </motion.button>

              {/* User profile */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">A</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Admin</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      {/* Toast Container */}
      {/* <ToastContainer toasts={toasts} onRemove={removeToast} /> */}
    </div>
  );
};

export default Layout;
