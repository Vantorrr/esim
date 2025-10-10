'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPackageDetails, createStripeSession, createYooKassaPayment, createTinkoffPayment } from '@/lib/api';
import { hapticFeedback, showBackButton, hideBackButton } from '@/lib/telegram';
import LoadingScreen from '@/components/LoadingScreen';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('package');

  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'yookassa' | 'tinkoff'>('tinkoff');

  useEffect(() => {
    if (!packageId) {
      router.push('/');
      return;
    }

    showBackButton(() => {
      router.back();
    });

    loadPackage();

    return () => {
      hideBackButton();
    };
  }, [packageId]);

  const loadPackage = async () => {
    try {
      const data = await getPackageDetails(packageId!);
      setPkg(data);
    } catch (error) {
      console.error('Failed to load package:', error);
      alert('Ошибка загрузки пакета');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!pkg) return;

    setProcessing(true);
    hapticFeedback('medium');

    try {
      if (paymentMethod === 'stripe') {
        const session = await createStripeSession({
          packageId: pkg.id,
          packageName: pkg.name,
          price: pkg.price,
          currency: 'usd',
        });

        // Открываем Stripe Checkout
        if (session.url) {
          window.location.href = session.url;
        }
      } else if (paymentMethod === 'tinkoff') {
        const payment = await createTinkoffPayment({
          packageId: pkg.id,
          packageName: pkg.name,
          price: pkg.price * 90, // Конвертируем в рубли (примерный курс)
          email: 'customer@email.com',
        });

        // Открываем страницу оплаты Т-Банк
        if (payment.paymentUrl) {
          window.location.href = payment.paymentUrl;
        }
      } else {
        const payment = await createYooKassaPayment({
          packageId: pkg.id,
          packageName: pkg.name,
          price: pkg.price,
          currency: 'RUB',
        });

        // Открываем YooKassa
        if (payment.confirmation?.confirmation_url) {
          window.location.href = payment.confirmation.confirmation_url;
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка при создании платежа');
      setProcessing(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!pkg) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Оформление заказа</h1>
          <p className="opacity-90">Проверьте детали и выберите способ оплаты</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Package Info */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">📦 Детали пакета</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Название:</span>
              <span className="font-medium text-text-primary">{pkg.name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Данные:</span>
              <span className="font-medium text-text-primary">{pkg.data}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Срок действия:</span>
              <span className="font-medium text-text-primary">{pkg.validity} дней</span>
            </div>
            
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-text-primary">Итого:</span>
                <span className="font-bold text-primary">${pkg.price}</span>
              </div>
              {pkg.originalPrice && pkg.originalPrice !== pkg.price && (
                <div className="text-right text-sm text-text-secondary line-through">
                  ${pkg.originalPrice}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">💳 Способ оплаты</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setPaymentMethod('stripe');
                hapticFeedback('light');
              }}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'stripe'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-2xl">
                  💳
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-text-primary">Stripe</div>
                  <div className="text-sm text-text-secondary">Карты, Apple Pay, Google Pay</div>
                </div>
                {paymentMethod === 'stripe' && (
                  <div className="text-primary text-xl">✓</div>
                )}
              </div>
            </button>

            <button
              onClick={() => {
                setPaymentMethod('tinkoff');
                hapticFeedback('light');
              }}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'tinkoff'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center text-2xl">
                  💛
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-text-primary">Т-Банк</div>
                  <div className="text-sm text-text-secondary">Карты РФ, СБП, рассрочка</div>
                </div>
                {paymentMethod === 'tinkoff' && (
                  <div className="text-primary text-xl">✓</div>
                )}
              </div>
            </button>

            <button
              onClick={() => {
                setPaymentMethod('yookassa');
                hapticFeedback('light');
              }}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'yookassa'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center text-2xl">
                  🇷🇺
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-text-primary">ЮKassa</div>
                  <div className="text-sm text-text-secondary">Карты РФ, СБП, кошельки</div>
                </div>
                {paymentMethod === 'yookassa' && (
                  <div className="text-primary text-xl">✓</div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-primary/5 rounded-2xl p-4 flex gap-3">
          <div className="text-2xl">🔒</div>
          <div className="flex-1 text-sm text-text-secondary">
            <p className="font-medium text-text-primary mb-1">Безопасная оплата</p>
            <p>Ваши данные защищены по стандарту PCI DSS. Мы не храним данные вашей карты.</p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full py-4 bg-gradient-primary text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Обработка...
              </span>
            ) : (
              `Оплатить $${pkg.price}`
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

