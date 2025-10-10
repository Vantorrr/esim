'use client';

import { useState, useEffect } from 'react';
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        <span className="text-sm text-text-secondary">
          {packages.length} {packages.length === 1 ? 'тариф' : 'тарифов'}
        </span>
      </div>
      
      <div className="space-y-3">
        {packages.map(pkg => (
          <PackageCard key={pkg.id} package={pkg} />
        ))}
      </div>
    </div>
  );
}

