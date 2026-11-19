import { randomUUID } from 'crypto';
import { db } from '../config/database';
import { notificationRepository } from '../repositories/notification.repository';
import { productRepository } from '../repositories/product.repository';
import { replenishmentRepository } from '../repositories/replenishment.repository';
import { CreateReplenishmentInput, DeliverReplenishmentInput } from '../schemas/replenishment.schema';
import { AuthUser, ReplenishmentRequest } from '../types/domain';
import { AppError } from '../types/responses';

export class ReplenishmentService {
  /**
   * HU-13: El distribuidor envía una solicitud formal de reabastecimiento.
   * - RN-05: la sede se obtiene del usuario autenticado; nunca del cuerpo de la petición.
   * - Estado inicial PENDING y notificación a Logística dentro de la misma transacción.
   */
  async create(user: AuthUser, input: CreateReplenishmentInput): Promise<ReplenishmentRequest> {
    if (user.role !== 'DISTRIBUTOR') {
      throw AppError.forbidden('Solo un distribuidor puede solicitar reposición para su sede', 'REPLENISHMENT_DISTRIBUTOR_ONLY');
    }
    if (!user.branch_id) {
      throw AppError.forbidden('El usuario distribuidor no tiene una sede asociada', 'NO_BRANCH_ASSIGNED');
    }

    // Un mismo libro no puede repetirse dentro de la solicitud
    const seen = new Set<string>();
    for (const item of input.items) {
      if (seen.has(item.product_id)) {
        throw AppError.badRequest('Un libro no puede repetirse en la misma solicitud; sume las cantidades en una sola línea', 'DUPLICATED_PRODUCT');
      }
      seen.add(item.product_id);
    }

    // Los libros deben existir en el catálogo y estar vigentes
    for (const item of input.items) {
      const product = await productRepository.findById(item.product_id);
      if (!product || !product.is_active) {
        throw AppError.badRequest(`El libro con ID ${item.product_id} no existe en el catálogo o está inactivo`, 'INVALID_PRODUCT');
      }
    }

    const branchId = user.branch_id;
    const requestId = await db.transaction(async (tx) => {
      const id = randomUUID();
      const requestCode = await replenishmentRepository.generateRequestCode(tx);
      await replenishmentRepository.insertRequest(tx, {
        id,
        requestCode,
        branchId,
        requestedByUserId: user.id,
        notes: input.notes && input.notes.length > 0 ? input.notes : undefined,
        items: input.items.map((i) => ({ productId: i.product_id, quantity: i.quantity }))
      });

      const totalUnits = input.items.reduce((acc, i) => acc + i.quantity, 0);
      await notificationRepository.create(tx, {
        targetRole: 'LOGISTICS',
        targetBranchId: branchId,
        type: 'REPLENISHMENT_REQUESTED',
        title: `Nueva solicitud de reposición ${requestCode}`,
        message: `${user.full_name} solicitó ${input.items.length} título(s) y ${totalUnits} ejemplar(es).`,
        requestId: id
      });
      return id;
    });

    return (await replenishmentRepository.findById(requestId))!;
  }

  /** HU-13/HU-14: listado. Distribuidor ve solo su sede (RN-05); Logística/Admin ven todas. */
  async list(user: AuthUser, status?: string): Promise<ReplenishmentRequest[]> {
    if (status && !['PENDING', 'COMPLETED'].includes(status)) {
      throw AppError.badRequest('Estado de solicitud inválido. Use PENDING o COMPLETED', 'INVALID_STATUS');
    }
    if (user.role === 'DISTRIBUTOR') {
      if (!user.branch_id) {
        throw AppError.forbidden('El usuario distribuidor no tiene una sede asociada', 'NO_BRANCH_ASSIGNED');
      }
      return replenishmentRepository.list(user.branch_id, status);
    }
    return replenishmentRepository.list(undefined, status);
  }

  /**
   * HU-14 / Escenario 1: detalle con stock entregado anterior, ventas y saldo actual (solo Logística/Admin).
   * El distribuidor únicamente ve el detalle de las solicitudes de su sede, sin datos de almacén central.
   */
  async getById(id: string, user: AuthUser): Promise<ReplenishmentRequest> {
    const request = await replenishmentRepository.findById(id);
    if (!request) {
      throw AppError.notFound('La solicitud de reposición no existe', 'REPLENISHMENT_NOT_FOUND');
    }
    if (user.role === 'DISTRIBUTOR' && request.branch_id !== user.branch_id) {
      throw AppError.forbidden('RN-05: No tiene autorización para consultar solicitudes de otra distribuidora', 'BRANCH_ACCESS_DENIED');
    }

    if (user.role !== 'DISTRIBUTOR') {
      const insights = await replenishmentRepository.getInsights(
        request.branch_id,
        request.items.map((i) => i.product_id)
      );
      request.items = request.items.map((i) => ({ ...i, insight: insights.get(i.product_id) }));
      request.movements = await replenishmentRepository.listMovements(id);
    }
    return request;
  }

  /**
   * HU-14 / Escenario 2: registra la entrega física.
   * Todo ocurre en UNA transacción: descuento del almacén (RN-01), ingreso a la sede,
   * movimientos de trazabilidad y cambio de estado a COMPLETED. Si algo falla, nada se guarda.
   * Regla definida: la cantidad entregada puede ser menor o igual a la solicitada (entrega parcial);
   * nunca mayor a lo pedido ni al stock disponible; al menos un título debe entregarse.
   */
  async deliver(id: string, user: AuthUser, input: DeliverReplenishmentInput): Promise<ReplenishmentRequest> {
    if (user.role !== 'LOGISTICS' && user.role !== 'ADMIN') {
      throw AppError.forbidden('Solo Logística puede registrar entregas de reposición', 'FORBIDDEN');
    }

    const seen = new Set<string>();
    for (const item of input.items) {
      if (seen.has(item.product_id)) {
        throw AppError.badRequest('Un libro no puede repetirse en el registro de entrega', 'DUPLICATED_PRODUCT');
      }
      seen.add(item.product_id);
    }

    await db.transaction(async (tx) => {
      const header = await replenishmentRepository.lockRequest(tx, id);
      if (!header) {
        throw AppError.notFound('La solicitud de reposición no existe', 'REPLENISHMENT_NOT_FOUND');
      }
      if (header.status !== 'PENDING') {
        throw AppError.conflict(
          'Esta solicitud ya fue completada; no se puede registrar la entrega nuevamente',
          'REPLENISHMENT_ALREADY_COMPLETED'
        );
      }

      const request = (await replenishmentRepository.findById(id, tx))!;

      // Cada línea entregada debe pertenecer a la solicitud y toda línea solicitada debe informarse
      for (const item of input.items) {
        if (!request.items.some((ri) => ri.product_id === item.product_id)) {
          throw AppError.badRequest(`El libro ${item.product_id} no forma parte de esta solicitud`, 'PRODUCT_NOT_IN_REQUEST');
        }
      }
      for (const ri of request.items) {
        if (!input.items.some((i) => i.product_id === ri.product_id)) {
          throw AppError.badRequest(`Falta indicar la cantidad entregada de "${ri.product_title}" (use 0 si no se entrega)`, 'MISSING_DELIVERY_LINE');
        }
      }

      const totalDelivered = input.items.reduce((acc, i) => acc + i.delivered_quantity, 0);
      if (totalDelivered <= 0) {
        throw AppError.badRequest('Debe entregar al menos un ejemplar para completar la solicitud', 'EMPTY_DELIVERY');
      }

      for (const item of input.items) {
        const ri = request.items.find((r) => r.product_id === item.product_id)!;
        const qty = item.delivered_quantity;

        if (qty > ri.requested_quantity) {
          throw AppError.badRequest(
            `La cantidad entregada de "${ri.product_title}" (${qty}) no puede superar la solicitada (${ri.requested_quantity})`,
            'DELIVERY_EXCEEDS_REQUEST',
            { product_id: ri.product_id, requested_quantity: ri.requested_quantity, delivered_quantity: qty }
          );
        }

        if (qty > 0) {
          // RN-01: prohibición de sobreventa sobre el almacén principal
          const available = await replenishmentRepository.lockCentralQuantity(tx, ri.product_id);
          if (qty > available) {
            throw AppError.badRequest(
              `RN-01: Existencias insuficientes en Almacén Central para "${ri.product_title}". Disponibles: ${available}, a entregar: ${qty}`,
              'INSUFFICIENT_CENTRAL_STOCK',
              { product_id: ri.product_id, product_title: ri.product_title, available_quantity: available, requested_quantity: qty }
            );
          }

          await replenishmentRepository.decreaseCentralStock(tx, ri.product_id, qty);
          await replenishmentRepository.insertMovement(tx, {
            productId: ri.product_id,
            movementType: 'REPLENISHMENT_OUT',
            locationType: 'CENTRAL',
            branchId: null,
            quantity: qty,
            requestId: id,
            userId: user.id
          });

          await replenishmentRepository.addBranchStock(tx, request.branch_id, ri.product_id, qty);
          await replenishmentRepository.insertMovement(tx, {
            productId: ri.product_id,
            movementType: 'REPLENISHMENT_IN',
            locationType: 'BRANCH',
            branchId: request.branch_id,
            quantity: qty,
            requestId: id,
            userId: user.id
          });
        }

        await replenishmentRepository.setItemDelivered(tx, id, ri.product_id, qty);
      }

      await replenishmentRepository.markCompleted(tx, id, user.id, input.notes && input.notes.length > 0 ? input.notes : undefined);

      await notificationRepository.create(tx, {
        targetRole: 'DISTRIBUTOR',
        targetBranchId: request.branch_id,
        type: 'REPLENISHMENT_COMPLETED',
        title: `Reposición ${request.request_code} completada`,
        message: `Logística entregó ${totalDelivered} ejemplar(es). Su inventario fue actualizado.`,
        requestId: id
      });
    });

    return this.getById(id, user);
  }
}

export const replenishmentService = new ReplenishmentService();
