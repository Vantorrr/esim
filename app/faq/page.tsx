'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { hapticFeedback } from '@/lib/telegram';
import BottomNav from '@/components/BottomNav';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'Что такое eSIM?',
    answer: 'eSIM - это встроенная SIM-карта, которая не требует физической установки. Вы можете активировать её, просто отсканировав QR-код на вашем телефоне.',
  },
  {
    question: 'Поддерживает ли мой телефон eSIM?',
    answer: 'eSIM поддерживают: iPhone XS и новее, Google Pixel 3 и новее, Samsung Galaxy S20 и новее, и многие другие современные устройства. Проверьте совместимость в разделе "Совместимость".',
  },
  {
    question: 'Как активировать eSIM?',
    answer: '1. После оплаты вы получите QR-код\n2. Откройте Настройки → Сотовая связь\n3. Нажмите "Добавить eSIM"\n4. Отсканируйте QR-код\n5. Следуйте инструкциям на экране',
  },
  {
    question: 'Когда начинается срок действия?',
    answer: 'Срок действия начинается с момента первого подключения к сети в стране назначения, а не с момента покупки.',
  },
  {
    question: 'Могу ли я использовать eSIM вместе с основной SIM?',
    answer: 'Да! eSIM можно использовать одновременно с вашей основной SIM-картой. Вы сможете выбирать, какую линию использовать для звонков и интернета.',
  },
  {
    question: 'Что делать, если QR-код не сканируется?',
    answer: 'Вы можете ввести данные активации вручную. На странице с QR-кодом нажмите "Детали" и скопируйте SM-DP+ адрес и код активации.',
  },
  {
    question: 'Могу ли я пополнить или продлить eSIM?',
    answer: 'Да, вы можете купить новый пакет для той же страны. Некоторые провайдеры также предлагают опцию пополнения через их приложение.',
  },
  {
    question: 'Что делать, если интернет не работает?',
    answer: '1. Убедитесь, что включен роуминг данных\n2. Проверьте, что выбрана правильная линия для данных\n3. Перезагрузите устройство\n4. Если не помогло - обратитесь в поддержку',
  },
  {
    question: 'Возможен ли возврат средств?',
    answer: 'Возврат возможен только если eSIM не был активирован. После активации возврат не производится согласно политике провайдеров.',
  },
  {
    question: 'Как связаться с поддержкой?',
    answer: 'Напишите нам в Telegram: @support или на email: support@ewave.com. Мы отвечаем 24/7!',
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filteredFaq = faqData.filter(
    item =>
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (index: number) => {
    hapticFeedback('light');
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-gradient-primary text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-4 text-white/80 hover:text-white transition-colors"
          >
            ← Назад
          </button>
          <h1 className="text-3xl font-bold mb-2">❓ FAQ</h1>
          <p className="opacity-90">Часто задаваемые вопросы</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Search */}
        <div className="bg-white rounded-2xl p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Поиск по вопросам..."
            className="w-full px-4 py-3 rounded-xl bg-background border-2 border-transparent focus:border-primary outline-none transition-colors text-text-primary"
          />
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {filteredFaq.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-text-secondary">Вопросы не найдены</p>
            </div>
          ) : (
            filteredFaq.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden">
                <button
                  onClick={() => handleToggle(index)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-background transition-colors"
                >
                  <span className="font-medium text-text-primary pr-4">
                    {item.question}
                  </span>
                  <span
                    className={`text-primary text-xl transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
                
                {openIndex === index && (
                  <div className="px-5 pb-5 text-text-secondary whitespace-pre-line animate-fade-in">
                    {item.answer}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-primary text-white rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="text-xl font-bold mb-2">Не нашли ответ?</h3>
          <p className="mb-4 opacity-90">Наша поддержка всегда готова помочь!</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="https://t.me/support"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-primary rounded-xl font-medium hover:bg-white/90 transition-colors"
            >
              Telegram
            </a>
            <a
              href="mailto:support@ewave.com"
              className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
            >
              Email
            </a>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

