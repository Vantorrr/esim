'use client';

import { usePathname, useRouter } from 'next/navigation';
import { hapticFeedback } from '@/lib/telegram';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      id: 'esim',
      label: 'eSIM',
      icon: '🌍',
      path: '/',
      active: pathname === '/',
    },
    {
      id: 'account',
      label: 'Аккаунт',
      icon: '👤',
      path: '/my-orders',
      active: pathname === '/my-orders',
    },
    {
      id: 'help',
      label: 'Помощь',
      icon: '❓',
      path: '/faq',
      active: pathname === '/faq',
    },
  ];

  const handleNavigate = (path: string) => {
    hapticFeedback('light');
    router.push(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="max-w-4xl mx-auto px-2 py-2">
        <div className="grid grid-cols-3 gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 ${
                item.active
                  ? 'bg-gradient-primary text-white shadow-lg scale-105'
                  : 'text-text-secondary hover:bg-background active:scale-95'
              }`}
            >
              <div className={`text-2xl mb-1 transition-transform ${
                item.active ? 'scale-110' : ''
              }`}>
                {item.icon}
              </div>
              <span className={`text-xs font-medium ${
                item.active ? 'font-bold' : ''
              }`}>
                {item.label}
              </span>
              {item.active && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-secondary rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Gradient overlay для красоты */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
    </nav>
  );
}

