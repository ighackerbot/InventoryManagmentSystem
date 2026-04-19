import axios, { AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        const currentStoreId = localStorage.getItem('currentStoreId');
        if (currentStoreId) config.headers['x-store-id'] = currentStoreId;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('currentStoreId');
                localStorage.removeItem('guestId');
                window.location.href = '/login';
            }
            if (error.response.status === 403) {
                console.error('Access denied:', error.response.data.error);
            }
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    signup: (data: object) => api.post('/auth/signup', data),
    signin: (data: object) => api.post('/auth/signin', data),
    joinStore: (data: object) => api.post('/auth/join-store', data),
    staffLogin: (data: object) => api.post('/auth/staff-login', data),
    getMe: () => api.get('/auth/me'),
    signout: () => api.post('/auth/signout')
};

export const guestAPI = {
    start: () => api.post('/guest/start')
};

export const storesAPI = {
    getAll: () => api.get('/stores'),
    getById: (id: string) => api.get(`/stores/${id}`),
    create: (data: object) => api.post('/stores', data),
    update: (id: string, data: object) => api.put(`/stores/${id}`, data),
    delete: (id: string) => api.delete(`/stores/${id}`)
};

export const productsAPI = {
    getAll: (params?: AxiosRequestConfig['params']) => api.get('/products', { params }),
    getById: (id: string) => api.get(`/products/${id}`),
    create: (data: object) => api.post('/products', data),
    update: (id: string, data: object) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`)
};

export const salesAPI = {
    getAll: (params?: AxiosRequestConfig['params']) => api.get('/sales', { params }),
    getById: (id: string) => api.get(`/sales/${id}`),
    create: (data: object) => api.post('/sales', data),
    delete: (id: string) => api.delete(`/sales/${id}`)
};

export const purchasesAPI = {
    getAll: (params?: AxiosRequestConfig['params']) => api.get('/purchases', { params }),
    getById: (id: string) => api.get(`/purchases/${id}`),
    create: (data: object) => api.post('/purchases', data),
    delete: (id: string) => api.delete(`/purchases/${id}`)
};

export const reportsAPI = {
    getDashboard: () => api.get('/reports'),
    getStats: () => api.get('/reports/stats')
};

export const setCurrentStore = (storeId: string | null): void => {
    if (storeId) localStorage.setItem('currentStoreId', storeId);
    else localStorage.removeItem('currentStoreId');
};

export const getCurrentStore = (): string | null => {
    return localStorage.getItem('currentStoreId');
};

export default api;
