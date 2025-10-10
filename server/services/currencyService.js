const axios = require('axios');

class CurrencyService {
  constructor() {
    this.usdRate = 95; // Дефолтный курс
    this.lastUpdate = null;
    this.updateInterval = 24 * 60 * 60 * 1000; // 24 часа
    
    // Запускаем обновление при старте
    this.updateRate();
  }

  async updateRate() {
    try {
      console.log('[Currency] Updating USD/RUB rate from CB RF...');
      
      // API ЦБ РФ для курса USD
      const response = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
      const usdData = response.data?.Valute?.USD;
      
      if (usdData && usdData.Value) {
        this.usdRate = Math.round(usdData.Value);
        this.lastUpdate = new Date();
        console.log('[Currency] USD rate updated:', this.usdRate, '₽');
      } else {
        console.warn('[Currency] Failed to parse USD rate, using default:', this.usdRate);
      }
      
      // Планируем следующее обновление
      setTimeout(() => this.updateRate(), this.updateInterval);
    } catch (error) {
      console.error('[Currency] Failed to update rate:', error.message);
      // Повторяем через 1 час при ошибке
      setTimeout(() => this.updateRate(), 60 * 60 * 1000);
    }
  }

  getRate() {
    return this.usdRate;
  }

  getLastUpdate() {
    return this.lastUpdate;
  }

  convertToRub(usdAmount) {
    return Math.round(usdAmount * this.usdRate);
  }
}

module.exports = new CurrencyService();

