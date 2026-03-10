
import { Order, OrderStatus } from '../types';

const API_ENDPOINT = '/api';

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
    const response = await fetch(`${API_ENDPOINT}/orders`);
    if (response.status === 401) throw new Error('AUTH_REQUIRED');
    if (!response.ok) throw new Error('Veriler alınamadı');
    return response.json();
  },

  createOrder: async (order: Order): Promise<void> => {
    const { calculatedValues, ...orderData } = order;
    const response = await fetch(`${API_ENDPOINT}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Sipariş oluşturulamadı');
    }
  },

  updateOrder: async (order: Order): Promise<void> => {
    const { calculatedValues, ...orderData } = order;
    const response = await fetch(`${API_ENDPOINT}/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Sipariş güncellenemedi');
    }
  },

  deleteOrder: async (id: string): Promise<void> => {
    const response = await fetch(`${API_ENDPOINT}/orders/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Silme işlemi başarısız');
  },

  restoreOrder: async (id: string): Promise<void> => {
    const response = await fetch(`${API_ENDPOINT}/orders/${id}/restore`, { method: 'POST' });
    if (!response.ok) throw new Error('Geri yükleme başarısız');
  },

  hardDeleteOrder: async (id: string): Promise<void> => {
    const response = await fetch(`${API_ENDPOINT}/orders/${id}/hard-delete`, { method: 'POST' });
    if (!response.ok) throw new Error('Kalıcı silme başarısız');
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<void> => {
    const response = await fetch(`${API_ENDPOINT}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Durum güncellenemedi');
  }
};
