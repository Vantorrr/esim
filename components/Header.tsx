'use client';

import { useState, useEffect } from 'react';
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
    <header className="bg-white border-b border-primary/10 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center text-2xl">
            🌊
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">eWave</h1>
            {user && (
              <p className="text-xs text-text-secondary">
                {texts[lang].welcome}, {user.first_name}!
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
            className="px-3 py-1 rounded-lg bg-background text-text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            {lang === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}
          </button>
        </div>
      </div>
    </header>
  );
}

