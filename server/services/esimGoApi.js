const axios = require('axios');

class EsimGoAPI {
  constructor() {
    this.baseURL = process.env.ESIM_GO_API_URL || 'https://api.esim-go.com/v2.2';
    this.apiKey = process.env.ESIM_GO_API_KEY;
    this.marginMultiplier = 2; // 100% margin
  }

  async request(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('eSIM-GO API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'API request failed');
    }
  }

  // Получить список стран
  async getCountries() {
    const data = await this.request('/countries');
    return data;
  }

  // Получить пакеты для страны
  async getPackages(countryCode) {
    const endpoint = countryCode 
      ? `/esim?country=${countryCode}` 
      : '/esim';
    const data = await this.request(endpoint);
    
    // Добавляем маржу к ценам
    if (data.esims) {
      data.esims = data.esims.map(esim => ({
        ...esim,
        originalPrice: esim.price,
        price: parseFloat((esim.price * this.marginMultiplier).toFixed(2)),
      }));
    }
    
    return data;
  }

  // Получить детали пакета
  async getPackageDetails(packageId) {
    const data = await this.request(`/esim/${packageId}`);
    
    if (data.price) {
      data.originalPrice = data.price;
      data.price = parseFloat((data.price * this.marginMultiplier).toFixed(2));
    }
    
    return data;
  }

  // Создать заказ
  async createOrder(packageId, quantity = 1) {
    const data = await this.request('/orders', 'POST', {
      type: 'sim',
      quantity,
      package: packageId,
    });
    return data;
  }

  // Получить информацию о заказе
  async getOrder(orderId) {
    const data = await this.request(`/orders/${orderId}`);
    return data;
  }

  // Получить список заказов
  async getOrders() {
    const data = await this.request('/orders');
    return data;
  }

  // Получить QR код и данные активации
  async getOrderQR(orderId) {
    const order = await this.getOrder(orderId);
    
    if (order.esims && order.esims.length > 0) {
      const esim = order.esims[0];
      return {
        iccid: esim.iccid,
        smdpAddress: esim.smdpAddress,
        activationCode: esim.activationCode,
        qrCode: esim.qrCode,
        qrCodeUrl: esim.qrCodeUrl,
      };
    }
    
    throw new Error('eSIM data not available yet');
  }
}

module.exports = new EsimGoAPI();

