import { randomUUID } from 'crypto';
import { db } from '../config/database';
import { env } from '../config/env';
import { liquidationRepository, SaleLineRow } from '../repositories/liquidation.repository';
import {
  CreateLiquidationInput,
  CreatePaymentInput,
  createPaymentSchema,
  liquidationPeriodSchema
} from '../schemas/liquidation.schema';
import {
  AuthUser,
  BranchDebtSummary,
  DebtsOverview,
  Liquidation,
  LiquidationItem,
  LiquidationPreview,
  LiquidationStatus
} from '../types/domain';
import { AppError } from '../types/responses';
import { addDays, limaDayStartUtc, todayLima, isValidIsoDate } from '../utils/lima-date';
import { fromCents, toCents } from '../utils/money';

const statusFor = (netCents: number, paidCents: number): LiquidationStatus =>
  paidCents >= netCents ? 'PAID' : paidCents > 0 ? 'PARTIAL' : 'PENDING';

interface Computed {
  salesCount: number;
  grossCents: number;
  commissionCents: number;
  netCents: number;
  items: Omit<LiquidationItem, 'id'>[];
  saleIds: string[];
}

/**
 * HU-15 / T03: cálculo en el servidor, en céntimos enteros.
 *   IB = Σ (precio_i × cantidad_i)     C = Σ (comisión_i × cantidad_i)     MN = IB − C
 * Las líneas se agrupan por (título, precio, comisión): si el precio cambió entre dos ventas,
 * cada precio conserva su propia línea y el resultado sigue siendo exacto.
 */
export function computeLiquidation(lines: SaleLineRow[]): Computed {
  const groups = new Map<string, Omit<LiquidationItem, 'id'> & { priceC: number; commC: number }>();
  const saleIds = new Set<string>();
  for (const l of lines) {
    saleIds.add(l.sale_id);
    const priceC = toCents(l.unit_price);
    const commC = toCents(l.unit_commission);
    const key = `${l.product_id}|${priceC}|${commC}`;
    const g = groups.get(key);
    if (g) {
      g.quantity += l.quantity;
    } else {
      groups.set(key, {
        product_id: l.product_id,
        code_snapshot: l.code,
        title_snapshot: l.title,
        quantity: l.quantity,
        unit_price: fromCents(priceC),
        unit_commission: fromCents(commC),
        gross_subtotal: 0,
        commission_subtotal: 0,
        priceC,
        commC
      });
    }
  }
  let grossCents = 0;
  let commissionCents = 0;
  const items: Omit<LiquidationItem, 'id'>[] = [];
  for (const g of groups.values()) {
    const grossC = g.priceC * g.quantity;
    const commC = g.commC * g.quantity;
    grossCents += grossC;
    commissionCents += commC;
    const { priceC: _p, commC: _c, ...item } = g;
    items.push({ ...item, gross_subtotal: fromCents(grossC), commission_subtotal: fromCents(commC) });
  }
  return { salesCount: saleIds.size, grossCents, commissionCents, netCents: grossCents - commissionCents, items, saleIds: [...saleIds] };
}

export class LiquidationService {
  private assertCanSeeBranch(user: AuthUser, branchId: string): void {
    if (user.role === 'DISTRIBUTOR' && user.branch_id !== branchId) {
      throw AppError.forbidden('RN-05: No tiene autorización para consultar liquidaciones de otra distribuidora', 'BRANCH_ACCESS_DENIED');
    }
  }

  private async resolvePeriod(input: { branch_id: string; period_start: string; period_end: string }) {
    const branch = await liquidationRepository.findBranch(input.branch_id);
    if (!branch) throw AppError.notFound('La distribuidora seleccionada no existe', 'BRANCH_NOT_FOUND');
    if (input.period_end > todayLima()) {
      throw AppError.badRequest('El período no puede terminar en una fecha futura', 'PERIOD_IN_FUTURE');
    }
    return {
      branch,
      startUtc: limaDayStartUtc(input.period_start),
      endUtc: limaDayStartUtc(addDays(input.period_end, 1)), // fin exclusivo: incluye todo el último día
      dueDate: addDays(input.period_end, env.LIQUIDATION_DUE_DAYS)
    };
  }

  /** HU-15: calcula sin guardar, para revisar el desglose con el distribuidor. */
  async preview(query: Record<string, unknown>): Promise<LiquidationPreview> {
    const parsed = liquidationPeriodSchema.safeParse({
      branch_id: query.branch_id,
      period_start: query.period_start,
      period_end: query.period_end
    });
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues.map((i) => i.message).join('; '), 'VALIDATION_ERROR');
    }
    const input = parsed.data;
    const { branch, startUtc, endUtc, dueDate } = await this.resolvePeriod(input);
    const lines = await liquidationRepository.findEligibleSaleLines(db, input.branch_id, startUtc, endUtc);
    const already = await liquidationRepository.countAlreadyLiquidatedSales(db, input.branch_id, startUtc, endUtc);
    const c = computeLiquidation(lines);
    return {
      branch_id: branch.id,
      branch_name: branch.name,
      period_start: input.period_start,
      period_end: input.period_end,
      sales_count: c.salesCount,
      already_liquidated_sales: already,
      gross_amount: fromCents(c.grossCents),
      commission_amount: fromCents(c.commissionCents),
      net_amount: fromCents(c.netCents),
      due_date: dueDate,
      details: c.items
    };
  }

  /** HU-15: calcula y guarda la liquidación (cabecera + detalle + ventas incluidas) en una transacción. */
  async create(user: AuthUser, input: CreateLiquidationInput): Promise<Liquidation> {
    const { startUtc, endUtc, dueDate } = await this.resolvePeriod(input);
    try {
      const id = await db.transaction(async (tx) => {
        const lines = await liquidationRepository.findEligibleSaleLines(tx, input.branch_id, startUtc, endUtc);
        const c = computeLiquidation(lines);
        if (c.salesCount === 0) {
          throw AppError.badRequest(
            'No hay ventas pendientes de liquidar para esta distribuidora en el período seleccionado',
            'NO_SALES_TO_LIQUIDATE'
          );
        }
        if (c.netCents < 0) {
          throw AppError.badRequest('El monto neto resultó negativo: revise las comisiones configuradas de las ventas', 'NEGATIVE_NET_AMOUNT');
        }
        const newId = randomUUID();
        await liquidationRepository.insertLiquidation(tx, {
          id: newId,
          code: await liquidationRepository.generateCode(tx),
          branchId: input.branch_id,
          periodStart: input.period_start,
          periodEnd: input.period_end,
          salesCount: c.salesCount,
          grossCents: c.grossCents,
          commissionCents: c.commissionCents,
          netCents: c.netCents,
          dueDate,
          notes: input.notes && input.notes.length > 0 ? input.notes : undefined,
          userId: user.id,
          items: c.items,
          saleIds: c.saleIds
        });
        // Una liquidación de S/ 0.00 neto no tiene nada que cobrar: nace pagada
        if (c.netCents === 0) {
          await liquidationRepository.updateTotals(tx, newId, 0, 0, 'PAID');
        }
        return newId;
      });
      return (await liquidationRepository.findById(id))!;
    } catch (err: any) {
      if (!(err instanceof AppError) && /UNIQUE|PRIMARY KEY|duplicate key/i.test(String(err?.message))) {
        throw AppError.conflict('Alguna venta del período ya fue incluida en otra liquidación; vuelva a calcular', 'SALE_ALREADY_LIQUIDATED');
      }
      throw err;
    }
  }

  async list(
    user: AuthUser,
    q: { branch_id?: string; status?: string; from?: string; to?: string; overdue?: string }
  ): Promise<Liquidation[]> {
    if (q.status && !['PENDING', 'PARTIAL', 'PAID'].includes(q.status)) {
      throw AppError.badRequest('Estado inválido. Use PENDING, PARTIAL o PAID', 'INVALID_STATUS');
    }
    for (const d of [q.from, q.to]) {
      if (d && !isValidIsoDate(d)) throw AppError.badRequest('Las fechas de filtro deben tener el formato AAAA-MM-DD', 'INVALID_DATE');
    }
    const branchId = user.role === 'DISTRIBUTOR' ? user.branch_id ?? '__none__' : q.branch_id;
    return liquidationRepository.list({
      branchId,
      status: q.status,
      from: q.from,
      to: q.to,
      overdueOnly: q.overdue === 'true'
    });
  }

  async getById(id: string, user: AuthUser): Promise<Liquidation> {
    const liq = await liquidationRepository.findById(id);
    if (!liq) throw AppError.notFound('La liquidación no existe', 'LIQUIDATION_NOT_FOUND');
    this.assertCanSeeBranch(user, liq.branch_id);
    return liq;
  }

  /**
   * HU-16: registra un cobro. Cada pago es un movimiento independiente (no se sobrescribe nada).
   * saldo = neto − Σ pagos; estado: sin pagos → PENDING, pagos parciales → PARTIAL, saldo 0 → PAID.
   */
  async addPayment(id: string, user: AuthUser, input: CreatePaymentInput): Promise<Liquidation> {
    const parsed = createPaymentSchema.safeParse(input);
    if (!parsed.success) throw AppError.badRequest(parsed.error.issues.map((i) => i.message).join('; '), 'VALIDATION_ERROR');
    const paymentDate = input.payment_date ?? todayLima();
    if (paymentDate > todayLima()) {
      throw AppError.badRequest('La fecha de pago no puede ser futura', 'PAYMENT_DATE_IN_FUTURE');
    }
    const amountCents = toCents(input.amount);

    await db.transaction(async (tx) => {
      const header = await liquidationRepository.lockLiquidation(tx, id);
      if (!header) throw AppError.notFound('La liquidación no existe', 'LIQUIDATION_NOT_FOUND');

      const netCents = toCents(header.net_amount);
      const paidCents = await liquidationRepository.sumPaymentsCents(tx, id);
      const pendingCents = netCents - paidCents;

      if (pendingCents <= 0) {
        throw AppError.conflict('Esta liquidación ya está pagada en su totalidad', 'LIQUIDATION_ALREADY_PAID');
      }
      if (amountCents > pendingCents) {
        throw AppError.badRequest(
          `El pago (S/ ${fromCents(amountCents).toFixed(2)}) supera el saldo pendiente (S/ ${fromCents(pendingCents).toFixed(2)})`,
          'PAYMENT_EXCEEDS_PENDING',
          { pending_amount: fromCents(pendingCents), amount: fromCents(amountCents) }
        );
      }

      await liquidationRepository.insertPayment(tx, {
        liquidationId: id,
        amountCents,
        method: input.payment_method,
        paymentDate,
        evidence: input.evidence && input.evidence.length > 0 ? input.evidence : undefined,
        userId: user.id
      });
      const newPaid = paidCents + amountCents;
      await liquidationRepository.updateTotals(tx, id, newPaid, netCents - newPaid, statusFor(netCents, newPaid));
    });

    return (await liquidationRepository.findById(id))!;
  }

  /** HU-16 / T07: panel de deudas por distribuidora. Distribuidor: solo su sede (RN-05). */
  async debts(user: AuthUser): Promise<DebtsOverview> {
    const all = await liquidationRepository.list({ branchId: user.role === 'DISTRIBUTOR' ? user.branch_id ?? '__none__' : undefined });
    const byBranch = new Map<string, BranchDebtSummary & { netC: number; paidC: number; pendC: number; overC: number }>();
    for (const l of all) {
      const b =
        byBranch.get(l.branch_id) ??
        {
          branch_id: l.branch_id,
          branch_name: l.branch_name ?? '',
          liquidations_count: 0,
          open_liquidations: 0,
          overdue_liquidations: 0,
          net_total: 0,
          paid_total: 0,
          pending_total: 0,
          overdue_pending: 0,
          netC: 0,
          paidC: 0,
          pendC: 0,
          overC: 0
        };
      b.liquidations_count += 1;
      b.netC += toCents(l.net_amount);
      b.paidC += toCents(l.paid_amount);
      b.pendC += toCents(l.pending_amount);
      if (l.status !== 'PAID') b.open_liquidations += 1;
      if (l.is_overdue) {
        b.overdue_liquidations += 1;
        b.overC += toCents(l.pending_amount);
      }
      byBranch.set(l.branch_id, b);
    }
    const branches = [...byBranch.values()]
      .map(({ netC, paidC, pendC, overC, ...b }) => ({
        ...b,
        net_total: fromCents(netC),
        paid_total: fromCents(paidC),
        pending_total: fromCents(pendC),
        overdue_pending: fromCents(overC)
      }))
      .sort((a, b) => b.pending_total - a.pending_total || a.branch_name.localeCompare(b.branch_name));
    const sumC = (k: 'pending_total' | 'paid_total' | 'overdue_pending') => branches.reduce((acc, b) => acc + toCents(b[k]), 0);
    return {
      total_to_collect: fromCents(sumC('pending_total')),
      total_collected: fromCents(sumC('paid_total')),
      total_overdue: fromCents(sumC('overdue_pending')),
      branches
    };
  }
}

export const liquidationService = new LiquidationService();
