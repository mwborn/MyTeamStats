import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { AppData } from '../types';
import { Save, Upload, Sun, Moon, Image as ImageIcon, CheckCircle, Loader2 } from 'lucide-react';
// FIX: Replaced useNavigate hook with withRouter HOC for v5 compatibility.
import { withRouter, RouteComponentProps } from 'react-router-dom';

// FIX: Added RouteComponentProps for router props type safety.
const Setup: React.FC<RouteComponentProps> = ({ history }) => {
  const { appData: data, updateAppData, loadingData } = useContext(AppContext);
  const [appName, setAppName] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [logoUrl, setLogoUrl] = useState<string | undefined>('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (data) {
      setAppName(data.settings.appName);
      setTheme(data.settings.theme);
      setLogoUrl(data.settings.appLogoUrl);
    }
  }, [data]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
          alert("Logo is large. Recommended size < 1MB.");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!data) return;
    const newData: AppData = {
        ...data,
        settings: {
            appName,
            theme,
            appLogoUrl: logoUrl,
        }
    };
    await updateAppData(newData);
    setStatus("Settings saved successfully! Redirecting...");
    
    document.documentElement.classList.toggle('dark', theme === 'dark');

    // FIX: Used history.push for navigation instead of navigate().
    setTimeout(() => history.push('/'), 1500);
  };
  
  if (loadingData || !data) {
     return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-sky-400">Application Setup</h1>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">
        
        <div>
           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Application Title</label>
           <input
             type="text"
             value={appName}
             onChange={(e) => setAppName(e.target.value)}
             className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
           />
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This title appears in the browser tab and sidebar.</p>
        </div>

        <div>
           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Theme</label>
           <div className="grid grid-cols-2 gap-4">
             <button onClick={() => setTheme('light')} className={`p-4 border-2 rounded-lg text-center transition-all ${theme === 'light' ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-700' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}`}>
                <Sun className="mx-auto mb-2 text-yellow-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">Light Mode</span>
             </button>
             <button onClick={() => setTheme('dark')} className={`p-4 border-2 rounded-lg text-center transition-all ${theme === 'dark' ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-700' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}`}>
                <Moon className="mx-auto mb-2 text-indigo-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">Dark Mode</span>
             </button>
           </div>
        </div>

        <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Application Logo</label>
            <div className="flex items-center gap-6 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon size={32} className="text-slate-400" />
                    )}
                </div>
                <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm">
                        <Upload size={16} />
                        <span>Upload Logo</span>
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg" 
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Recommended: Square PNG/JPG, &lt; 1MB</p>
                </div>
            </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-4">
         {status && 
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle size={16}/> 
                <span>{status}</span>
            </div>
         }
         <button 
            onClick={handleSave}
            className="bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-700 flex items-center gap-2 shadow-sm transition-all"
         >
            <Save size={18} /> Save Settings
         </button>
      </div>

    </div>
  );
};

// FIX: Wrapped component with withRouter to inject router props.
export default withRouter(Setup);