import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineBanner } from './components/common/OfflineBanner';
import { Navbar } from './components/common/Navbar';
import type { NavTab } from './components/common/Navbar';
import { LoginView } from './views/auth/LoginView';
import { BranchesView } from './views/admin/BranchesView';
import { ProductsView } from './views/admin/ProductsView';
import { InventoryView } from './views/inventory/InventoryView';
import { ConsignmentsView } from './views/consignments/ConsignmentsView';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>(
    user?.role === 'DISTRIBUTOR' ? 'inventory' : 'branches'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Iniciando sesión segura en Editorial QSY...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <OfflineBanner />
        <LoginView />
      </>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'branches':
        return <BranchesView />;
      case 'products':
        return <ProductsView />;
      case 'inventory':
        return <InventoryView />;
      case 'consignments':
        return <ConsignmentsView />;
      default:
        return <InventoryView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <OfflineBanner />
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />
      <main className="flex-1">{renderContent()}</main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
