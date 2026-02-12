import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:12000',
});

export const getStores = async () => {
    const response = await api.get('/stores');
    return response.data;
};

export const getStore = async (id: string) => {
    const response = await api.get(`/stores/${id}`);
    return response.data;
};

export const createStore = async (data: any) => {
    const response = await api.post('/stores', data);
    return response.data;
};

export const deleteStore = async (id: string) => {
    const response = await api.delete(`/stores/${id}`);
    return response.data;
};
