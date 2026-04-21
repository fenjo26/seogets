# SEO Gets — Personal GSC Dashboard

**Проблема:** Когда у тебя 150+ сайтов на нескольких Google аккаунтах, ты тратишь час в день на логины и ручной просмотр статистики в Google Search Console. Это не масштабируется.

**Решение:** SEO Gets — личная панель управления, которая подключается ко всем твоим Google аккаунтам через официальный GSC API и показывает все сайты в одном месте. Открыл браузер — сразу видишь всю картину.

---

## Что умеет

- **Единый дашборд** — все сайты со всех Google аккаунтов на одном экране
- **Мини-графики трафика** — спарклайн для каждого сайта, сразу видно динамику
- **Фильтр по периоду** — 7D / 1M / 3M / 6M / 1Y
- **Поиск** — быстро находить нужный домен среди сотен сайтов
- **Избранное** — закрепить важные проекты наверху
- **Privacy Blur** — размыть домены для скриншотов и записи экрана

---

## Стек

- **Next.js 16** (App Router, Turbopack)
- **Prisma 5** + SQLite (локальное хранение)
- **NextAuth** — авторизация через Google OAuth
- **Recharts** — графики
- **Google Search Console API** — источник данных

---

## Локальный запуск

### 1. Установи зависимости
```bash
npm install
```

### 2. Заполни `.env`
Скопируй `.env.template` → `.env` и заполни:

```env
DATABASE_URL="file:./dev.db"

NEXTAUTH_SECRET="сгенерируй: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

ADMIN_EMAIL="твой@email.com"
ADMIN_PASSWORD="твой_пароль"

GOOGLE_CLIENT_ID="из Google Cloud Console"
GOOGLE_CLIENT_SECRET="из Google Cloud Console"
```

### 3. Создай базу данных
```bash
npx prisma db push
```

### 4. Запусти
```bash
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

---

## Настройка Google OAuth

1. Перейди в [Google Cloud Console](https://console.cloud.google.com/)
2. Создай проект → **APIs & Services → Credentials**
3. Создай **OAuth 2.0 Client ID** (тип: Web application)
4. Добавь Redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Включи **Google Search Console API** в библиотеке API
6. Скопируй Client ID и Secret в `.env`

---

## Структура проекта

```
src/
  app/
    page.tsx              # Главный дашборд — список всех сайтов
    login/page.tsx        # Страница входа
    settings/page.tsx     # Настройки и подключение аккаунтов
    api/
      auth/               # NextAuth
      gsc/sites/          # API: получение сайтов из GSC
  lib/
    auth.ts               # Конфигурация NextAuth
    prisma.ts             # Prisma клиент
prisma/
  schema.prisma           # Схема БД
```
