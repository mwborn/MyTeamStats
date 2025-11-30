import React from 'react';
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
import { getCurrentUser, hasPermission } from './services/auth';

const ProtectedRoute = ({ children, path }: { children: React.ReactElement, path: string }) => {
  const user = getCurrentUser();

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
          
          <Route path="/" element={<ProtectedRoute path="/" children={<Home />} />} />
          <Route path="/roster" element={<ProtectedRoute path="/roster" children={<Roster />} />} />
          <Route path="/schedule" element={<ProtectedRoute path="/schedule" children={<Schedule />} />} />
          <Route path="/import" element={<ProtectedRoute path="/import" children={<Import />} />} />
          <Route path="/report" element={<ProtectedRoute path="/report" children={<GameReport />} />} />
          <Route path="/team-stats" element={<ProtectedRoute path="/team-stats" children={<TeamStats />} />} />
          <Route path="/users" element={<ProtectedRoute path="/users" children={<UserManagement />} />} />
          <Route path="/setup" element={<ProtectedRoute path="/setup" children={<Setup />} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;