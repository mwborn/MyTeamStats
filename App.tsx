import React, { useContext } from 'react';
// Fix: Import useLocation to get the current path.
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
import { AppProvider, AppContext } from './context/AppContext';
import { hasPermission } from './services/auth';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loadingAuth } = useContext(AppContext);
  // Fix: Use useLocation to get the current path instead of trying to access a non-existent prop.
  const location = useLocation();
  const path = location.pathname;

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Nota: il ruolo dell'utente non è ancora nel DB, quindi questa logica verrà ripristinata
  // quando migreremo anche la tabella utenti. Per ora, permettiamo l'accesso.
  // const userRole = 'admin'; // Placeholder
  // if (!hasPermission(userRole, path)) {
  //   return (
  //       <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
  //           <h2 className="text-xl font-bold mb-2">Access Denied</h2>
  //           <p>You do not have permission to view this page.</p>
  //       </div>
  //   );
  // }

  return children;
};


const AppRoutes: React.FC = () => {
    const { user, loadingAuth } = useContext(AppContext);

    if (loadingAuth) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <Layout>
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

                <Route path="*" element={user ? <Navigate to="/" /> : <Navigate to="/login" />} />
            </Routes>
        </Layout>
    )
}


const App: React.FC = () => {
  return (
    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  );
};

export default App;