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

  useEffect(() => {
    // Загружаем eSIM из localStorage
    const loadESIMs = async () => {
      try {
        // Динамический импорт для избежания SSR проблем
        const { getStoredESIMs, initDemoData } = await import('@/lib/esimStorage');
        
        let storedESIMs = getStoredESIMs();
        
        // Если нет данных, инициализируем демо-данные
        if (storedESIMs.length === 0) {
          initDemoData();
          storedESIMs = getStoredESIMs();
        }
        
        setEsims(storedESIMs);
      } catch (error) {
        console.error('Error loading eSIMs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadESIMs();
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
      </div>

      <BottomNav />
    </main>
  );
}
