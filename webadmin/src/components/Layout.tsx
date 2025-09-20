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
  BellIcon,
  TableCellsIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  BuildingStorefrontIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../hooks/useSocket';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';

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
  const [isDesktop, setIsDesktop] = useState(false);

  const { socket } = useSocket();

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

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: HomeIcon, 
      color: 'text-green-500',
      gradient: 'from-green-500 to-green-600',
      description: 'Tổng quan hệ thống'
    },
    { 
      id: 'menu', 
      name: 'Thực đơn', 
      icon: BuildingStorefrontIcon, 
      color: 'text-green-600',
      gradient: 'from-green-600 to-green-700',
      description: 'Quản lý món ăn'
    },
    { 
      id: 'tables', 
      name: 'Bàn', 
      icon: TableCellsIcon, 
      color: 'text-green-400',
      gradient: 'from-green-400 to-green-500',
      description: 'Quản lý bàn'
    },
    { 
      id: 'payments', 
      name: 'Thanh toán', 
      icon: CurrencyDollarIcon, 
      color: 'text-green-700',
      gradient: 'from-green-700 to-green-800',
      description: 'Quản lý thanh toán'
    },
    { 
      id: 'inventory', 
      name: 'Kho hàng', 
      icon: CubeIcon, 
      color: 'text-green-300',
      gradient: 'from-green-300 to-green-400',
      description: 'Quản lý kho'
    },
    { 
      id: 'stock', 
      name: 'Kiểm kho', 
      icon: ClipboardDocumentListIcon, 
      color: 'text-green-800',
      gradient: 'from-green-800 to-green-900',
      description: 'Kiểm tra tồn kho'
    },
    { 
      id: 'import-export', 
      name: 'Nhập/Xuất', 
      icon: ShoppingCartIcon, 
      color: 'text-green-200',
      gradient: 'from-green-200 to-green-300',
      description: 'Nhập xuất hàng'
    },
    { 
      id: 'transactions', 
      name: 'Giao dịch', 
      icon: ChartBarIcon, 
      color: 'text-green-600',
      gradient: 'from-green-600 to-green-700',
      description: 'Lịch sử giao dịch'
    },
    { 
      id: 'employees', 
      name: 'Nhân viên', 
      icon: UserGroupIcon, 
      color: 'text-green-500',
      gradient: 'from-green-500 to-green-600',
      description: 'Quản lý nhân viên'
    },
    { 
      id: 'customers', 
      name: 'Khách hàng', 
      icon: UserCircleIcon, 
      color: 'text-green-700',
      gradient: 'from-green-700 to-green-800',
      description: 'Quản lý khách hàng'
    },
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

  const currentMenuItem = menuItems.find(item => item.id === currentPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-green-950 dark:via-green-900 dark:to-green-800 transition-all duration-500">
      <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial="closed"
        animate={isDesktop ? "open" : (sidebarOpen ? "open" : "closed")}
        variants={sidebarVariants}
        className="fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-green-50/95 dark:bg-green-900/95 backdrop-blur-xl border-r border-green-200/50 dark:border-green-700/50 lg:translate-x-0 lg:static lg:inset-0 shadow-xl lg:shadow-none flex-shrink-0"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-green-200/50 dark:border-green-700/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">🍃</span>
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Cafe Admin
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Quản lý quán cà phê</p>
              </div>
            </motion.div>
            
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="lg"
                    fullWidth
                    onClick={() => {
                      onPageChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      'justify-start h-auto p-4 group relative overflow-hidden',
                      isActive && `bg-gradient-to-r ${item.gradient} text-white shadow-lg hover:shadow-xl`,
                      !isActive && 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className={cn(
                        'p-2 rounded-lg transition-all duration-200',
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : `bg-gradient-to-br ${item.gradient} text-white group-hover:scale-110`
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.name}</div>
                        <div className={cn(
                          'text-xs opacity-75',
                          isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                        )}>
                          {item.description}
                        </div>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="w-2 h-2 bg-white rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </nav>

          {/* Theme toggle and User info */}
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={toggleDarkMode}
              className="justify-center space-x-2"
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </Button>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Admin</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-green-50/80 dark:bg-green-900/80 backdrop-blur-xl border-b border-green-200/50 dark:border-green-700/50 shadow-sm">
          <div className="flex h-16 items-center justify-between px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Bars3Icon className="w-6 h-6" />
              </Button>
              
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 sm:space-x-3"
              >
                {currentMenuItem && (
                  <>
                    <div className={cn(
                      'p-2 rounded-lg bg-gradient-to-br',
                      currentMenuItem.gradient,
                      'text-white shadow-lg'
                    )}>
                      <currentMenuItem.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="hidden sm:block">
                      <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        {currentMenuItem.name}
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {currentMenuItem.description}
                      </p>
                    </div>
                    <div className="sm:hidden">
                      <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                        {currentMenuItem.name}
                      </h1>
                    </div>
                  </>
                )}
              </motion.div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Button
                  id="notification-bell"
                  variant="ghost"
                  size="icon"
                  className="relative"
                >
                  <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  {unreadNotifications > 0 && (
                    <Badge
                      variant="destructive"
                      size="sm"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      animated
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </motion.div>

              {/* Quick actions */}
              <div className="hidden sm:flex items-center space-x-2">
                <Badge variant="success" dot animated>
                  Online
                </Badge>
                <Badge variant="info">
                  {new Date().toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
      </div>
    </div>
  );
};

export default Layout;
