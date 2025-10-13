'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { hapticFeedback } from '@/lib/telegram';
import ClockIcon from './icons/ClockIcon';
import CoverageModal from './CoverageModal';
import RegionIconMap from './icons/regions/Regions';

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
  isRegionalCategory?: boolean;
  regionName?: string;
  regionNameRu?: string;
  regionIcon?: string;
  variantsCount?: number;
}

interface PackageCardProps {
  package: Package;
}

export default function PackageCard({ package: pkg }: PackageCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);

  const handleBuy = () => {
    hapticFeedback('medium');
    
    // Если это региональная категория — показываем все варианты региона
    if (pkg.isRegionalCategory && pkg.regionName) {
      const regionSlug = pkg.regionName
        .toLowerCase()
        .replace(/\s*[-–—]\s*/g, '-')  // все тире → дефис
        .replace(/\s*\+\s*/g, '-')      // плюсы → дефис
        .replace(/\s+/g, '-')           // пробелы → дефис
        .replace(/[^a-z0-9-]/g, '')     // только буквы, цифры, дефисы
        .replace(/--+/g, '-')           // множественные → один
        .replace(/^-|-$/g, '');         // убираем с краёв
      
      router.push(`/region/${regionSlug}`);
    } else {
      router.push(`/checkout?package=${pkg.id}`);
    }
  };

  const handleToggle = () => {
    hapticFeedback('light');
    setIsExpanded(!isExpanded);
  };

  // Используем цену в рублях из API (уже рассчитана по курсу ЦБ РФ)
  const priceInRub = pkg.priceRub || Math.round(pkg.price * 95);

  // Получаем флаг/иконку для региона или страны
  const getRegionIcon = () => {
    // Если это региональная категория — используем SVG-иконку
    if (pkg.isRegionalCategory && pkg.regionName) {
      const key = pkg.regionName.toLowerCase();
      const mapKey =
        /global.*light/.test(key) || /global.*standard/.test(key) || /global.*max/.test(key) || /global/.test(key)
          ? 'global'
          : /europe/.test(key)
          ? 'europe'
          : /asia/.test(key)
          ? 'asia'
          : /america/.test(key)
          ? 'americas'
          : /africa/.test(key)
          ? 'africa'
          : /middle\s*east/.test(key)
          ? 'middle-east'
          : '';
      const Icon = (RegionIconMap as any)[mapKey];
      if (Icon) return <Icon className="w-8 h-8" />;
    }
    
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
    // Если это региональная категория — используем русское название
    if (pkg.isRegionalCategory && pkg.regionNameRu) {
      return pkg.regionNameRu;
    }
    if (pkg.isRegionalCategory && pkg.regionName) {
      return pkg.regionName;
    }
    
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
    <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all animate-fade-in border border-gray-100">
      <div className="flex items-center gap-4">
        {/* Icon/Flag */}
        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
          {getRegionIcon()}
        </div>
        
        {/* Region Name + Data */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-text-primary mb-1 leading-tight whitespace-normal break-words">
            {getRegionName()}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">{pkg.data}</span>
            {Array.isArray((pkg as any).regionCoverage) && (pkg as any).regionCoverage.length > 1 ? (
              <span className="text-xs text-text-secondary">· {(pkg as any).regionCoverage.length} стран</span>
            ) : Array.isArray(pkg.coverage) && pkg.coverage.length > 1 ? (
              <span className="text-xs text-text-secondary">
                · {pkg.coverage.length} стран
              </span>
            ) : null}
          </div>
        </div>
        
        {/* Days + Price + Button */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-xs font-medium text-secondary flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5" />
            {pkg.validity} {pkg.validity === 1 ? 'день' : pkg.validity < 5 ? 'дня' : 'дней'}
          </div>
          <div className="text-2xl font-black text-text-primary">
            {priceInRub}₽
          </div>
          <div className="flex gap-2">
            {(Array.isArray((pkg as any).regionCoverage) && (pkg as any).regionCoverage.length) || (Array.isArray(pkg.coverage) && pkg.coverage.length > 3) ? (
              <button
                onClick={() => setCoverageOpen(true)}
                className="px-3 py-2 text-primary font-medium text-xs underline underline-offset-2"
              >
                Страны покрытия
              </button>
            ) : null}
            <button
            onClick={handleBuy}
            className="px-6 py-2 bg-gradient-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            {pkg.isRegionalCategory ? 'Выбрать' : 'Купить'}
          </button>
          </div>
        </div>
      </div>
      <CoverageModal
        isOpen={coverageOpen}
        onClose={() => setCoverageOpen(false)}
        coverage={(pkg as any).regionCoverage || pkg.coverage || []}
        title="Страны покрытия"
      />
    </div>
  );
}

