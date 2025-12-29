import React, { useEffect, useState, useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Upload, BarChart3, Menu, X, PieChart, Shield, LogOut, Settings } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { hasPermission } from '../services/auth';
import { AppData } from '../types';
import { getDB } from '../services/storage';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useContext(AppContext);
  const [appSettings, setAppSettings] = useState(getDB().settings);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (appSettings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    document.title = appSettings.appName;
  }, [appSettings]);

  useEffect(() => {
    setAppSettings(getDB().settings);
  }, [location]);

  const handleLogout = async () => {
      await logout();
      navigate('/login');
  };

  if (location.pathname === '/login') {
      return <>{children}</>;
  }
  
  // Temporaneamente, assegniamo un ruolo fittizio per visualizzare i link.
  // Questo verrà sostituito quando i dati utente saranno in Supabase.
  const userRole = user ? 'admin' : ''; // Default to empty if no user
  const userName = user?.email?.split('@')[0] || 'User';


  const allNavItems = [
    { to: '/', label: 'Home', icon: BarChart3 },
    { to: '/roster', label: 'Roster & Teams', icon: Users },
    { to: '/schedule', label: 'Schedule', icon: Calendar },
    { to: '/import', label: 'Data Entry', icon: Upload },
    { to: '/report', label: 'Game Dashboard', icon: LayoutDashboard },
    { to: '/team-stats', label: 'Team Stats', icon: PieChart },
    { to: '/users', label: 'User Management', icon: Shield },
    { to: '/setup', label: 'Setup', icon: Settings },
  ];

  const visibleItems = allNavItems; //.filter(item => hasPermission(userRole, item.to));

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white dark:bg-slate-950 dark:border-r dark:border-slate-800 transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
        flex flex-col
      `}>
        <div className="h-16 flex items-center justify-between px-6 bg-orange-600 shrink-0">
          <div className="font-bold text-xl flex items-center gap-2 overflow-hidden">
            {appSettings.appLogoUrl ? (
                <img src={appSettings.appLogoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
                <span className="text-2xl shrink-0">🏀</span>
            )}
            <span className="truncate">{appSettings.appName}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 bg-slate-800 dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold text-white shrink-0">
                    {userName.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <div className="font-bold text-sm truncate text-white">{userName}</div>
                    <div className="text-xs text-slate-400 capitalize">{userRole}</div>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm text-slate-200 transition-colors"
            >
                <LogOut size={16} /> Logout
            </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden h-16 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center px-4 justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 dark:text-slate-300">
            <Menu size={24} />
          </button>
          <span className="font-bold text-slate-800 dark:text-white">{appSettings.appName}</span>
          <div className="w-6" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;