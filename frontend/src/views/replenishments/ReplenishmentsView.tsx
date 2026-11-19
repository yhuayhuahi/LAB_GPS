import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDbDateTime } from '../../utils/date';
import { validateDeliveredQty, validateRequestedQty } from '../../utils/quantity';
import type { BranchStock, Product, ReplenishmentRequest, ReplenishmentStatus } from '../../types';
import { AlertCircle, CheckCircle2, ClipboardList, Clock, PackageCheck, Plus, RefreshCw, Send, Trash2, X } from 'lucide-react';

const statusBadge = (status: ReplenishmentStatus) =>
  status === 'PENDING' ? (
    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Pendiente
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Completada
    </span>
  );


interface Props {
  focusRequestId?: string | null;
  onFocusHandled?: () => void;
}

export const ReplenishmentsView: React.FC<Props> = ({ focusRequestId, onFocusHandled }) => {
  const { user } = useAuth();
  const isDistributor = user?.role === 'DISTRIBUTOR';

  const [requests, setRequests] = useState<ReplenishmentRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | ReplenishmentStatus>(isDistributor ? '' : 'PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setRequests(await api.replenishments.list(statusFilter || undefined));
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las solicitudes de reposición');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------------------------------------------------------------------------
  // HU-13: Formulario "Solicitar Reposición" (Distribuidor)
  // ---------------------------------------------------------------------------
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchStock, setBranchStock] = useState<BranchStock[]>([]);
  const [lines, setLines] = useState<{ productId: string; qty: string }[]>([]);
  const [pickProductId, setPickProductId] = useState('');
  const [notes, setNotes] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openForm = async () => {
    setShowForm(true);
    setLines([]);
    setNotes('');
    setAttempted(false);
    setFormError(null);
    try {
      const [catalogue, balance] = await Promise.all([api.products.list(false), api.inventory.getBalance()]);
      setProducts(catalogue);
      setBranchStock(balance.branchStock ?? []);
      setPickProductId('');
    } catch (err: any) {
      setFormError(err.message || 'No se pudo cargar el catálogo de libros');
    }
  };

  const availableToAdd = useMemo(() => products.filter((p) => !lines.some((l) => l.productId === p.id)), [products, lines]);
  const stockOf = (productId: string) => branchStock.find((s) => s.product_id === productId)?.available_quantity ?? 0;
  const productOf = (productId: string) => products.find((p) => p.id === productId);

  const addLine = () => {
    const id = pickProductId || availableToAdd[0]?.id;
    if (!id) return;
    setLines((prev) => [...prev, { productId: id, qty: '' }]);
    setPickProductId('');
  };

  const lineErrors = lines.map((l) => validateRequestedQty(l.qty));
  const formInvalid = lines.length === 0 || lineErrors.some(Boolean);
  const totalUnits = lines.reduce((acc, l) => acc + (validateRequestedQty(l.qty) ? 0 : Number(l.qty)), 0);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setFormError(null);
    if (lines.length === 0) {
      setFormError('Agregue al menos un libro a la solicitud');
      return;
    }
    if (lineErrors.some(Boolean)) {
      setFormError('Corrija las cantidades: deben ser números enteros mayores a 0');
      return;
    }
    try {
      setIsSubmitting(true);
      const created = await api.replenishments.create({
        notes: notes.trim() || undefined,
        items: lines.map((l) => ({ product_id: l.productId, quantity: Number(l.qty) }))
      });
      setShowForm(false);
      setSuccess(`Solicitud ${created.request_code} enviada a Logística (estado: Pendiente).`);
      await load();
    } catch (err: any) {
      setFormError(err.message || 'No se pudo enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HU-14: Detalle asistido y registro de entrega (Logística / Admin)
  // ---------------------------------------------------------------------------
  const [detail, setDetail] = useState<ReplenishmentRequest | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [delivered, setDelivered] = useState<Record<string, string>>({});
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliverError, setDeliverError] = useState<string | null>(null);
  const [isDelivering, setIsDelivering] = useState(false);

  const openDetail = useCallback(async (id: string) => {
    try {
      setIsDetailLoading(true);
      setDeliverError(null);
      setDeliveryNotes('');
      const data = await api.replenishments.getById(id);
      setDetail(data);
      const initial: Record<string, string> = {};
      for (const it of data.items) {
        const central = it.insight?.central_available ?? 0;
        initial[it.product_id] = String(Math.min(it.requested_quantity, central));
      }
      setDelivered(initial);
    } catch (err: any) {
      setError(err.message || 'No se pudo abrir la solicitud');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  // Apertura desde la campana de notificaciones
  useEffect(() => {
    if (focusRequestId && !isDistributor) {
      openDetail(focusRequestId);
      onFocusHandled?.();
    }
  }, [focusRequestId, isDistributor, openDetail, onFocusHandled]);

  const deliveryErrors = detail
    ? detail.items.map((it) => validateDeliveredQty(delivered[it.product_id] ?? '', it.requested_quantity, it.insight?.central_available ?? 0))
    : [];
  const totalDelivering = detail ? detail.items.reduce((acc, it, i) => acc + (deliveryErrors[i] ? 0 : Number(delivered[it.product_id] ?? 0)), 0) : 0;
  const canDeliver = !!detail && detail.status === 'PENDING' && deliveryErrors.every((e) => !e) && totalDelivering > 0;

  const confirmDelivery = async () => {
    if (!detail || !canDeliver) return;
    if (!confirm(`¿Confirmar la entrega de ${totalDelivering} ejemplar(es) a ${detail.branch_name}? Se actualizarán el almacén central y la sede.`)) return;
    try {
      setIsDelivering(true);
      setDeliverError(null);
      const updated = await api.replenishments.deliver(detail.id, {
        notes: deliveryNotes.trim() || undefined,
        items: detail.items.map((it) => ({ product_id: it.product_id, delivered_quantity: Number(delivered[it.product_id]) }))
      });
      setDetail(updated);
      setSuccess(`Solicitud ${updated.request_code} completada. Inventarios actualizados.`);
      await load();
    } catch (err: any) {
      setDeliverError(err.message || 'No se pudo registrar la entrega');
    } finally {
      setIsDelivering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{isDistributor ? 'Solicitudes de Reposición' : 'Reabastecimiento de Distribuidoras'}</h2>
            <p className="text-xs text-slate-500">
              {isDistributor
                ? 'HU-13 • Pida libros formalmente a Logística indicando títulos y cantidades.'
                : 'HU-14 • Revise entregas previas, ventas y saldo antes de viajar; luego registre la entrega.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | ReplenishmentStatus)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="COMPLETED">Completadas</option>
          </select>
          <button onClick={load} title="Actualizar" className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isDistributor && (
            <button onClick={openForm} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
              <Plus className="w-4 h-4" /> Solicitar Reposición
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="flex items-start justify-between gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg px-4 py-3">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</span>
          <button onClick={() => setSuccess(null)} className="cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Listado */}
      <div className="space-y-3">
        {!isLoading && requests.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-sm text-slate-500">
            {statusFilter === 'PENDING' ? 'No hay solicitudes pendientes.' : 'Todavía no hay solicitudes de reposición.'}
          </div>
        )}
        {requests.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-slate-900">{r.request_code}</span>
                {statusBadge(r.status)}
              </div>
              <div className="text-xs text-slate-500">
                {!isDistributor && <span className="font-semibold text-slate-700 mr-2">{r.branch_name}</span>}
                {formatDbDateTime(r.created_at)}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {r.items.map((it) => (
                <div key={it.id} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-1.5 text-xs">
                  <span className="text-slate-800 font-medium">{it.product_title}</span>
                  <span className="text-slate-600">
                    {it.requested_quantity} sol.
                    {r.status === 'COMPLETED' && <span className="text-emerald-700 font-semibold"> • {it.delivered_quantity} entr.</span>}
                  </span>
                </div>
              ))}
            </div>
            {r.notes && <p className="text-xs text-slate-500 italic mt-2">Notas: {r.notes}</p>}
            <div className="flex items-center justify-between mt-3">
              <span className="text-2xs text-slate-400">
                {r.status === 'COMPLETED' ? `Completada ${formatDbDateTime(r.completed_at)} por ${r.completed_by_name ?? 'Logística'}` : `Solicitada por ${r.requested_by_name}`}
              </span>
              {!isDistributor && (
                <button
                  onClick={() => openDetail(r.id)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" /> {r.status === 'PENDING' ? 'Revisar y entregar' : 'Ver detalle'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal HU-13: Solicitar Reposición */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Solicitar Reposición</h3>
                <p className="text-2xs text-indigo-600 font-semibold uppercase">HU-13 • Se envía a Logística como “Pendiente”</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={submitRequest} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Agregar libro del catálogo</label>
                <div className="flex gap-2">
                  <select
                    value={pickProductId}
                    onChange={(e) => setPickProductId(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                    disabled={availableToAdd.length === 0}
                  >
                    <option value="">{availableToAdd.length === 0 ? 'No hay más títulos disponibles' : 'Seleccione un título…'}</option>
                    {availableToAdd.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} ({p.code})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addLine}
                    disabled={!pickProductId}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-semibold border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {lines.length === 0 && <p className="text-xs text-slate-400 italic">Aún no agregó libros a la solicitud.</p>}
                {lines.map((l, idx) => {
                  const p = productOf(l.productId);
                  const err = (attempted || l.qty !== '') && lineErrors[idx];
                  return (
                    <div key={l.productId} className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/60">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{p?.title}</div>
                          <div className="text-2xs text-slate-500">En mostrador: {stockOf(l.productId)} unid.</div>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={l.qty}
                          onChange={(e) => setLines(lines.map((x, i) => (i === idx ? { ...x, qty: e.target.value } : x)))}
                          placeholder="Cant."
                          aria-label={`Cantidad de ${p?.title}`}
                          className={`w-24 border rounded-lg px-2 py-1.5 text-sm text-right ${err ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                        />
                        <button type="button" onClick={() => setLines(lines.filter((_, i) => i !== idx))} title="Quitar" className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {err && <p className="text-2xs text-rose-600 mt-1 text-right">{err}</p>}
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones (opcional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-sm">
                <span className="text-indigo-900 font-medium">Resumen</span>
                <span className="text-indigo-800">{lines.length} título(s) • <strong>{totalUnits}</strong> ejemplar(es)</span>
              </div>

              {formError && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancelar</button>
                <button
                  type="submit"
                  disabled={isSubmitting || (attempted && formInvalid)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  <Send className="w-4 h-4" /> {isSubmitting ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal HU-14: Detalle asistido + registro de entrega */}
      {(detail || isDetailLoading) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            {!detail ? (
              <p className="text-sm text-slate-500">Cargando solicitud…</p>
            ) : (
              <>
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900 text-lg font-mono">{detail.request_code}</h3>
                      {statusBadge(detail.status)}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {detail.branch_name} • solicitada por {detail.requested_by_name} • {formatDbDateTime(detail.created_at)}
                    </p>
                    {detail.notes && <p className="text-xs text-slate-500 italic mt-1">Notas: {detail.notes}</p>}
                  </div>
                  <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-2xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                        <th className="text-left py-2 pr-2">Título</th>
                        <th className="text-right px-2">Solicitado</th>
                        <th className="text-right px-2">Entregado antes</th>
                        <th className="text-right px-2">Ventas</th>
                        <th className="text-right px-2">Saldo en sede</th>
                        <th className="text-right px-2">Almacén</th>
                        <th className="text-right pl-2">{detail.status === 'PENDING' ? 'Entregar' : 'Entregado'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((it, i) => (
                        <tr key={it.id} className="border-b border-slate-100 align-top">
                          <td className="py-2 pr-2">
                            <div className="font-medium text-slate-900">{it.product_title}</div>
                            <div className="text-2xs text-slate-400 font-mono">{it.product_code}</div>
                          </td>
                          <td className="text-right px-2 py-2 font-semibold">{it.requested_quantity}</td>
                          <td className="text-right px-2 py-2">{it.insight?.delivered_total ?? '-'}</td>
                          <td className="text-right px-2 py-2">{it.insight?.sold_total ?? '-'}</td>
                          <td className="text-right px-2 py-2">
                            <span className={(it.insight?.current_balance ?? 0) <= 3 ? 'text-rose-600 font-bold' : 'text-slate-800'}>{it.insight?.current_balance ?? '-'}</span>
                            {!!it.insight?.other_exits && <div className="text-2xs text-slate-400">({it.insight.other_exits} otras salidas)</div>}
                          </td>
                          <td className="text-right px-2 py-2">{it.insight?.central_available ?? '-'}</td>
                          <td className="text-right pl-2 py-2">
                            {detail.status === 'PENDING' ? (
                              <div>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={delivered[it.product_id] ?? ''}
                                  onChange={(e) => setDelivered({ ...delivered, [it.product_id]: e.target.value })}
                                  aria-label={`Cantidad entregada de ${it.product_title}`}
                                  className={`w-20 border rounded-lg px-2 py-1.5 text-sm text-right ${deliveryErrors[i] ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                                />
                                {deliveryErrors[i] && <div className="text-2xs text-rose-600 mt-1 max-w-[11rem] ml-auto">{deliveryErrors[i]}</div>}
                              </div>
                            ) : (
                              <span className="font-bold text-emerald-700">{it.delivered_quantity}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-2xs text-slate-400">Saldo en sede = entregado − ventas − otras salidas. “Entregado antes” y “Ventas” son datos ya registrados en el sistema; no requieren conteo físico previo.</p>

                {detail.status === 'PENDING' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones de la entrega (opcional)</label>
                      <input value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} maxLength={500} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-sm">
                      <span className="text-indigo-900 font-medium">Resumen de entrega</span>
                      <span className="text-indigo-800"><strong>{totalDelivering}</strong> ejemplar(es) de {detail.items.reduce((a, it) => a + it.requested_quantity, 0)} solicitados</span>
                    </div>
                    {deliverError && (
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {deliverError}
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cerrar</button>
                      <button
                        onClick={confirmDelivery}
                        disabled={!canDeliver || isDelivering}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        <PackageCheck className="w-4 h-4" /> {isDelivering ? 'Registrando…' : 'Confirmar entrega'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-emerald-700">
                      ✓ Completada el {formatDbDateTime(detail.completed_at)} por {detail.completed_by_name ?? 'Logística'}.
                    </p>
                    {!!detail.movements?.length && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-700 mb-1">Movimientos de inventario registrados</h4>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-slate-500">
                              <tr><th className="text-left p-2">Título</th><th className="text-left p-2">Movimiento</th><th className="text-left p-2">Ubicación</th><th className="text-right p-2">Cant.</th><th className="text-left p-2">Responsable</th></tr>
                            </thead>
                            <tbody>
                              {detail.movements.map((m) => (
                                <tr key={m.id} className="border-t border-slate-100">
                                  <td className="p-2">{m.product_title}</td>
                                  <td className="p-2">{m.movement_type === 'REPLENISHMENT_OUT' ? 'Salida' : 'Entrada'}</td>
                                  <td className="p-2">{m.location_type === 'CENTRAL' ? 'Almacén Central' : m.branch_name}</td>
                                  <td className="p-2 text-right font-semibold">{m.quantity}</td>
                                  <td className="p-2">{m.performed_by_name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">Cerrar</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
