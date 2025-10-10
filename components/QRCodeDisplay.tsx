'use client';

import { useState } from 'react';
import { hapticFeedback } from '@/lib/telegram';

interface QRCodeDisplayProps {
  qrData: {
    iccid: string;
    smdpAddress: string;
    activationCode: string;
    qrCode?: string;
    qrCodeUrl?: string;
  };
  order?: any;
}

export default function QRCodeDisplay({ qrData, order }: QRCodeDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    hapticFeedback('medium');
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownload = () => {
    hapticFeedback('medium');
    
    // Если есть URL QR-кода, открываем его
    if (qrData.qrCodeUrl) {
      window.open(qrData.qrCodeUrl, '_blank');
    } else if (qrData.qrCode) {
      // Если есть base64 QR-кода, скачиваем его
      const link = document.createElement('a');
      link.href = qrData.qrCode;
      link.download = `esim-qr-${qrData.iccid}.png`;
      link.click();
    }
  };

  const handleEmail = () => {
    hapticFeedback('light');
    
    const subject = 'Мой eSIM QR-код';
    const body = `
Ваш eSIM готов к использованию!

ICCID: ${qrData.iccid}
SM-DP+ Address: ${qrData.smdpAddress}
Activation Code: ${qrData.activationCode}

Инструкция по установке:
1. Откройте Настройки → Сотовая связь
2. Нажмите "Добавить eSIM"
3. Отсканируйте QR-код или введите данные вручную

QR-код: ${qrData.qrCodeUrl || 'См. вложение'}

С уважением,
Команда eWave
    `.trim();

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-text-primary text-center">
        📱 Ваш QR-код eSIM
      </h2>

      {/* QR Code Image */}
      <div className="bg-background rounded-2xl p-6 flex justify-center">
        {qrData.qrCodeUrl || qrData.qrCode ? (
          <img
            src={qrData.qrCodeUrl || qrData.qrCode}
            alt="eSIM QR Code"
            className="w-64 h-64 object-contain"
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center text-text-secondary">
            QR-код недоступен
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleDownload}
          className="py-3 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors text-sm"
        >
          💾 Сохранить
        </button>
        
        <button
          onClick={handleEmail}
          className="py-3 bg-secondary/10 text-secondary rounded-xl font-medium hover:bg-secondary/20 transition-colors text-sm"
        >
          ✉️ Email
        </button>
        
        <button
          onClick={() => {
            setShowDetails(!showDetails);
            hapticFeedback('light');
          }}
          className="py-3 bg-background text-text-primary rounded-xl font-medium hover:bg-primary/10 transition-colors text-sm"
        >
          📋 Детали
        </button>
      </div>

      {/* Activation Details */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-4 space-y-3 animate-fade-in">
          <h3 className="font-bold text-text-primary">Данные для ручной активации:</h3>
          
          <div className="bg-background rounded-xl p-4 space-y-3">
            <div>
              <div className="text-xs text-text-secondary mb-1">ICCID:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-text-primary break-all">
                  {qrData.iccid}
                </code>
                <button
                  onClick={() => handleCopy(qrData.iccid)}
                  className="px-3 py-1 bg-white rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs text-text-secondary mb-1">SM-DP+ Address:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-text-primary break-all">
                  {qrData.smdpAddress}
                </code>
                <button
                  onClick={() => handleCopy(qrData.smdpAddress)}
                  className="px-3 py-1 bg-white rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs text-text-secondary mb-1">Activation Code:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-text-primary break-all">
                  {qrData.activationCode}
                </code>
                <button
                  onClick={() => handleCopy(qrData.activationCode)}
                  className="px-3 py-1 bg-white rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-text-secondary">
            💡 Эти данные можно ввести вручную, если не получается отсканировать QR-код
          </p>
        </div>
      )}
    </div>
  );
}

