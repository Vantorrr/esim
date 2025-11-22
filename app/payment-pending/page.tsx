'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTelegramUser } from '@/lib/telegram';
import api from '@/lib/api';

function PaymentPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const packageId = searchParams.get('package');

  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const [esimData, setEsimData] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }

    // Проверяем статус каждые 3 секунды
    const checkPaymentStatus = async () => {
      try {
        const tgUser = getTelegramUser();
        const telegramId = tgUser?.id;

        if (!telegramId) {
          console.error('No telegram ID');
          return;
        }

        // Получаем все eSIM пользователя
        const response = await api.get('/user-esims/my-esims', {
          params: { telegramId },
        });

        if (response.data.success && response.data.esims) {
          // Ищем eSIM с нашим sessionId
          const esim = response.data.esims.find(
            (e: any) => e.paymentSessionId === sessionId
          );

          if (esim && esim.esimOrderId && esim.qrData) {
            // eSIM создан и QR готов!
            setStatus('success');
            setEsimData(esim);
            
            // Через 2 секунды перенаправляем на страницу eSIM
            setTimeout(() => {
              router.push(`/my-esim/${esim.id}`);
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Первая проверка сразу
    checkPaymentStatus();

    // Потом каждые 3 секунды
    const interval = setInterval(checkPaymentStatus, 3000);

    // Таймаут на 2 минуты
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (status === 'checking') {
        setStatus('failed');
      }
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [sessionId, router, status]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl p-8 text-center shadow-lg">
          {status === 'checking' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-primary"></div>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-3">
                Ожидаем оплату
              </h1>
              <p className="text-text-secondary mb-6">
                Пожалуйста, завершите оплату в приложении банка
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <p className="mb-2">
                  <strong>Что делать:</strong>
                </p>
                <ol className="text-left space-y-1 ml-4 list-decimal">
                  <li>Откройте приложение вашего банка</li>
                  <li>Подтвердите платёж через СБП</li>
                  <li>Вернитесь в Telegram</li>
                  <li>eSIM появится автоматически</li>
                </ol>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-3">
                Оплата успешна!
              </h1>
              <p className="text-text-secondary mb-4">
                Ваш eSIM готов. Перенаправляем...
              </p>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-3">
                Время ожидания истекло
              </h1>
              <p className="text-text-secondary mb-6">
                Если вы завершили оплату, ваш eSIM появится в разделе "Мои eSIM" в течение нескольких минут.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/my-orders')}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
                >
                  Перейти к моим eSIM
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-gray-100 text-text-primary py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  На главную
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PaymentPending() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-primary"></div>
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  );
}
