// vite.config.js
export default {
  server: {
    // Disabilita l'apertura automatica del browser.
    // Risolve l'errore 'spawn xdg-open ENOENT' in ambienti
    // dove il comando xdg-open non è disponibile.
    open: false,
  },
  // FIX: Aggiunti alias per risolvere le importazioni di Firebase.
  // Vite, in modalità sviluppo, ha bisogno di sapere come risolvere i percorsi
  // dei moduli "bare" (es. 'firebase/auth'). Poiché non sono in node_modules,
  // l'alias associa direttamente il percorso all'URL della CDN, risolvendo
  // l'errore [plugin:vite:import-analysis].
  resolve: {
    alias: {
      'firebase/app': 'https://esm.sh/firebase@10.12.2/app',
      'firebase/auth': 'https://esm.sh/firebase@10.12.2/auth',
      'firebase/firestore': 'https://esm.sh/firebase@10.12.2/firestore',
    }
  }
  // La configurazione 'optimizeDeps.exclude' è stata rimossa perché la gestione
  // tramite alias è una soluzione più diretta e risolutiva per questo problema.
};