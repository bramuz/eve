import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  getAuth,
  inMemoryPersistence,
  initializeAuth
} from 'firebase/auth';
import { isInAppBrowser } from '../utils/inAppBrowser';

// Solo la app y el inicio de sesión: es lo que necesita la página pública (/).
// Firestore, Storage y Functions están en config.ts y se descargan al entrar al panel.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);

// En los navegadores internos de Facebook/Instagram IndexedDB puede quedarse sin responder
// y bloquear el inicio de sesión, así que ahí la sesión se guarda en localStorage.
export const auth = isInAppBrowser()
  ? initializeAuth(app, {
      persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
      popupRedirectResolver: browserPopupRedirectResolver
    })
  : getAuth(app);
