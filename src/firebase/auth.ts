import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './config';

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update user profile with display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

// Sign in with Google - SOLO POPUP (funciona y es más simple)
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    console.log('[signInWithGoogle] Starting Google sign-in with POPUP');
    console.log('[signInWithGoogle] Current URL:', window.location.href);
    
    // Use popup for all devices (simpler and more reliable)
    const result = await signInWithPopup(auth, provider);
    console.log('[signInWithGoogle] ✅ Popup successful! User:', result.user.email);
    
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('[signInWithGoogle] ❌ ERROR:', error.code, error.message);
    
    // User closed popup - not an error
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      console.log('[signInWithGoogle] User closed popup');
      return { user: null, error: null };
    }
    
    // Popup blocked by browser
    if (error.code === 'auth/popup-blocked') {
      return {
        user: null,
        error: 'El navegador bloqueó la ventana emergente. Permite popups para este sitio.'
      };
    }
    
    // Domain not authorized
    if (error.code === 'auth/unauthorized-domain') {
      return { 
        user: null, 
        error: `Dominio no autorizado: ${window.location.hostname}. Agrégalo en Firebase Console.` 
      };
    }
    
    return { user: null, error: error.message };
  }
};



// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Send password reset email
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
