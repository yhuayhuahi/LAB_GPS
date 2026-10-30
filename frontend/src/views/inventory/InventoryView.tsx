import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type {
  Branch,
  CriticalStockAlert,
  InventoryBalanceResponse,
  NonCommercialExit,
  Product
} from '../../types';
import {
  AlertTriangle,
  ArrowDownToLine,
  Building2,
  FileText,
  Layers,
  RefreshCw,
  ShieldAlert,
  Truck
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { user } = useAuth();
  const [balanceData, setBalanceData] = useState<InventoryBalanceResponse | null>(null);
  const [alerts, setAlerts] = useState<CriticalStockAlert[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [exits, setExits] = useState<NonCommercialExit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryProductId, setEntryProductId] = useState('');
  const [entryQuantity, setEntryQuantity] = useState(20);
  const [entryNotes, setEntryNotes] = useState('');

  const [showExitModal, setShowExitModal] = useState(false);
  const [exitProductId, setExitProductId] = useState('');
  const [exitSourceType, setExitSourceType] = useState<'CENTRAL' | 'BRANCH'>('CENTRAL');
  const [exitBranchId, setExitBranchId] = useState('');
  const [exitMovementType, setExitMovementType] = useState<string>('MUESTRA_DOCENTE');
  const [exitQuantity, setExitQuantity] = useState(1);
  const [exitJustification, setExitJustification] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [bal, alt, prods, brs, nce] = await Promise.all([
        api.inventory.getBalance(),
        api.inventory.getCriticalAlerts(),
        api.products.list(true).catch(() => []),
        api.branches.list(true).catch(() => []),
        user?.role !== 'DISTRIBUTOR' ? api.inventory.listNonCommercialExits().catch(() => []) : Promise.resolve([])
      ]);

      setBalanceData(bal);
      setAlerts(alt);
      setProducts(prods);
      setBranches(brs);
      setExits(nce);

      if (prods.length > 0) {
        setEntryProductId(prods[0].id);
        setExitProductId(prods[0].id);
      }
      if (brs.length > 0) {
        setExitBranchId(brs[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar el inventario');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateCentralEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryProductId || entryQuantity <= 0) return;
    try {
      setIsSubmitting(true);
      await api.inventory.addCentralStock({
        product_id: entryProductId,
        quantity: entryQuantity,
        notes: entryNotes
      });
      setShowEntryModal(false);
      setEntryNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al registrar ingreso de libros');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNonCommercialExit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitProductId || exitQuantity <= 0 || exitJustification.trim().length < 5) {
      alert('La justificación es obligatoria y debe tener al menos 5 caracteres (RN-07)');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.inventory.createNonCommercialExit({
        product_id: exitProductId,
        source_type: exitSourceType,
        branch_id: exitSourceType === 'BRANCH' ? exitBranchId : null,
        movement_type: exitMovementType,
        quantity: exitQuantity,
        justification: exitJustification
      });
      setShowExitModal(false);
      setExitJustification('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al procesar la salida especial');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogisticsOrAdmin = user?.role === 'ADMIN' || user?.role === 'LOGISTICS';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Control de Existencias e Inventario</h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Sprint 2
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {balanceData?.scope === 'GLOBAL'
              ? 'Matriz centralizada de existencias en Almacén Central y consignaciones multisede'
              : `Inventario vendible asignado a ${user?.branch_name || 'su distribuidora'} (RN-05)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            title="Recargar inventario"
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {isLogisticsOrAdmin && (
            <>
              <button
                onClick={() => setShowEntryModal(true)}
                className="flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-xs cursor-pointer"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Ingreso Imprenta</span>
              </button>

              <button
                onClick={() => setShowExitModal(true)}
                className="flex items-center gap-1.5 bg-rose-600 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-rose-700 transition shadow-xs cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Muestra / Merma (RN-07)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* HU-08: Panel de Alertas de Stock Crítico */}
      {alerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>HU-08: Alertas Automáticas de Stock Crítico ({alerts.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map((al, idx) => (
              <div
                key={idx}
                className="bg-white border-l-4 border-rose-600 rounded-lg p-3 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-slate-900 text-sm">{al.product_title}</span>
                    <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full font-bold">
                      {al.available_quantity} unid.
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {al.branch_name ? `📍 ${al.branch_name}` : '🏢 Almacén Central QSY'}
                  </p>
                </div>
                <div className="mt-2 text-2xs text-rose-600 font-semibold uppercase tracking-wider">
                  ⚠️ Por debajo del umbral mínimo ({al.threshold})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HU-06: Matriz Global (Administrador / Logística) */}
      {balanceData?.scope === 'GLOBAL' && balanceData.matrix && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Balance General de Inventario Multisede</h3>
            </div>
            <span className="text-xs text-slate-500">
              {balanceData.matrix.length} títulos activos contabilizados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Código / Título</th>
                  <th className="px-3 py-3 text-left">Nivel</th>
                  <th className="px-3 py-3 text-right bg-indigo-50/50 text-indigo-900">Almacén Central</th>
                  <th className="px-3 py-3 text-right bg-amber-50/50 text-amber-900">En Tránsito</th>
                  {branches.map((b) => (
                    <th key={b.id} className="px-3 py-3 text-right">
                      {b.name}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-bold text-slate-900 bg-slate-100/60">Total Global</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {balanceData.matrix.length === 0 ? (
                  <tr>
                    <td colSpan={5 + branches.length} className="text-center py-8 text-slate-500">
                      No hay productos registrados en el catálogo.
                    </td>
                  </tr>
                ) : (
                  balanceData.matrix.map((row) => (
                    <tr key={row.product_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{row.product_title}</div>
                        <div className="text-2xs text-slate-400 font-mono">{row.product_code}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{row.education_level}</td>
                      <td className="px-3 py-3 text-right font-bold bg-indigo-50/30">
                        <span
                          className={
                            row.is_central_critical
                              ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-bold'
                              : 'text-indigo-700'
                          }
                        >
                          {row.central_stock}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-amber-700 bg-amber-50/30">
                        {row.in_transit_stock > 0 ? (
                          <span className="flex items-center justify-end gap-1">
                            <Truck className="w-3.5 h-3.5 inline" />
                            {row.in_transit_stock}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>
                      {branches.map((b) => {
                        const bStock = row.branches_stock.find((s) => s.branch_id === b.id);
                        const avail = bStock ? bStock.available_quantity : 0;
                        const isCrit = bStock ? bStock.is_critical : false;
                        return (
                          <td key={b.id} className="px-3 py-3 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                isCrit
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                                  : 'text-slate-700'
                              }`}
                            >
                              {avail}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900 bg-slate-100/60">
                        {row.total_available}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HU-06: Vista Restringida por Sede (Distribuidor) */}
      {balanceData?.scope === 'BRANCH' && balanceData.branchStock && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50/40 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Stock Vendible en Mostrador ({user?.branch_name || 'Mi Sede'})
              </h3>
            </div>
            <span className="text-xs text-emerald-800 font-semibold bg-emerald-100 px-2.5 py-0.5 rounded-full">
              RN-05: Aislamiento Activo
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Título del Libro</th>
                  <th className="px-4 py-3 text-right">Recibidos en Consignación</th>
                  <th className="px-4 py-3 text-right">Vendidos</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-900 bg-emerald-50/50">Disponible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {balanceData.branchStock.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">
                      Aún no tiene ejemplares asignados a su sucursal. Confirme despachos pendientes en la pestaña de
                      Despachos.
                    </td>
                  </tr>
                ) : (
                  balanceData.branchStock.map((bs) => (
                    <tr key={bs.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{bs.product_title}</div>
                        <div className="text-2xs text-slate-400 font-mono">{bs.product_code}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{bs.received_quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{bs.sold_quantity}</td>
                      <td className="px-4 py-3 text-right font-bold bg-emerald-50/50">
                        <span
                          className={`px-2.5 py-1 rounded text-xs ${
                            bs.available_quantity <= 3
                              ? 'bg-rose-100 text-rose-800 font-extrabold border border-rose-300'
                              : 'text-emerald-700 font-bold'
                          }`}
                        >
                          {bs.available_quantity} unidades
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HU-07: Kardex de Salidas No Comerciales y Mermas (Solo Admin / Logística) */}
      {isLogisticsOrAdmin && exits.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Historial de Salidas Especiales, Muestras y Mermas Justificadas (RN-07)
              </h3>
            </div>
            <span className="text-xs text-slate-500">{exits.length} registros auditables</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Fecha / Hora</th>
                  <th className="px-4 py-2.5 text-left">Título</th>
                  <th className="px-3 py-2.5 text-left">Tipo de Salida</th>
                  <th className="px-3 py-2.5 text-left">Origen</th>
                  <th className="px-3 py-2.5 text-right">Cant.</th>
                  <th className="px-4 py-2.5 text-left">Justificación Obligatoria</th>
                  <th className="px-4 py-2.5 text-left">Autorizado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {exits.map((ex) => (
                  <tr key={ex.id}>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(ex.created_at).toLocaleString('es-PE')}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{ex.product_title}</td>
                    <td className="px-3 py-2.5">
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-2xs font-bold">
                        {ex.movement_type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {ex.source_type === 'CENTRAL' ? 'Almacén Central' : ex.branch_name || 'Sucursal'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-rose-700">-{ex.quantity}</td>
                    <td className="px-4 py-2.5 text-slate-700 italic max-w-xs truncate" title={ex.justification}>
                      "{ex.justification}"
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{ex.authorized_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Ingreso de Libros desde Imprenta al Almacén Central (HU-04) */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ArrowDownToLine className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-lg">Ingreso al Almacén Central</h3>
            </div>
            <form onSubmit={handleCreateCentralEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título de la Publicación</label>
                <select
                  value={entryProductId}
                  onChange={(e) => setEntryProductId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad de Ejemplares</label>
                <input
                  type="number"
                  min="1"
                  value={entryQuantity}
                  onChange={(e) => setEntryQuantity(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas de Imprenta / Lote (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Remesa N° 12 de imprenta"
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Cargando...' : 'Guardar Ingreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Salida Especial / Merma Justificada (HU-07 / RN-07) */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Salida Especial o Merma</h3>
                <p className="text-2xs text-rose-600 font-semibold uppercase">RN-07: Justificación Obligatoria</p>
              </div>
            </div>

            <form onSubmit={handleCreateNonCommercialExit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título</label>
                <select
                  value={exitProductId}
                  onChange={(e) => setExitProductId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Origen</label>
                  <select
                    value={exitSourceType}
                    onChange={(e) => setExitSourceType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="CENTRAL">Almacén Central</option>
                    <option value="BRANCH">Distribuidora Aliada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Salida</label>
                  <select
                    value={exitMovementType}
                    onChange={(e) => setExitMovementType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="MUESTRA_DOCENTE">Muestra a Docente</option>
                    <option value="CORTESIA">Cortesía Institucional</option>
                    <option value="PROMOCION">Promoción Editorial</option>
                    <option value="SORTEO">Sorteo Estudiantil</option>
                    <option value="MERMA_DANO">Merma por Daño Físico</option>
                    <option value="AJUSTE">Ajuste de Conteo</option>
                  </select>
                </div>
              </div>

              {exitSourceType === 'BRANCH' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Distribuidora Afectada</label>
                  <select
                    value={exitBranchId}
                    onChange={(e) => setExitBranchId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad a Dar de Baja</label>
                <input
                  type="number"
                  min="1"
                  value={exitQuantity}
                  onChange={(e) => setExitQuantity(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo y Justificación Detallada <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explique detalladamente el motivo de la salida o merma (mínimo 5 caracteres)"
                  value={exitJustification}
                  onChange={(e) => setExitJustification(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Procesando...' : 'Registrar Salida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
