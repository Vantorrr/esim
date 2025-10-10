const axios = require('axios');
const crypto = require('crypto');

class TinkoffAPI {
  constructor() {
    this.terminalKey = process.env.TINKOFF_TERMINAL_KEY;
    this.password = process.env.TINKOFF_PASSWORD;
    this.baseURL = 'https://securepay.tinkoff.ru/v2';
  }

  // Генерация токена для запроса
  generateToken(params) {
    const values = { ...params, Password: this.password };
    const sortedKeys = Object.keys(values).sort();
    const concatenated = sortedKeys.map(key => values[key]).join('');
    return crypto.createHash('sha256').update(concatenated).digest('hex');
  }

  // Инициализация платежа
  async init(orderId, amount, description, customerEmail) {
    const params = {
      TerminalKey: this.terminalKey,
      Amount: Math.round(amount * 100), // в копейках
      OrderId: orderId,
      Description: description,
      CustomerKey: customerEmail,
      Receipt: {
        Email: customerEmail,
        Taxation: 'usn_income',
        Items: [
          {
            Name: description,
            Price: Math.round(amount * 100),
            Quantity: 1,
            Amount: Math.round(amount * 100),
            Tax: 'none',
          },
        ],
      },
    };

    params.Token = this.generateToken(params);

    try {
      const response = await axios.post(`${this.baseURL}/Init`, params);
      return response.data;
    } catch (error) {
      console.error('Tinkoff Init Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.Message || 'Ошибка инициализации платежа');
    }
  }

  // Проверка статуса платежа
  async getState(paymentId) {
    const params = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
    };

    params.Token = this.generateToken(params);

    try {
      const response = await axios.post(`${this.baseURL}/GetState`, params);
      return response.data;
    } catch (error) {
      console.error('Tinkoff GetState Error:', error.response?.data || error.message);
      throw new Error('Ошибка проверки статуса платежа');
    }
  }

  // Отмена платежа
  async cancel(paymentId) {
    const params = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
    };

    params.Token = this.generateToken(params);

    try {
      const response = await axios.post(`${this.baseURL}/Cancel`, params);
      return response.data;
    } catch (error) {
      console.error('Tinkoff Cancel Error:', error.response?.data || error.message);
      throw new Error('Ошибка отмены платежа');
    }
  }

  // Подтверждение платежа
  async confirm(paymentId, amount) {
    const params = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
      Amount: Math.round(amount * 100),
    };

    params.Token = this.generateToken(params);

    try {
      const response = await axios.post(`${this.baseURL}/Confirm`, params);
      return response.data;
    } catch (error) {
      console.error('Tinkoff Confirm Error:', error.response?.data || error.message);
      throw new Error('Ошибка подтверждения платежа');
    }
  }

  // Проверка уведомления от Тинькофф
  validateNotification(notification) {
    const token = notification.Token;
    delete notification.Token;
    
    const generatedToken = this.generateToken(notification);
    return token === generatedToken;
  }
}

module.exports = new TinkoffAPI();

