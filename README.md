# SEO Gets — Personal GSC Dashboard

Личная панель управления Google Search Console. Все сайты со всех Google аккаунтов — в одном месте. Устанавливается на VPS за 5 минут.

---

## Что умеет

- **Единый дашборд** — все сайты со всех Google аккаунтов на одном экране
- **Мини-графики трафика** — спарклайн для каждого сайта, сразу видно динамику
- **Фильтр по периоду** — Yesterday / 7D / 14D / 28D / 3M / 6M / 1Y
- **Сравнение периодов** — Previous / Year over Year / Custom
- **Поиск** — быстро находить нужный домен среди сотен сайтов
- **Избранное** — закрепить важные проекты наверху
- **Скрытие сайтов** — убрать неактивные из общего списка
- **Экспорт в CSV** — выгрузка с выбором измерений
- **Privacy Blur** — размыть домены для скриншотов и записи экрана
- **Dark / Light Mode** — переключение темы
- **Детальная страница сайта** — графики, запросы, страницы, страны, устройства

---

## Требования к VPS

| Параметр | Минимум | Рекомендуется |
|---|---|---|
| **ОС** | Ubuntu 22.04 LTS | Ubuntu 22.04 / 24.04 LTS |
| **CPU** | 1 vCPU | 2 vCPU |
| **RAM** | 1 GB | 2 GB |
| **Диск** | 10 GB SSD | 20 GB SSD |

> Node.js, PM2, Nginx и все зависимости устанавливаются **автоматически** скриптом. Ничего ставить руками не нужно.

Протестировано на **Ubuntu 22.04 LTS**. Другие Debian-based дистрибутивы тоже работают. CentOS / RHEL — не поддерживаются.

---

## Установка на VPS

### 1. Подключись к серверу

```bash
ssh root@YOUR_SERVER_IP
```

### 2. Клонируй репозиторий

```bash
git clone https://github.com/fenjo26/seogets.git
cd seogets
```

### 3. Создай Google OAuth приложение

Перед запуском установщика нужны Google OAuth credentials. Занимает ~5 минут.

**Шаг 1 — Создай проект**

Открой [Google Cloud Console](https://console.cloud.google.com/) и создай новый проект (или используй существующий).

**Шаг 2 — Включи Search Console API**

APIs & Services → Library → найди **Google Search Console API** → Enable.

**Шаг 3 — Создай OAuth Client ID**

APIs & Services → Credentials → Create Credentials → **OAuth 2.0 Client ID**, тип: **Web application**.

Заполни два поля:

| Поле | Значение |
|---|---|
| Authorized JavaScript origins | `https://твой-домен.com` |
| Authorized redirect URIs | `https://твой-домен.com/api/auth/callback/google` |

> **Используешь VPS без домена?** Замени `https://твой-домен.com` на `http://IP_СЕРВЕРА:3000` (именно `http://`, не `https://`).

**Шаг 4 — Скопируй credentials**

После создания появятся **Client ID** и **Client Secret** — установщик их спросит.

### 4. Запусти установщик

```bash
sudo bash install.sh
```

Скрипт спросит:
- Домен или IP сервера
- Порт приложения (по умолчанию 3000)
- Устанавливать ли Nginx (рекомендуется — да)
- Настраивать ли SSL через Let's Encrypt (только если есть реальный домен)
- Email для SSL-сертификата
- Google Client ID и Client Secret

После этого сам:
- Установит Node.js 20 LTS
- Установит PM2 и запустит приложение как системный сервис
- Настроит Nginx как reverse proxy
- Опционально выпустит SSL-сертификат через Certbot
- Настроит UFW firewall (порты 22, 80, 443)

---

## Варианты деплоя

### Вариант A: Домен + HTTPS (рекомендуется)

Лучший вариант для продакшна. Нужен домен, привязанный к IP сервера.

В Google Console:
```
Authorized JavaScript origins:  https://твой-домен.com
Authorized redirect URIs:        https://твой-домен.com/api/auth/callback/google
```

В установщике: домен → `твой-домен.com`, SSL → `Y`.

Результат: `https://твой-домен.com`

### Вариант B: VPS по IP, без домена

Подходит для личного использования. Работает без SSL (браузер покажет «небезопасно»).

В Google Console:
```
Authorized JavaScript origins:  http://123.45.67.89:3000
Authorized redirect URIs:        http://123.45.67.89:3000/api/auth/callback/google
```

В установщике: домен → `123.45.67.89`, SSL → `N`.

Результат: `http://123.45.67.89:3000`

### Вариант C: Ручная установка

Если хочешь настроить всё самостоятельно без скрипта:

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# PM2
npm install -g pm2

# Зависимости проекта
npm install

# .env — скопируй шаблон и заполни
cp .env.template .env
nano .env

# База данных и сборка
npx prisma generate
npx prisma db push
npm run build

# Запуск
pm2 start npm --name seogets -- start
pm2 save
pm2 startup
```

---

## Переменные окружения

| Переменная | Описание | Пример |
|---|---|---|
| `DATABASE_URL` | Путь к SQLite базе данных | `file:/home/user/seogets/data/prod.db` |
| `NEXTAUTH_SECRET` | Случайный секрет для шифрования сессий | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Полный URL твоего приложения | `https://твой-домен.com` |
| `GOOGLE_CLIENT_ID` | Из Google Cloud Console | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Из Google Cloud Console | `GOCSPX-...` |

> `NEXTAUTH_URL` должен **точно совпадать** с тем, что указано в Google Console. Если там `https://` — здесь тоже `https://`. Несовпадение = ошибка `redirect_uri_mismatch`.

Сгенерировать секрет:
```bash
openssl rand -base64 32
```

---

## Как работает авторизация

SEO Gets использует **только Google OAuth** — никаких паролей.

- Первый вход → «Sign in with Google» → этот аккаунт становится **владельцем** дашборда
- В **Settings → My Google Accounts** можно добавить дополнительные Google аккаунты
- Сайты со всех добавленных аккаунтов автоматически появляются на дашборде

---

## Управление приложением

```bash
pm2 logs seogets       # просмотр логов
pm2 restart seogets    # перезапуск
pm2 stop seogets       # остановка
pm2 status             # статус всех процессов
```

### Обновление до новой версии

```bash
cd /root/seogets
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart seogets
```

---

## Частые проблемы

**Логотип не отображается на странице входа**

В middleware не были исключены публичные файлы. Убедись что используешь актуальную версию `src/middleware.ts` из репозитория.

**Ошибка `redirect_uri_mismatch` при входе через Google**

URL в `.env` (`NEXTAUTH_URL`) не совпадает с Authorized redirect URI в Google Console. Они должны быть одинаковыми — вплоть до `http://` vs `https://`.

**Бесконечный редирект на `/login` после входа**

Проверь `NEXTAUTH_URL` в `.env`. Если приложение работает по HTTPS — убедись что SSL-сертификат действителен. Если по HTTP — проверь что в `NEXTAUTH_URL` нет `https://`.

**База данных пропала после перезапуска**

Используй абсолютный путь в `DATABASE_URL`, не относительный. Установщик делает это автоматически (`file:/root/seogets/data/prod.db`). При ручной установке задай путь явно.

**`pm2 restart seogets` не помогает после `git pull`**

После обновления нужно пересобрать проект:
```bash
npm run build && pm2 restart seogets
```

---

## Стек

- **Next.js 16** (App Router, Turbopack)
- **Prisma 5** + SQLite
- **NextAuth v4** — авторизация через Google OAuth
- **Recharts** — графики
- **Google Search Console API** — источник данных
- **PM2** — процесс-менеджер
- **Nginx** — reverse proxy

---

## Структура проекта

```
src/
  app/
    page.tsx              # Главный дашборд — все сайты
    site/[id]/page.tsx    # Детальная страница сайта
    login/page.tsx        # Страница входа
    settings/page.tsx     # Настройки и управление аккаунтами
    api/
      auth/               # NextAuth
      gsc/sites/          # Получение сайтов из GSC
      gsc/accounts/       # Управление Google аккаунтами
  lib/
    auth.ts               # Конфигурация NextAuth
    prisma.ts             # Prisma клиент
    PrivacyContext.tsx    # Глобальный Privacy Blur
    ThemeContext.tsx      # Тема (dark / light)
    LayoutContext.tsx     # Layout (wide / default)
prisma/
  schema.prisma           # Схема БД
install.sh                # Установщик для VPS (Ubuntu/Debian)
```
