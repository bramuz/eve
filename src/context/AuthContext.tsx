import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  signOutUser,
  resetPassword
} from '../firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ user: User | null; error: string | null }>;
  signInGoogle: () => Promise<{ user: User | null; error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  resetUserPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth listener...');
    
    // En algunos navegadores internos (Instagram, Facebook) el almacenamiento de la sesión
    // nunca responde y la app se quedaría cargando: tras unos segundos se muestra sin sesión.
    const fallback = setTimeout(() => {
      console.warn('[AuthProvider] Auth state timeout, continuing without session');
      setLoading(false);
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[AuthProvider] Auth state changed:', user ? user.email : 'no user');
      clearTimeout(fallback);
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      console.log('[AuthProvider] Cleaning up...');
      clearTimeout(fallback);
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signIn: signInWithEmail,
    signUp: signUpWithEmail,
    signInGoogle: signInWithGoogle,
    signOut: signOutUser,
    resetUserPassword: resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
