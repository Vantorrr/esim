'use client';

import { useState, useEffect, useMemo } from 'react';
import { getPackages } from '@/lib/api';
import PackageCard from './PackageCard';

interface Package {
  id: string;
  name: string;
  data: string;
  validity: number;
  price: number;
  originalPrice: number;
  country: string;
  countryName?: string;
  coverage: string[];
  priceRub?: number;
}

interface PackageListProps {
  country: string | null;
}

export default function PackageList({ country }: PackageListProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'limited' | 'unlimited'>('limited');

  useEffect(() => {
    loadPackages();
  }, [country]);

  const loadPackages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getPackages(country || undefined);
      // Сервер уже возвращает отфильтрованные и отсортированные тарифы
      setPackages(data.esims || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load packages');
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Разделяем на стандартные (ограниченные) и безлимитные
  const { limited, unlimited } = useMemo(() => {
    const isUnlimited = (p: Package) => /unlimited|безлимит/i.test(p.data || '');
    const limitedList = packages.filter(p => !isUnlimited(p));
    const unlimitedList = packages.filter(p => isUnlimited(p));
    return { limited: limitedList, unlimited: unlimitedList };
  }, [packages]);

  // Группировка по дням с сортировкой по цене
  const grouped = useMemo(() => {
    const source = tab === 'limited' ? limited : unlimited;
    const map = new Map<number, Package[]>();
    for (const p of source) {
      const v = Number(p.validity) || 0;
      if (!map.has(v)) map.set(v, []);
      map.get(v)!.push(p);
    }
    const order = tab === 'unlimited' ? [1, 3, 5, 7, 15, 30] : Array.from(map.keys()).sort((a, b) => a - b);
    const result: { validity: number; items: Package[] }[] = [];
    for (const v of order) {
      const arr = (map.get(v) || []).slice().sort((a, b) => (a.priceRub ?? a.price) - (b.priceRub ?? b.price));
      if (arr.length) result.push({ validity: v, items: arr });
    }
    return result;
  }, [limited, unlimited, tab]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Ошибка загрузки</h3>
        <p className="text-text-secondary mb-4">{error}</p>
        <button
          onClick={loadPackages}
          className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-background rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-text-secondary" viewBox="0 0 24 24" fill="none">
            <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
            <rect x="7" y="9" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          {country ? 'Пакеты не найдены' : 'Выберите страну'}
        </h3>
        <p className="text-text-secondary">
          {country 
            ? 'К сожалению, для этой страны пока нет доступных пакетов'
            : 'Выберите страну выше, чтобы увидеть доступные тарифы eSIM'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 bg-gradient-secondary rounded-xl flex items-center justify-center text-white shadow-lg">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary">
          {country ? '📱 Доступные тарифы' : '🌍 Долгосрочные пакеты'}
        </h2>
      </div>
      {country && (
        <div className="bg-white rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setTab('limited')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab==='limited' ? 'bg-primary/10 text-text-primary' : 'text-text-secondary'}`}
          >
            Стандартный
          </button>
          <button
            onClick={() => setTab('unlimited')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab==='unlimited' ? 'bg-primary/10 text-text-primary' : 'text-text-secondary'}`}
          >
            Безлимитный
          </button>
        </div>
      )}

      {country ? (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={`v-${group.validity}`} className="space-y-2">
              <div className="text-sm font-semibold text-text-secondary ml-1">
                {group.validity} {group.validity === 1 ? 'день' : group.validity < 5 ? 'дня' : 'дней'}
              </div>
              {group.items.map(pkg => (
                <PackageCard key={pkg.id} package={pkg} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map(pkg => (
            <PackageCard key={pkg.id} package={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}

