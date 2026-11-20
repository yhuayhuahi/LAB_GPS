export type RoleName = 'ADMIN' | 'LOGISTICS' | 'DISTRIBUTOR';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: RoleName;
  branch_id: string | null;
  branch_name?: string | null;
  observations?: string | null;
  is_active?: boolean;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  phone?: string | null;
  manager_name?: string | null;
  observations?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  code: string;
  category_code: 'QSY' | 'PK' | 'KUSI';
  title: string;
  education_level: string;
  isbn?: string | null;
  public_price: number;
  fixed_commission: number;
  observations?: string | null;
  is_active: boolean;
  created_at?: string;
}

// ==============================================================================
// TIPOS DE SPRINT 2: INVENTARIO, DESPACHOS Y ALERTAS
// ==============================================================================

export interface CentralStock {
  id: string;
  product_id: string;
  product_title?: string;
  product_code?: string;
  current_quantity: number;
  min_critical_stock: number;
  updated_at: string;
}

export interface BranchStock {
  id: string;
  branch_id: string;
  branch_name?: string;
  branch_code?: string;
  product_id: string;
  product_title?: string;
  product_code?: string;
  received_quantity: number;
  sold_quantity: number;
  available_quantity: number;
  updated_at: string;
}

export type ConsignmentStatus = 'PENDING' | 'RECEIVED' | 'OBSERVED';

export interface ConsignmentItem {
  id: string;
  consignment_id: string;
  product_id: string;
  product_title?: string;
  product_code?: string;
  dispatched_quantity: number;
  received_quantity: number;
  discrepancy_notes?: string | null;
}

export interface Consignment {
  id: string;
  dispatch_code: string;
  target_branch_id: string;
  target_branch_name?: string;
  dispatcher_user_id: string;
  dispatcher_name?: string;
  receiver_user_id?: string | null;
  receiver_name?: string | null;
  status: ConsignmentStatus;
  notes?: string | null;
  created_at: string;
  received_at?: string | null;
  items?: ConsignmentItem[];
}

export type NonCommercialExitType =
  | 'MUESTRA_DOCENTE'
  | 'CORTESIA'
  | 'PROMOCION'
  | 'SORTEO'
  | 'MERMA_DANO'
  | 'AJUSTE';

export interface NonCommercialExit {
  id: string;
  product_id: string;
  product_title?: string;
  product_code?: string;
  source_type: 'CENTRAL' | 'BRANCH';
  branch_id?: string | null;
  branch_name?: string | null;
  movement_type: NonCommercialExitType;
  quantity: number;
  justification: string;
  authorized_by_user_id: string;
  authorized_by_name?: string;
  created_at: string;
}

export interface CriticalStockAlert {
  product_id: string;
  product_title: string;
  product_code: string;
  scope: 'CENTRAL' | 'BRANCH';
  branch_id?: string | null;
  branch_name?: string | null;
  available_quantity: number;
  threshold: number;
  is_critical: boolean;
}

export interface GlobalInventoryMatrixRow {
  product_id: string;
  product_code: string;
  product_title: string;
  education_level: string;
  public_price: number;
  central_stock: number;
  in_transit_stock: number;
  branches_stock: {
    branch_id: string;
    branch_code: string;
    branch_name: string;
    available_quantity: number;
    received_quantity: number;
    sold_quantity: number;
    is_critical: boolean;
  }[];
  total_available: number;
  is_central_critical: boolean;
}

export interface InventoryBalanceResponse {
  scope: 'GLOBAL' | 'BRANCH';
  matrix?: GlobalInventoryMatrixRow[];
  branchStock?: BranchStock[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface LoginResponseData {
  token: string;
  user: User;
}

export type PaymentMethod = 'EFECTIVO' | 'YAPE';
export interface SaleItem { id: string; product_id: string; product_title?: string; quantity: number; unit_price: number; subtotal: number; }
export interface Sale { id: string; client_sale_uuid: string; customer_dni: string; customer_name: string; payment_method: PaymentMethod; total_amount: number; status: 'CONFIRMED' | 'ANNULLED'; is_offline_sync: boolean; created_at: string; items: SaleItem[]; }

// ==============================================================================
// SPRINT 4: REABASTECIMIENTO (HU-13 / HU-14) Y NOTIFICACIONES
// ==============================================================================
export type ReplenishmentStatus = 'PENDING' | 'COMPLETED';

export interface ReplenishmentItemInsight {
  central_available: number;
  delivered_total: number;
  sold_total: number;
  other_exits: number;
  current_balance: number;
}

export interface ReplenishmentItem {
  id: string;
  request_id: string;
  product_id: string;
  product_title?: string;
  product_code?: string;
  requested_quantity: number;
  delivered_quantity: number;
  insight?: ReplenishmentItemInsight;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_title?: string;
  movement_type: 'REPLENISHMENT_OUT' | 'REPLENISHMENT_IN';
  location_type: 'CENTRAL' | 'BRANCH';
  branch_name?: string | null;
  quantity: number;
  performed_by_name?: string;
  created_at: string;
}

export interface ReplenishmentRequest {
  id: string;
  request_code: string;
  branch_id: string;
  branch_name?: string;
  requested_by_name?: string;
  status: ReplenishmentStatus;
  notes?: string | null;
  created_at: string;
  completed_at?: string | null;
  completed_by_name?: string | null;
  items: ReplenishmentItem[];
  movements?: InventoryMovement[];
}

export interface AppNotification {
  id: string;
  type: 'REPLENISHMENT_REQUESTED' | 'REPLENISHMENT_COMPLETED';
  title: string;
  message: string;
  replenishment_request_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  unread: number;
  notifications: AppNotification[];
}

// ==============================================================================
// SPRINT 4 (cont.): LIQUIDACIONES Y COBRANZAS (HU-15 / HU-16)
// ==============================================================================
export type LiquidationStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type CollectionMethod = 'CASH' | 'VOUCHER' | 'TRANSFER';

export interface LiquidationItem {
  id?: string;
  product_id: string;
  code_snapshot: string;
  title_snapshot: string;
  quantity: number;
  unit_price: number;
  unit_commission: number;
  gross_subtotal: number;
  commission_subtotal: number;
}

export interface LiquidationPayment {
  id: string;
  amount: number;
  payment_method: CollectionMethod;
  payment_date: string;
  evidence?: string | null;
  registered_by_name?: string;
  created_at: string;
}

export interface LiquidationPreview {
  branch_id: string;
  branch_name: string;
  period_start: string;
  period_end: string;
  sales_count: number;
  already_liquidated_sales: number;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  due_date: string;
  details: LiquidationItem[];
}

export interface Liquidation {
  id: string;
  liquidation_code: string;
  branch_id: string;
  branch_name?: string;
  period_start: string;
  period_end: string;
  sales_count: number;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  paid_amount: number;
  pending_amount: number;
  status: LiquidationStatus;
  due_date: string;
  is_overdue: boolean;
  notes?: string | null;
  created_by_name?: string;
  created_at: string;
  details?: LiquidationItem[];
  payments?: LiquidationPayment[];
}

export interface BranchDebtSummary {
  branch_id: string;
  branch_name: string;
  liquidations_count: number;
  open_liquidations: number;
  overdue_liquidations: number;
  net_total: number;
  paid_total: number;
  pending_total: number;
  overdue_pending: number;
}

export interface DebtsOverview {
  total_to_collect: number;
  total_collected: number;
  total_overdue: number;
  branches: BranchDebtSummary[];
}

export interface LiquidationFilters {
  branch_id?: string;
  status?: string;
  from?: string;
  to?: string;
  overdue?: boolean;
}
