import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Por favor ingrese su correo electrónico y contraseña.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de autenticación. Verifique sus credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin123!');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
        {/* Cabecera institucional */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-3 shadow-md">
            Q
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Editorial QSY</h2>
          <p className="text-sm text-slate-500 mt-1">
            Sistema de Gestión Comercial y Control de Existencias
          </p>
        </div>

        {/* Alerta de Error */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Formulario Mobile-First */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@editorialqsy.com"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-base transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-base transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-150 disabled:opacity-50 cursor-pointer text-base active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span>Validando credenciales...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>

        {/* Acceso Rápido Demo para Evaluación (Sprint 1 + Sprint 2) */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-semibold mb-2">Accesos Demo por Rol (Sprint 1 y 2):</p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => handleFillDemo('admin@editorialqsy.com')}
              className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-left flex justify-between items-center"
            >
              <span>👑 Administrador General</span>
              <span className="text-2xs text-purple-500 font-mono">admin@editorialqsy.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('logistica@editorialqsy.com')}
              className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-left flex justify-between items-center"
            >
              <span>📦 Encargado de Logística</span>
              <span className="text-2xs text-blue-500 font-mono">logistica@editorialqsy.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('distribuidor.trilce@editorialqsy.com')}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-left flex justify-between items-center"
            >
              <span>🏪 Distribuidor Trilce (RN-05)</span>
              <span className="text-2xs text-emerald-500 font-mono">distribuidor.trilce@...</span>
            </button>
          </div>
          <p className="text-2xs text-slate-400 mt-2 font-mono">Clave demo universal: Admin123!</p>
        </div>
      </div>
    </div>
  );
};
