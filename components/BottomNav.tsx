'use client';

import { usePathname, useRouter } from 'next/navigation';
import { hapticFeedback } from '@/lib/telegram';
import EsimIcon from './icons/EsimIcon';
import UserIcon from './icons/UserIcon';
import HelpIcon from './icons/HelpIcon';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      id: 'esim',
      label: 'eSIM',
      icon: EsimIcon,
      path: '/',
      active: pathname === '/',
    },
    {
      id: 'account',
      label: 'Аккаунт',
      icon: UserIcon,
      path: '/my-orders',
      active: pathname === '/my-orders',
    },
    {
      id: 'help',
      label: 'Помощь',
      icon: HelpIcon,
      path: '/faq',
      active: pathname === '/faq',
    },
  ];

  const handleNavigate = (path: string) => {
    hapticFeedback('medium');
    router.push(path);
  };

  return (
    <>
      {/* Градиентный оверлей сверху бара */}
      <div className="fixed bottom-16 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/50 to-transparent pointer-events-none z-40"></div>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-primary/10 safe-area-bottom z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={`relative flex flex-col items-center justify-center py-3 px-4 transition-all duration-300 ${
                    item.active
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary active:scale-95'
                  }`}
                >
                  {/* Активный индикатор сверху */}
                  {item.active && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-secondary rounded-b-full shadow-lg"></div>
                  )}
                  
                  {/* Иконка */}
                  <div className={`mb-1 transition-all duration-300 ${
                    item.active ? 'scale-110 -translate-y-0.5' : 'scale-100'
                  }`}>
                    <IconComponent 
                      className="w-6 h-6" 
                      active={item.active}
                    />
                  </div>
                  
                  {/* Текст */}
                  <span className={`text-[11px] font-medium transition-all duration-300 ${
                    item.active ? 'font-bold text-primary' : 'text-text-secondary'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Фоновая подсветка при активности */}
                  {item.active && (
                    <div className="absolute inset-0 bg-primary/5 rounded-t-2xl -z-10"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

