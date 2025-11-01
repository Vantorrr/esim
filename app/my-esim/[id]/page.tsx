'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import QRCode from 'qrcode';

interface ESIMDetails {
  id: string;
  country: string;
  countryCode: string;
  packageName: string;
  dataTotal: number;
  dataUsed: number;
  daysTotal: number;
  daysRemaining: number;
  status: 'active' | 'inactive' | 'expired';
  activatedAt?: string;
  expiresAt?: string;
  iccid: string;
  qrData: string;
  apn?: string;
}

export default function ESIMDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [esim, setEsim] = useState<ESIMDetails | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // TODO: Загрузить детали eSIM из API
    // Пока показываем демо-данные
    setTimeout(async () => {
      const demoData: ESIMDetails = {
        id: params.id as string,
        country: 'Турция',
        countryCode: 'TR',
        packageName: 'Merhaba • 3GB',
        dataTotal: 3,
        dataUsed: 2,
        daysTotal: 7,
        daysRemaining: 5,
        status: 'active',
        activatedAt: '2025-10-25T12:00:00Z',
        expiresAt: '2025-11-01T23:59:59Z',
        iccid: '8901234567890123456',
        qrData: 'LPA:1$example.com$ACTIVATION_CODE',
        apn: 'internet',
      };

      setEsim(demoData);

      // Генерируем QR-код
      try {
        const qrUrl = await QRCode.toDataURL(demoData.qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeUrl(qrUrl);
      } catch (err) {
        console.error('Ошибка генерации QR-кода:', err);
      }

      setLoading(false);
    }, 800);
  }, [params.id]);

  if (loading || !esim) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-primary">Загрузка данных eSIM...</p>
        </div>
      </div>
    );
  }

  const dataRemaining = Math.max(0, esim.dataTotal - esim.dataUsed);
  const dataPercentage = Math.min(100, (dataRemaining / esim.dataTotal) * 100);
  const daysPercentage = Math.min(100, (esim.daysRemaining / esim.daysTotal) * 100);

  const getProgressColor = (percentage: number) => {
    if (percentage > 50) return 'from-green-400 to-green-500';
    if (percentage > 20) return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
  };

  const getFlagEmoji = (code: string) => {
    if (code === '🌍') return code;
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-primary text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Назад
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-5xl">{getFlagEmoji(esim.countryCode)}</div>
            <div>
              <h1 className="text-3xl font-bold mb-1">{esim.country}</h1>
              <p className="text-white/80">{esim.packageName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Статус и прогресс */}
        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary">Статус пакета</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
              esim.status === 'active' ? 'bg-green-100 text-green-700' :
              esim.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
              'bg-red-100 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                esim.status === 'active' ? 'bg-green-500 animate-pulse' :
                esim.status === 'inactive' ? 'bg-gray-400' :
                'bg-red-500'
              }`}></span>
              {esim.status === 'active' ? 'Активна' : esim.status === 'inactive' ? 'Неактивна' : 'Истекла'}
            </span>
          </div>

          {/* Трафик */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="text-text-secondary font-medium">Трафик</span>
              </div>
              <span className="text-2xl font-bold text-text-primary">
                {dataRemaining.toFixed(1)} GB
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 bg-gradient-to-r ${getProgressColor(dataPercentage)}`}
                style={{ width: `${dataPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-text-secondary mt-2">
              {esim.dataUsed.toFixed(1)} GB использовано из {esim.dataTotal} GB
            </p>
          </div>

          {/* Дни */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="text-text-secondary font-medium">Срок действия</span>
              </div>
              <span className="text-2xl font-bold text-text-primary">
                {esim.daysRemaining} {esim.daysRemaining === 1 ? 'день' : esim.daysRemaining < 5 ? 'дня' : 'дней'}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 bg-gradient-to-r ${getProgressColor(daysPercentage)}`}
                style={{ width: `${daysPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-text-secondary mt-2">
              {esim.daysTotal - esim.daysRemaining} из {esim.daysTotal} дней прошло
            </p>
          </div>

          {/* Даты */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            {esim.activatedAt && (
              <div>
                <p className="text-text-secondary text-sm mb-1">Активирована</p>
                <p className="text-text-primary font-medium">
                  {new Date(esim.activatedAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
            {esim.expiresAt && (
              <div>
                <p className="text-text-secondary text-sm mb-1">Истекает</p>
                <p className="text-text-primary font-medium">
                  {new Date(esim.expiresAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* QR-код */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">QR-код для установки</h2>
          
          {!showQR ? (
            <button
              onClick={() => setShowQR(true)}
              className="w-full py-4 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Показать QR-код
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl border-2 border-gray-100 flex items-center justify-center">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR-код eSIM" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-text-secondary text-sm">Генерация QR-кода...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <strong>Как установить:</strong><br/>
                  1. Откройте Настройки → Сотовая связь<br/>
                  2. Нажмите "Добавить eSIM"<br/>
                  3. Отсканируйте этот QR-код<br/>
                  4. Следуйте инструкциям на экране
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Технические детали */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">Технические детали</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-text-secondary">ICCID</span>
              <span className="text-text-primary font-mono text-sm">{esim.iccid}</span>
            </div>
            {esim.apn && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-text-secondary">APN</span>
                <span className="text-text-primary font-medium">{esim.apn}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-text-secondary">ID пакета</span>
              <span className="text-text-primary font-mono text-sm">{esim.id}</span>
            </div>
          </div>
        </div>

        {/* Кнопка пополнения */}
        {esim.status === 'active' && (
          <button
            onClick={() => router.push(`/topup/${esim.id}`)}
            className="w-full py-4 bg-gradient-primary text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            💰 Пополнить пакет
          </button>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

