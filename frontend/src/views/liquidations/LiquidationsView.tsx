import React, { useCallback, useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import { LiquidationDetailModal } from '../../components/liquidations/LiquidationDetailModal';
import { LiquidationGenerator } from '../../components/liquidations/LiquidationGenerator';
import { LiquidationTable } from '../../components/liquidations/LiquidationTable';
import { api } from '../../services/api';
import type { Liquidation } from '../../types';
import { CollectionsView } from './CollectionsView';

type Section = 'liquidations' | 'collections';

/** HU-15 (Liquidaciones) y HU-16 (Cobranzas) dentro de un mismo módulo, solo para Logística/Admin. */
export const LiquidationsView: React.FC = () => {
  const [section, setSection] = useState<Section>('liquidations');
  const [rows, setRows] = useState<Liquidation[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setRows(await api.liquidations.list());
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las liquidaciones');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tabClass = (s: Section) =>
    `px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${section === s ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Receipt className="w-5 h-5 text-indigo-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Liquidaciones y Cobranzas</h2>
            <p className="text-xs text-slate-500">HU-15 • calcule lo que cada distribuidora debe entregar · HU-16 • registre los cobros y controle las deudas.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className={tabClass('liquidations')} onClick={() => setSection('liquidations')}>Liquidaciones</button>
          <button className={tabClass('collections')} onClick={() => setSection('collections')}>Cobranzas</button>
        </div>
      </div>

      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg px-4 py-3">{success}</div>}
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {section === 'liquidations' ? (
        <>
          <LiquidationGenerator
            onCreated={(liq) => {
              setSuccess(`Liquidación ${liq.liquidation_code} generada para ${liq.branch_name}. Quedó Pendiente de cobro.`);
              setOpenId(liq.id);
              setRefreshKey((k) => k + 1);
              load();
            }}
          />
          <div>
            <h3 className="font-bold text-slate-900 mb-2">Liquidaciones generadas</h3>
            <LiquidationTable rows={rows} onOpen={setOpenId} />
          </div>
        </>
      ) : (
        <CollectionsView refreshKey={refreshKey} />
      )}

      {openId && (
        <LiquidationDetailModal
          liquidationId={openId}
          canCollect
          onClose={() => setOpenId(null)}
          onChanged={() => {
            setRefreshKey((k) => k + 1);
            load();
          }}
        />
      )}
    </div>
  );
};
