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
    const iconStyle = process.env.NEXT_PUBLIC_REGION_ICONS || 'svg';

    // SVG variant behind flag
    if (iconStyle === 'svg' && pkg.isRegionalCategory && pkg.regionName) {
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

    // Emoji for regional category (default)
    if (pkg.isRegionalCategory) {
      const name = (pkg.regionName || pkg.name || '').toLowerCase();
      if (/global/.test(name)) return '🌍';
      if (/europe/.test(name)) return '🇪🇺';
      if (/asia/.test(name)) return '🌏';
      if (/america/.test(name)) return '🌎';
      if (/africa/.test(name)) return '🌍';
      if (/middle\s*east/.test(name)) return '🕌';
      return '🌐';
    }

    // Emoji for country
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
      <div className="flex items-start gap-3">
        {/* Icon/Flag */}
        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
          {getRegionIcon()}
        </div>
        
        {/* Region Name + Data + Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-text-primary mb-1 leading-snug">
                {getRegionName()}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-primary whitespace-nowrap">{pkg.data}</span>
                {Array.isArray((pkg as any).regionCoverage) && (pkg as any).regionCoverage.length > 1 ? (
                  <span className="text-xs text-text-secondary whitespace-nowrap">· {(pkg as any).regionCoverage.length} стран</span>
                ) : Array.isArray(pkg.coverage) && pkg.coverage.length > 1 ? (
                  <span className="text-xs text-text-secondary whitespace-nowrap">
                    · {pkg.coverage.length} стран
                  </span>
                ) : null}
              </div>
            </div>
            <div className="text-xs font-medium text-secondary flex items-center gap-1 whitespace-nowrap">
              <ClockIcon className="w-3.5 h-3.5" />
              {pkg.validity} {pkg.validity === 1 ? 'день' : pkg.validity < 5 ? 'дня' : 'дней'}
            </div>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-2xl font-black text-text-primary">
                {priceInRub}₽
              </div>
              {(Array.isArray((pkg as any).regionCoverage) && (pkg as any).regionCoverage.length > 0) || (Array.isArray(pkg.coverage) && pkg.coverage.length > 3) ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCoverageOpen(true);
                  }}
                  className="text-primary font-medium text-xs underline underline-offset-2 whitespace-nowrap flex items-center gap-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {((pkg as any).regionCoverage?.length || pkg.coverage?.length || 0)} {((pkg as any).regionCoverage?.length || pkg.coverage?.length || 0) === 1 ? 'страна' : ((pkg as any).regionCoverage?.length || pkg.coverage?.length || 0) < 5 ? 'страны' : 'стран'}
                </button>
              ) : null}
            </div>
            <button
              onClick={handleBuy}
              className="w-full px-6 py-2.5 bg-gradient-primary text-white rounded-xl font-bold text-base hover:opacity-90 transition-all shadow-md active:scale-95"
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

