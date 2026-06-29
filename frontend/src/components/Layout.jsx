import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FiHome, FiFileText, FiList, FiBarChart2, FiSettings, 
  FiShield, FiLogOut, FiSun, FiMoon, FiBell, FiMenu, FiX, FiCheckCircle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children, activePage, setActivePage }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: "New feedback draft auto-saved", time: "5 mins ago", type: "info" },
    { id: 2, text: "Driver Ramesh Kumar's rating updated to 4.8", time: "1 hour ago", type: "success" },
    { id: 3, text: "OpenAI GPT-4o Connection Active", time: "2 hours ago", type: "success" }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'generate', label: 'Generate Feedback', icon: FiFileText },
    { id: 'history', label: 'History', icon: FiList },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  // Include Admin Panel if admin
  if (user?.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: FiShield });
  }

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard';
      case 'generate': return 'Generate Feedback';
      case 'history': return 'History Logs';
      case 'analytics': return 'Performance Analytics';
      case 'settings': return 'System Settings';
      case 'admin': return 'Admin Dashboard';
      default: return 'Feedback Script Generator';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-300">
      {/* Animated Background Mesh */}
      <div className="bg-mesh bg-mesh-light dark:bg-mesh"></div>

      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md bg-white/60 dark:bg-darkbg/60 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚌</span>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent text-sm">
            MANIVTHA TOURS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {isDarkMode ? <FiSun /> : <FiMoon />}
          </button>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <FiMenu />
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop and Mobile (Drawer) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 p-6 glass-panel flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-white/80 dark:bg-slate-900/85 border-r border-slate-200/40 dark:border-slate-800/40
      `}>
        <div>
          {/* Logo & Close button for Mobile */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold shadow-md shadow-primary/20">
                🚌
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 dark:text-white leading-none text-base tracking-wide">
                  MANIVTHA
                </h1>
                <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                  Tours & Travels
                </span>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20 scale-[1.02]' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout & User details */}
        <div className="mt-8 border-t border-slate-200/50 dark:border-slate-850/50 pt-6">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img 
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80'} 
              alt="Manager Avatar" 
              className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover"
            />
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm text-slate-850 dark:text-white truncate">
                {user?.name || 'Rohan Sharma'}
              </h4>
              <span className="text-xs text-slate-400 capitalize">
                {user?.role || 'Manager'}
              </span>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-550/10 dark:hover:bg-rose-500/10 transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header - Desktop Only */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-slate-200/20 dark:border-slate-800/20 bg-white/20 dark:bg-transparent backdrop-blur-sm sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white">
              {getPageTitle()}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Welcome back, {user?.name || 'Manager'} • Manivtha Tours & Travels Portal
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200/30 dark:border-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? <FiSun className="w-5 h-5 text-amber-500" /> : <FiMoon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl border border-slate-200/30 dark:border-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 transition-colors relative"
              >
                <FiBell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-ping"></span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent"></span>
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-80 glass-panel border border-slate-200/40 dark:border-slate-800/40 shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden z-30 p-4"
                    >
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-850">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Notifications</span>
                        <span className="text-[10px] text-accent font-semibold px-2 py-0.5 bg-accent/15 rounded-full">3 New</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {notifications.map((n) => (
                          <div key={n.id} className="flex gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <FiCheckCircle className="text-accent mt-0.5 w-4 h-4 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-slate-705 dark:text-slate-300 leading-normal">{n.text}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-3 border-l border-slate-200/30 dark:border-slate-800/30 pl-4">
              <img 
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80'} 
                alt="Profile" 
                className="w-9 h-9 rounded-full object-cover border border-primary/20"
              />
              <div className="text-left">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">
                  {user?.name || 'Rohan Sharma'}
                </h4>
                <span className="text-[10px] text-slate-400 capitalize">{user?.role || 'Manager'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Overlay Background */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
        ></div>
      )}
    </div>
  );
};

export default Layout;
