import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { Lock, User as UserIcon } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(username, password);
    if (user) {
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md">
        <div className="bg-orange-600 p-8 text-center">
            <span className="text-4xl">🏀</span>
            <h1 className="text-2xl font-bold text-white mt-2">BasketStats Pro</h1>
            <p className="text-orange-100 text-sm">Team Management System</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 text-center">Sign In</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
            <div className="relative">
               <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="Enter username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
               />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <div className="relative">
               <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
               />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
          >
            Login
          </button>
          
          <div className="text-center text-xs text-slate-400 pt-4">
             <div>Default Credentials:</div>
             <div>admin / password</div>
             <div>coach / password</div>
             <div>player / password</div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;