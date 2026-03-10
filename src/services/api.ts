
import { Order, OrderStatus } from '../types';

const API_ENDPOINT = '/api';

let tenantOverride: number | null = null;

export const setTenantOverride = (tenantId: number | null) => {
    tenantOverride = tenantId;
};

const getAuthHeaders = (): Record<string, string> => {
    const storedUser = localStorage.getItem('rol_user_session');
    if (!storedUser) return {};
    try {
        const user = JSON.parse(storedUser);
        const headers = {
            'x-user-role': user.role || '',
            'x-tenant-id': (tenantOverride !== null ? tenantOverride : (user.tenantId || 0)).toString()
        };
        console.log('Auth Headers:', headers);
        return headers;
    } catch (e) {
        return {};
    }
};

export const api = {
  getDbInfo: async (): Promise<any> => {
    const response = await fetch(`${API_ENDPOINT}/db-info`);
    return response.json();
  },

  login: async (username: string, password: string): Promise<any> => {
    const response = await fetch(`${API_ENDPOINT}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) {
        const error: any = new Error(data.error || 'Giriş yapılamadı');
        error.details = data.details;
        throw error;
    }
    return data;
  },

  logout: async (): Promise<void> => {
    // Client side session clear is enough for now
  },

  updatePassword: async (newPassword: string, userId: number): Promise<void> => {
    const response = await fetch(`${API_ENDPOINT}/update-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword, userId })
    });
    if (!response.ok) throw new Error('Şifre güncellenemedi');
  },

  checkHealth: async (): Promise<{ connected: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_ENDPOINT}/health?t=${Date.now()}`);
      if (response.ok) return { connected: true };
      const data = await response.json();
      return { connected: false, error: data.error };
    } catch (error) {
      return { connected: false, error: 'API Erişilemiyor' };
    }
  },

  uploadImage: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_ENDPOINT}/upload`, {
          method: 'POST',
          body: formData
      });

      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Resim yüklenemedi');
      }
      const data = await response.json();
      return data.url;
  },

  getOrders: async (): Promise<Order[]> => {
    const response = await fetch(`${API_ENDPOINT}/orders`, {
        headers: getAuthHeaders()
    });
    if (response.status === 401) throw new Error('AUTH_REQUIRED');
    if (!response.ok) throw new Error('Veriler alınamadı');
    return response.json();
  },

  createOrder: async (order: Order): Promise<void> => {
    const { calculatedValues, ...orderData } = order;
    await fetch(`${API_ENDPOINT}/orders`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
      },
      body: JSON.stringify(orderData)
    });
  },

  updateOrder: async (order: Order): Promise<void> => {
    const { calculatedValues, ...orderData } = order;
    await fetch(`${API_ENDPOINT}/orders/${order.id}`, {
      method: 'PUT',
      headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
      },
      body: JSON.stringify(orderData)
    });
  },

  deleteOrder: async (id: string): Promise<void> => {
    await fetch(`${API_ENDPOINT}/orders/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
    });
  },

  restoreOrder: async (id: string): Promise<void> => {
    await fetch(`${API_ENDPOINT}/orders/${id}/restore`, { 
        method: 'POST',
        headers: getAuthHeaders()
    });
  },

  hardDeleteOrder: async (id: string): Promise<void> => {
    await fetch(`${API_ENDPOINT}/orders/${id}/hard-delete`, { 
        method: 'POST',
        headers: getAuthHeaders()
    });
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<void> => {
    await fetch(`${API_ENDPOINT}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
      },
      body: JSON.stringify({ status })
    });
  },

  // Kullanıcı Yönetimi
  getUsers: async (): Promise<any[]> => {
      const response = await fetch(`${API_ENDPOINT}/admin/users`, {
          headers: getAuthHeaders()
      });
      if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Sunucu hatası (${response.status})`);
      }
      return response.json();
  },

  createUser: async (userData: any): Promise<void> => {
      const response = await fetch(`${API_ENDPOINT}/admin/users`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              ...getAuthHeaders()
          },
          body: JSON.stringify(userData)
      });
      if (!response.ok) throw new Error('Kullanıcı oluşturulamadı');
  },

  deleteUser: async (id: number): Promise<void> => {
      const response = await fetch(`${API_ENDPOINT}/admin/users/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Kullanıcı silinemedi');
  }
};
