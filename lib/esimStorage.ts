// Утилиты для работы с локальным хранилищем eSIM

export interface StoredESIM {
  id: string;
  orderId: string;
  country: string;
  countryCode: string;
  packageName: string;
  dataTotal: number; // в GB
  dataUsed: number; // в GB
  daysTotal: number;
  daysRemaining: number;
  status: 'active' | 'inactive' | 'expired';
  activatedAt?: string;
  expiresAt?: string;
  iccid?: string;
  qrData?: string;
  apn?: string;
  price: number;
  currency: string;
  purchaseDate: string;
}

export interface PurchaseRecord {
  id: string;
  esimId: string;
  packageName: string;
  country: string;
  countryCode: string;
  price: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
}

const ESIMS_KEY = 'ewave_esims';
const PURCHASES_KEY = 'ewave_purchases';

// Получить все eSIM
export function getStoredESIMs(): StoredESIM[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(ESIMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading eSIMs from localStorage:', error);
    return [];
  }
}

// Сохранить eSIM
export function saveESIM(esim: StoredESIM): void {
  if (typeof window === 'undefined') return;
  
  try {
    const esims = getStoredESIMs();
    const existingIndex = esims.findIndex(e => e.id === esim.id);
    
    if (existingIndex >= 0) {
      esims[existingIndex] = esim;
    } else {
      esims.push(esim);
    }
    
    localStorage.setItem(ESIMS_KEY, JSON.stringify(esims));
  } catch (error) {
    console.error('Error saving eSIM to localStorage:', error);
  }
}

// Получить конкретную eSIM
export function getESIMById(id: string): StoredESIM | null {
  const esims = getStoredESIMs();
  return esims.find(e => e.id === id) || null;
}

// Обновить статус eSIM
export function updateESIMStatus(id: string, updates: Partial<StoredESIM>): void {
  const esims = getStoredESIMs();
  const index = esims.findIndex(e => e.id === id);
  
  if (index >= 0) {
    esims[index] = { ...esims[index], ...updates };
    localStorage.setItem(ESIMS_KEY, JSON.stringify(esims));
  }
}

// Удалить eSIM
export function deleteESIM(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const esims = getStoredESIMs();
    const filtered = esims.filter(e => e.id !== id);
    localStorage.setItem(ESIMS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting eSIM from localStorage:', error);
  }
}

// Получить все покупки
export function getStoredPurchases(): PurchaseRecord[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(PURCHASES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading purchases from localStorage:', error);
    return [];
  }
}

// Сохранить покупку
export function savePurchase(purchase: PurchaseRecord): void {
  if (typeof window === 'undefined') return;
  
  try {
    const purchases = getStoredPurchases();
    purchases.unshift(purchase); // Новые покупки в начало
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
  } catch (error) {
    console.error('Error saving purchase to localStorage:', error);
  }
}

// Очистить все данные (для тестирования)
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(ESIMS_KEY);
  localStorage.removeItem(PURCHASES_KEY);
}

// Инициализировать демо-данные (для разработки)
export function initDemoData(): void {
  if (typeof window === 'undefined') return;
  
  const demoESIMs: StoredESIM[] = [
    {
      id: 'esim-001',
      orderId: 'order-001',
      country: 'Турция',
      countryCode: 'TR',
      packageName: 'Merhaba • 3GB',
      dataTotal: 3,
      dataUsed: 1,
      daysTotal: 7,
      daysRemaining: 5,
      status: 'active',
      activatedAt: '2025-10-25T12:00:00Z',
      expiresAt: '2025-11-01T23:59:59Z',
      iccid: '8901234567890123456',
      qrData: 'LPA:1$example.com$ACTIVATION_CODE_TR',
      apn: 'internet',
      price: 850,
      currency: 'RUB',
      purchaseDate: '2025-10-25T12:00:00Z',
    },
    {
      id: 'esim-002',
      orderId: 'order-002',
      country: 'Весь мир',
      countryCode: '🌍',
      packageName: 'Global • Discover+ • 1GB',
      dataTotal: 1,
      dataUsed: 0.8,
      daysTotal: 2,
      daysRemaining: 1,
      status: 'active',
      activatedAt: '2025-10-30T15:30:00Z',
      expiresAt: '2025-11-01T23:59:59Z',
      iccid: '8901234567890123457',
      qrData: 'LPA:1$example.com$ACTIVATION_CODE_GLOBAL',
      apn: 'internet',
      price: 1200,
      currency: 'RUB',
      purchaseDate: '2025-10-30T15:30:00Z',
    },
    {
      id: 'esim-003',
      orderId: 'order-003',
      country: 'США',
      countryCode: 'US',
      packageName: 'USA • 5GB',
      dataTotal: 5,
      dataUsed: 5,
      daysTotal: 7,
      daysRemaining: 0,
      status: 'expired',
      activatedAt: '2025-10-15T10:00:00Z',
      expiresAt: '2025-10-22T23:59:59Z',
      iccid: '8901234567890123458',
      qrData: 'LPA:1$example.com$ACTIVATION_CODE_US',
      apn: 'internet',
      price: 1500,
      currency: 'RUB',
      purchaseDate: '2025-10-15T10:00:00Z',
    },
  ];
  
  const demoPurchases: PurchaseRecord[] = demoESIMs.map(esim => ({
    id: esim.orderId,
    esimId: esim.id,
    packageName: esim.packageName,
    country: esim.country,
    countryCode: esim.countryCode,
    price: esim.price,
    currency: esim.currency,
    date: esim.purchaseDate,
    status: 'completed' as const,
    paymentMethod: 'Т-Банк',
  }));
  
  localStorage.setItem(ESIMS_KEY, JSON.stringify(demoESIMs));
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(demoPurchases));
  
  console.log('✅ Demo data initialized!');
}

