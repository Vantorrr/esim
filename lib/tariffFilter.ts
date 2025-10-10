// Умная фильтрация и сортировка тарифов

interface Package {
  id: string;
  name: string;
  data: string;
  validity: number;
  price: number;
  country: string;
  priceRub?: number;
}

// Приоритетная последовательность тарифов
const PRIORITY_TARIFFS = [
  // Обычные тарифы
  { data: '1GB', validity: 7, priority: 1 },
  { data: '2GB', validity: 15, priority: 2 },
  { data: '5GB', validity: 30, priority: 3 },
  { data: '10GB', validity: 30, priority: 4 },
  { data: '50GB', validity: 30, priority: 5 },
  
  // Безлимит (unlimited)
  { data: 'unlimited', validity: 1, priority: 6 },
  { data: 'unlimited', validity: 3, priority: 7 },
  { data: 'unlimited', validity: 5, priority: 8 },
  { data: 'unlimited', validity: 7, priority: 9 },
  { data: 'unlimited', validity: 15, priority: 10 },
  { data: 'unlimited', validity: 30, priority: 11 },
];

// Нормализуем данные для сравнения
function normalizeData(data: string): string {
  const lower = data.toLowerCase();
  
  // Проверяем на безлимит
  if (lower.includes('unlimited') || lower.includes('безлимит')) {
    return 'unlimited';
  }
  
  // Извлекаем число GB/MB
  const match = data.match(/(\d+(?:\.\d+)?)\s*(GB|MB)/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    if (unit === 'GB') {
      return `${value}GB`;
    } else if (unit === 'MB') {
      return `${value / 1000}GB`;
    }
  }
  
  return data;
}

// Получаем приоритет тарифа
function getTariffPriority(pkg: Package): number {
  const normalizedData = normalizeData(pkg.data);
  
  for (const tariff of PRIORITY_TARIFFS) {
    const targetData = tariff.data === 'unlimited' ? 'unlimited' : tariff.data;
    
    if (normalizedData === targetData && pkg.validity === tariff.validity) {
      return tariff.priority;
    }
  }
  
  // Если не в приоритетном списке — низкий приоритет
  return 999;
}

// Фильтруем и сортируем тарифы
export function filterAndSortTariffs(packages: Package[], limit: number = 10): Package[] {
  // Сортируем по приоритету
  const sorted = [...packages].sort((a, b) => {
    const priorityA = getTariffPriority(a);
    const priorityB = getTariffPriority(b);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Если одинаковый приоритет — по цене (дешевле первым)
    return a.price - b.price;
  });
  
  // Берём только топ N
  return sorted.slice(0, limit);
}

// Получаем дефолтные тарифы для главной (одна популярная страна)
export function getDefaultTariffs(packages: Package[], countryCode: string = 'TH', limit: number = 10): Package[] {
  // Фильтруем по стране
  const countryPackages = packages.filter(p => p.country === countryCode);
  
  // Применяем умную фильтрацию
  return filterAndSortTariffs(countryPackages, limit);
}

