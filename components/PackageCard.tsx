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
  countryName?: string;
  coverage: string[];
  priceRub?: number;
  currencyRate?: number;
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

  // Используем цену в рублях из API (уже рассчитана по курсу ЦБ РФ)
  const priceInRub = pkg.priceRub || Math.round(pkg.price * 95);

  // Получаем флаг/иконку для региона или страны
  const getRegionIcon = () => {
    const name = pkg.name?.toLowerCase() || '';
    const isRegional = Array.isArray(pkg.coverage) && pkg.coverage.length > 3;
    
    // Определяем регион по названию
    if (/global/i.test(name)) return '🌍';
    if (/europe/i.test(name)) return '🇪🇺';
    if (/asia/i.test(name)) return '🌏';
    if (/america/i.test(name)) return '🌎';
    if (/africa/i.test(name)) return '🌍';
    if (/middle\s*east/i.test(name)) return '🕌';
    
    // Если региональный, но не определили — глобус
    if (isRegional) return '🌐';
    
    // Обычный пакет — флаг страны
    if (!pkg.country || pkg.country.length !== 2) return '🏳️';
    const codePoints = pkg.country.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getRegionName = () => {
    const name = pkg.name?.toLowerCase() || '';
    if (/global.*light/i.test(name)) return 'Global - Light';
    if (/global.*standard/i.test(name)) return 'Global - Standard';
    if (/global.*max/i.test(name)) return 'Global - Max';
    if (/global/i.test(name)) return 'Global';
    if (/europe.*usa/i.test(name)) return 'Europe + USA';
    if (/europe/i.test(name)) return 'Europe';
    if (/asia/i.test(name)) return 'Asia';
    if (/america/i.test(name)) return 'Americas';
    if (/africa/i.test(name)) return 'Africa';
    if (/middle\s*east/i.test(name)) return 'Middle East';
    
    // Если покрытие > 3 стран — показываем количество
    if (Array.isArray(pkg.coverage) && pkg.coverage.length > 3) {
      return `${pkg.coverage.length} стран`;
    }
    
    return pkg.countryName || pkg.country || 'Region';
  };

  const isRegional = Array.isArray(pkg.coverage) && pkg.coverage.length > 3;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all animate-fade-in border-2 border-transparent hover:border-primary/20">
      <div className="flex items-center justify-between">
        {/* Left: Icon/Flag + Region/Country + Data + Days */}
        <div className="flex items-center gap-3 flex-1">
          <div className="text-4xl">{getRegionIcon()}</div>
          <div className="flex flex-col gap-1">
            {isRegional && (
              <div className="text-xs font-bold text-secondary uppercase tracking-wide">
                {getRegionName()}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-text-primary flex items-center gap-1">
                <DataIcon className="w-4 h-4 text-primary" />
                {pkg.data}
              </span>
              <span className="text-text-secondary">•</span>
              <span className="font-semibold text-text-primary flex items-center gap-1">
                <ClockIcon className="w-4 h-4 text-secondary" />
                {pkg.validity} {pkg.validity === 1 ? 'день' : 'дней'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Right: Price + Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-text-primary">
              {priceInRub}₽
            </div>
          </div>
          <button
            onClick={handleBuy}
            className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg active:scale-95"
          >
            Купить
          </button>
        </div>
      </div>
    </div>
  );
}

