'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import ESIMCard from '@/components/ESIMCard';

interface ESIMData {
  id: string;
  country: string;
  countryCode: string;
  packageName: string;
  dataTotal: number;
  dataUsed: number;
  daysTotal: number;
  daysRemaining: number;
  status: 'active' | 'inactive' | 'expired';
  activatedAt?: string;
  expiresAt?: string;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [esims, setEsims] = useState<ESIMData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [activeTab, setActiveTab] = useState<'esims' | 'history'>('esims');
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    // Загружаем eSIM и историю покупок из localStorage
    const loadData = async () => {
      try {
        // Динамический импорт для избежания SSR проблем
        const { getStoredESIMs, getStoredPurchases, initDemoData } = await import('@/lib/esimStorage');
        
        let storedESIMs = getStoredESIMs();
        let storedPurchases = getStoredPurchases();
        
        // Если нет данных, инициализируем демо-данные
        if (storedESIMs.length === 0) {
          initDemoData();
          storedESIMs = getStoredESIMs();
          storedPurchases = getStoredPurchases();
        }
        
        setEsims(storedESIMs);
        setPurchases(storedPurchases);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const filteredEsims = esims.filter((esim) => {
    if (filter === 'all') return true;
    return esim.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-primary">Загрузка ваших eSIM...</p>
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
                <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Мои eSIM</h1>
              <p className="text-white/80">Управление вашими eSIM-картами</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Вкладки: Активные eSIM / История покупок */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('esims')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-base transition-all ${
              activeTab === 'esims'
                ? 'bg-gradient-primary text-white shadow-lg'
                : 'bg-white text-text-secondary border-2 border-gray-200 hover:border-primary/30'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Активные eSIM
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-base transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-primary text-white shadow-lg'
                : 'bg-white text-text-secondary border-2 border-gray-200 hover:border-primary/30'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
              </svg>
              История покупок
            </div>
          </button>
        </div>

        {/* Контент для вкладки "Активные eSIM" */}
        {activeTab === 'esims' && (
          <>
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
            Все ({esims.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === 'active'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-text-primary border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Активные ({esims.filter(e => e.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === 'inactive'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-text-primary border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Неактивные ({esims.filter(e => e.status === 'inactive').length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === 'expired'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-text-primary border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Истёкшие ({esims.filter(e => e.status === 'expired').length})
          </button>
        </div>

        {filteredEsims.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-background rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-text-secondary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {filter === 'all' ? 'У вас пока нет eSIM' : `Нет eSIM со статусом "${filter === 'active' ? 'Активные' : filter === 'inactive' ? 'Неактивные' : 'Истёкшие'}"`}
            </h2>
            <p className="text-text-secondary mb-6">
              {filter === 'all' 
                ? 'Выберите страну и купите свой первый eSIM для путешествий!'
                : 'Попробуйте изменить фильтр или купите новый eSIM'
              }
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md"
            >
              Выбрать eSIM
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEsims.map((esim) => (
              <ESIMCard key={esim.id} {...esim} />
            ))}
          </div>
        )}
          </>
        )}

        {/* Контент для вкладки "История покупок" */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {purchases.length === 0 ? (
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
                  У вас пока нет истории покупок
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md"
                >
                  Купить первый eSIM
                </button>
              </div>
            ) : (
              purchases.map((purchase) => {
                const getFlagEmoji = (code: string) => {
                  if (code === '🌍') return code;
                  const codePoints = code
                    .toUpperCase()
                    .split('')
                    .map(char => 127397 + char.charCodeAt(0));
                  return String.fromCodePoint(...codePoints);
                };

                return (
                  <div key={purchase.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
                      
                      {purchase.status === 'completed' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => alert('Скачивание чека...')}
                            className="px-4 py-2 bg-background text-text-primary rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Чек
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
