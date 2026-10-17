import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Branch, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Building2, Plus, Users, Phone, MapPin, CheckCircle2, XCircle, Search, AlertCircle, X, UserPlus } from 'lucide-react';

export const BranchesView: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal Alta de Sede
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formObs, setFormObs] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal Vendedores de Sede
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchUsers, setBranchUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);

  // Formulario Nuevo Vendedor
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await api.branches.list();
      setBranches(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar las distribuidoras');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenCreateModal = () => {
    setFormCode('');
    setFormName('');
    setFormAddress('');
    setFormPhone('');
    setFormManager('');
    setFormObs('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCode || !formName || !formAddress) {
      setFormError('Código, Nombre y Dirección son campos obligatorios.');
      return;
    }

    try {
      setIsSaving(true);
      const created = await api.branches.create({
        code: formCode.toUpperCase(),
        name: formName,
        address: formAddress,
        phone: formPhone || null,
        manager_name: formManager || null,
        observations: formObs || null
      });

      setBranches((prev) => [created, ...prev]);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la distribuidora');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenUsersModal = async (branch: Branch) => {
    setSelectedBranch(branch);
    setUserModalOpen(true);
    setUserFormError(null);
    try {
      setLoadingUsers(true);
      const users = await api.branches.getUsers(branch.id);
      setBranchUsers(users);
    } catch (err: any) {
      setUserFormError(err.message || 'Error al cargar usuarios de la sede');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateBranchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    setUserFormError(null);

    if (!userEmail || !userPassword || !userFullName) {
      setUserFormError('Todos los campos son obligatorios');
      return;
    }

    try {
      setSavingUser(true);
      const newUser = await api.branches.createUser(selectedBranch.id, {
        email: userEmail.trim(),
        password: userPassword,
        full_name: userFullName.trim(),
        role_id: 'role-03' // DISTRIBUTOR
      });
      setBranchUsers((prev) => [...prev, newUser]);
      setUserEmail('');
      setUserPassword('');
      setUserFullName('');
    } catch (err: any) {
      setUserFormError(err.message || 'Error al registrar vendedor');
    } finally {
      setSavingUser(false);
    }
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.manager_name && b.manager_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Encabezado y Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Padrón de Distribuidoras Aliadas</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestión de locales comerciales céntricos, encargados y vendedores asignados
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-all cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Distribuidora</span>
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o encargado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Mensajes de Error */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Lista / Grid de Sedes */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Cargando distribuidoras...</div>
      ) : filteredBranches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No se encontraron distribuidoras</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchTerm ? 'Intente con otro término de búsqueda.' : 'Aún no se han registrado sedes en el sistema.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      {branch.code}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{branch.name}</h3>
                  </div>
                  {branch.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" /> Inactivo
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                  {branch.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  {branch.manager_name && (
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Users className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Titular: {branch.manager_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {branch.observations || 'Sin observaciones'}
                </span>
                <button
                  onClick={() => handleOpenUsersModal(branch)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Personal</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Nueva Distribuidora */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Alta de Nueva Distribuidora</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código Único *</label>
                  <input
                    type="text"
                    required
                    placeholder="SEDE-TRILCE"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Distribuidora Trilce"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dirección Física *</label>
                <input
                  type="text"
                  required
                  placeholder="Calle San Juan de Dios 214, Cercado"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="959123456"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Encargado Titular</label>
                  <input
                    type="text"
                    placeholder="Carlos Mendoza"
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Horarios, condiciones del local..."
                  value={formObs}
                  onChange={(e) => setFormObs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Guardando...' : 'Crear Distribuidora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Vendedores de la Sede */}
      {userModalOpen && selectedBranch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>Personal Asignado: {selectedBranch.name}</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedBranch.code}</p>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userFormError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{userFormError}</span>
              </div>
            )}

            {/* Listado de Vendedores */}
            <div className="mb-5 max-h-48 overflow-y-auto divide-y divide-slate-100">
              {loadingUsers ? (
                <div className="py-4 text-center text-xs text-slate-400">Cargando personal...</div>
              ) : branchUsers.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  No hay vendedores asignados a esta sede todavía.
                </div>
              ) : (
                branchUsers.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-semibold text-slate-800">{u.full_name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                      Distribuidor
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Formulario para agregar vendedor */}
            {isAdmin && (
              <form onSubmit={handleCreateBranchUser} className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Asignar Nuevo Vendedor</span>
                </h4>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    value={userFullName}
                    onChange={(e) => setUserFullName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    required
                    placeholder="correo@editorialqsy.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Contraseña (mín 6 car.)"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {savingUser ? 'Asignando...' : 'Crear y Asignar Vendedor'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
