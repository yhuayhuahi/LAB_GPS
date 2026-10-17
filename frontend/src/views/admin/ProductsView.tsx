import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Plus, Search, AlertCircle, X, CheckCircle2 } from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal Alta de Libro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formLevel, setFormLevel] = useState('Básico');
  const [formIsbn, setFormIsbn] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formCommission, setFormCommission] = useState<number | ''>('');
  const [formObs, setFormObs] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await api.products.list();
      setProducts(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar catálogo de libros');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreateModal = () => {
    setFormCode('');
    setFormTitle('');
    setFormLevel('Básico');
    setFormIsbn('');
    setFormPrice('');
    setFormCommission('');
    setFormObs('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Cálculo de Margen Neto en tiempo real
  const priceNum = typeof formPrice === 'number' ? formPrice : 0;
  const commNum = typeof formCommission === 'number' ? formCommission : 0;
  const netMargin = priceNum > 0 ? priceNum - commNum : 0;
  const isCommissionInvalid = commNum >= priceNum && priceNum > 0;

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCode || !formTitle || !formLevel || formPrice === '' || formCommission === '') {
      setFormError('Por favor complete todos los campos obligatorios.');
      return;
    }

    if (commNum >= priceNum) {
      setFormError('La comisión fija por unidad debe ser estrictamente menor que el precio de venta al público.');
      return;
    }

    try {
      setIsSaving(true);
      const created = await api.products.create({
        code: formCode.toUpperCase(),
        title: formTitle,
        education_level: formLevel,
        isbn: formIsbn || null,
        public_price: priceNum,
        fixed_commission: commNum,
        observations: formObs || null
      });

      setProducts((prev) => [created, ...prev]);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar publicación');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.isbn && p.isbn.includes(searchTerm));
    const matchesLevel = selectedLevel === 'ALL' || p.education_level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const formatPEN = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>Catálogo Oficial de Publicaciones y Tarifas</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Libros de quechua, tarifas oficiales inmutables y comisiones fijas en soles
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-all cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Libro</span>
          </button>
        )}
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título, código o ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
        >
          <option value="ALL">Todos los Niveles</option>
          <option value="Básico">Nivel Básico</option>
          <option value="Intermedio">Nivel Intermedio</option>
          <option value="Avanzado">Nivel Avanzado</option>
          <option value="Especializado">Especializado / Médico</option>
          <option value="Diccionario">Diccionarios</option>
        </select>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabla / Tarjetas de Productos */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Cargando catálogo oficial...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No hay publicaciones registradas</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchTerm ? 'No se encontraron libros coincidentes.' : 'El catálogo está vacío. Comience agregando un título.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Código / Título</th>
                  <th className="py-3.5 px-4">Nivel</th>
                  <th className="py-3.5 px-4 text-right">Precio Venta (PVP)</th>
                  <th className="py-3.5 px-4 text-right">Comisión Fija</th>
                  <th className="py-3.5 px-4 text-right">Margen Editorial</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((p) => {
                  const margin = Number(p.public_price) - Number(p.fixed_commission);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-mono text-xs font-bold text-indigo-700">{p.code}</div>
                        <div className="font-semibold text-slate-900 mt-0.5">{p.title}</div>
                        {p.isbn && <div className="text-xs text-slate-400">ISBN: {p.isbn}</div>}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {p.education_level}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-slate-900">
                        {formatPEN(Number(p.public_price))}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-emerald-600">
                        {formatPEN(Number(p.fixed_commission))}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-indigo-900">
                        {formatPEN(margin)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {p.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Activo
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Inactivo</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Publicación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Registrar Libro en Catálogo</span>
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

            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código Editorial *</label>
                  <input
                    type="text"
                    required
                    placeholder="QSY-BAS-01"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nivel Educativo *</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="Básico">Básico</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Especializado">Especializado / Médico</option>
                    <option value="Diccionario">Diccionario</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Título de la Publicación *</label>
                <input
                  type="text"
                  required
                  placeholder="Quechua Collao: Nivel Básico Comunicativo"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código ISBN (Opcional)</label>
                <input
                  type="text"
                  placeholder="978-612-48123-0-1"
                  value={formIsbn}
                  onChange={(e) => setFormIsbn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Precios y comisiones con cálculo en tiempo real */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Precio Oficial (S/) *
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="1"
                      required
                      placeholder="35.00"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Comisión Fija (S/) *
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      required
                      placeholder="5.00"
                      value={formCommission}
                      onChange={(e) => setFormCommission(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Cálculo visual del margen */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                  <span className="text-slate-500 font-medium">Margen Neto Editorial:</span>
                  <span className={`font-bold text-sm ${isCommissionInvalid ? 'text-rose-600' : 'text-indigo-700'}`}>
                    {isCommissionInvalid ? '¡Comisión no puede ser mayor o igual al precio!' : formatPEN(netMargin)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre edición, tiraje o público objetivo..."
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
                  disabled={isSaving || isCommissionInvalid}
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Guardando...' : 'Registrar Publicación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
