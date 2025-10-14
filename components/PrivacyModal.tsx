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
            <h3 className="text-lg font-bold">Политика конфиденциальности eWave</h3>
            <p className="text-text-secondary">Дата обновления: 14 октября 2025 года</p>
            <p className="text-text-secondary leading-relaxed">
              Настоящая Политика регулирует порядок обработки и защиты информации пользователей сервиса eWave (далее — «Сервис»),
              предоставляющего цифровые услуги подключения интернет-трафика через технологию eSIM. Сервис соблюдает законодательство РФ,
              включая ФЗ № 152-ФЗ «О персональных данных», № 149-ФЗ «Об информации» и другие акты, регулирующие защиту данных.
            </p>

            <section>
              <h3 className="text-lg font-bold mb-3">1. Общие положения</h3>
              <p className="text-text-secondary leading-relaxed">
                eWave предоставляет пользователям доступ к услугам интернет-трафика от партнёрских операторов. Обрабатываются только технические данные,
                необходимые для исполнения заказа. Персональные данные в понимании ФЗ‑152 не собираются и не хранятся. Все операции выполняются через
                защищённые API платёжных систем и партнёров.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">2. Обработка и хранение информации</h3>
              <p className="text-text-secondary leading-relaxed mb-2">
                При оформлении заказа передаются технические параметры: страна, объём трафика, срок действия и сумма платежа. История заказов сохраняется в приложении исключительно для:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>повторного просмотра инструкции по установке eSIM,</li>
                <li>проверки статуса и срока действия пакета.</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-2">
                Информация обезличена и не содержит персональных данных. eWave не использует cookies и не ведёт рекламную аналитику.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">3. Передача данных партнёрам</h3>
              <p className="text-text-secondary leading-relaxed mb-2">Для выполнения заказа минимальные сведения передаются:</p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>оператору связи — для генерации eSIM‑профиля;</li>
                <li>платёжному агрегатору — для проведения транзакции.</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-2">
                Передача осуществляется по защищённым каналам (SSL/TLS) и строго в рамках законодательства РФ.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">4. Безопасность</h3>
              <p className="text-text-secondary leading-relaxed">
                Соединения между пользователем и партнёрами защищены сертифицированными протоколами. Доступ к истории заказов возможен только пользователю через его аккаунт.
                eWave не хранит персональные данные на своих серверах.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">5. Права пользователя</h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Пользователь может прекратить использование Сервиса в любое время.</li>
                <li>История заказов может быть удалена по запросу через поддержку.</li>
                <li>Передавая технические данные, пользователь соглашается с их обработкой в рамках настоящей Политики.</li>
              </ul>
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

