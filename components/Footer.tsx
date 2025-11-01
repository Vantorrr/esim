'use client';

import { useState } from 'react';
import Link from 'next/link';
import PrivacyModal from './PrivacyModal';
import OfferModal from './OfferModal';

export default function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

  return (
    <>
      <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <OfferModal isOpen={offerOpen} onClose={() => setOfferOpen(false)} />
    <footer className="bg-white border-t border-primary/10 mt-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="font-bold text-text-primary mb-3">Информация</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/how-to-install" className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Как установить eSIM
                </Link>
              </li>
              <li>
                <Link href="/compatibility" className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Совместимость
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-text-primary mb-3">Поддержка</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://t.me/eWaveSupport" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Telegram Support
                </a>
              </li>
              <li>
                <a 
                  href="mailto:ewavenet@yandex.com"
                  className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Email: ewavenet@yandex.com
                </a>
              </li>
              <li>
                <Link href="/my-orders" className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Мои eSIM
                </Link>
              </li>
              <li>
                <Link href="/purchase-history" className="text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  История покупок
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-background rounded-2xl">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 text-primary">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-xs text-text-secondary font-medium">Мгновенная активация</div>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 text-primary">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-xs text-text-secondary font-medium">Безопасная оплата</div>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 text-primary">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-xs text-text-secondary font-medium">200+ стран</div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-text-secondary space-y-2">
          <p>© 2025 eWave. Все права защищены.</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setPrivacyOpen(true)}
              className="text-primary hover:underline underline-offset-2 font-medium transition-colors"
            >
              Политика конфиденциальности
            </button>
            <span className="text-text-secondary/50">•</span>
            <button
              onClick={() => setOfferOpen(true)}
              className="text-primary hover:underline underline-offset-2 font-medium transition-colors"
            >
              Публичная оферта
            </button>
          </div>
          <p className="mt-2">Сделано с ❤️ для путешественников</p>
          <p className="mt-1">
            Разработка: <a href="https://noface.digital" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">N0FACE</a>
            <span className="mx-2 text-text-secondary/50">•</span>
            Руководитель: <a href="https://t.me/pavel_xdev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@pavel_xdev</a>
          </p>
        </div>
      </div>
    </footer>
    </>
  );
}

