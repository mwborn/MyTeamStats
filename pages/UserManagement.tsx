import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { AppData, User, UserRole } from '../types';
import { Plus, Trash2, Edit2, Save, X, Shield, User as UserIcon, Loader2 } from 'lucide-react';

const UserManagement: React.FC = () => {
  const { appData: data, updateAppData, loadingData } = useContext(AppContext);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({});

  if (loadingData || !data) {
     return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  const startEdit = (user?: User) => {
    if (user) {
        setEditingId(user.id);
        setUserForm({ ...user });
    } else {
        setEditingId('new');
        setUserForm({ username: '', password: '', role: 'player', name: '' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setUserForm({});
  };

  const handleSave = async () => {
    if (!userForm.username || !userForm.password || !userForm.name) return;

    let newUsers = [...data.users];
    
    if (editingId === 'new') {
        const newUser: User = {
            id: `u${Date.now()}`,
            username: userForm.username!,
            password: userForm.password!,
            role: (userForm.role as UserRole) || 'player',
            name: userForm.name!
        };
        newUsers.push(newUser);
    } else {
        newUsers = newUsers.map(u => u.id === editingId ? { ...u, ...userForm } as User : u);
    }

    const newData = { ...data, users: newUsers };
    await updateAppData(newData);
    cancelEdit();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this user?")) {
        const newData = { ...data, users: data.users.filter(u => u.id !== id) };
        await updateAppData(newData);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-slate-800 dark:text-sky-400">User Management</h1>
         {!editingId && (
            <button 
                onClick={() => startEdit()}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-orange-700 shadow-sm"
            >
                <Plus size={16} /> Add User
            </button>
         )}
      </div>

      {editingId && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-orange-100 dark:border-orange-800 shadow-lg animate-in fade-in slide-in-from-top-4">
           <div className="flex justify-between mb-4 border-b dark:border-slate-700 pb-2">
               <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{editingId === 'new' ? 'Create User' : 'Edit User'}</h3>
               <button onClick={cancelEdit}><X size={20} className="text-slate-400" /></button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Display Name</label>
                  <input className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700" value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Username</label>
                  <input className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700" value={userForm.username || ''} onChange={e => setUserForm({...userForm, username: e.target.value})} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label>
                  <input type="text" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700" value={userForm.password || ''} onChange={e => setUserForm({...userForm, password: e.target.value})} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Role</label>
                  <select className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700" value={userForm.role || 'player'} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                      <option value="admin">Admin</option>
                      <option value="coach">Coach</option>
                      <option value="player">Player</option>
                  </select>
              </div>
           </div>
           <div className="mt-4 flex justify-end gap-2">
               <button onClick={cancelEdit} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">Cancel</button>
               <button onClick={handleSave} className="px-4 py-2 bg-slate-900 dark:bg-slate-600 text-white rounded hover:bg-slate-800 dark:hover:bg-slate-500 flex items-center gap-2">
                  <Save size={16} /> Save User
               </button>
           </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
         <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-600">
               <tr>
                   <th className="px-6 py-4">Name</th>
                   <th className="px-6 py-4">Username</th>
                   <th className="px-6 py-4">Role</th>
                   <th className="px-6 py-4 text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
               {data.users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500">
                              <UserIcon size={16} />
                          </div>
                          {user.name}
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-600 dark:text-slate-400">{user.username}</td>
                      <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                              ${user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : ''}
                              ${user.role === 'coach' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : ''}
                              ${user.role === 'player' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''}
                          `}>
                              {user.role}
                          </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                          <button onClick={() => startEdit(user)} className="text-blue-600 dark:text-blue-400 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"><Edit2 size={16}/></button>
                          <button onClick={() => handleDelete(user.id)} className="text-red-600 dark:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded ml-1"><Trash2 size={16}/></button>
                      </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default UserManagement;