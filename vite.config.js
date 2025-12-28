// vite.config.js
export default {
  server: {
    // Disabilita l'apertura automatica del browser.
    // Risolve l'errore 'spawn xdg-open ENOENT' in ambienti
    // dove il comando xdg-open non è disponibile.
    open: false,
  },
  // Aggiunge alias per mappare gli import 'bare' (es. 'firebase/auth')
  // agli URL della CDN, consentendo a Vite di risolvere i moduli
  // che non sono in node_modules. Questo deve corrispondere all'importmap.
  resolve: {
    alias: [
      { find: "lucide-react", replacement: "https://aistudiocdn.com/lucide-react@^0.554.0" },
      { find: "react-dom", replacement: "https://esm.sh/react-dom@18.3.1" },
      { find: "react-dom/client", replacement: "https://esm.sh/react-dom@18.3.1/client" },
      { find: "react/jsx-dev-runtime", replacement: "https://esm.sh/react@18.3.1/jsx-dev-runtime" },
      { find: "react", replacement: "https://esm.sh/react@18.3.1" },
      { find: "react-router-dom", replacement: "https://esm.sh/react-router-dom@6.23.1" },
      { find: "@google/genai", replacement: "https://aistudiocdn.com/@google/genai@^1.30.0" },
      { find: "recharts", replacement: "https://aistudiocdn.com/recharts@^2.12.7" },
      { find: "firebase/app", replacement: "https://esm.sh/firebase@10.11.1/app" },
      { find: "firebase/auth", replacement: "https://esm.sh/firebase@10.11.1/auth" },
      { find: "firebase/firestore", replacement: "https://esm.sh/firebase@10.11.1/firestore" }
    ]
  }
};