import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSummary = () => api.get('/payments/summary');
export const getCustomers = () => api.get('/customers');
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const createPayment = (data) => api.post('/payments', data);

export const getCustomerHistory = (id, page = 1) => api.get(`/customers/${id}/history?page=${page}`);
export const getPayments = (page = 1) => api.get(`/payments?page=${page}`);
export const deletePayment = (id) => api.delete(`/payments/${id}`);

export default api; 