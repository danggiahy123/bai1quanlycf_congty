import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getTopItems: () => api.get('/dashboard/top-items'),
};

// Menu API
export const menuAPI = {
  getAll: () => api.get('/menu'),
  create: (data: any) => api.post('/menu', data),
  update: (id: string, data: any) => api.put(`/menu/${id}`, data),
  delete: (id: string) => api.delete(`/menu/${id}`),
};

// Tables API
export const tablesAPI = {
  getAll: () => api.get('/tables'),
  create: (data: any) => api.post('/tables', data),
  update: (id: string, data: any) => api.put(`/tables/${id}`, data),
  delete: (id: string) => api.delete(`/tables/${id}`),
};

// Orders API
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  create: (data: any) => api.post('/orders', data),
  update: (id: string, data: any) => api.put(`/orders/${id}`, data),
  delete: (id: string) => api.delete(`/orders/${id}`),
};

// Customers API
export const customersAPI = {
  getAll: () => api.get('/customers'),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// Employees API
export const employeesAPI = {
  getAll: () => api.get('/employees'),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
};

export default api;
