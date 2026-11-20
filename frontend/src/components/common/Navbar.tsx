import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { BookOpen, Building2, ClipboardList, Layers, LogOut, Receipt, ShoppingCart, Truck, UserCircle } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export type NavTab = 'branches' | 'products' | 'inventory' | 'consignments' | 'replenishments' | 'liquidations' | 'sales';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenReplenishment: (requestId: string | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenReplenishment }) => {
  const { user, logout } = useAuth();
  const [criticalCount, setCriticalCount] = useState<number>(0);

  useEffect(() => {
    // Cargar número de alertas críticas (HU-08)
    api.inventory
      .getCriticalAlerts()
      .then((alerts) => setCriticalCount(alerts.length))
      .catch(() => {});
  }, [currentTab]);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-200">
            Administrador
          </span>
        );
      case 'LOGISTICS':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
            Logística
          </span>
        );
      case 'DISTRIBUTOR':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
            Distribuidor
          </span>
        );
      default:
        return null;
    }
  };

  const isManagement = user?.role === 'ADMIN' || user?.role === 'LOGISTICS';

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

          {/* Navegación central (Sprint 1 + Sprint 2) */}
          <nav className="flex space-x-1 sm:space-x-2">
            {user?.role === 'DISTRIBUTOR' && (
              <button onClick={() => onSelectTab('sales')} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentTab === 'sales' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                <ShoppingCart className="w-4 h-4" /><span>Vender</span>
              </button>
            )}
            {isManagement && (
              <button
                onClick={() => onSelectTab('branches')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'branches'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Distribuidoras</span>
              </button>
            )}

            {isManagement && <button
              onClick={() => onSelectTab('products')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'products'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Catálogo</span>
            </button>}

            <button
              onClick={() => onSelectTab('inventory')}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'inventory'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Inventario</span>
              {criticalCount > 0 && (
                <span
                  title={`${criticalCount} alertas de stock crítico activas`}
                  className="bg-rose-500 text-white text-2xs px-1.5 py-0.2 rounded-full font-bold ml-1 animate-pulse"
                >
                  {criticalCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('consignments')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'consignments'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Despachos</span>
            </button>

            <button
              onClick={() => onSelectTab('replenishments')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'replenishments'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Reposición</span>
            </button>

            {isManagement && (
              <button
                onClick={() => onSelectTab('liquidations')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'liquidations'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Liquidaciones</span>
              </button>
            )}
          </nav>

          {/* Perfil de usuario y Logout */}
          <div className="flex items-center gap-3">
            <NotificationBell onOpenReplenishment={onOpenReplenishment} />
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
