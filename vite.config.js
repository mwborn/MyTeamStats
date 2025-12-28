// vite.config.js
export default {
  server: {
    // Disabilita l'apertura automatica del browser.
    // Risolve l'errore 'spawn xdg-open ENOENT' in ambienti
    // dove il comando xdg-open non è disponibile.
    open: false,
  },
  // La sezione 'resolve.alias' è stata rimossa.
  // Gli alias a URL CDN sono un anti-pattern e creavano conflitti
  // con la `importmap` in index.html, che è il metodo corretto
  // per gestire dipendenze esterne in questo setup.
};