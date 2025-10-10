'use client';

import { useState, useEffect } from 'react';
import { getCountries } from '@/lib/api';
import { hapticFeedback } from '@/lib/telegram';

interface Country {
  code: string;
  name: string;
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

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const data = await getCountries();
      setCountries(data.countries || []);
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (countryCode: string) => {
    hapticFeedback('light');
    onSelectCountry(countryCode === selectedCountry ? null : countryCode);
  };

  const popularCountries = ['US', 'GB', 'FR', 'DE', 'IT', 'ES', 'TH', 'JP'];

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
          <div className="grid grid-cols-4 gap-2">
            {popularCountries.map(code => {
              const country = countries.find(c => c.code === code);
              if (!country) return null;
              
              return (
                <button
                  key={code}
                  onClick={() => handleSelect(code)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedCountry === code
                      ? 'border-secondary bg-secondary/10 shadow-lg'
                      : 'border-primary/20 bg-white hover:border-primary/40'
                  }`}
                >
                  <div className="text-2xl mb-1">{country.flag || '🏳️'}</div>
                  <div className="text-xs text-text-primary font-medium truncate">
                    {country.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All Countries */}
      {(search || !selectedCountry) && (
        <div className="bg-white rounded-2xl p-4 max-h-64 overflow-y-auto">
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
                  onClick={() => handleSelect(country.code)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    selectedCountry === country.code
                      ? 'bg-secondary/10 text-text-primary'
                      : 'hover:bg-background text-text-secondary'
                  }`}
                >
                  <span className="text-2xl">{country.flag || '🏳️'}</span>
                  <span className="font-medium">{country.name}</span>
                  {selectedCountry === country.code && (
                    <span className="ml-auto text-secondary">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

