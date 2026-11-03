import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Minus, Plus, RotateCcw, ShoppingBag, WalletCards } from 'lucide-react';
import { api } from '../../services/api';
import { pendingSales, queueSale, syncPendingSales } from '../../services/offlineSales';
import type { BranchStock, Product, Sale } from '../../types';

const money = (value: number) => `S/ ${value.toFixed(2)}`;

export const SalesView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<BranchStock[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [dni, setDni] = useState('');
  const [name, setName] = useState('');
  const [payment, setPayment] = useState<'EFECTIVO' | 'YAPE'>('EFECTIVO');
  const [cash, setCash] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<Sale | null>(null);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const load = async () => {
    const [catalogue, balance] = await Promise.all([api.products.list(), api.inventory.getBalance()]);
    setProducts(catalogue.filter((product) => (balance.branchStock ?? []).some((row) => row.product_id === product.id)).slice(0, 4));
    setStock(balance.branchStock ?? []);
  };
  const refreshPending = () => pendingSales().then((sales) => setPendingCount(sales.length)).catch(() => {});
  useEffect(() => {
    load().catch(() => setError('No se pudo cargar el stock de esta sede.'));
    refreshPending();
    const onOnline = () => setOnline(true); const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline); window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);
  const available = (id: string) => stock.find((row) => row.product_id === id)?.available_quantity ?? 0;
  const total = useMemo(() => products.reduce((sum, product) => sum + product.public_price * (quantities[product.id] ?? 0), 0), [products, quantities]);
  const selected = products.filter((product) => (quantities[product.id] ?? 0) > 0);
  const changeQty = (id: string, delta: number) => setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(available(id), (current[id] ?? 0) + delta)) }));
  const reset = () => { setQuantities({}); setDni(''); setName(''); setCash(null); setSuccess(null); setError(''); };
  const save = async () => {
    if (!name.trim()) return setError('Ingrese el nombre del comprador.');
    if (selected.length === 0) return setError('Seleccione por lo menos un libro.');
    setSaving(true); setError('');
    try {
      const data = { client_sale_uuid: crypto.randomUUID(), customer_dni: dni || undefined, customer_name: name.trim(), payment_method: payment, items: selected.map((product) => ({ product_id: product.id, quantity: quantities[product.id] })) };
      if (!online) {
        await queueSale({ id: data.client_sale_uuid, created_at: new Date().toISOString(), customer_dni: data.customer_dni, customer_name: data.customer_name, payment_method: data.payment_method, items: data.items });
        setSuccess({ id: data.client_sale_uuid, client_sale_uuid: data.client_sale_uuid, customer_dni: data.customer_dni ?? 'SIN-DNI', customer_name: data.customer_name, payment_method: data.payment_method, total_amount: total, status: 'CONFIRMED', is_offline_sync: true, created_at: new Date().toISOString(), items: [] });
        setQuantities({}); setCash(null); refreshPending(); return;
      }
      const sale = await api.sales.create(data);
      setSuccess(sale); await load(); setQuantities({}); setCash(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo registrar la venta.'); }
    finally { setSaving(false); }
  };
  const change = cash === null ? null : cash - total;
  const sync = async () => { try { const synced = await syncPendingSales(); await refreshPending(); await load(); setError(synced ? `${synced} venta(s) sincronizada(s).` : 'No hay ventas pendientes.'); } catch { setError('No se pudo sincronizar; revise la conexión y el stock.'); } };

  return <div className="min-h-full bg-[#f9f9ff] pb-10"><main className="mx-auto max-w-xl px-4 py-5 space-y-4">
    <header className="flex items-center justify-between"><div><h2 className="text-2xl font-bold text-[#001333]">Venta rápida</h2><p className="text-sm font-semibold text-slate-600">Toque los botones grandes para registrar una venta.</p></div><button onClick={reset} className="rounded-xl bg-[#e7eeff] px-3 py-2 text-sm font-bold text-[#001333]"><RotateCcw className="mr-1 inline h-4 w-4" />Limpiar</button></header>
    <div className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold ${online ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}><span>{online ? '● Conectado' : '● Sin conexión: las ventas se guardan en el celular'}</span>{pendingCount > 0 && <button onClick={sync} disabled={!online} className="rounded-lg bg-white px-2 py-1 font-bold disabled:opacity-50">Sincronizar {pendingCount}</button>}</div>
    {success && <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950"><CheckCircle2 className="mr-2 inline" />Venta registrada: <strong>{money(success.total_amount)}</strong>. Comprobante disponible en el siguiente incremento.</div>}
    {error && <div className="rounded-xl bg-rose-50 p-3 font-medium text-rose-700">{error}</div>}
    <section className="rounded-2xl border border-[#d8e3fb] bg-white p-4"><label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700">1. Edición / variante lingüística</label><div className="grid grid-cols-3 gap-2"><button className="rounded-xl bg-[#001333] p-3 font-bold text-white">Quechua<br /><span className="text-xs font-medium text-cyan-200">Disponible</span></button><button disabled className="rounded-xl bg-[#f0f3ff] p-3 font-bold text-slate-400">Otra edición<br /><span className="text-xs">Próximamente</span></button><button disabled className="rounded-xl bg-[#f0f3ff] p-3 font-bold text-slate-400">Otra edición<br /><span className="text-xs">Próximamente</span></button></div></section>
    <section className="rounded-2xl border border-[#d8e3fb] bg-white p-4"><label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700">2. Datos del comprador <span className="normal-case text-blue-700">(DNI opcional)</span></label><input value={dni} onChange={(event) => setDni(event.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" placeholder="DNI: 8 dígitos (opcional)" className="mb-2 h-12 w-full rounded-xl bg-[#f0f3ff] px-4 text-center text-xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-blue-500" /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del comprador" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500" /></section>
    <section className="rounded-2xl border border-[#d8e3fb] bg-white p-4"><div className="mb-3 flex justify-between"><span className="text-xs font-bold uppercase tracking-wide text-slate-700">3. Seleccione libros</span><span className="text-xs text-slate-600">Máximo 4 por edición</span></div><div className="space-y-3">{products.map((product) => <div key={product.id} className="flex items-center justify-between gap-2 rounded-2xl border border-[#d8e3fb] bg-[#f0f3ff] p-3"><div><h3 className="text-lg font-bold text-[#001333]">{product.title}</h3><p className="text-2xl font-black text-[#0051d5]">{money(product.public_price)} <span className="text-xs font-medium text-slate-600">· Stock {available(product.id)}</span></p></div><div className="flex items-center gap-2"><button onClick={() => changeQty(product.id, -1)} disabled={!quantities[product.id]} className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#001333] disabled:opacity-30"><Minus /></button><strong className="w-7 text-center text-2xl text-[#001333]">{quantities[product.id] ?? 0}</strong><button onClick={() => changeQty(product.id, 1)} disabled={available(product.id) === (quantities[product.id] ?? 0)} className="grid h-12 w-12 place-items-center rounded-2xl bg-[#001333] text-white disabled:opacity-30"><Plus /></button></div></div>)}</div></section>
    <section className="rounded-2xl border border-[#d8e3fb] bg-white p-4"><div className="mb-3 rounded-2xl bg-[#001333] p-4 text-white"><span className="text-xs font-bold uppercase tracking-wide text-cyan-200">Total a cobrar</span><div className="text-4xl font-black">{money(total)}</div></div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">4. Forma de pago</p><div className="grid grid-cols-2 gap-3"><button onClick={() => setPayment('EFECTIVO')} className={`rounded-2xl p-4 font-bold ${payment === 'EFECTIVO' ? 'border-2 border-blue-600 bg-blue-50 text-blue-900' : 'bg-[#f0f3ff]'}`}><WalletCards className="mx-auto mb-1" />Efectivo</button><button onClick={() => setPayment('YAPE')} className={`rounded-2xl p-4 font-bold ${payment === 'YAPE' ? 'border-2 border-purple-600 bg-purple-50 text-purple-900' : 'bg-[#f0f3ff]'}`}><span className="mx-auto mb-1 grid h-6 w-6 place-items-center rounded bg-purple-700 text-white">Y</span>Yape</button></div>{payment === 'EFECTIVO' && <div className="mt-3 grid grid-cols-4 gap-2">{[null, 50, 100, 200].map((bill) => <button key={String(bill)} onClick={() => setCash(bill ?? total)} className="rounded-xl border border-slate-200 bg-white py-2 font-bold">{bill ? money(bill) : 'Exacto'}</button>)}{change !== null && <div className="col-span-4 rounded-xl bg-emerald-100 p-3 font-bold text-emerald-950">Vuelto: <span className="float-right text-2xl">{money(Math.max(0, change))}</span></div>}</div>}</section>
    <button disabled={saving} onClick={save} className="flex min-h-[68px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0051d5] text-xl font-black text-white shadow-lg disabled:opacity-60"><ShoppingBag />{saving ? 'REGISTRANDO...' : 'CONFIRMAR Y FINALIZAR'}</button>
  </main></div>;
};
