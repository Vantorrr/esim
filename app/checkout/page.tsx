'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPackageDetails, createPayment131SBP, getPayment131SBPLink } from '@/lib/api';
import { hapticFeedback, showBackButton, hideBackButton, getTelegramUser } from '@/lib/telegram';
import LoadingScreen from '@/components/LoadingScreen';
import CoverageModal from '@/components/CoverageModal';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('package');

  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);

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
      const tgUser = getTelegramUser();
      const telegramId = tgUser?.id;

      if (!telegramId) {
        alert('Ошибка: Не удалось определить пользователя Telegram. Пожалуйста, перезапустите приложение.');
        setProcessing(false);
        return;
      }

      const amountRub = pkg.priceRub || Math.round(pkg.price * 95);
      const orderId = `esim_${Date.now()}`;
      const successUrl = `${window.location.origin}/success?order=${orderId}`;
      const failUrl = `${window.location.origin}/checkout?package=${pkg.id}&status=payment_failed`;

      const payment = await createPayment131SBP({
        amount: amountRub,
        currency: 'RUB',
        orderId,
        description: `eSIM ${pkg.name}`,
        successUrl,
        failUrl,
        metadata: {
          telegramId,
          packageId: pkg.id,
          packageName: pkg.name,
          region: pkg.region,
        },
        customer: {
          reference: telegramId ? String(telegramId) : orderId,
        },
        extra: {
          telegramId,
        },
      });

      const redirectUrl =
        payment?.paymentUrl ||
        payment?.url ||
        payment?.deeplink ||
        payment?.link ||
        payment?.sbpUrl ||
        payment?.formUrl ||
        payment?.invoice?.url ||
        payment?.payload?.formUrl ||
        payment?.redirect?.url;

      if (redirectUrl) {
        // Открываем СБП ссылку через Telegram WebApp API
        if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(redirectUrl);
        } else {
          window.location.href = redirectUrl;
        }
      } else if (payment?.qr?.link) {
        if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(payment.qr.link);
        } else {
          window.location.href = payment.qr.link;
        }
      } else {
        // For SBP QR flow, link may arrive asynchronously via action_required webhook.
        const sessionId = payment?.sessionId || payment?.session?.id;

        if (sessionId) {
          const maxAttempts = 30;
          for (let i = 0; i < maxAttempts; i++) {
            try {
              const linkData = await getPayment131SBPLink(sessionId);
              const qrLink =
                linkData?.qrDeeplink ||
                linkData?.paymentUrl ||
                linkData?.customer_interaction?.inform?.qr?.content;

              if (qrLink) {
                // Открываем через Telegram API
                if (window.Telegram?.WebApp?.openLink) {
                  window.Telegram.WebApp.openLink(qrLink);
                } else {
                  window.location.href = qrLink;
                }
                
                // Перенаправляем на страницу ожидания
                router.push(`/payment-pending?session=${sessionId}&package=${pkg.id}`);
                return;
              }
            } catch (pollErr: any) {
              // 404 NOT_READY — просто ждём и пробуем ещё раз
              if (axios.isAxiosError(pollErr) && pollErr.response?.status === 404) {
                // continue to next iteration
              } else {
                console.warn('SBP polling for QR failed', pollErr);
                break;
              }
            }

            // Если ещё не готово, подождать и попробовать снова
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        console.warn('SBP payment response missing redirect URL', payment);
        alert('Не удалось получить ссылку на оплату СБП. Свяжитесь с поддержкой.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка при создании платежа');
    } finally {
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
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 text-primary">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary">Детали пакета</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Название:</span>
              <span className="font-medium text-text-primary text-right">{pkg.name?.replace(/_V\d+$/i, '').replace(/,\s*V\d+/i, '')}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Данные:</span>
              <span className="font-medium text-text-primary">{pkg.data}</span>
            </div>

            {/* Тип подключения */}
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Тип подключения:</span>
              <span className="font-medium text-text-primary">
                {pkg.networkType || '3G/4G/LTE'}
              </span>
            </div>

            {/* Услуги в пакете */}
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Услуги в пакете:</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                  Интернет
                </span>
                {pkg.voice && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                    Звонки
                  </span>
                )}
                {pkg.sms && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                    SMS
                  </span>
                )}
              </div>
            </div>

            {/* Звонки, SMS, номер */}
            {(pkg.voice || pkg.sms) && (
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Звонки, SMS, номер:</span>
                <div className="text-right">
                  <span className="font-medium text-text-primary">
                    {pkg.voice && pkg.sms ? 'Да' : pkg.voice ? 'Только звонки' : 'Только SMS'}
                  </span>
                  {!pkg.voice && !pkg.sms && (
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <span className="text-xs text-text-secondary">Нет</span>
                      <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 9h6M9 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Срок действия */}
            <div className="flex justify-between items-start">
              <span className="text-text-secondary">Срок действия:</span>
              <div className="text-right">
                <div className="font-medium text-text-primary">
                  {pkg.validity} {pkg.validity === 1 ? 'день' : pkg.validity < 5 ? 'дня' : 'дней'}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">С момента активации</div>
              </div>
            </div>

            {/* Отложенная активация */}
            {pkg.activationDelay && (
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Отложенная активация:</span>
                <div className="text-right">
                  <span className="font-medium text-text-primary">{pkg.activationDelay} дней</span>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <svg className="w-3 h-3 text-text-secondary" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-xs text-text-secondary">Можно активировать позже</span>
                  </div>
                </div>
              </div>
            )}

            {/* Начало действия */}
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Начало действия:</span>
              <span className="font-medium text-text-primary">
                {pkg.autoActivation ? 'После активации' : 'Сразу'}
              </span>
            </div>

            {/* Ограничение скорости */}
            {pkg.speedLimit && (
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Ограничение скорости:</span>
                <span className="font-medium text-text-primary">{pkg.speedLimit}</span>
              </div>
            )}

            {pkg.unlimitedThrottle && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="text-xs text-yellow-800">
                  <strong>Unlimited тариф:</strong> 1 ГБ неограниченного интернета каждые 24 часа. После исчерпания скорость снижается до 1,25 Мбит/с до начала следующего периода.
                </div>
              </div>
            )}

            {/* Операторы */}
            {pkg.operators && pkg.operators.length > 0 && (
              <div className="flex justify-between items-start">
                <span className="text-text-secondary">Операторы:</span>
                <div className="text-right">
                  <span className="font-medium text-text-primary">
                    {pkg.operators.join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Покрытие */}
            {(Array.isArray((pkg as any).regionCoverage) && (pkg as any).regionCoverage.length > 3) || (Array.isArray(pkg.coverage) && pkg.coverage.length > 3) ? (
              <div className="flex justify-between items-start">
                <span className="text-text-secondary">Покрытие:</span>
                <button onClick={() => setCoverageOpen(true)} className="text-right text-sm text-primary underline-offset-2 hover:underline flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {((pkg as any).regionCoverage?.length || pkg.coverage?.length || 0)} {((pkg as any).regionCoverage?.length || pkg.coverage?.length || 0) === 1 ? 'страна' : ((pkg as any).regionCoverage?.length || pkg.coverage?.length || 0) < 5 ? 'страны' : 'стран'}
                </button>
              </div>
            ) : null}
            
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-text-primary">Итого:</span>
                <span className="font-bold text-primary text-2xl">
                  {pkg.priceRub || Math.round(pkg.price * 95)}₽
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 text-primary">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary">Оплата через СБП</h2>
          </div>

          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border-2 border-primary/20">
                <span className="text-3xl font-bold text-primary">СБП</span>
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-text-primary text-lg">Система Быстрых Платежей</div>
                <div className="text-sm text-text-secondary">Оплата по QR-коду или ссылке</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-primary/5 rounded-2xl p-4 flex gap-3">
          <div className="w-10 h-10 flex-shrink-0 text-primary">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
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
              `Оплатить ${pkg.priceRub || Math.round(pkg.price * 95)}₽`
            )}
          </button>
        </div>
      </div>
      <CoverageModal
        isOpen={coverageOpen}
        onClose={() => setCoverageOpen(false)}
        coverage={(pkg as any).regionCoverage || pkg.coverage || []}
        title="Страны покрытия"
      />
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

