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
        <div className="text-6xl mb-4">😕</div>
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
        <div className="text-6xl mb-4">📱</div>
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
        <h2 className="text-2xl font-bold text-text-primary">
          📦 Доступные тарифы
        </h2>
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

