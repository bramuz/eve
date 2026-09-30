import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  StickyNote,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Citas', path: '/appointments' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: StickyNote, label: 'Notas', path: '/notes' },
  { icon: Package, label: 'Productos', path: '/products' },
  { icon: ShoppingCart, label: 'Ventas', path: '/sales' },
  { icon: CreditCard, label: 'Pagos', path: '/payments' }
];

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, currentUser } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error al cerrar sesión');
    } else {
      toast.success('Sesión cerrada exitosamente');
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          Eve
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gestión Profesional
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {currentUser?.displayName || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {currentUser?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 30 }}
            className="lg:hidden w-64 bg-white dark:bg-gray-900 flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl"
          >
            <SidebarContent />
          </motion.aside>
        </>
      )}
    </>
  );
};
