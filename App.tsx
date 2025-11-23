import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Roster from './pages/Roster';
import Schedule from './pages/Schedule';
import Import from './pages/Import';
import GameReport from './pages/GameReport';
import TeamStats from './pages/TeamStats';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import Setup from './pages/Setup'; // Import the new Setup page
import { getCurrentUser, hasPermission } from './services/auth';
import { User } from './types';

// Guard Component
const ProtectedRoute = ({ children, path }: { children: React.ReactElement, path: string }) => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  
  // Re-check user on render to prevent stale state issues
  useEffect(() => {
     setUser(getCurrentUser());
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(user.role, path)) {
    return (
        <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p>You do not have permission to view this page.</p>
        </div>
    );
  }

  return children;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute path="/"><Home /></ProtectedRoute>} />
          <Route path="/roster" element={<ProtectedRoute path="/roster"><Roster /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute path="/schedule"><Schedule /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute path="/import"><Import /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute path="/report"><GameReport /></ProtectedRoute>} />
          <Route path="/team-stats" element={<ProtectedRoute path="/team-stats"><TeamStats /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute path="/users"><UserManagement /></ProtectedRoute>} />
          <Route path="/setup" element={<ProtectedRoute path="/setup"><Setup /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
