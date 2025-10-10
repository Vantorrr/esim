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
export const createStripeSession = async (packageData: {
  packageId: string;
  packageName: string;
  price: number;
  currency?: string;
}) => {
  const response = await api.post('/payment/stripe/create-session', packageData);
  return response.data;
};

export const createYooKassaPayment = async (packageData: {
  packageId: string;
  packageName: string;
  price: number;
  currency?: string;
}) => {
  const response = await api.post('/payment/yookassa/create-payment', packageData);
  return response.data;
};

// Tinkoff (T-Bank)
export const createTinkoffPayment = async (packageData: {
  packageId: string;
  packageName: string;
  price: number;
  email?: string;
}) => {
  const response = await api.post('/tinkoff/create-payment', packageData);
  return response.data;
};

export const getTinkoffPaymentStatus = async (paymentId: string) => {
  const response = await api.get(`/tinkoff/payment/${paymentId}`);
  return response.data;
};

