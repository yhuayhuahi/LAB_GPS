import React, { useEffect, useState } from 'react';
import { AlertCircle, Calculator, FilePlus2 } from 'lucide-react';
import { api } from '../../services/api';
import type { Branch, Liquidation, LiquidationPreview } from '../../types';
import { firstOfMonthIso, formatIsoDate, formatPEN, todayIso } from '../../utils/money';

interface Props {
  onCreated: (liq: Liquidation) => void;
}

/** HU-15: selecciona distribuidora y período, calcula en el servidor y genera la liquidación. */
export const LiquidationGenerator: React.FC<Props> = ({ onCreated }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [start, setStart] = useState(firstOfMonthIso());
  const [end, setEnd] = useState(todayIso());
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<LiquidationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.branches.list(false).then(setBranches).catch((e) => setError(e.message || 'No se pudieron cargar las distribuidoras'));
  }, []);

  const dateError = !start || !end ? 'Seleccione las fechas del período' : start > end ? 'La fecha de inicio no puede ser posterior a la de fin' : end > todayIso() ? 'El período no puede terminar en una fecha futura' : null;
  const canCalculate = !!branchId && !dateError;

  const reset = () => {
    setPreview(null);
    setError(null);
  };

  const calculate = async () => {
    if (!canCalculate) return;
    try {
      setBusy(true);
      setError(null);
      setPreview(await api.liquidations.preview(branchId, start, end));
    } catch (err: any) {
      setPreview(null);
      setError(err.message || 'No se pudo calcular la liquidación');
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    if (!preview || preview.sales_count === 0) return;
    if (!confirm(`¿Generar la liquidación de ${preview.branch_name} por ${formatPEN(preview.net_amount)}? Las ${preview.sales_count} venta(s) incluidas no podrán liquidarse de nuevo ni anularse.`)) return;
    try {
      setBusy(true);
      setError(null);
      const created = await api.liquidations.create({ branch_id: branchId, period_start: start, period_end: end, notes: notes.trim() || undefined });
      setPreview(null);
      setNotes('');
      onCreated(created);
    } catch (err: any) {
      setError(err.message || 'No se pudo generar la liquidación');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div>
        <h3 className="font-bold text-slate-900">Nueva liquidación</h3>
        <p className="text-xs text-slate-500">Ingreso bruto − comisión fija = monto neto a entregar a QSY. El cálculo lo hace el servidor con las ventas confirmadas.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-2xs font-semibold text-slate-600 mb-1">Distribuidora</label>
          <select value={branchId} onChange={(e) => { setBranchId(e.target.value); reset(); }} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white">
            <option value="">Seleccione…</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-2xs font-semibold text-slate-600 mb-1">Desde</label>
          <input type="date" value={start} max={todayIso()} onChange={(e) => { setStart(e.target.value); reset(); }} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-2xs font-semibold text-slate-600 mb-1">Hasta</label>
          <input type="date" value={end} max={todayIso()} onChange={(e) => { setEnd(e.target.value); reset(); }} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm" />
        </div>
        <button onClick={calculate} disabled={!canCalculate || busy} className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
          <Calculator className="w-4 h-4" /> {busy && !preview ? 'Calculando…' : 'Calcular'}
        </button>
      </div>
      {dateError && <p className="text-2xs text-rose-600">{dateError}</p>}
      {error && <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

      {preview && (
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-lg p-3"><div className="text-2xs text-slate-500 uppercase">Ingreso bruto</div><div className="text-lg font-bold text-slate-900">{formatPEN(preview.gross_amount)}</div></div>
            <div className="bg-slate-50 rounded-lg p-3"><div className="text-2xs text-slate-500 uppercase">Comisiones</div><div className="text-lg font-bold text-slate-900">− {formatPEN(preview.commission_amount)}</div></div>
            <div className="bg-indigo-50 rounded-lg p-3"><div className="text-2xs text-indigo-600 uppercase">Monto neto a entregar a QSY</div><div className="text-lg font-bold text-indigo-900">{formatPEN(preview.net_amount)}</div></div>
          </div>
          <p className="text-xs text-slate-500">
            {preview.sales_count} venta(s) del {formatIsoDate(preview.period_start)} al {formatIsoDate(preview.period_end)} • vencimiento {formatIsoDate(preview.due_date)}
            {preview.already_liquidated_sales > 0 && ` • ${preview.already_liquidated_sales} venta(s) ya liquidadas se excluyen`}
          </p>
          {preview.sales_count === 0 ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-3 py-2">No hay ventas pendientes de liquidar en este período.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-2xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="text-left py-2">Título</th><th className="text-right px-2">Unid.</th><th className="text-right px-2">Precio</th><th className="text-right px-2">Comisión</th><th className="text-right px-2">Subtotal ventas</th><th className="text-right">Subtotal comisión</th>
                  </tr></thead>
                  <tbody>
                    {preview.details.map((d, i) => (
                      <tr key={`${d.product_id}-${i}`} className="border-b border-slate-100">
                        <td className="py-2"><span className="font-medium text-slate-900">{d.title_snapshot}</span> <span className="text-2xs text-slate-400 font-mono">{d.code_snapshot}</span></td>
                        <td className="text-right px-2">{d.quantity}</td><td className="text-right px-2">{formatPEN(d.unit_price)}</td><td className="text-right px-2">{formatPEN(d.unit_commission)}</td>
                        <td className="text-right px-2 font-semibold">{formatPEN(d.gross_subtotal)}</td><td className="text-right">{formatPEN(d.commission_subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-2xs text-slate-400">La comisión es fija por título (RN-06) y se toma de lo registrado en cada venta; no puede modificarse aquí.</p>
              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1">Observaciones (opcional)</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end">
                <button onClick={generate} disabled={busy} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
                  <FilePlus2 className="w-4 h-4" /> {busy ? 'Generando…' : 'Generar liquidación'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
