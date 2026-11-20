import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { LiquidationDetailModal } from '../../components/liquidations/LiquidationDetailModal';
import { LiquidationTable } from '../../components/liquidations/LiquidationTable';
import { api } from '../../services/api';
import type { Branch, DebtsOverview, Liquidation } from '../../types';
import { formatPEN } from '../../utils/money';

interface Props {
  refreshKey?: number;
}

/** HU-16: control de cobranzas: totales, deuda por distribuidora, filtros y registro de pagos. */
export const CollectionsView: React.FC<Props> = ({ refreshKey = 0 }) => {
  const [debts, setDebts] = useState<DebtsOverview | null>(null);
  const [rows, setRows] = useState<Liquidation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [d, list] = await Promise.all([
        api.liquidations.debts(),
        api.liquidations.list({ branch_id: branchId || undefined, status: status || undefined, from: from || undefined, to: to || undefined, overdue })
      ]);
      setDebts(d);
      setRows(list);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la información de cobranzas');
    } finally {
      setLoading(false);
    }
  }, [branchId, status, from, to, overdue]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    api.branches.list(true).then(setBranches).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      {error && <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3"><AlertCircle className="w-4 h-4" /> {error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-2xs uppercase text-slate-500">Total por cobrar</div><div className="text-2xl font-bold text-rose-700">{formatPEN(debts?.total_to_collect ?? 0)}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-2xs uppercase text-slate-500">Total recibido</div><div className="text-2xl font-bold text-emerald-700">{formatPEN(debts?.total_collected ?? 0)}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-2xs uppercase text-slate-500">Vencido</div><div className={`text-2xl font-bold ${(debts?.total_overdue ?? 0) > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{formatPEN(debts?.total_overdue ?? 0)}</div></div>
      </div>

      <div>
        <h3 className="font-bold text-slate-900 mb-2">Estado de distribuidoras</h3>
        {debts && debts.branches.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center text-sm text-slate-500">Aún no hay liquidaciones generadas.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {debts?.branches.map((b) => {
              const owes = b.pending_total > 0;
              return (
                <button key={b.branch_id} onClick={() => { setBranchId(b.branch_id); setStatus(''); }} className={`text-left bg-white border rounded-xl p-4 cursor-pointer hover:shadow-xs ${b.overdue_liquidations > 0 ? 'border-rose-300' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-slate-900">{b.branch_name}</div>
                    {owes ? (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {b.overdue_liquidations > 0 && <AlertTriangle className="w-3 h-3" />} Deuda pendiente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Al día</span>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div><div className="text-slate-500">Liquidado</div><div className="font-semibold">{formatPEN(b.net_total)}</div></div>
                    <div><div className="text-slate-500">Pagado</div><div className="font-semibold text-emerald-700">{formatPEN(b.paid_total)}</div></div>
                    <div><div className="text-slate-500">Pendiente</div><div className={`font-bold ${owes ? 'text-rose-700' : 'text-slate-400'}`}>{formatPEN(b.pending_total)}</div></div>
                  </div>
                  {b.overdue_liquidations > 0 && <div className="mt-2 text-2xs text-rose-700 font-semibold">{b.overdue_liquidations} liquidación(es) vencida(s): {formatPEN(b.overdue_pending)}</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-2xs font-semibold text-slate-600 mb-1">Distribuidora</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white">
              <option value="">Todas</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-2xs font-semibold text-slate-600 mb-1">Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white">
              <option value="">Todos</option><option value="PENDING">Pendientes</option><option value="PARTIAL">Parciales</option><option value="PAID">Pagadas</option>
            </select>
          </div>
          <div><label className="block text-2xs font-semibold text-slate-600 mb-1">Período desde</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-2 text-sm" /></div>
          <div><label className="block text-2xs font-semibold text-slate-600 mb-1">Período hasta</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-2 text-sm" /></div>
          <label className="flex items-center gap-2 text-sm text-slate-700 pb-2 cursor-pointer"><input type="checkbox" checked={overdue} onChange={(e) => setOverdue(e.target.checked)} /> Solo vencidas</label>
          <button onClick={() => { setBranchId(''); setStatus(''); setFrom(''); setTo(''); setOverdue(false); }} className="text-xs text-slate-500 hover:text-slate-800 pb-2.5 cursor-pointer">Limpiar filtros</button>
          <button onClick={load} title="Actualizar" className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer mb-0.5"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        <LiquidationTable rows={rows} onOpen={setOpenId} actionLabel={(l) => (l.status === 'PAID' ? 'Ver detalle' : 'Cobrar')} emptyText="No hay liquidaciones con los filtros seleccionados." />
      </div>

      {openId && <LiquidationDetailModal liquidationId={openId} canCollect onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
};
