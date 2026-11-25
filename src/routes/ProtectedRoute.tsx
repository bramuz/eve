import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lazy, Suspense, type ReactNode } from 'react';
import { Loading } from '../components/ui/Loading';

// Solo hace falta con sesión iniciada: así la página pública no descarga su código.
const LegalAcceptanceGate = lazy(() =>
  import('../components/LegalAcceptanceGate').then((m) => ({ default: m.LegalAcceptanceGate }))
);

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <LegalAcceptanceGate>{children}</LegalAcceptanceGate>
    </Suspense>
  );
};

export const PublicRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Loading />
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
