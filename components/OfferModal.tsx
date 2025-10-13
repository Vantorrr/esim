'use client';

import { useEffect } from 'react';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OfferModal({ isOpen, onClose }: OfferModalProps) {
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
          <h2 className="text-xl font-bold">Публичная оферта</h2>
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
            <section>
              <h3 className="text-lg font-bold mb-3">7. Возврат и отказ от услуг</h3>
              <p className="text-text-secondary leading-relaxed mb-3">
                Возврат осуществляется тем же способом, которым была произведена оплата, в срок до 7 рабочих дней.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">8. Ограничения и добросовестное использование</h3>
              <div className="space-y-2 text-text-secondary leading-relaxed">
                <p><strong>8.1.</strong> Покупатель обязуется использовать eSIM-профиль только в законных целях.</p>
                <p><strong>8.2.</strong> Запрещается использование eSIM-профиля для обхода блокировок, незаконных действий, мошенничества и нарушений правил операторов.</p>
                <p><strong>8.3.</strong> Продавец вправе приостанавливать выполнение заказов при выявлении злоупотреблений или нарушений условий Оферты.</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">9. Ответственность сторон</h3>
              <div className="space-y-2 text-text-secondary leading-relaxed">
                <p><strong>9.1.</strong> Продавец не отвечает за качество, скорость или стабильность услуг связи, предоставляемых иностранными операторами.</p>
                <p><strong>9.2.</strong> Ответственность Продавца ограничивается суммой оплаченного заказа.</p>
                <p><strong>9.3.</strong> Продавец не несёт ответственности за убытки, вызванные действиями третьих лиц, сбоями оборудования или сетей связи.</p>
                <p><strong>9.4.</strong> Стороны освобождаются от ответственности за неисполнение обязательств вследствие обстоятельств непреодолимой силы (форс-мажор).</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">10. Персональные данные</h3>
              <div className="space-y-2 text-text-secondary leading-relaxed">
                <p><strong>10.1.</strong> Обработка персональных данных осуществляется в соответствии с Федеральным законом № 152-ФЗ «О персональных данных».</p>
                <p><strong>10.2.</strong> Политика обработки персональных данных опубликована в разделе «Политика конфиденциальности».</p>
                <p>
                  <strong>10.3.</strong> Все обращения по вопросам персональных данных направляются на{' '}
                  <a href="mailto:ewavenet@yandex.com" className="text-primary font-medium underline">
                    ewavenet@yandex.com
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">11. Интеллектуальная собственность</h3>
              <div className="space-y-2 text-text-secondary leading-relaxed">
                <p><strong>11.1.</strong> Все материалы сайта и интерфейсов (дизайн, тексты, инструкции, программный код и т.п.) являются интеллектуальной собственностью Продавца или правообладателей.</p>
                <p><strong>11.2.</strong> Любое копирование, распространение и использование материалов без письменного согласия запрещено.</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">12. Применимое право и порядок разрешения споров</h3>
              <div className="space-y-2 text-text-secondary leading-relaxed">
                <p><strong>12.1.</strong> К настоящей Оферте применяется право Российской Федерации.</p>
                <p><strong>12.2.</strong> Все споры решаются путём переговоров, а при невозможности — в суде по месту регистрации Продавца.</p>
                <p>
                  <strong>12.3.</strong> Претензии направляются по адресу{' '}
                  <a href="mailto:ewavenet@yandex.com" className="text-primary font-medium underline">
                    ewavenet@yandex.com
                  </a>
                  {' '}и рассматриваются в срок до 10 рабочих дней.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold mb-3">13. Заключительные положения</h3>
              <div className="space-y-2 text-text-secondary leading-relaxed">
                <p><strong>13.1.</strong> Недействительность отдельного положения Оферты не влечёт недействительность остальных её частей.</p>
                <p><strong>13.2.</strong> Продавец вправе изменять Оферту в одностороннем порядке путём публикации новой редакции.</p>
                <p><strong>13.3.</strong> Актуальная версия Оферты всегда размещается на сайте Продавца.</p>
                <p><strong>13.4.</strong> Договор считается заключённым в электронной форме и имеет юридическую силу в соответствии с законодательством РФ.</p>
              </div>
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

