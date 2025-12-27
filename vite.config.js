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
      { 
        find: 'firebase/compat/app', 
        replacement: 'https://aistudiocdn.com/firebase@^10.12.2/compat/app' 
      },
      { 
        find: 'firebase/compat/auth', 
        replacement: 'https://aistudiocdn.com/firebase@^10.12.2/compat/auth' 
      },
      { 
        find: 'firebase/compat/firestore', 
        replacement: 'https://aistudiocdn.com/firebase@^10.12.2/compat/firestore' 
      },
    ]
  }
};