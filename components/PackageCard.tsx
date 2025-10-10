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
    <div className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all animate-fade-in border border-gray-100 hover:border-primary/40">
      {/* Region/Country Name + Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
            {getRegionIcon()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-0.5">
              {getRegionName()}
            </h3>
            {isRegional && pkg.coverage && pkg.coverage.length > 0 && (
              <p className="text-xs text-text-secondary font-medium">
                {pkg.coverage.length} {pkg.coverage.length === 1 ? 'страна' : pkg.coverage.length < 5 ? 'страны' : 'стран'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Data + Days + Price + Button */}
      <div className="flex items-center justify-between">
        {/* Left: Data + Days */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 bg-gradient-to-r from-primary/15 to-primary/5 rounded-xl">
              <div className="flex items-center gap-1.5">
                <DataIcon className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary text-base">{pkg.data}</span>
              </div>
            </div>
            <div className="px-3 py-2 bg-gradient-to-r from-secondary/15 to-secondary/5 rounded-xl">
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-secondary" />
                <span className="font-bold text-secondary text-base">
                  {pkg.validity} {pkg.validity === 1 ? 'д' : 'д'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: Price + Button */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-black text-text-primary">
              {priceInRub}<span className="text-2xl">₽</span>
            </div>
          </div>
          <button
            onClick={handleBuy}
            className="px-7 py-3.5 bg-gradient-primary text-white rounded-2xl font-bold text-base hover:opacity-90 transition-all shadow-lg hover:shadow-xl active:scale-95 whitespace-nowrap"
          >
            Купить
          </button>
        </div>
      </div>
    </div>
  );
}

