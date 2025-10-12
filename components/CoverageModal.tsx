'use client';

import { useMemo } from 'react';
import { getCountryNameRu } from '@/lib/countryNames';

interface CoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverage: string[]; // ISO codes
  title?: string;
}

export default function CoverageModal({ isOpen, onClose, coverage, title = 'Страны покрытия' }: CoverageModalProps) {
  const list = useMemo(() => {
    const unique = Array.from(new Set((coverage || []).filter(Boolean)));
    return unique
      .map(code => ({ code: code.toUpperCase(), name: getCountryNameRu(code) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [coverage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full sm:w-[560px] bg-white rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-secondary text-xl">×</button>
        </div>
        <div className="text-sm text-text-secondary mb-2">Покрытие: {list.length} стран(ы)</div>
        <div className="overflow-auto divide-y max-h-[65vh]">
          {list.map(item => {
            const codePoints = item.code.length === 2
              ? item.code.split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0))
              : [];
            const flag = codePoints.length ? String.fromCodePoint(...codePoints) : '🌐';
            return (
              <div key={item.code} className="flex items-center gap-3 py-2">
                <div className="w-7 h-7 text-lg">{flag}</div>
                <div className="flex-1">
                  <div className="text-text-primary">{item.name}</div>
                  <div className="text-xs text-text-secondary">{item.code}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


