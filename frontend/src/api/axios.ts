import api from '../utils/axios';

interface Customer {
  id: string;
  name: string;
  phone_number: string;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  direction: 'CREDIT' | 'DEBIT';
  method: string;
  date: string;
  customer_id: string;
  recorded_by: string;
}

// Customer API functions
export const getCustomers = async () => {
  const response = await api.get('/business/customers');
  return response.data;
};

export const getCustomer = async (customerId: string) => {
  const response = await api.get(`/business/customers/${customerId}`);
  return response.data;
};

export const createCustomer = async (customerData: Partial<Customer>) => {
  const response = await api.post('/business/customers', customerData);
  return response.data;
};

// Payment API functions
export const getPayments = async (filters?: { customerId?: string; startDate?: string; endDate?: string }) => {
  const params = new URLSearchParams();
  if (filters?.customerId) params.append('customerId', filters.customerId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  
  const response = await api.get(`/business/payments?${params.toString()}`);
  return response.data;
};

export const createPayment = async (paymentData: Partial<Payment>) => {
  const response = await api.post('/business/payments', paymentData);
  return response.data;
};

// Dashboard API functions
export const getSummary = async () => {
  const response = await api.get('/business/payments/summary');
  return response.data;
};

export default {
  getCustomers,
  getCustomer,
  createCustomer,
  getPayments,
  createPayment,
  getSummary
}; 