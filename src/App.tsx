import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PlanProvider } from './context/PlanContext';
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute';
import { MobileLayout } from './components/layout/MobileLayout';
import { Toaster } from 'sonner';
import { useVersionCheck } from './hooks/useVersionCheck';

// Auth Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';

// App Pages
import { Dashboard } from './pages/Dashboard';
const IncomeDashboard = lazy(() => import('./pages/IncomeDashboard.tsx').then((m) => ({ default: m.IncomeDashboard })));
const Appointments = lazy(() => import('./pages/Appointments').then((m) => ({ default: m.Appointments })));
const Clients = lazy(() => import('./pages/Clients').then((m) => ({ default: m.Clients })));
const Notes = lazy(() => import('./pages/Notes').then((m) => ({ default: m.Notes })));
const Plans = lazy(() => import('./pages/Plans').then((m) => ({ default: m.Plans })));
const LegalPage = lazy(() => import('./pages/LegalPage').then((m) => ({ default: m.LegalPage })));
const PublicBooking = lazy(() => import('./pages/PublicBooking').then((m) => ({ default: m.PublicBooking })));

function App() {
  // Hook para detectar y recargar nuevas versiones automáticamente
  useVersionCheck();

  return (
    <BrowserRouter>
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

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

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
