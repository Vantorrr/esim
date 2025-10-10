'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getOrder, getOrderQR } from '@/lib/api';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import LoadingScreen from '@/components/LoadingScreen';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id') || searchParams.get('session_id');

  const [order, setOrder] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    loadOrderData();
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      // Пробуем загрузить заказ
      const orderData = await getOrder(orderId!);
      setOrder(orderData);

      // Пробуем получить QR код (может быть не сразу доступен)
      try {
        const qr = await getOrderQR(orderId!);
        setQrData(qr);
      } catch (qrError) {
        // QR код может быть не готов сразу, попробуем позже
        setTimeout(loadOrderData, 5000); // Повторяем через 5 секунд
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Ошибка</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Success Header */}
      <div className="bg-gradient-primary text-white py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold mb-2">Оплата успешна!</h1>
          <p className="text-xl opacity-90">Ваш eSIM готов к использованию</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* QR Code Display */}
        {qrData ? (
          <QRCodeDisplay qrData={qrData} order={order} />
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-primary font-medium mb-2">Генерация вашего eSIM...</p>
            <p className="text-sm text-text-secondary">
              Провайдер готовит ваш eSIM. Это займёт всего несколько секунд.
            </p>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">📋 Что дальше?</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Сохраните QR-код</h3>
                <p className="text-sm text-text-secondary">
                  Скачайте или сделайте скриншот QR-кода выше
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Установите eSIM</h3>
                <p className="text-sm text-text-secondary">
                  Откройте Настройки → Сотовая связь → Добавить eSIM
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Отсканируйте QR-код</h3>
                <p className="text-sm text-text-secondary">
                  Наведите камеру на QR-код и следуйте инструкциям
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-bold">
                4
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Готово!</h3>
                <p className="text-sm text-text-secondary">
                  Включите роуминг данных и пользуйтесь интернетом
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-secondary/5 rounded-2xl p-6 flex gap-4">
          <div className="text-3xl">💬</div>
          <div className="flex-1">
            <h3 className="font-bold text-text-primary mb-1">Нужна помощь?</h3>
            <p className="text-sm text-text-secondary mb-3">
              Наша поддержка работает 24/7 и готова помочь с установкой
            </p>
            <a
              href="https://t.me/support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Написать в поддержку
            </a>
          </div>
        </div>

        {/* Back to Home */}
        <button
          onClick={() => router.push('/')}
          className="w-full py-4 bg-background text-text-primary rounded-xl font-medium hover:bg-primary/10 transition-colors"
        >
          Вернуться на главную
        </button>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

