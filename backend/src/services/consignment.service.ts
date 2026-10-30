import { branchRepository } from '../repositories/branch.repository';
import { consignmentRepository } from '../repositories/consignment.repository';
import { inventoryRepository } from '../repositories/inventory.repository';
import { productRepository } from '../repositories/product.repository';
import { ConfirmConsignmentInput, CreateConsignmentInput } from '../schemas/consignment.schema';
import { AuthUser, Consignment } from '../types/domain';
import { AppError } from '../types/responses';

export class ConsignmentService {
  /**
   * HU-04: Registrar despacho de libros en consignación desde Almacén Central
   * RN-01: Prohibición de sobreventa (valida stock central antes de despachar)
   */
  async createDispatch(user: AuthUser, input: CreateConsignmentInput): Promise<Consignment> {
    // 1. Verificar existencia y estado de la sucursal receptora
    const branch = await branchRepository.findById(input.target_branch_id);
    if (!branch || !branch.is_active) {
      throw AppError.badRequest('La sucursal de destino no existe o se encuentra inactiva', 'INVALID_BRANCH');
    }

    // 2. Verificar existencia de productos y validar existencias en Almacén Central (RN-01)
    for (const item of input.items) {
      const product = await productRepository.findById(item.product_id);
      if (!product || !product.is_active) {
        throw AppError.badRequest(`El producto con ID ${item.product_id} no existe o está inactivo`, 'INVALID_PRODUCT');
      }

      const centralStock = await inventoryRepository.getCentralStockByProductId(item.product_id);
      const availableCentral = centralStock ? centralStock.current_quantity : 0;

      if (availableCentral < item.quantity) {
        throw AppError.badRequest(
          `RN-01: Existencias insuficientes en Almacén Central para el título "${product.title}". Disponibles: ${availableCentral}, Solicitadas: ${item.quantity}`,
          'INSUFFICIENT_CENTRAL_STOCK',
          {
            product_id: item.product_id,
            product_title: product.title,
            available_quantity: availableCentral,
            requested_quantity: item.quantity
          }
        );
      }
    }

    // 3. Descontar las unidades del Almacén Central
    for (const item of input.items) {
      await inventoryRepository.decreaseCentralStock(item.product_id, item.quantity);
    }

    // 4. Generar código de remisión y registrar consignación
    const dispatchCode = await consignmentRepository.generateDispatchCode();
    const created = await consignmentRepository.create({
      dispatchCode,
      targetBranchId: input.target_branch_id,
      dispatcherUserId: user.id,
      notes: input.notes,
      items: input.items.map((it) => ({
        productId: it.product_id,
        quantity: it.quantity
      }))
    });

    return created;
  }

  /**
   * HU-05: Listar despachos con aislamiento por sede (RN-05)
   */
  async listDispatches(user: AuthUser, status?: string): Promise<Consignment[]> {
    if (user.role === 'DISTRIBUTOR') {
      if (!user.branch_id) {
        throw AppError.forbidden('El usuario distribuidor no tiene una sede asociada', 'NO_BRANCH_ASSIGNED');
      }
      return consignmentRepository.list(user.branch_id, status);
    }
    return consignmentRepository.list(undefined, status);
  }

  /**
   * HU-05: Consultar detalle de un despacho con aislamiento por sede (RN-05)
   */
  async getDispatchById(id: string, user: AuthUser): Promise<Consignment> {
    const consignment = await consignmentRepository.findById(id);
    if (!consignment) {
      throw AppError.notFound('El despacho solicitado no existe', 'CONSIGNMENT_NOT_FOUND');
    }

    if (user.role === 'DISTRIBUTOR') {
      if (consignment.target_branch_id !== user.branch_id) {
        throw AppError.forbidden(
          'RN-05: No tiene autorización para consultar despachos de otra distribuidora',
          'BRANCH_ACCESS_DENIED'
        );
      }
    }

    return consignment;
  }

  /**
   * HU-05: Confirmación digital de recepción por la distribuidora
   * - Escenario 1: Conforme (status: RECEIVED)
   * - Escenario 2: Con observación / discrepancia física (status: OBSERVED)
   * Suma automáticamente las unidades efectivamente recibidas al stock vendible de la sede.
   */
  async confirmReception(id: string, user: AuthUser, input: ConfirmConsignmentInput): Promise<Consignment> {
    const consignment = await consignmentRepository.findById(id);
    if (!consignment) {
      throw AppError.notFound('El despacho solicitado no existe', 'CONSIGNMENT_NOT_FOUND');
    }

    if (consignment.status !== 'PENDING') {
      throw AppError.badRequest(
        `Este despacho ya fue procesado con anterioridad (Estado actual: ${consignment.status})`,
        'CONSIGNMENT_ALREADY_PROCESSED'
      );
    }

    // RN-05: Solo el distribuidor de la sede receptora (o el Administrador General) puede confirmar
    if (user.role === 'DISTRIBUTOR') {
      if (consignment.target_branch_id !== user.branch_id) {
        throw AppError.forbidden(
          'RN-05: Solo el personal de la sede destinataria puede confirmar la recepción de este lote',
          'BRANCH_ACCESS_DENIED'
        );
      }
    }

    // Evaluar partidas recibidas
    const itemsConfirmation: {
      productId: string;
      receivedQuantity: number;
      discrepancyNotes?: string;
    }[] = [];

    let hasDiscrepancy = false;

    for (const item of consignment.items || []) {
      const inputItem = input.items?.find((i) => i.product_id === item.product_id);
      const recQty = inputItem !== undefined ? inputItem.received_quantity : item.dispatched_quantity;
      const notes = inputItem?.discrepancy_notes;

      if (recQty !== item.dispatched_quantity || (notes && notes.trim().length > 0)) {
        hasDiscrepancy = true;
      }

      itemsConfirmation.push({
        productId: item.product_id,
        receivedQuantity: recQty,
        discrepancyNotes: notes
      });
    }

    const finalStatus = hasDiscrepancy ? 'OBSERVED' : 'RECEIVED';

    // Actualizar registro en base de datos
    const confirmed = await consignmentRepository.confirmReception({
      consignmentId: id,
      receiverUserId: user.id,
      status: finalStatus,
      notes: input.notes,
      itemsConfirmation
    });

    // Cargar ejemplares efectivamente recibidos al inventario vendible de la distribuidora (branch_stock)
    for (const item of itemsConfirmation) {
      if (item.receivedQuantity > 0) {
        await inventoryRepository.addBranchStock(
          consignment.target_branch_id,
          item.productId,
          item.receivedQuantity
        );
      }
    }

    return confirmed;
  }
}

export const consignmentService = new ConsignmentService();

