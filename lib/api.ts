import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Countries
export const getCountries = async () => {
  const response = await api.get('/esim/countries');
  return response.data;
};

// Packages
export const getPackages = async (country?: string) => {
  const response = await api.get('/esim/packages', {
    params: { country },
  });
  return response.data;
};

export const getPackageDetails = async (id: string) => {
  const response = await api.get(`/esim/packages/${id}`);
  return response.data;
};

// Orders
export const createOrder = async (packageId: string) => {
  const response = await api.post('/esim/orders', { packageId, quantity: 1 });
  return response.data;
};

export const getOrder = async (orderId: string) => {
  const response = await api.get(`/esim/orders/${orderId}`);
  return response.data;
};

export const getOrderQR = async (orderId: string) => {
  const response = await api.get(`/esim/orders/${orderId}/qr`);
  return response.data;
};

// Payment
export const createPayment131SBP = async (payload: {
  amount: number | string;
  currency?: string;
  orderId?: string;
  description?: string;
  successUrl?: string;
  failUrl?: string;
  metadata?: Record<string, any>;
  customer?: Record<string, any>;
  extra?: Record<string, any>;
}) => {
  const response = await api.post('/payments/131/sbp/create-payment', payload);
  return response.data;
};

export const getPayment131SBPStatus = async (orderId: string) => {
  const response = await api.get(`/payments/131/sbp/orders/${orderId}`);
  return response.data;
};

