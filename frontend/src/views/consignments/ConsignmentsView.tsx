import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Branch, CentralStock, Consignment, Product } from '../../types';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Truck
} from 'lucide-react';

export const ConsignmentsView: React.FC = () => {
  const { user } = useAuth();
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [centralStock, setCentralStock] = useState<CentralStock[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Nuevo Despacho (HU-04)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatchItems, setDispatchItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 10 }
  ]);

  // Modal Confirmación con Observaciones (HU-05)
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
  const [showObserveModal, setShowObserveModal] = useState(false);
  const [observeNotes, setObserveNotes] = useState('');
  const [observedItems, setObservedItems] = useState<
    { productId: string; receivedQuantity: number; discrepancyNotes: string }[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [consList, brList, prodList, cStock] = await Promise.all([
        api.consignments.list(statusFilter || undefined),
        api.branches.list(false).catch(() => []),
        api.products.list(true).catch(() => []),
        user?.role !== 'DISTRIBUTOR' ? api.inventory.getCentralStock().catch(() => []) : Promise.resolve([])
      ]);

      setConsignments(consList);
      setBranches(brList);
      setProducts(prodList);
      setCentralStock(cStock);

      if (brList.length > 0 && !targetBranchId) {
        setTargetBranchId(brList[0].id);
      }
      if (prodList.length > 0 && dispatchItems[0].productId === '') {
        setDispatchItems([{ productId: prodList[0].id, quantity: 10 }]);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los despachos en consignación');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, statusFilter]);

  const handleAddDispatchItem = () => {
    if (products.length > 0) {
      setDispatchItems([...dispatchItems, { productId: products[0].id, quantity: 5 }]);
    }
  };

  const handleRemoveDispatchItem = (index: number) => {
    setDispatchItems(dispatchItems.filter((_, i) => i !== index));
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBranchId || dispatchItems.length === 0) return;

    // Validación básica
    for (const item of dispatchItems) {
      if (!item.productId || item.quantity <= 0) {
        alert('Por favor configure productos válidos con cantidades mayores a 0');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await api.consignments.create({
        target_branch_id: targetBranchId,
        notes: dispatchNotes,
        items: dispatchItems.map((i) => ({ product_id: i.productId, quantity: i.quantity }))
      });
      setShowCreateModal(false);
      setDispatchNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al emitir el despacho en consignación');
    } finally {
      setIsSubmitting(false);
    }
  };

  // HU-05: Confirmación Conforme
  const handleConfirmDirect = async (consignment: Consignment) => {
    if (!confirm(`¿Confirmar recepción conforme de los libros del despacho ${consignment.dispatch_code}?`)) {
      return;
    }
    try {
      setIsSubmitting(true);
      await api.consignments.confirm(consignment.id, {
        notes: 'Recepción 100% conforme sin discrepancias físicas'
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al confirmar recepción');
    } finally {
      setIsSubmitting(false);
    }
  };

  // HU-05: Abrir modal de observación
  const handleOpenObserveModal = (consignment: Consignment) => {
    setSelectedConsignment(consignment);
    setObserveNotes('');
    setObservedItems(
      (consignment.items || []).map((it) => ({
        productId: it.product_id,
        receivedQuantity: it.dispatched_quantity,
        discrepancyNotes: ''
      }))
    );
    setShowObserveModal(true);
  };

  const handleConfirmWithObservations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsignment) return;

    try {
      setIsSubmitting(true);
      await api.consignments.confirm(selectedConsignment.id, {
        notes: observeNotes || 'Recepción con observaciones registradas en mostrador',
        items: observedItems.map((oi) => ({
          product_id: oi.productId,
          received_quantity: oi.receivedQuantity,
          discrepancy_notes: oi.discrepancyNotes
        }))
      });
      setShowObserveModal(false);
      setSelectedConsignment(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al procesar la recepción observada');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogisticsOrAdmin = user?.role === 'ADMIN' || user?.role === 'LOGISTICS';
  const isDistributor = user?.role === 'DISTRIBUTOR';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
            <Clock className="w-3.5 h-3.5" /> En Tránsito
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Recibido Conforme
          </span>
        );
      case 'OBSERVED':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
            <AlertCircle className="w-3.5 h-3.5" /> Con Observación
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Despachos en Consignación</h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              HU-04 & HU-05
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {isDistributor
              ? `Envíos remitidos por Logística hacia su punto de venta (${user?.branch_name || 'Mi Sede'}).`
              : 'Gestión central de remesas de libros a distribuidoras aliadas de Arequipa.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 font-medium"
          >
            <option value="">Todos los Estados</option>
            <option value="PENDING">En Tránsito (Pendientes)</option>
            <option value="RECEIVED">Recibidos Conformes</option>
            <option value="OBSERVED">Con Observación</option>
          </select>

          <button
            onClick={loadData}
            title="Recargar despachos"
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {isLogisticsOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Nuevo Despacho (HU-04)</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Despachos */}
      <div className="space-y-4">
        {consignments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-800 text-base">No hay despachos registrados</h3>
            <p className="text-sm text-slate-500 mt-1">
              {isDistributor
                ? 'Actualmente no tiene remisiones pendientes de entrega para su sede.'
                : 'Presione "Nuevo Despacho" para transferir lotes de libros a una distribuidora.'}
            </p>
          </div>
        ) : (
          consignments.map((c) => (
            <div
              key={c.id}
              className={`bg-white border rounded-xl shadow-xs overflow-hidden transition-all ${
                c.status === 'PENDING' ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
              }`}
            >
              {/* Encabezado del Despacho */}
              <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-mono font-bold text-xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono text-base">{c.dispatch_code}</span>
                      {getStatusBadge(c.status)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Destino: <strong className="text-slate-800">{c.target_branch_name}</strong> • Enviado por:{' '}
                      {c.dispatcher_name} • {new Date(c.created_at).toLocaleDateString('es-PE')}
                    </div>
                  </div>
                </div>

                {/* Acciones de Recepción (Distribuidor / Admin) */}
                {c.status === 'PENDING' && (isDistributor || user?.role === 'ADMIN') && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirmDirect(c)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Conforme (HU-05)</span>
                    </button>
                    <button
                      onClick={() => handleOpenObserveModal(c)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 border border-rose-300 text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Observar Faltante</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Detalle de Partidas Despachadas */}
              <div className="px-5 py-3">
                <div className="text-2xs uppercase tracking-wider font-bold text-slate-400 mb-2">
                  Partidas de Libros Despachadas
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {(c.items || []).map((it) => (
                    <div
                      key={it.id}
                      className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/40 flex justify-between items-center"
                    >
                      <div>
                        <div className="text-xs font-medium text-slate-900">{it.product_title}</div>
                        <div className="text-2xs text-slate-400 font-mono">{it.product_code}</div>
                        {it.discrepancy_notes && (
                          <div className="text-2xs text-rose-600 italic mt-0.5">⚠️ {it.discrepancy_notes}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800">{it.dispatched_quantity} unid.</div>
                        {c.status !== 'PENDING' && (
                          <div className="text-2xs text-emerald-600 font-medium">
                            Recibidos: {it.received_quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {c.notes && (
                  <p className="text-xs text-slate-500 italic mt-2 border-t border-slate-100 pt-1.5">
                    <strong>Notas:</strong> {c.notes}
                  </p>
                )}

                {c.received_at && (
                  <p className="text-2xs text-emerald-700 mt-1">
                    ✓ Confirmado por {c.receiver_name || 'Distribuidor'} el{' '}
                    {new Date(c.received_at).toLocaleString('es-PE')}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Nuevo Despacho en Consignación (HU-04) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Nuevo Despacho en Consignación</h3>
                <p className="text-2xs text-indigo-600 font-semibold uppercase">HU-04 • Valida Almacén Central (RN-01)</p>
              </div>
            </div>

            <form onSubmit={handleCreateDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Distribuidora Aliada de Destino
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.address})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista dinámica de partidas a despachar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">Títulos y Cantidades a Enviar</label>
                  <button
                    type="button"
                    onClick={handleAddDispatchItem}
                    className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Título
                  </button>
                </div>

                <div className="space-y-2">
                  {dispatchItems.map((item, idx) => {
                    const cStockItem = centralStock.find((cs) => cs.product_id === item.productId);
                    const avail = cStockItem ? cStockItem.current_quantity : 0;
                    return (
                      <div key={idx} className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const newItems = [...dispatchItems];
                            newItems[idx].productId = e.target.value;
                            setDispatchItems(newItems);
                          }}
                          className="flex-1 border border-slate-300 rounded-md px-2 py-1.5 text-xs bg-white"
                          required
                        >
                          {products.map((p) => {
                            const stock = centralStock.find((cs) => cs.product_id === p.id);
                            return (
                              <option key={p.id} value={p.id}>
                                {p.title} (Disp. Central: {stock?.current_quantity ?? 0})
                              </option>
                            );
                          })}
                        </select>

                        <div className="text-2xs text-indigo-700 font-bold whitespace-nowrap">
                          Disp: {avail}
                        </div>

                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...dispatchItems];
                              newItems[idx].quantity = Number(e.target.value);
                              setDispatchItems(newItems);
                            }}
                            className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs text-right"
                            required
                          />
                        </div>

                        {dispatchItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDispatchItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas de Remisión (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Entrega en caja sellada con precinto"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Generando...' : 'Emitir Despacho (HU-04)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmación con Observaciones de Entrega (HU-05) */}
      {showObserveModal && selectedConsignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Recepción con Discrepancia Física</h3>
                <p className="text-2xs text-rose-600 font-semibold uppercase">
                  HU-05 • Despacho {selectedConsignment.dispatch_code}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmWithObservations} className="space-y-4">
              <p className="text-xs text-slate-600">
                Indique la cantidad física real efectivamente recibida y anote el motivo de la discrepancia (ej. libros
                faltantes, mojados o con fallas de imprenta). Solo se sumarán al inventario vendible las unidades
                recibidas.
              </p>

              <div className="space-y-3">
                {observedItems.map((item, idx) => {
                  const originalItem = selectedConsignment.items?.find((i) => i.product_id === item.productId);
                  return (
                    <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                        <span>{originalItem?.product_title}</span>
                        <span className="text-slate-500">Despachados: {originalItem?.dispatched_quantity}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-xs text-slate-600 whitespace-nowrap">Recibidos Reales:</label>
                        <input
                          type="number"
                          min="0"
                          max={originalItem?.dispatched_quantity}
                          value={item.receivedQuantity}
                          onChange={(e) => {
                            const newObs = [...observedItems];
                            newObs[idx].receivedQuantity = Number(e.target.value);
                            setObservedItems(newObs);
                          }}
                          className="w-24 border border-slate-300 rounded px-2 py-1 text-xs text-right font-bold"
                          required
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Motivo de la discrepancia (ej. 2 ejemplares llegaron mojados)"
                        value={item.discrepancyNotes}
                        onChange={(e) => {
                          const newObs = [...observedItems];
                          newObs[idx].discrepancyNotes = e.target.value;
                          setObservedItems(newObs);
                        }}
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones Generales de Recepción
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalle global de la entrega..."
                  value={observeNotes}
                  onChange={(e) => setObserveNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowObserveModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar con Observación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
