import React from 'react';
import { ShieldAlert } from 'lucide-react';

const UserManagement: React.FC = () => {
  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-sky-400">User Management</h1>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
        <ShieldAlert size={48} className="text-orange-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Coming Soon</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          User management is now handled by Supabase. This section will be updated to allow inviting new users and managing roles directly from the Supabase authentication system.
        </p>
      </div>
    </div>
  );
};

export default UserManagement;