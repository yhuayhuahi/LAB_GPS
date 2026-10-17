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
