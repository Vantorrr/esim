'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getTelegramUser } from '@/lib/telegram';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<'ru' | 'en'>('ru');

  useEffect(() => {
    const tgUser = getTelegramUser();
    setUser(tgUser);
    
    // Определяем язык из Telegram
    if (tgUser?.language_code === 'en') {
      setLang('en');
    }
  }, []);

  const texts = {
    ru: {
      welcome: 'Привет',
      menu: 'Меню',
    },
    en: {
      welcome: 'Hello',
      menu: 'Menu',
    },
  };

  return (
    <header className="bg-white border-b border-primary/10 sticky top-0 z-50 backdrop-blur-lg bg-white/95 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Логотип */}
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md">
            <Image
              src="/logo.png"
              alt="eWave"
              width={40}
              height={40}
              className="object-cover"
              priority
            />
          </div>
          
          {/* Текст */}
          <div>
            <h1 className="text-lg font-bold text-text-primary">eWave</h1>
            {user && (
              <p className="text-xs text-text-secondary">
                {texts[lang].welcome}, {user.first_name}!
              </p>
            )}
          </div>
        </div>
        
        {/* Переключатель языка */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
            className="px-3 py-1.5 rounded-lg bg-background text-text-primary text-sm font-medium hover:bg-primary/10 transition-colors border border-primary/10"
          >
            {lang === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}
          </button>
        </div>
      </div>
    </header>
  );
}

