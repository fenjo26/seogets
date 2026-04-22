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

Перед запуском установщика нужны Google OAuth credentials:

1. Открой [Google Cloud Console](https://console.cloud.google.com/) → создай проект
2. **APIs & Services → Credentials → Create OAuth 2.0 Client ID** (тип: Web application)
3. В поле **Authorized redirect URIs** добавь: `https://твой-домен.com/api/auth/callback/google`
4. **APIs & Services → Library** → найди и включи **Google Search Console API**
5. Скопируй **Client ID** и **Client Secret** — установщик их спросит

### 4. Запусти установщик

```bash
sudo bash install.sh
```

Скрипт спросит:
- Домен или IP сервера
- Порт приложения (по умолчанию 3000)
- Устанавливать ли Nginx (рекомендуется — да)
- Настраивать ли SSL через Let's Encrypt (только если есть домен)
- Google Client ID и Client Secret

После этого сам:
- Установит Node.js 20 LTS
- Установит PM2 и запустит приложение как системный сервис
- Настроит Nginx как reverse proxy
- Опционально выпустит SSL-сертификат через Certbot
- Настроит UFW firewall (порты 22, 80, 443)

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
npm run build
pm2 restart seogets
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
