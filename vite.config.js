// vite.config.js
export default {
  server: {
    // Disabilita l'apertura automatica del browser.
    // Risolve l'errore 'spawn xdg-open ENOENT' in ambienti
    // dove il comando xdg-open non è disponibile.
    open: false,
  },
  optimizeDeps: {
    exclude: [
      'firebase/compat/app',
      'firebase/compat/auth',
      'firebase/compat/firestore'
    ]
  }
};