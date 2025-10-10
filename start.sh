#!/bin/bash

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              🌊  eWave eSIM App  🌊                       ║"
echo "║                                                            ║"
echo "║         Telegram Mini App для продажи eSIM                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo -e "${RED}⚠️  Файл .env не найден!${NC}"
    echo -e "${YELLOW}📝 Создай .env файл или запусти: cp .env.example .env${NC}"
    echo -e "${YELLOW}📖 Инструкция: SETUP.md${NC}"
    exit 1
fi

# Проверка API ключа
if ! grep -q "ESIM_GO_API_KEY=_3yKwRuZoP43qBpyk5ryzqypowLM6domwydwYASH" .env; then
    echo -e "${YELLOW}⚠️  API ключ eSIM-GO не найден в .env${NC}"
    echo -e "${YELLOW}Убедись что файл .env содержит:${NC}"
    echo -e "${BLUE}ESIM_GO_API_KEY=_3yKwRuZoP43qBpyk5ryzqypowLM6domwydwYASH${NC}"
fi

# Проверка наличия node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Установка зависимостей...${NC}"
    npm install
    echo ""
fi

echo -e "${GREEN}✅ Всё готово к запуску!${NC}"
echo ""
echo -e "${BOLD}🚀 Запускаю серверы...${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Backend:${NC}  http://localhost:8080"
echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Для остановки нажми: ${BOLD}Ctrl+C${NC}"
echo ""
echo -e "${CYAN}💡 После запуска открой: ${BOLD}http://localhost:3000${NC}"
echo ""

# Ждем 2 секунды
sleep 2

# Запуск backend и frontend одновременно
trap 'echo ""; echo "👋 Остановка серверов..."; kill 0' EXIT INT TERM

npm run server:dev &
BACKEND_PID=$!

npm run dev &
FRONTEND_PID=$!

# Ждем запуска
wait

