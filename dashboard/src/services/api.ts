import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Store {
  id: string;
  name: string;
  engine: 'medusa' | 'woocommerce';
  template?: string;
  status: 'REQUESTED' | 'PROVISIONING' | 'READY' | 'FAILED' | 'DELETING';
  url?: string;
  namespace: string;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface StoreEvent {
  id: number;
  storeId: string;
  action: 'create' | 'delete' | 'provision' | 'ready' | 'fail';
  status: string;
  message?: string;
  error?: string;
  timestamp: string;
}

export const storeApi = {
  getAll: async (): Promise<Store[]> => {
    const response = await api.get('/stores');
    return response.data;
  },

  getById: async (id: string): Promise<Store> => {
    const response = await api.get(`/stores/${id}`);
    return response.data;
  },

  create: async (data: { name: string; engine: string; template?: string }): Promise<Store> => {
    const response = await api.post('/stores', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/stores/${id}`);
  },
};

export const eventApi = {
  getByStoreId: async (storeId: string): Promise<StoreEvent[]> => {
    const response = await api.get(`/events/store/${storeId}`);
    return response.data;
  },

  getAll: async (limit?: number): Promise<StoreEvent[]> => {
    const response = await api.get('/events', { params: { limit } });
    return response.data;
  },
};
