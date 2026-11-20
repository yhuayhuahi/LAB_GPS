import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, CircleDashed } from 'lucide-react';
import type { LiquidationStatus } from '../../types';

interface Props {
  status: LiquidationStatus;
  overdue?: boolean;
}

/** Pendiente / Parcial / Pagada, con realce rojo cuando la liquidación está vencida (HU-16). */
export const LiquidationStatusBadge: React.FC<Props> = ({ status, overdue }) => {
  if (status === 'PAID') {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Pagada
      </span>
    );
  }
  const base = status === 'PARTIAL' ? 'Parcial' : 'Pendiente';
  const Icon = status === 'PARTIAL' ? CircleDashed : Clock;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2 py-0.5 rounded-full">
        <Icon className="w-3 h-3" /> {base}
      </span>
      {overdue && (
        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" /> Vencida
        </span>
      )}
    </span>
  );
};
