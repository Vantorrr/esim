'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-primary/10 mt-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="font-bold text-text-primary mb-3">Информация</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-text-secondary hover:text-primary transition-colors">
                  ❓ FAQ
                </Link>
              </li>
              <li>
                <Link href="/how-to-install" className="text-text-secondary hover:text-primary transition-colors">
                  📱 Как установить eSIM
                </Link>
              </li>
              <li>
                <Link href="/compatibility" className="text-text-secondary hover:text-primary transition-colors">
                  📋 Совместимость
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-text-primary mb-3">Поддержка</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://t.me/support" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-primary transition-colors"
                >
                  💬 Telegram Support
                </a>
              </li>
              <li>
                <a 
                  href="mailto:support@ewave.com"
                  className="text-text-secondary hover:text-primary transition-colors"
                >
                  ✉️ Email Support
                </a>
              </li>
              <li>
                <Link href="/my-orders" className="text-text-secondary hover:text-primary transition-colors">
                  📦 Мои заказы
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-background rounded-2xl">
          <div className="text-center">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-xs text-text-secondary">Мгновенная активация</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-xs text-text-secondary">Безопасная оплата</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🌍</div>
            <div className="text-xs text-text-secondary">200+ стран</div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-text-secondary">
          <p>© 2025 eWave. Все права защищены.</p>
          <p className="mt-1">Сделано с ❤️ для путешественников</p>
        </div>
      </div>
    </footer>
  );
}

