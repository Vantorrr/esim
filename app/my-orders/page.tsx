'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';

interface Order {
  id: string;
  packageName: string;
  country: string;
  status: string;
  date: string;
  price: number;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Загрузить заказы пользователя из API
    // Пока показываем заглушку
    setTimeout(() => {
      setOrders([
        // Пример данных
        // {
        //   id: '123',
        //   packageName: 'USA 5GB',
        //   country: 'United States',
        //   status: 'active',
        //   date: '2025-01-15',
        //   price: 15.99,
        // },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-primary">Загрузка заказов...</p>
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
            className="mb-4 text-white/80 hover:text-white transition-colors"
          >
            ← Назад
          </button>
          <h1 className="text-3xl font-bold mb-2">📦 Мои заказы</h1>
          <p className="opacity-90">История ваших покупок eSIM</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              У вас пока нет заказов
            </h2>
            <p className="text-text-secondary mb-6">
              Выберите страну и купите свой первый eSIM для путешествий!
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Выбрать тариф
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-1">
                      {order.packageName}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      🌍 {order.country}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      📅 {new Date(order.date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-text-primary">
                      ${order.price}
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                        order.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {order.status === 'active' ? 'Активен' : 'Истёк'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/success?order_id=${order.id}`)}
                  className="w-full py-3 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors"
                >
                  Посмотреть QR-код
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

