import React, { useContext } from 'react';
// FIX: Switched to react-router-dom v6 imports.
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Roster from './pages/Roster';
import Schedule from './pages/Schedule';
import Import from './pages/Import';
import GameReport from './pages/GameReport';
import TeamStats from './pages/TeamStats';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import Setup from './pages/Setup';
import { hasPermission } from './services/auth';
import { AppProvider, AppContext } from './context/AppContext';
import { Loader2 } from 'lucide-react';

// FIX: Re-implemented ProtectedRoute for react-router-dom v6.
// It's now a component wrapper that handles auth logic and renders children or a Navigate component.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loadingAuth } = useContext(AppContext);
  const location = useLocation();

  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-orange-600" size={48} />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!hasPermission(user.role, location.pathname)) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
};


const AppContent: React.FC = () => {
  return (
    <Layout>
      {/* FIX: Replaced v5 <Switch> with v6 <Routes> and updated Route syntax to use the 'element' prop. */}
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/roster" element={<ProtectedRoute><Roster /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><GameReport /></ProtectedRoute>} />
        <Route path="/team-stats" element={<ProtectedRoute><TeamStats /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
      </Routes>
    </Layout>
  )
}

const App: React.FC = () => {
  return (
    // FIX: Removed the 'future' prop from HashRouter as it was causing a TypeScript error,
    // likely due to an incompatible version of react-router-dom.
    <HashRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </HashRouter>
  );
};

export default App;