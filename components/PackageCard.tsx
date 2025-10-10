'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { hapticFeedback } from '@/lib/telegram';
import DataIcon from './icons/DataIcon';
import ClockIcon from './icons/ClockIcon';

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

interface PackageCardProps {
  package: Package;
}

export default function PackageCard({ package: pkg }: PackageCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleBuy = () => {
    hapticFeedback('medium');
    router.push(`/checkout?package=${pkg.id}`);
  };

  const handleToggle = () => {
    hapticFeedback('light');
    setIsExpanded(!isExpanded);
  };

  const discount = Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-text-primary mb-1">
              {pkg.name}
            </h3>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl font-medium flex items-center gap-1.5">
                <DataIcon className="w-4 h-4" />
                {pkg.data}
              </span>
              <span className="px-3 py-1.5 bg-secondary/10 text-secondary rounded-xl font-medium flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" />
                {pkg.validity} дней
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-text-primary">
              ${pkg.price}
            </div>
            {pkg.originalPrice && pkg.originalPrice !== pkg.price && (
              <div className="text-xs text-text-secondary line-through">
                ${pkg.originalPrice}
              </div>
            )}
          </div>
        </div>

        {/* Coverage info */}
        {isExpanded && pkg.coverage && pkg.coverage.length > 0 && (
          <div className="mb-4 p-3 bg-background rounded-xl">
            <p className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Покрытие:
            </p>
            <div className="flex flex-wrap gap-1">
              {pkg.coverage.slice(0, 10).map((country, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-white rounded-lg text-text-secondary"
                >
                  {country}
                </span>
              ))}
              {pkg.coverage.length > 10 && (
                <span className="text-xs px-2 py-1 text-text-secondary">
                  +{pkg.coverage.length - 10} ещё
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleBuy}
            className="flex-1 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Купить сейчас
          </button>
          
          {pkg.coverage && pkg.coverage.length > 0 && (
            <button
              onClick={handleToggle}
              className="px-4 py-3 bg-background text-text-primary rounded-xl hover:bg-primary/10 transition-colors"
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

