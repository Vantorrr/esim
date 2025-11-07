'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';

interface Purchase {
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
  receiptUrl?: string;
}

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  useEffect(() => {
    // TODO: Загрузить историю покупок из API
    // Пока показываем демо-данные
    setTimeout(() => {
      setPurchases([
        {
          id: 'order-001',
          esimId: 'esim-001',
          packageName: 'Merhaba • 3GB',
          country: 'Турция',
          countryCode: 'TR',
          price: 850,
          currency: 'RUB',
          date: '2025-10-25T12:00:00Z',
          status: 'completed',
          paymentMethod: 'СБП (Банк 131)',
          receiptUrl: '/api/receipts/order-001.pdf',
        },
        {
          id: 'order-002',
          esimId: 'esim-002',
          packageName: 'Global • Discover+ • 1GB',
          country: 'Весь мир',
          countryCode: '🌍',
          price: 1200,
          currency: 'RUB',
          date: '2025-10-30T15:30:00Z',
          status: 'completed',
          paymentMethod: 'СБП (Банк 131)',
          receiptUrl: '/api/receipts/order-002.pdf',
        },
        {
          id: 'order-003',
          esimId: 'esim-003',
          packageName: 'USA • 5GB',
          country: 'США',
          countryCode: 'US',
          price: 1500,
          currency: 'RUB',
          date: '2025-10-15T10:00:00Z',
          status: 'completed',
          paymentMethod: 'СБП (Банк 131)',
          receiptUrl: '/api/receipts/order-003.pdf',
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const filteredPurchases = purchases.filter((purchase) => {
    if (filter === 'all') return true;
    return purchase.status === filter;
  });

  const getFlagEmoji = (code: string) => {
    if (code === '🌍') return code;
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const handleDownloadReceipt = (purchase: Purchase) => {
    // TODO: Реализовать скачивание чека
    alert(`Скачивание чека для заказа ${purchase.id}`);
  };

  const handleEmailReceipt = (purchase: Purchase) => {
    // TODO: Реализовать отправку чека на email
    alert(`Отправка чека на email для заказа ${purchase.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-primary">Загрузка истории покупок...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-primary text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Назад
          </button>
          
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">История покупок</h1>
              <p className="text-white/80">Все ваши транзакции и чеки</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Фильтры */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-text-primary border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Все ({purchases.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === 'completed'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-text-primary border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Завершённые ({purchases.filter(p => p.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === 'pending'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-text-primary border border-gray-200 hover:bg-gray-50'
            }`}
          >
            В обработке ({purchases.filter(p => p.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === 'failed'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-text-primary border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Отменённые ({purchases.filter(p => p.status === 'failed').length})
          </button>
        </div>

        {/* Список покупок */}
        {filteredPurchases.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-background rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-text-secondary" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Нет покупок
            </h2>
            <p className="text-text-secondary mb-6">
              {filter === 'all' 
                ? 'У вас пока нет покупок'
                : `Нет покупок со статусом "${filter === 'completed' ? 'Завершённые' : filter === 'pending' ? 'В обработке' : 'Отменённые'}"`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPurchases.map((purchase) => (
              <div key={purchase.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{getFlagEmoji(purchase.countryCode)}</div>
                    <div>
                      <h3 className="font-bold text-text-primary text-lg leading-tight">
                        {purchase.country}
                      </h3>
                      <p className="text-text-secondary text-sm">{purchase.packageName}</p>
                      <p className="text-text-secondary text-xs mt-1">
                        {new Date(purchase.date).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-text-primary">
                      {purchase.price} {purchase.currency === 'RUB' ? '₽' : purchase.currency}
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                      purchase.status === 'completed' ? 'bg-green-100 text-green-700' :
                      purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {purchase.status === 'completed' ? 'Завершён' : purchase.status === 'pending' ? 'В обработке' : 'Отменён'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {purchase.paymentMethod}
                  </div>
                  
                  {purchase.status === 'completed' && purchase.receiptUrl && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadReceipt(purchase)}
                        className="px-4 py-2 bg-background text-text-primary rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Скачать чек
                      </button>
                      <button
                        onClick={() => handleEmailReceipt(purchase)}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Email
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

