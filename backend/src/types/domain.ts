export type RoleName = 'ADMIN' | 'LOGISTICS' | 'DISTRIBUTOR';

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role_id: string;
  role_name?: RoleName;
  branch_id: string | null;
  branch_name?: string | null;
  observations?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: RoleName;
  branch_id: string | null;
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
  created_at: string;
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
  created_at: string;
}
