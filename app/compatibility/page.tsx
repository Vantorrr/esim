'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const compatibleDevices = {
  apple: [
    'iPhone 15 Pro Max',
    'iPhone 15 Pro',
    'iPhone 15 Plus',
    'iPhone 15',
    'iPhone 14 Pro Max',
    'iPhone 14 Pro',
    'iPhone 14 Plus',
    'iPhone 14',
    'iPhone 13 Pro Max',
    'iPhone 13 Pro',
    'iPhone 13',
    'iPhone 13 mini',
    'iPhone 12 Pro Max',
    'iPhone 12 Pro',
    'iPhone 12',
    'iPhone 12 mini',
    'iPhone 11 Pro Max',
    'iPhone 11 Pro',
    'iPhone 11',
    'iPhone XS Max',
    'iPhone XS',
    'iPhone XR',
    'iPhone SE (2020)',
    'iPhone SE (2022)',
    'iPad Pro 11" (с 3-го поколения)',
    'iPad Pro 12.9" (с 3-го поколения)',
    'iPad Air (с 3-го поколения)',
    'iPad (с 7-го поколения)',
    'iPad mini (с 5-го поколения)',
  ],
  samsung: [
    'Samsung Galaxy S24 Ultra',
    'Samsung Galaxy S24+',
    'Samsung Galaxy S24',
    'Samsung Galaxy S23 Ultra',
    'Samsung Galaxy S23+',
    'Samsung Galaxy S23',
    'Samsung Galaxy S22 Ultra',
    'Samsung Galaxy S22+',
    'Samsung Galaxy S22',
    'Samsung Galaxy S21 Ultra',
    'Samsung Galaxy S21+',
    'Samsung Galaxy S21',
    'Samsung Galaxy S20 Ultra',
    'Samsung Galaxy S20+',
    'Samsung Galaxy S20',
    'Samsung Galaxy Z Fold 5',
    'Samsung Galaxy Z Fold 4',
    'Samsung Galaxy Z Fold 3',
    'Samsung Galaxy Z Flip 5',
    'Samsung Galaxy Z Flip 4',
    'Samsung Galaxy Z Flip 3',
    'Samsung Galaxy Note 20 Ultra',
    'Samsung Galaxy Note 20',
  ],
  google: [
    'Google Pixel 8 Pro',
    'Google Pixel 8',
    'Google Pixel 7 Pro',
    'Google Pixel 7',
    'Google Pixel 7a',
    'Google Pixel 6 Pro',
    'Google Pixel 6',
    'Google Pixel 6a',
    'Google Pixel 5',
    'Google Pixel 5a',
    'Google Pixel 4a',
    'Google Pixel 4',
    'Google Pixel 3a XL',
    'Google Pixel 3a',
    'Google Pixel 3 XL',
    'Google Pixel 3',
    'Google Pixel Fold',
  ],
  other: [
    'Huawei P40 Pro',
    'Huawei P40',
    'Huawei Mate 40 Pro',
    'Motorola Razr 2019',
    'Motorola Razr 5G',
    'Oppo Find X3 Pro',
    'Oppo Find X5 Pro',
    'Oppo Reno 5A',
    'Sony Xperia 10 III Lite',
    'Xiaomi 12T Pro',
    'Xiaomi 13 Pro',
  ],
};

export default function CompatibilityPage() {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState<string>('apple');
  const [search, setSearch] = useState('');

  const allDevices = Object.values(compatibleDevices).flat();
  const filteredDevices = search
    ? allDevices.filter(device =>
        device.toLowerCase().includes(search.toLowerCase())
      )
    : compatibleDevices[selectedBrand as keyof typeof compatibleDevices];

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-gradient-primary text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-4 text-white/80 hover:text-white transition-colors"
          >
            ← Назад
          </button>
          <h1 className="text-3xl font-bold mb-2">📋 Совместимость</h1>
          <p className="opacity-90">Список устройств с поддержкой eSIM</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Search */}
        <div className="bg-white rounded-2xl p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Поиск устройства..."
            className="w-full px-4 py-3 rounded-xl bg-background border-2 border-transparent focus:border-primary outline-none transition-colors text-text-primary"
          />
        </div>

        {/* Brand Tabs */}
        {!search && (
          <div className="bg-white rounded-2xl p-2 grid grid-cols-4 gap-2">
            <button
              onClick={() => setSelectedBrand('apple')}
              className={`py-3 rounded-xl font-medium transition-all ${
                selectedBrand === 'apple'
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'text-text-secondary hover:bg-background'
              }`}
            >
              🍎 Apple
            </button>
            <button
              onClick={() => setSelectedBrand('samsung')}
              className={`py-3 rounded-xl font-medium transition-all ${
                selectedBrand === 'samsung'
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'text-text-secondary hover:bg-background'
              }`}
            >
              📱 Samsung
            </button>
            <button
              onClick={() => setSelectedBrand('google')}
              className={`py-3 rounded-xl font-medium transition-all ${
                selectedBrand === 'google'
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'text-text-secondary hover:bg-background'
              }`}
            >
              🤖 Google
            </button>
            <button
              onClick={() => setSelectedBrand('other')}
              className={`py-3 rounded-xl font-medium transition-all ${
                selectedBrand === 'other'
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'text-text-secondary hover:bg-background'
              }`}
            >
              📲 Другие
            </button>
          </div>
        )}

        {/* Device List */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            {search ? 'Результаты поиска' : 'Совместимые устройства'}
          </h2>

          {filteredDevices.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">😕</div>
              <p className="text-text-secondary">Устройства не найдены</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredDevices.map((device, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-background transition-colors"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    ✓
                  </div>
                  <span className="text-text-primary">{device}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Check Compatibility */}
        <div className="bg-gradient-secondary text-white rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-3">🔍 Как проверить совместимость?</h2>
          
          <div className="space-y-3 text-sm">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-bold mb-1">iPhone</h3>
              <p className="opacity-90">
                Настройки → Основные → Об этом устройстве → Если есть "Цифровая SIM-карта", то поддерживается
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-bold mb-1">Android</h3>
              <p className="opacity-90">
                Наберите *#06# — если отображается EID, значит eSIM поддерживается
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
            <p className="text-sm">
              💡 <strong>Важно:</strong> Убедитесь, что ваше устройство не залочено оператором. Некоторые операторы блокируют возможность использования eSIM от других провайдеров.
            </p>
          </div>
        </div>

        {/* Need Help */}
        <div className="bg-white rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">❓</div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            Не уверены в совместимости?
          </h3>
          <p className="text-text-secondary mb-4">
            Свяжитесь с нами, и мы поможем проверить ваше устройство
          </p>
          <a
            href="https://t.me/support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Написать в поддержку
          </a>
        </div>
      </div>
    </main>
  );
}

