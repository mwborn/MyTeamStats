// vite.config.js
export default {
  server: {
    // Disabilita l'apertura automatica del browser.
    // Risolve l'errore 'spawn xdg-open ENOENT' in ambienti
    // dove il comando xdg-open non è disponibile.
    open: false,
  },
  resolve: {
    alias: [
      { find: 'react', replacement: 'https://aistudiocdn.com/react@^18.2.0' },
      { find: 'react-dom/client', replacement: 'https://aistudiocdn.com/react-dom@^18.2.0/client' },
      { find: 'react/jsx-dev-runtime', replacement: 'https://aistudiocdn.com/react@^18.2.0/jsx-dev-runtime' },
      // FIX: Upgraded react-router-dom to v6 to resolve API inconsistencies.
      { find: 'react-router-dom', replacement: 'https://aistudiocdn.com/react-router-dom@^6.22.0' },
      { find: 'lucide-react', replacement: 'https://aistudiocdn.com/lucide-react@^0.554.0' },
      { find: '@google/genai', replacement: 'https://aistudiocdn.com/@google/genai@^1.30.0' },
      { find: 'recharts', replacement: 'https://aistudiocdn.com/recharts@^2.12.7' },
      { find: 'firebase/compat/app', replacement: 'https://aistudiocdn.com/firebase@^10.12.2/compat/app' },
      { find: 'firebase/compat/auth', replacement: 'https://aistudiocdn.com/firebase@^10.12.2/compat/auth' },
      { find: 'firebase/compat/firestore', replacement: 'https://aistudiocdn.com/firebase@^10.12.2/compat/firestore' },
    ]
  }
};
