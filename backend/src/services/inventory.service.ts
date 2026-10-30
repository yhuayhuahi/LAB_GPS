import { branchRepository } from '../repositories/branch.repository';
import { inventoryRepository } from '../repositories/inventory.repository';
import { productRepository } from '../repositories/product.repository';
import { CentralStockEntryInput, NonCommercialExitInput } from '../schemas/inventory.schema';
import {
  AuthUser,
  BranchStock,
  CentralStock,
  CriticalStockAlert,
  GlobalInventoryMatrixRow,
  NonCommercialExit
} from '../types/domain';
import { AppError } from '../types/responses';

export class InventoryService {
  /**
   * Ingreso de tirajes y lotes desde imprenta al Almacén Central
   */
  async addCentralStock(input: CentralStockEntryInput): Promise<CentralStock> {
    const product = await productRepository.findById(input.product_id);
    if (!product || !product.is_active) {
      throw AppError.badRequest('El producto indicado no existe o se encuentra inactivo', 'INVALID_PRODUCT');
    }

    return inventoryRepository.upsertCentralStock(input.product_id, input.quantity);
  }

  /**
   * Listar existencias actuales del Almacén Central
   */
  async listCentralStock(): Promise<CentralStock[]> {
    return inventoryRepository.listCentralStock();
  }

  /**
   * HU-06: Consulta de stock central y en consignación por sede
   * - Administrador y Logística: Matriz de Balance Global de todas las sedes y almacén central.
   * - Distribuidor: Vista restringida exclusivamente a las existencias de su local comercial (RN-05).
   */
  async getInventoryBalance(user: AuthUser): Promise<{
    scope: 'GLOBAL' | 'BRANCH';
    matrix?: GlobalInventoryMatrixRow[];
    branchStock?: BranchStock[];
  }> {
    if (user.role === 'DISTRIBUTOR') {
      if (!user.branch_id) {
        throw AppError.forbidden('El usuario distribuidor no tiene una sede asociada', 'NO_BRANCH_ASSIGNED');
      }
      const branchStock = await inventoryRepository.listBranchStock(user.branch_id);
      return {
        scope: 'BRANCH',
        branchStock
      };
    }

    const matrix = await inventoryRepository.getGlobalInventoryMatrix();
    return {
      scope: 'GLOBAL',
      matrix
    };
  }

  /**
   * HU-07: Registro de salidas no comerciales y mermas justificadas
   * RN-07: Justificación obligatoria y trazable (muestras docentes, cortesías, promociones, mermas por daño).
   */
  async registerNonCommercialExit(input: NonCommercialExitInput, user: AuthUser): Promise<NonCommercialExit> {
    const product = await productRepository.findById(input.product_id);
    if (!product || !product.is_active) {
      throw AppError.badRequest('El producto especificado no existe o está inactivo', 'INVALID_PRODUCT');
    }

    if (input.source_type === 'CENTRAL') {
      const central = await inventoryRepository.getCentralStockByProductId(input.product_id);
      const available = central ? central.current_quantity : 0;
      if (available < input.quantity) {
        throw AppError.badRequest(
          `Existencias insuficientes en Almacén Central para registrar la baja. Disponibles: ${available}, Solicitadas: ${input.quantity}`,
          'INSUFFICIENT_STOCK'
        );
      }
      await inventoryRepository.decreaseCentralStock(input.product_id, input.quantity);
    } else {
      // source_type === 'BRANCH'
      if (!input.branch_id) {
        throw AppError.badRequest('Debe indicar la sede para registrar una baja de distribuidora', 'MISSING_BRANCH');
      }
      const branch = await branchRepository.findById(input.branch_id);
      if (!branch) {
        throw AppError.badRequest('La sede indicada no existe', 'INVALID_BRANCH');
      }

      const branchStock = await inventoryRepository.getBranchStock(input.branch_id, input.product_id);
      const available = branchStock ? branchStock.available_quantity : 0;
      if (available < input.quantity) {
        throw AppError.badRequest(
          `Existencias insuficientes en la sede "${branch.name}" para registrar la baja. Disponibles: ${available}, Solicitadas: ${input.quantity}`,
          'INSUFFICIENT_STOCK'
        );
      }
      await inventoryRepository.decreaseBranchStock(input.branch_id, input.product_id, input.quantity);
    }

    return inventoryRepository.createNonCommercialExit({
      productId: input.product_id,
      sourceType: input.source_type,
      branchId: input.branch_id,
      movementType: input.movement_type,
      quantity: input.quantity,
      justification: input.justification.trim(),
      authorizedByUserId: user.id
    });
  }

  /**
   * HU-07: Listar historial y kardex de salidas no comerciales
   */
  async listNonCommercialExits(user: AuthUser): Promise<NonCommercialExit[]> {
    if (user.role === 'DISTRIBUTOR') {
      if (!user.branch_id) return [];
      return inventoryRepository.listNonCommercialExits(user.branch_id);
    }
    return inventoryRepository.listNonCommercialExits();
  }

  /**
   * HU-08: Alertas automáticas de stock crítico por distribuidora (<= 3 unidades)
   * Administrador y Logística ven todas las alertas; Distribuidor solo de su sede (RN-05).
   */
  async getCriticalAlerts(user: AuthUser): Promise<CriticalStockAlert[]> {
    if (user.role === 'DISTRIBUTOR') {
      if (!user.branch_id) return [];
      return inventoryRepository.getCriticalStockAlerts(user.branch_id, 3);
    }
    return inventoryRepository.getCriticalStockAlerts(undefined, 3);
  }
}

export const inventoryService = new InventoryService();

