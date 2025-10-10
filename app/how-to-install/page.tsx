'use client';

import { useRouter } from 'next/navigation';

export default function HowToInstallPage() {
  const router = useRouter();

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
          <h1 className="text-3xl font-bold mb-2">📱 Как установить eSIM</h1>
          <p className="opacity-90">Пошаговая инструкция для всех устройств</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* iPhone */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">🍎</div>
            <h2 className="text-2xl font-bold text-text-primary">iPhone</h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Откройте Настройки</h3>
                <p className="text-sm text-text-secondary">
                  Зайдите в Настройки → Сотовая связь (или Мобильные данные)
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Добавьте eSIM</h3>
                <p className="text-sm text-text-secondary">
                  Нажмите "Добавить сотовый тариф" или "Добавить eSIM"
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
                  Наведите камеру на QR-код из письма или из приложения
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Активируйте тариф</h3>
                <p className="text-sm text-text-secondary">
                  Дайте название тарифу (например, "Путешествия") и активируйте
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-bold">
                5
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Включите роуминг данных</h3>
                <p className="text-sm text-text-secondary">
                  Настройки → Сотовая связь → выберите eSIM → включите "Роуминг данных"
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/5 rounded-xl">
            <p className="text-sm text-text-secondary">
              💡 <strong>Совет:</strong> Если QR-код не сканируется, нажмите "Ввести данные вручную" и введите SM-DP+ адрес и код активации.
            </p>
          </div>
        </div>

        {/* Android */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">🤖</div>
            <h2 className="text-2xl font-bold text-text-primary">Android</h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Откройте Настройки</h3>
                <p className="text-sm text-text-secondary">
                  Настройки → Сеть и Интернет → SIM-карты
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Добавьте eSIM</h3>
                <p className="text-sm text-text-secondary">
                  Нажмите "Добавить SIM-карту" или "Добавить мобильную сеть"
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Выберите eSIM</h3>
                <p className="text-sm text-text-secondary">
                  Выберите опцию "Загрузить SIM-карту" или "Использовать QR-код"
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Отсканируйте QR-код</h3>
                <p className="text-sm text-text-secondary">
                  Наведите камеру на QR-код и подождите
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-bold">
                5
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Активируйте</h3>
                <p className="text-sm text-text-secondary">
                  Следуйте инструкциям на экране и активируйте eSIM
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-secondary/5 rounded-xl">
            <p className="text-sm text-text-secondary">
              ⚠️ <strong>Примечание:</strong> Интерфейс может отличаться в зависимости от производителя (Samsung, Google Pixel, Xiaomi и т.д.)
            </p>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-gradient-secondary text-white rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">🔧 Возникли проблемы?</h2>
          
          <div className="space-y-3 text-sm">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-bold mb-1">QR-код не сканируется</h3>
              <p className="opacity-90">
                Попробуйте ввести данные вручную или обеспечьте хорошее освещение при сканировании
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-bold mb-1">Нет интернета после установки</h3>
              <p className="opacity-90">
                Убедитесь, что включен роуминг данных и выбрана правильная SIM для мобильных данных
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-bold mb-1">Ошибка активации</h3>
              <p className="opacity-90">
                Проверьте интернет-соединение и попробуйте снова через несколько минут
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="https://t.me/support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-white text-secondary rounded-xl font-medium hover:bg-white/90 transition-colors"
            >
              Написать в поддержку
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

