import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineBanner } from './components/common/OfflineBanner';
import { Navbar } from './components/common/Navbar';
import { LoginView } from './views/auth/LoginView';
import { BranchesView } from './views/admin/BranchesView';
import { ProductsView } from './views/admin/ProductsView';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'branches' | 'products'>('branches');

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <OfflineBanner />
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />
      <main className="flex-1">
        {currentTab === 'branches' ? <BranchesView /> : <ProductsView />}
      </main>
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
