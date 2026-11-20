import React from 'react';
import type { Liquidation } from '../../types';
import { formatIsoDate, formatPEN } from '../../utils/money';
import { LiquidationStatusBadge } from './LiquidationStatusBadge';

interface Props {
  rows: Liquidation[];
  onOpen: (id: string) => void;
  actionLabel?: (l: Liquidation) => string;
  emptyText?: string;
}

export const LiquidationTable: React.FC<Props> = ({ rows, onOpen, actionLabel, emptyText = 'No hay liquidaciones para mostrar.' }) => {
  if (rows.length === 0) {
    return <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-sm text-slate-500">{emptyText}</div>;
  }
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-2xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="text-left p-3">Código</th><th className="text-left p-3">Distribuidora</th><th className="text-left p-3">Período</th>
            <th className="text-right p-3">Neto</th><th className="text-right p-3">Cobrado</th><th className="text-right p-3">Pendiente</th>
            <th className="text-left p-3">Vence</th><th className="text-left p-3">Estado</th><th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="border-t border-slate-100">
              <td className="p-3 font-mono font-semibold text-slate-900">{l.liquidation_code}</td>
              <td className="p-3">{l.branch_name}</td>
              <td className="p-3 text-xs text-slate-600">{formatIsoDate(l.period_start)} – {formatIsoDate(l.period_end)}</td>
              <td className="p-3 text-right">{formatPEN(l.net_amount)}</td>
              <td className="p-3 text-right text-emerald-700">{formatPEN(l.paid_amount)}</td>
              <td className={`p-3 text-right font-semibold ${l.pending_amount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{formatPEN(l.pending_amount)}</td>
              <td className={`p-3 text-xs ${l.is_overdue ? 'text-rose-700 font-semibold' : 'text-slate-600'}`}>{formatIsoDate(l.due_date)}</td>
              <td className="p-3"><LiquidationStatusBadge status={l.status} overdue={l.is_overdue} /></td>
              <td className="p-3 text-right">
                <button onClick={() => onOpen(l.id)} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold cursor-pointer">{actionLabel ? actionLabel(l) : 'Ver detalle'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
