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

  // Конвертируем USD в RUB (курс ~95₽)
  const priceInRub = Math.round(pkg.price * 95);

  // Получаем флаг страны из ISO кода
  const getCountryFlag = (code: string) => {
    if (!code || code.length !== 2) return '🌐';
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all animate-fade-in">
      <div className="flex items-center justify-between">
        {/* Left: Flag + Data + Days */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getCountryFlag(pkg.country)}</div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-text-primary flex items-center gap-1">
                <DataIcon className="w-4 h-4 text-primary" />
                {pkg.data}
              </span>
              <span className="text-text-secondary">•</span>
              <span className="font-semibold text-text-primary flex items-center gap-1">
                <ClockIcon className="w-4 h-4 text-secondary" />
                {pkg.validity} дней
              </span>
            </div>
          </div>
        </div>
        
        {/* Right: Price + Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xl font-bold text-text-primary">
              {priceInRub}₽
            </div>
          </div>
          <button
            onClick={handleBuy}
            className="px-6 py-2.5 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md active:scale-95"
          >
            Купить
          </button>
        </div>
      </div>
    </div>
  );
}

