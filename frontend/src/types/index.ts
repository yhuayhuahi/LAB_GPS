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
