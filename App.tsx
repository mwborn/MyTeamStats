import React, { useContext } from 'react';
// FIX: Switched to react-router-dom v5 imports.
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom';
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

// FIX: Re-implemented ProtectedRoute as a custom Route component compatible with react-router-dom v5.
// It now uses the `render` prop to conditionally render children or a redirect.
const ProtectedRoute = ({ children, path, ...rest }: { children: React.ReactNode, path: string, exact?: boolean }) => {
  const { user, loadingAuth } = useContext(AppContext);

  return (
    <Route
      path={path}
      {...rest}
      render={() => {
        if (loadingAuth) {
          return (
            <div className="flex justify-center items-center h-screen">
              <Loader2 className="animate-spin text-orange-600" size={48} />
            </div>
          );
        }
        
        if (!user) {
          return <Redirect to="/login" />;
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
      }}
    />
  );
};


const AppContent: React.FC = () => {
  return (
    <Layout>
      {/* FIX: Replaced v6 <Routes> with v5 <Switch> and updated Route syntax. */}
      <Switch>
        <Route path="/login" component={Login} />
        
        <ProtectedRoute path="/" exact><Home /></ProtectedRoute>
        <ProtectedRoute path="/roster"><Roster /></ProtectedRoute>
        <ProtectedRoute path="/schedule"><Schedule /></ProtectedRoute>
        <ProtectedRoute path="/import"><Import /></ProtectedRoute>
        <ProtectedRoute path="/report"><GameReport /></ProtectedRoute>
        <ProtectedRoute path="/team-stats"><TeamStats /></ProtectedRoute>
        <ProtectedRoute path="/users"><UserManagement /></ProtectedRoute>
        <ProtectedRoute path="/setup"><Setup /></ProtectedRoute>
      </Switch>
    </Layout>
  )
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </HashRouter>
  );
};

export default App;