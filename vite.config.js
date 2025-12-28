// vite.config.js
export default {
  server: {
    // Disabilita l'apertura automatica del browser.
    // Risolve l'errore 'spawn xdg-open ENOENT' in ambienti
    // dove il comando xdg-open non è disponibile.
    open: false,
  },
  // FIX: Aggiunti alias per risolvere le importazioni di Firebase, React e ReactDOM.
  // Vite, in modalità sviluppo, ha bisogno di sapere come risolvere i percorsi
  // dei moduli "bare" (es. 'firebase/auth'). Poiché non sono in node_modules,
  // l'alias associa direttamente il percorso all'URL della CDN, risolvendo
  // l'errore [plugin:vite:import-analysis].
  resolve: {
    alias: {
      'react': 'https://esm.sh/react@18.3.1',
      'react-dom': 'https://esm.sh/react-dom@18.3.1',
      'react-dom/client': 'https://esm.sh/react-dom@18.3.1/client',
      'react/jsx-dev-runtime': 'https://esm.sh/react@18.3.1/jsx-dev-runtime',
      'react-router-dom': 'https://esm.sh/react-router-dom@6.23.1',
      'firebase/app': 'https://esm.sh/firebase@10.12.2/app',
      'firebase/auth': 'https://esm.sh/firebase@10.12.2/auth',
      'firebase/firestore': 'https://esm.sh/firebase@10.12.2/firestore',
    }
  }
};