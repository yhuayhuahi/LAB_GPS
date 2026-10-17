import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Building2, LogOut, UserCircle } from 'lucide-react';

interface NavbarProps {
  currentTab: 'branches' | 'products';
  onSelectTab: (tab: 'branches' | 'products') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-200">Administrador</span>;
      case 'LOGISTICS':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">Logística</span>;
      case 'DISTRIBUTOR':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">Distribuidor</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo y Marca */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              Q
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Editorial QSY</h1>
              <p className="text-xs text-slate-500 font-medium">Gestión Comercial & Stock</p>
            </div>
          </div>

          {/* Navegación central */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => onSelectTab('branches')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'branches'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Distribuidoras</span>
            </button>
            <button
              onClick={() => onSelectTab('products')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'products'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Catálogo de Libros</span>
            </button>
          </nav>

          {/* Perfil de usuario y Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-800 leading-tight">{user?.full_name}</span>
              <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
            </div>
            <div className="md:hidden">
              <UserCircle className="w-8 h-8 text-slate-600" />
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
