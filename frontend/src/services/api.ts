import type { ApiResponse, Branch, LoginResponseData, Product, User } from '../types';

const API_BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('qsy_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const body = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    const errorMsg = body?.error?.message || `Error en el servidor (${response.status})`;
    const error = new Error(errorMsg);
    (error as any).code = body?.error?.code;
    (error as any).status = response.status;
    throw error;
  }

  return body.data;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<LoginResponseData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    me: () => request<User>('/auth/me')
  },
  branches: {
    list: (all = true) => request<Branch[]>(`/branches${all ? '?all=true' : ''}`),
    getById: (id: string) => request<Branch>(`/branches/${id}`),
    create: (data: Partial<Branch>) =>
      request<Branch>('/branches', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<Branch>) =>
      request<Branch>(`/branches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    getUsers: (branchId: string) => request<User[]>(`/branches/${branchId}/users`),
    createUser: (branchId: string, userData: { email: string; password: string; full_name: string; role_id?: string; observations?: string }) =>
      request<User>(`/branches/${branchId}/users`, {
        method: 'POST',
        body: JSON.stringify(userData)
      })
  },
  products: {
    list: (all = true) => request<Product[]>(`/products${all ? '?all=true' : ''}`),
    getById: (id: string) => request<Product>(`/products/${id}`),
    create: (data: Partial<Product>) =>
      request<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  }
};
