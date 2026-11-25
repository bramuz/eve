import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PlanProvider } from './context/PlanContext';
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute';
import { MobileLayout } from './components/layout/MobileLayout';
import { Toaster } from 'sonner';
import { useVersionCheck } from './hooks/useVersionCheck';
import { Analytics } from '@vercel/analytics/react';
import { trackPageView } from './analytics/metaPixel';

// Auth Pages
import { Landing } from './pages/Landing';
// Todo lo demás se carga por partes: la página de la campaña (/) abre con lo mínimo.
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));

// App Pages
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const IncomeDashboard = lazy(() => import('./pages/IncomeDashboard.tsx').then((m) => ({ default: m.IncomeDashboard })));
const Appointments = lazy(() => import('./pages/Appointments').then((m) => ({ default: m.Appointments })));
const Clients = lazy(() => import('./pages/Clients').then((m) => ({ default: m.Clients })));
const Notes = lazy(() => import('./pages/Notes').then((m) => ({ default: m.Notes })));
const Plans = lazy(() => import('./pages/Plans').then((m) => ({ default: m.Plans })));
const LegalPage = lazy(() => import('./pages/LegalPage').then((m) => ({ default: m.LegalPage })));
const PublicBooking = lazy(() => import('./pages/PublicBooking').then((m) => ({ default: m.PublicBooking })));

const PageViewTracker = () => {
  const { pathname } = useLocation();
  useEffect(() => trackPageView(pathname), [pathname]);
  return null;
};

function App() {
  // Hook para detectar y recargar nuevas versiones automáticamente
  useVersionCheck();

  return (
    <BrowserRouter>
      <PageViewTracker />
      {/* Las páginas de reserva son de los clientes de cada profesional: no se miden. */}
      <Analytics beforeSend={(event) => (new URL(event.url).pathname.startsWith('/reservar/') ? null : event)} />
      <ThemeProvider>
        <AuthProvider>
          <PlanProvider>
          <Toaster position="top-center" richColors />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-warm-600">Cargando...</div>}>
          <Routes>
            <Route path="/legal/privacidad" element={<LegalPage />} />
            <Route path="/legal/terminos" element={<LegalPage />} />
            <Route path="/reservar/:uid" element={<PublicBooking />} />

            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Dashboard />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/income-dashboard"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <IncomeDashboard />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Appointments />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Clients />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Notes />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/plans"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Plans />
                  </MobileLayout>
                </ProtectedRoute>
              }
            />

            {/* Página de presentación; con sesión iniciada va directo al panel */}
            <Route
              path="/"
              element={<Landing />}
            />

            {/* 404 - Redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
          </PlanProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
