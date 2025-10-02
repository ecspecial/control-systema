# 🏗️ Система Контроля Благоустройства

Интерактивная система управления процессами благоустройства города с геолокационной верификацией, автоматическим распознаванием документов и электронным журналом работ.

---

## 📋 Содержание

- [О проекте](#о-проекте)
- [Технологический стек](#технологический-стек)
- [Архитектура системы](#архитектура-системы)
- [Роли пользователей](#роли-пользователей)
- [Установка и запуск](#установка-и-запуск)
  - [Локальная разработка](#локальная-разработка)
  - [Развертывание на сервере](#развертывание-на-сервере)
- [Конфигурация](#конфигурация)
- [Тестовые пользователи](#тестовые-пользователи)
- [API документация](#api-документация)
- [Особенности реализации](#особенности-реализации)

---

## 🎯 О проекте

Система разработана в соответствии с техническим заданием Правительства Москвы для цифровизации процессов контроля благоустройства. Решение обеспечивает:

- ✅ **Геолокационную верификацию** присутствия инспекторов на объектах
- ✅ **Автоматическое распознавание ТТН** с помощью компьютерного зрения
- ✅ **Электронный журнал работ** с защитой от фальсификации
- ✅ **Интерактивную карту объектов** на базе OpenStreetMap
- ✅ **Систему контроля замечаний** и управление графиками работ
- ✅ **Полную технологическую независимость** от зарубежных сервисов

### Ключевые преимущества

🔐 **Технологическая независимость** - использование только открытых технологий  
🗺️ **OpenStreetMap** - независимость от зарубежных картографических сервисов  
🤖 **Собственный OCR** - распознавание документов на базе PaddleOCR  
📱 **Адаптивный дизайн** - работа на десктопе и мобильных устройствах  
🔒 **Безопасность** - JWT авторизация, хеширование паролей  

---

## 🛠 Технологический стек

### Frontend
- **React 19** - современный UI фреймворк
- **TypeScript** - типизированный JavaScript
- **React Router** - маршрутизация
- **Axios** - HTTP клиент
- **MapLibre GL** - отображение карт (OpenStreetMap)
- **Vis-Timeline** - визуализация графиков работ
- **SCSS** - стилизация компонентов
- **Vite** - сборщик проекта

### Backend
- **NestJS** - масштабируемый Node.js фреймворк
- **TypeORM** - ORM для работы с БД
- **PostgreSQL 14** - реляционная база данных
- **JWT** - аутентификация и авторизация
- **Fastify** - высокопроизводительный веб-сервер
- **bcrypt** - хеширование паролей
- **Multer** - загрузка файлов

### OCR Service
- **Python 3.9** - язык программирования
- **FastAPI** - современный API фреймворк
- **PaddleOCR** - библиотека распознавания текста
- **PaddlePaddle** - фреймворк глубокого обучения
- **Pillow** - обработка изображений

### Infrastructure
- **Docker & Docker Compose** - контейнеризация
- **Nginx** - веб-сервер и reverse proxy
- **Certbot** - SSL сертификаты

---

## 🏗 Архитектура системы

```
┌─────────────────┐
│   Frontend      │  React + TypeScript + MapLibre
│   (Port 3000)   │  Адаптивный веб-интерфейс
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │  NestJS + TypeORM + PostgreSQL
│   (Port 3001)   │  REST API, JWT Auth, Business Logic
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │   OCR Service   │
│   (Port 5433)   │  │   (Port 8000)   │
│   База данных   │  │   PaddleOCR     │
└─────────────────┘  └─────────────────┘
```

### Основные модули Backend

- **Users Module** - управление пользователями и аутентификация
- **Objects Module** - управление объектами благоустройства
- **Electronic Journal Module** - электронный журнал работ и замечаний
- **Laboratory Samples Module** - учет лабораторных проб
- **Files Module** - загрузка и хранение файлов

---

## 👥 Роли пользователей

Система поддерживает 4 роли пользователей:

### 1. 👨‍💼 Администратор (admin)
- Создание и управление объектами
- Назначение ответственных лиц
- Полный доступ ко всем функциям

### 2. 🔍 Служба строительного контроля (control)
- Активация объектов
- Внесение замечаний
- Верификация выполненных работ
- Управление графиками работ

### 3. 👷 Подрядчик/Прораб (contractor)
- Загрузка и распознавание ТТН
- Контроль поставок материалов
- Отметка выполненных работ
- Устранение замечаний

### 4. 🔎 Инспектор контрольного органа (inspector)
- Согласование активации объектов
- Внесение нарушений
- Инициирование лабораторных проб
- Контроль устранения нарушений

---

## 🚀 Установка и запуск

### Предварительные требования

- **Docker** и **Docker Compose**
- **Node.js** 18+ и **npm** (для локальной разработки)
- **Python** 3.9+ (для разработки OCR сервиса)
- **Git**

### Локальная разработка

#### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd control-systema
```

#### 2. Создание Docker сети

```bash
docker network create city_service_network
docker network ls
```

#### 3. Запуск PostgreSQL

```bash
cd docker
docker-compose up -d
```

Проверка состояния:
```bash
docker ps
docker logs city-service-postgres
```

#### 4. Настройка Backend

```bash
cd ../backend

# Установка зависимостей
npm install

# Настройка .env файла
# Создайте файл backend/.env со следующим содержимым:
```

**backend/.env:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=cityservice
DB_PASSWORD=cityservice123
DB_DATABASE=city_service

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Application Configuration
PORT=3001
NODE_ENV=development

# File Upload Configuration
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760

# Frontend URL (для CORS)
FRONTEND_URL=http://localhost:3000

# OCR Service URL
OCR_SERVICE_URL=http://localhost:8000

# Для развертывания на сервере закомментируйте localhost и раскомментируйте:
# DB_HOST=city-service-postgres
# FRONTEND_URL=https://control-systema.ru
# OCR_SERVICE_URL=http://ocr-service:8000
```

```bash
# Сборка и запуск в Docker
docker-compose build
docker-compose up -d

# Выполнение миграций
npm run migration:run

# Загрузка тестовых данных
npm run seed
```

#### 5. Настройка Frontend

```bash
cd ../frontend

# Установка зависимостей
npm install

# Настройка .env файла
# Создайте файл frontend/.env со следующим содержимым:
```

**frontend/.env:**
```env
# Backend API URL
VITE_API_URL=http://localhost:3001/api

# OCR Service URL
VITE_OCR_URL=http://localhost:8000

# Для развертывания на сервере закомментируйте localhost и раскомментируйте:
# VITE_API_URL=https://control-systema.ru/api
# VITE_OCR_URL=https://control-systema.ru/ocr
```

```bash
# Запуск в режиме разработки
npm run dev

# Или сборка и запуск в Docker
docker-compose build
docker-compose up -d
```

#### 6. Запуск OCR Service

```bash
cd ../ocr

# Сборка и запуск
docker-compose build
docker-compose up -d

# Проверка логов
docker-compose logs -f
```

Проверка работоспособности OCR:
```bash
curl http://localhost:8000/health
```

### Развертывание на сервере

#### 1. Подготовка сервера

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Установка Nginx
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

#### 2. Настройка .env файлов

В файлах `backend/.env` и `frontend/.env` раскомментируйте строки для production и закомментируйте localhost.

#### 3. Запуск сервисов

```bash
# Создание сети
docker network create city_service_network

# Запуск PostgreSQL
cd docker
docker-compose up -d

# Запуск Backend
cd ../backend
docker-compose build
docker-compose up -d
npm run migration:run
npm run seed

# Запуск Frontend
cd ../frontend
docker-compose build
docker-compose up -d

# Запуск OCR Service
cd ../ocr
docker-compose build
docker-compose up -d
```

#### 4. Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/control-systema.ru
```

**Конфигурация Nginx:**
```nginx
server {
    listen 80;
    server_name control-systema.ru www.control-systema.ru;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }

    # OCR Service
    location /ocr {
        rewrite ^/ocr/(.*) /$1 break;
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 10M;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3001/uploads;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/control-systema.ru /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
```

#### 5. Настройка SSL

```bash
sudo certbot --nginx -d control-systema.ru -d www.control-systema.ru
```

---

## ⚙️ Конфигурация

### Переменные окружения Backend

| Переменная | Описание | Пример |
|-----------|----------|--------|
| `DB_HOST` | Хост базы данных | `localhost` или `city-service-postgres` |
| `DB_PORT` | Порт базы данных | `5433` |
| `DB_USERNAME` | Пользователь БД | `cityservice` |
| `DB_PASSWORD` | Пароль БД | `cityservice123` |
| `DB_DATABASE` | Имя базы данных | `city_service` |
| `JWT_SECRET` | Секретный ключ JWT | `your-secret-key` |
| `JWT_EXPIRES_IN` | Время жизни токена | `7d` |
| `PORT` | Порт бэкенда | `3001` |
| `UPLOAD_DEST` | Папка для загрузок | `./uploads` |
| `FRONTEND_URL` | URL фронтенда (CORS) | `http://localhost:3000` |
| `OCR_SERVICE_URL` | URL OCR сервиса | `http://localhost:8000` |

### Переменные окружения Frontend

| Переменная | Описание | Пример |
|-----------|----------|--------|
| `VITE_API_URL` | URL Backend API | `http://localhost:3001/api` |
| `VITE_OCR_URL` | URL OCR Service | `http://localhost:8000` |

---

## 👤 Тестовые пользователи

**⚠️ ВАЖНО: Все логины вводятся СТРОЧНЫМИ буквами!**

### Администратор
- **Логин:** `admin`
- **Пароль:** `password123`
- **Роль:** Администратор системы

### Служба строительного контроля
- **Логин:** `control1`
- **Пароль:** `password123`
- **ФИО:** Петров Иван Сергеевич

- **Логин:** `control2`
- **Пароль:** `password123`
- **ФИО:** Васильев Сергей Петрович

- **Логин:** `control3`
- **Пароль:** `password123`
- **ФИО:** Соколов Михаил Андреевич

### Подрядчики
- **Логин:** `contractor1`
- **Пароль:** `password123`
- **ФИО:** Сидоров Петр Олегович
- **Организация:** ООО "СтройГород"

- **Логин:** `contractor2`
- **Пароль:** `password123`
- **ФИО:** Николаев Алексей Викторович
- **Организация:** АО "УралСтрой"

- **Логин:** `contractor3`
- **Пароль:** `password123`
- **ФИО:** Морозов Дмитрий Сергеевич
- **Организация:** ООО "СибирьСтрой"

### Инспекторы
- **Логин:** `inspector1`
- **Пароль:** `password123`
- **ФИО:** Кузнецов Александр Игоревич
- **Орган:** Государственная инспекция

- **Логин:** `inspector2`
- **Пароль:** `password123`
- **ФИО:** Федоров Владимир Николаевич
- **Орган:** Государственная инспекция

- **Логин:** `inspector3`
- **Пароль:** `password123`
- **ФИО:** Павлов Андрей Юрьевич
- **Орган:** Государственная инспекция

---

## 📚 API документация

### Аутентификация

#### POST `/api/users/login`
Вход в систему

**Запрос:**
```json
{
  "login": "admin",
  "password": "password123"
}
```

**Ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "firstName": "Главный",
    "lastName": "Администратор",
    "middleName": "Админович",
    "role": "admin"
  }
}
```

### Объекты благоустройства

#### GET `/api/objects`
Получение списка объектов

#### POST `/api/objects`
Создание нового объекта (только admin)

#### GET `/api/objects/:id`
Получение детальной информации об объекте

#### PATCH `/api/objects/:id/activate`
Активация объекта (control)

### Электронный журнал

#### GET `/api/electronic-journal/:objectId/violations`
Получение списка замечаний

#### POST `/api/electronic-journal/:objectId/violations`
Внесение замечания

### OCR Service

#### POST `/ocr/submit`
Отправка изображения на распознавание

#### GET `/ocr/status/:taskId`
Проверка статуса обработки

---

## 🔧 Полезные команды

### Docker

```bash
# Просмотр запущенных контейнеров
docker ps

# Просмотр логов
docker logs <container-name>
docker-compose logs -f

# Остановка всех контейнеров
docker-compose down

# Пересборка и перезапуск
docker-compose build && docker-compose down && docker-compose up -d

# Очистка
docker stop city-service-postgres
docker rm city-service-postgres
docker volume rm docker_city_service_postgres_data
```

### Database

```bash
# Выполнение миграций
cd backend
npm run migration:run

# Откат последней миграции
npm run migration:revert

# Загрузка тестовых данных
npm run seed
```

### Разработка

```bash
# Frontend dev server
cd frontend
npm run dev

# Backend dev mode
cd backend
npm run start:dev

# Просмотр логов OCR
cd ocr
docker-compose logs -f
```

---

## 🌟 Особенности реализации

### Геолокационная верификация

Система проверяет, находится ли пользователь внутри полигона объекта с учетом погрешности GPS:
- Расчет минимального расстояния до границ полигона
- Учет точности определения координат
- Блокировка функций при отсутствии на объекте

### Распознавание документов

OCR сервис использует PaddleOCR с поддержкой русского языка:
- Очередь обработки запросов
- Асинхронная обработка изображений
- Сохранение результатов распознавания
- Поддержка различных форматов изображений

### Электронный журнал

Защита от фальсификации данных:
- Автоматическая фиксация времени и координат
- Невозможность редактирования после создания
- История всех действий пользователей

### Управление графиками работ

Интерактивная диаграмма Ганта:
- Визуализация с помощью Vis-Timeline
- Возможность изменения сроков с согласованием
- Контроль отклонений от плана

---

## 📄 Лицензия

Проект разработан для участия в конкурсе Правительства Москвы по цифровизации процессов благоустройства.

---

## 📞 Поддержка

При возникновении проблем с развертыванием или использованием системы, обратитесь к документации или создайте issue в репозитории.

---

**Разработано с использованием полностью открытых технологий для обеспечения технологической независимости Российской Федерации.**
```