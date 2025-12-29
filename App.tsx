import React, { useContext } from 'react';
// FIX: react-router-dom v6 components are not available, switching to v5 compatible components.
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
import { AppProvider, AppContext } from './context/AppContext';
import { hasPermission } from './services/auth';
import { Loader2 } from 'lucide-react';

// FIX: Update ProtectedRoute for react-router-dom v5.
const ProtectedRoute = ({ children, path }: { children: React.ReactElement, path: string }) => {
  const { user, loadingAuth } = useContext(AppContext);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    // FIX: Use Redirect component for v5.
    return <Redirect to="/login" />;
  }
  
  // Nota: il ruolo dell'utente non è ancora nel DB, quindi questa logica verrà ripristinata
  // quando migreremo anche la tabella utenti. Per ora, permettiamo l'accesso.
  // if (!hasPermission(user.role, path)) {
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
            {/* FIX: Use Switch and render prop for v5, instead of Routes and element prop from v6 */}
            <Switch>
                <Route path="/login" component={Login} />
                
                <Route path="/" exact render={() => <ProtectedRoute path="/" children={<Home />} />} />
                <Route path="/roster" render={() => <ProtectedRoute path="/roster" children={<Roster />} />} />
                <Route path="/schedule" render={() => <ProtectedRoute path="/schedule" children={<Schedule />} />} />
                <Route path="/import" render={() => <ProtectedRoute path="/import" children={<Import />} />} />
                <Route path="/report" render={() => <ProtectedRoute path="/report" children={<GameReport />} />} />
                <Route path="/team-stats" render={() => <ProtectedRoute path="/team-stats" children={<TeamStats />} />} />
                <Route path="/users" render={() => <ProtectedRoute path="/users" children={<UserManagement />} />} />
                <Route path="/setup" render={() => <ProtectedRoute path="/setup" children={<Setup />} />} />

                <Route path="*" render={() => user ? <Redirect to="/" /> : <Redirect to="/login" />} />
            </Switch>
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