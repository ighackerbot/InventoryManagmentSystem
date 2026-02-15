import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add JWT token and store ID
api.interceptors.request.use(
    (config) => {
        // Add JWT token if it exists
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add store ID if it exists (for multi-tenant requests)
        const currentStoreId = localStorage.getItem('currentStoreId');
        if (currentStoreId) {
            config.headers['x-store-id'] = currentStoreId;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Handle 401 Unauthorized - token expired or invalid
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('currentStoreId');
                window.location.href = '/login';
            }

            // Handle 403 Forbidden - insufficient permissions or no store access
            if (error.response.status === 403) {
                console.error('Access denied:', error.response.data.error);
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    signin: (data) => api.post('/auth/signin', data),
    joinStore: (data) => api.post('/auth/join-store', data),
    staffLogin: (data) => api.post('/auth/staff-login', data),
    getMe: () => api.get('/auth/me'),
    signout: () => api.post('/auth/signout')
};

// Stores API
export const storesAPI = {
    getAll: () => api.get('/stores'),
    getById: (id) => api.get(`/stores/${id}`),
    create: (data) => api.post('/stores', data),
    update: (id, data) => api.put(`/stores/${id}`, data),
    delete: (id) => api.delete(`/stores/${id}`)
};

// Products API
export const productsAPI = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`)
};

// Sales API
export const salesAPI = {
    getAll: (params) => api.get('/sales', { params }),
    getById: (id) => api.get(`/sales/${id}`),
    create: (data) => api.post('/sales', data),
    delete: (id) => api.delete(`/sales/${id}`)
};

// Purchases API
export const purchasesAPI = {
    getAll: (params) => api.get('/purchases', { params }),
    getById: (id) => api.get(`/purchases/${id}`),
    create: (data) => api.post('/purchases', data),
    delete: (id) => api.delete(`/purchases/${id}`)
};

// Reports API
export const reportsAPI = {
    getDashboard: () => api.get('/reports'),
    getStats: () => api.get('/reports/stats')
};

// Helper to set current store
export const setCurrentStore = (storeId) => {
    if (storeId) {
        localStorage.setItem('currentStoreId', storeId);
    } else {
        localStorage.removeItem('currentStoreId');
    }
};

// Helper to get current store
export const getCurrentStore = () => {
    return localStorage.getItem('currentStoreId');
};

export default api;
