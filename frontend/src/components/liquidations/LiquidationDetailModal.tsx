import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Banknote, X } from 'lucide-react';
import { api } from '../../services/api';
import type { CollectionMethod, Liquidation } from '../../types';
import { formatDbDateTime } from '../../utils/date';
import { formatIsoDate, formatPEN, parseAmount, todayIso, validatePaymentAmount } from '../../utils/money';
import { LiquidationStatusBadge } from './LiquidationStatusBadge';

const METHOD_LABEL: Record<CollectionMethod, string> = { CASH: 'Efectivo', VOUCHER: 'Constancia / comprobante', TRANSFER: 'Transferencia' };

interface Props {
  liquidationId: string;
  canCollect: boolean;
  onClose: () => void;
  onChanged: () => void;
}

/** HU-15: desglose congelado por título. HU-16: historial de cobros y registro de nuevos pagos. */
export const LiquidationDetailModal: React.FC<Props> = ({ liquidationId, canCollect, onClose, onChanged }) => {
  const [liq, setLiq] = useState<Liquidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<CollectionMethod>('CASH');
  const [date, setDate] = useState(todayIso());
  const [evidence, setEvidence] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLiq(await api.liquidations.getById(liquidationId));
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la liquidación');
    }
  }, [liquidationId]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = liq?.pending_amount ?? 0;
  const amountError = validatePaymentAmount(amount, pending);
  const evidenceError = method !== 'CASH' && evidence.trim().length < 3 ? 'Ingrese el N° de constancia o referencia (mín. 3 caracteres)' : null;
  const showAmountError = (attempted || amount !== '') && amountError;
  const showEvidenceError = attempted && evidenceError;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    setNotice(null);
    if (amountError || evidenceError || !liq) return;
    try {
      setSaving(true);
      const updated = await api.liquidations.addPayment(liq.id, {
        amount: parseAmount(amount),
        payment_method: method,
        payment_date: date,
        evidence: evidence.trim() || undefined
      });
      setLiq(updated);
      setAmount('');
      setEvidence('');
      setAttempted(false);
      setNotice(updated.status === 'PAID' ? 'Cobro registrado. La liquidación quedó PAGADA.' : `Cobro registrado. Saldo pendiente: ${formatPEN(updated.pending_amount)}.`);
      onChanged();
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar el cobro');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
        {!liq ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{error ?? 'Cargando liquidación…'}</p>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-lg font-mono">{liq.liquidation_code}</h3>
                  <LiquidationStatusBadge status={liq.status} overdue={liq.is_overdue} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {liq.branch_name} • período {formatIsoDate(liq.period_start)} al {formatIsoDate(liq.period_end)} • {liq.sales_count} venta(s) • vence {formatIsoDate(liq.due_date)}
                </p>
                <p className="text-2xs text-slate-400">Generada por {liq.created_by_name} el {formatDbDateTime(liq.created_at)}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-50 rounded-lg p-3"><div className="text-2xs text-slate-500 uppercase">Ingreso bruto</div><div className="font-bold text-slate-900">{formatPEN(liq.gross_amount)}</div></div>
              <div className="bg-slate-50 rounded-lg p-3"><div className="text-2xs text-slate-500 uppercase">Comisión</div><div className="font-bold text-slate-900">− {formatPEN(liq.commission_amount)}</div></div>
              <div className="bg-indigo-50 rounded-lg p-3"><div className="text-2xs text-indigo-600 uppercase">Neto a entregar a QSY</div><div className="font-bold text-indigo-900">{formatPEN(liq.net_amount)}</div></div>
              <div className={`rounded-lg p-3 ${liq.pending_amount > 0 ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                <div className={`text-2xs uppercase ${liq.pending_amount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Saldo pendiente</div>
                <div className={`font-bold ${liq.pending_amount > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>{formatPEN(liq.pending_amount)}</div>
                <div className="text-2xs text-slate-500">Cobrado {formatPEN(liq.paid_amount)}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-2xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="text-left py-2 pr-2">Título</th><th className="text-right px-2">Unid.</th><th className="text-right px-2">Precio</th>
                    <th className="text-right px-2">Comisión</th><th className="text-right px-2">Subtotal ventas</th><th className="text-right pl-2">Subtotal comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {liq.details?.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100">
                      <td className="py-2 pr-2"><div className="font-medium text-slate-900">{d.title_snapshot}</div><div className="text-2xs text-slate-400 font-mono">{d.code_snapshot}</div></td>
                      <td className="text-right px-2">{d.quantity}</td>
                      <td className="text-right px-2">{formatPEN(d.unit_price)}</td>
                      <td className="text-right px-2">{formatPEN(d.unit_commission)}</td>
                      <td className="text-right px-2 font-semibold">{formatPEN(d.gross_subtotal)}</td>
                      <td className="text-right pl-2">{formatPEN(d.commission_subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-2xs text-slate-400">Precios y comisiones congelados al momento de cada venta: no cambian si el catálogo se modifica después.</p>

            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-1">Historial de cobros</h4>
              {liq.payments && liq.payments.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-2">Fecha</th><th className="text-left p-2">Método</th><th className="text-left p-2">Referencia</th><th className="text-right p-2">Monto</th><th className="text-left p-2">Registró</th></tr></thead>
                    <tbody>
                      {liq.payments.map((p) => (
                        <tr key={p.id} className="border-t border-slate-100">
                          <td className="p-2">{formatIsoDate(p.payment_date)}</td><td className="p-2">{METHOD_LABEL[p.payment_method]}</td>
                          <td className="p-2">{p.evidence || '—'}</td><td className="p-2 text-right font-semibold">{formatPEN(p.amount)}</td><td className="p-2">{p.registered_by_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Aún no se registran cobros.</p>
              )}
            </div>

            {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg px-3 py-2">{notice}</div>}
            {error && <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

            {canCollect && liq.pending_amount > 0 && (
              <form onSubmit={submit} noValidate className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Banknote className="w-4 h-4 text-indigo-600" /> Registrar cobro (admite pagos parciales)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">Monto recibido (S/)</label>
                    <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder={`máx. ${liq.pending_amount.toFixed(2)}`}
                      className={`w-full border rounded-lg px-2 py-1.5 text-sm text-right ${showAmountError ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                    {showAmountError && <p className="text-2xs text-rose-600 mt-1">{amountError}</p>}
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">Método</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value as CollectionMethod)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white">
                      <option value="CASH">Efectivo</option><option value="VOUCHER">Constancia / comprobante</option><option value="TRANSFER">Transferencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">Fecha del pago</label>
                    <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">N° constancia / referencia{method === 'CASH' ? ' (opcional)' : ''}</label>
                    <input value={evidence} onChange={(e) => setEvidence(e.target.value)} maxLength={200}
                      className={`w-full border rounded-lg px-2 py-1.5 text-sm ${showEvidenceError ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`} />
                    {showEvidenceError && <p className="text-2xs text-rose-600 mt-1">{evidenceError}</p>}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
                    {saving ? 'Registrando…' : 'Registrar cobro'}
                  </button>
                </div>
              </form>
            )}
            <div className="flex justify-end"><button onClick={onClose} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">Cerrar</button></div>
          </>
        )}
      </div>
    </div>
  );
};
