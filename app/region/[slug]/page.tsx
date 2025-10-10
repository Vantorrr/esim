'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPackages } from '@/lib/api';
import { showBackButton, hideBackButton } from '@/lib/telegram';
import PackageCard from '@/components/PackageCard';

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

export default function RegionPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionName, setRegionName] = useState('');

  useEffect(() => {
    showBackButton(() => {
      router.push('/');
    });

    loadRegionPackages();

    return () => {
      hideBackButton();
    };
  }, [slug]);

  const loadRegionPackages = async () => {
    try {
      setLoading(true);
      
      // Конвертируем slug обратно в название региона
      const regionNameFromSlug = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      setRegionName(regionNameFromSlug);
      
      // Запрашиваем пакеты региона (относительный URL)
      const url = `/api/esim/packages?region=${slug}`;
      console.log('[Region Page] Fetching:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('[Region Page] API error:', response.status);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[Region Page] Received:', data.esims?.length || 0, 'packages');
      setPackages(data.esims || []);
    } catch (error) {
      console.error('Failed to load region packages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{regionName}</h1>
          <p className="opacity-90">Выберите тариф для вашей поездки</p>
        </div>
      </div>

      {/* Packages List */}
      <section className="py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-text-secondary">Тарифы не найдены</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-secondary rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-text-primary">
                  Доступные тарифы
                </h2>
              </div>
              {packages.map(pkg => (
                <PackageCard key={pkg.id} package={pkg} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

