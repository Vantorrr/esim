'use client';

import { useState, useEffect } from 'react';
import { getCountries } from '@/lib/api';
import { hapticFeedback } from '@/lib/telegram';
import { getCountryNameRu } from '@/lib/countryNames';

interface Country {
  code: string;
  name: string;
  nameRu?: string;
  flag?: string;
}

interface CountrySelectorProps {
  selectedCountry: string | null;
  onSelectCountry: (country: string | null) => void;
}

export default function CountrySelector({ selectedCountry, onSelectCountry }: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAllCountries, setShowAllCountries] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const data = await getCountries();
      // Добавляем русские названия к каждой стране
      const countriesWithRu = (data.countries || []).map(c => ({
        ...c,
        nameRu: getCountryNameRu(c.code),
      }));
      setCountries(countriesWithRu);
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter(country => {
    const searchLower = search.toLowerCase();
    return (
      country.name.toLowerCase().includes(searchLower) ||
      country.code.toLowerCase().includes(searchLower) ||
      (country.nameRu && country.nameRu.toLowerCase().includes(searchLower))
    );
  });

  const handleSelect = (countryCode: string) => {
    hapticFeedback('light');
    onSelectCountry(countryCode === selectedCountry ? null : countryCode);
  };

  const popularCountries = ['CN', 'TH', 'TR', 'AE'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center text-white shadow-lg">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary">
          Выберите страну
        </h2>
        {selectedCountry && (
          <button
            onClick={() => onSelectCountry(null)}
            className="text-sm text-secondary hover:text-secondary-dark transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск страны..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border-2 border-primary/20 focus:border-primary outline-none transition-colors text-text-primary shadow-sm"
        />
      </div>

      {/* Popular Countries */}
      {!search && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">Популярные направления</h3>
          <div className="grid grid-cols-4 gap-3">
            {popularCountries.map(code => {
              const country = countries.find(c => c.code === code);
              if (!country) return null;
              
              return (
                <button
                  key={code}
                  onClick={() => handleSelect(code)}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    selectedCountry === code
                      ? 'border-secondary bg-secondary/10 shadow-xl scale-105'
                      : 'border-primary/20 bg-white hover:border-primary/40 hover:shadow-lg'
                  }`}
                >
                  <div className="text-3xl mb-2">{country.flag || '🏳️'}</div>
                  <div className="text-xs text-text-primary font-semibold">
                    {country.nameRu || country.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* View All Countries Button */}
      {!search && !showAllCountries && (
        <button
          onClick={() => {
            hapticFeedback('medium');
            setShowAllCountries(true);
          }}
          className="w-full py-4 px-6 bg-gradient-primary text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Смотреть все страны
        </button>
      )}

      {/* All Countries Modal */}
      {(search || showAllCountries) && (
        <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-primary/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-text-primary">Все страны</h3>
            {showAllCountries && !search && (
              <button
                onClick={() => setShowAllCountries(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-text-secondary">
                Загрузка стран...
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                Страны не найдены
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCountries.map(country => (
                  <button
                    key={country.code}
                    onClick={() => {
                      handleSelect(country.code);
                      setShowAllCountries(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedCountry === country.code
                        ? 'bg-secondary/10 text-text-primary border-2 border-secondary'
                        : 'hover:bg-background text-text-secondary border-2 border-transparent'
                    }`}
                  >
                    <span className="text-2xl">{country.flag || '🏳️'}</span>
                    <span className="font-medium">{country.nameRu || country.name}</span>
                    {selectedCountry === country.code && (
                      <span className="ml-auto text-secondary">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

