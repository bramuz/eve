import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, LogOut, StickyNote } from 'lucide-react';
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
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Notas', href: '/notes', icon: StickyNote },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-warm-50 dark:bg-warm-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-4 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eve</h1>
          <p className="text-xs text-primary-100 opacity-90">Tu asistente personal</p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95 border border-white/20"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-semibold">Salir</span>
        </button>
      </header>

      {/* Main Content - con padding bottom para el menú */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-warm-800 border-t border-warm-200 dark:border-warm-700 shadow-2xl z-50 backdrop-blur-lg bg-opacity-95">
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
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
