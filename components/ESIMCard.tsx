'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ESIMCardProps {
  id: string;
  country: string;
  countryCode: string;
  packageName: string;
  dataTotal: number; // в GB
  dataUsed: number; // в GB
  daysTotal: number;
  daysRemaining: number;
  status: 'active' | 'inactive' | 'expired';
  activatedAt?: string;
  expiresAt?: string;
}

export default function ESIMCard({
  id,
  country,
  countryCode,
  packageName,
  dataTotal,
  dataUsed,
  daysTotal,
  daysRemaining,
  status,
  activatedAt,
  expiresAt,
}: ESIMCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const dataRemaining = Math.max(0, dataTotal - dataUsed);
  const dataPercentage = Math.min(100, (dataRemaining / dataTotal) * 100);
  const daysPercentage = Math.min(100, (daysRemaining / daysTotal) * 100);

  // Цвет прогресс-бара в зависимости от остатка
  const getProgressColor = (percentage: number) => {
    if (percentage > 50) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (percentage > 20) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  // Статус бейдж
  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Активна
          </span>
        );
      case 'inactive':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            Неактивна
          </span>
        );
      case 'expired':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Истекла
          </span>
        );
    }
  };

  // Флаг страны (эмодзи)
  const getFlagEmoji = (code: string) => {
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      {/* Заголовок карточки */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{getFlagEmoji(countryCode)}</div>
            <div>
              <h3 className="font-bold text-text-primary text-lg leading-tight">
                {country}
              </h3>
              <p className="text-text-secondary text-sm">{packageName}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Прогресс-бары */}
        <div className="space-y-4">
          {/* Трафик */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="text-text-secondary">Трафик</span>
              </div>
              <span className="font-bold text-text-primary">
                {dataRemaining.toFixed(1)} GB
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(dataPercentage)}`}
                style={{ width: `${dataPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {dataUsed.toFixed(1)} GB использовано из {dataTotal} GB
            </p>
          </div>

          {/* Дни */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="text-text-secondary">Срок действия</span>
              </div>
              <span className="font-bold text-text-primary">
                {daysRemaining} {daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(daysPercentage)}`}
                style={{ width: `${daysPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {daysTotal - daysRemaining} из {daysTotal} дней прошло
            </p>
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={() => router.push(`/my-esim/${id}`)}
          className="flex-1 px-4 py-3 bg-background text-text-primary rounded-xl font-medium hover:bg-gray-100 transition-colors"
        >
          Подробнее
        </button>
        {status === 'active' && (
          <button
            onClick={() => router.push(`/topup/${id}`)}
            className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md"
          >
            Пополнить
          </button>
        )}
      </div>

      {/* Дополнительная информация (раскрывающаяся) */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-2 text-sm animate-fade-in">
          {activatedAt && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Активирована:</span>
              <span className="text-text-primary font-medium">
                {new Date(activatedAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          )}
          {expiresAt && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Истекает:</span>
              <span className="text-text-primary font-medium">
                {new Date(expiresAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-secondary">ID:</span>
            <span className="text-text-primary font-mono text-xs">{id}</span>
          </div>
        </div>
      )}
    </div>
  );
}

