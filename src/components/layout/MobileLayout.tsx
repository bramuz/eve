import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, LogOut, StickyNote, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileLayoutProps {
  children: ReactNode;
}

export const MobileLayout = ({ children }: MobileLayoutProps) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const navigation = [
    { name: 'Inicio', href: '/dashboard', icon: Home },
    { name: 'Citas', href: '/appointments', icon: Calendar },
    { name: 'Usuarios', href: '/clients', icon: Users },
    { name: 'Notas', href: '/notes', icon: StickyNote },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-warm-50 dark:bg-warm-900">
      {/* Header */}
      <header className="relative z-10 overflow-hidden bg-gradient-to-br from-primary-300 via-primary-500 to-primary-700 text-white px-5 pt-5 pb-7 rounded-b-[2.5rem] shadow-float">
        <div className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-gold-300/40 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-2xl font-semibold tracking-wide">Stetik</h1>
              <p className="text-[11px] uppercase tracking-[0.18em] text-primary-100/90">Tu asistente personal</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/plans"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/25 transition-all active:scale-90"
              title="Planes"
            >
              <Crown className="w-5 h-5 text-gold-300" />
            </Link>
            <button
              onClick={() => signOut()}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur border border-white/25 transition-all active:scale-90"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - con padding bottom para el menú */}
      <main className="flex-1 overflow-y-auto pb-28">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-white/85 dark:bg-warm-800/85 border border-white/60 dark:border-warm-700 rounded-full shadow-float z-50 backdrop-blur-xl overflow-hidden">
        <div className="grid grid-cols-4 h-16">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center gap-1 transition-all relative ${
                  active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-300'
                }`}
              >
                <Icon className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`} />
                <span className="text-xs font-medium">{item.name}</span>
                {active && (
                  <div className="absolute inset-1.5 -z-10 bg-primary-100 dark:bg-primary-900/40 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
