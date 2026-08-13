# Ivanov Works

Сайт ИИ-студии Дмитрия Иванова. Проект работает на Next.js и разворачивается
на собственном сервере в Docker. Входящий HTTPS-трафик принимает Caddy, который
автоматически выпускает и продлевает TLS-сертификаты.

## Требования

Для локальной разработки:

- Node.js 22.13 или новее;
- npm.

Для сервера:

- Ubuntu 24.04 LTS;
- Docker Engine с плагином Docker Compose;
- открытые входящие порты 80 и 443;
- DNS-записи домена, направленные на публичный IP сервера.

## Локальная разработка

```bash
npm ci
npm run dev
```

Сайт будет доступен по адресу `http://localhost:3000`.

Проверки перед публикацией:

```bash
npm run lint
npm run build
docker compose config --quiet
```

## Переменные окружения

Создайте в корне проекта файл `.env`. Он не должен попадать в Git.

```dotenv
TELEGRAM_BOT_TOKEN=replace-me
TELEGRAM_CHAT_ID=replace-me
TELEGRAM_PROXY_URL=http://proxy.example:3128
TELEGRAM_PROXY_USER=replace-me
TELEGRAM_PROXY_PASSWORD=replace-me

# Необязательно: тема в Telegram-группе.
TELEGRAM_THREAD_ID=

# Необязательно: основной домен для Caddy. По умолчанию ivanov.works.
SITE_DOMAIN=ivanov.works
```

Адрес прокси указывается вместе с протоколом `http://` или `https://`.
Секреты доступны только серверному обработчику `/api/contact` и не передаются
в клиентский JavaScript.

Настройки registry хранятся в отдельном файле `.env.pypi`, который не попадает
в Git:

```dotenv
PYPI_DOMAIN=pypi.ivanov.works
PYPI_USERNAME=ivanov
PYPI_PASSWORD_HASH='$2a$14$replace-with-caddy-password-hash'
```

`PYPI_PASSWORD_HASH` содержит хеш, а не пароль. Получить его можно интерактивной
командой:

```bash
docker run --rm -it caddy:2-alpine caddy hash-password
```

В `.env.pypi` хеш нужно заключить в одинарные кавычки, чтобы символы `$`
сохранились без изменений.

## Приватный Python Package Index

Registry доступен по адресу `https://pypi.ivanov.works`. Caddy проверяет Basic
Auth и передаёт запросы в отдельный контейнер `pypi`. Контейнер не публикует
порт на хосте и хранит пакеты в именованном томе `pypi_packages`.

Подключение registry к проекту с `uv`:

```toml
[[tool.uv.index]]
name = "ivanov-private"
url = "https://pypi.ivanov.works/simple/"
publish-url = "https://pypi.ivanov.works/"
explicit = true
```

Логин и пароль передаются через окружение:

```bash
export UV_INDEX_IVANOV_PRIVATE_USERNAME=ivanov
export UV_INDEX_IVANOV_PRIVATE_PASSWORD=replace-me
export UV_PUBLISH_USERNAME=ivanov
export UV_PUBLISH_PASSWORD=replace-me
```

Сборка и публикация пакета:

```bash
uv build
uv publish --index ivanov-private
```

Версии опубликованных пакетов нельзя перезаписывать. Для исправления выпускается
новая версия пакета.

## Развёртывание

До первого запуска создайте DNS-записи `A` для основного домена и `www`,
направленные на IP сервера. Если используется IPv6, добавьте корректные
`AAAA`-записи. Убедитесь, что firewall и панель хостинга пропускают TCP 80/443
и UDP 443.

Скопируйте проект и заполненный `.env` на сервер, затем выполните:

```bash
docker compose up -d --build
docker compose ps
```

Caddy получит сертификат после того, как домен начнёт разрешаться в IP сервера.
Проверить запуск и выпуск сертификата можно по логам:

```bash
docker compose logs -f app caddy
```

Для обновления сайта:

```bash
git pull
docker compose up -d --build
```

Данные и учётная информация Caddy хранятся в именованных томах
`caddy_data` и `caddy_config`, поэтому сертификаты сохраняются при пересоздании
контейнеров.

## Структура

- `app/` — страницы, компоненты, стили и серверный обработчик формы;
- `public/` — шрифты, favicon и оригинальные фирменные SVG;
- `Dockerfile` — многоэтапная сборка standalone-приложения;
- `compose.yaml` — приложение и reverse proxy;
- `Caddyfile` — HTTPS, сжатие, заголовки и проксирование.
