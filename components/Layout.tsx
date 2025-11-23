import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Upload, BarChart3, Menu, X, PieChart, Shield, LogOut } from 'lucide-react';
import { getCurrentUser, hasPermission, logout } from '../services/auth';
import { User } from '../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser && location.pathname !== '/login') {
        navigate('/login');
    }
    setUser(currentUser);
  }, [location, navigate]);

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  // If on login page, render children only (no sidebar)
  if (location.pathname === '/login') {
      return <>{children}</>;
  }

  if (!user) return null; // Wait for redirect

  const allNavItems = [
    { to: '/', label: 'Home', icon: BarChart3 },
    { to: '/roster', label: 'Roster & Teams', icon: Users },
    { to: '/schedule', label: 'Schedule', icon: Calendar },
    { to: '/import', label: 'Data Entry', icon: Upload },
    { to: '/report', label: 'Game Dashboard', icon: LayoutDashboard },
    { to: '/team-stats', label: 'Team Stats', icon: PieChart },
    { to: '/users', label: 'User Management', icon: Shield },
  ];

  const visibleItems = allNavItems.filter(item => hasPermission(user.role, item.to));

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
        flex flex-col
      `}>
        <div className="h-16 flex items-center justify-between px-6 bg-orange-600 shrink-0">
          <div className="font-bold text-xl flex items-center gap-2">
            <span className="text-2xl">🏀</span> BasketStats
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
        
        <div className="p-4 bg-slate-800 shrink-0">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold text-white">
                    {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <div className="font-bold text-sm truncate">{user.name}</div>
                    <div className="text-xs text-slate-400 capitalize">{user.role}</div>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (Mobile Only) */}
        <header className="lg:hidden h-16 bg-white border-b flex items-center px-4 justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600">
            <Menu size={24} />
          </button>
          <span className="font-bold text-slate-800">BasketStats Pro</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
