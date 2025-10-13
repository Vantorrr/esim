'use client';

import { useEffect } from 'react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-primary text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Политика конфиденциальности</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)] px-6 py-6">
          <div className="space-y-6 text-text-primary">
            <p className="text-text-secondary leading-relaxed">
              Настоящая политика определяет порядок сбора, хранения и использования персональных данных пользователей при покупке и активации цифровых eSIM-профилей у ИП Аскольской Александры Николаевны (ИНН 233409091769, ОГРНИП 321508100385605).
            </p>

            <section>
              <h3 className="text-lg font-bold mb-3">1. Общие положения</h3>
              <p className="text-text-secondary leading-relaxed">
                Используя сайт, Telegram-бот или иные сервисы для приобретения eSIM-профиля, пользователь подтверждает своё согласие на обработку персональных данных в рамках настоящей Политики и законодательства РФ.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">2. Какие данные собираются</h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>имя или никнейм;</li>
                <li>адрес электронной почты;</li>
                <li>Telegram-ID или иной идентификатор пользователя;</li>
                <li>сведения о заказах и оплатах;</li>
                <li>технические данные (например, IP-адрес, cookie).</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">3. Цели использования данных</h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>оформление и исполнение заказов;</li>
                <li>отправка фискальных чеков и уведомлений;</li>
                <li>связь с пользователем по вопросам обслуживания;</li>
                <li>выполнение требований законодательства РФ.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">4. Хранение и защита</h3>
              <p className="text-text-secondary leading-relaxed">
                Все данные хранятся на защищённых ресурсах и не передаются третьим лицам, кроме случаев, необходимых для выполнения заказа или предусмотренных законом.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">5. Права пользователя</h3>
              <p className="text-text-secondary leading-relaxed">
                Пользователь вправе запросить информацию о своих данных, потребовать их изменения или удаления, а также отозвать согласие, направив письмо на{' '}
                <a href="mailto:ewavenet@yandex.com" className="text-primary font-medium underline">
                  ewavenet@yandex.com
                </a>
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">6. Изменение политики</h3>
              <p className="text-text-secondary leading-relaxed">
                Политика может обновляться без предварительного уведомления. Актуальная версия всегда размещается на сайте или в интерфейсе сервиса.
              </p>
            </section>

            <section className="pt-4 border-t border-gray-200">
              <div className="space-y-2 text-sm text-text-secondary">
                <p className="font-semibold text-text-primary">ИП Аскольская Александра Николаевна</p>
                <p>ИНН 233409091769</p>
                <p>ОГРНИП 321508100385605</p>
                <p>Адрес: 143025, Московская обл., г. Одинцово, с. Ромашково</p>
                <p>
                  Контактный e-mail:{' '}
                  <a href="mailto:ewavenet@yandex.com" className="text-primary font-medium underline">
                    ewavenet@yandex.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

