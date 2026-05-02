# Система регистрации посетителей организации

Fullstack-приложение для учёта посетителей на Next.js 14 с MySQL, Prisma и Docker.

## Стек

- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Next.js API Routes, Prisma ORM
- **БД:** MySQL 8.0
- **Инфраструктура:** Docker Compose

## Быстрый старт

```bash
git clone https://github.com/Z1ppzy/officeVisitorSystem.git
cd officeVisitorSystem
docker compose up --build
```

Приложение запустится на [http://localhost:3000](http://localhost:3000).  
База данных автоматически заполняется тестовыми данными (5 сотрудников, 30 посетителей, 100 визитов).

## Разработка без Docker

### Требования

- Node.js 20+
- MySQL 8.0

### Установка

```bash
# Установить зависимости
npm install

# Скопировать и настроить переменные окружения
cp .env.example .env
# Отредактировать .env: указать свою строку подключения к БД

# Применить миграции
npx prisma migrate dev

# Заполнить тестовыми данными
npm run db:seed

# Запустить dev-сервер
npm run dev
```

## Переменные окружения

| Переменная     | Описание                    | Пример                                         |
| -------------- | --------------------------- | ---------------------------------------------- |
| `DATABASE_URL` | Строка подключения к MySQL  | `mysql://root:password@localhost:3306/visitors_db` |

## Структура проекта

```
├── app/
│   ├── api/              # API Routes
│   │   ├── analytics/    # GET статистика
│   │   ├── employees/    # CRUD сотрудников
│   │   ├── visitors/     # CRUD посетителей
│   │   └── visits/       # CRUD + checkout визитов
│   ├── employees/        # Страница сотрудников
│   ├── visitors/         # Список + карточка посетителя
│   ├── visits/           # Журнал визитов
│   └── page.tsx          # Dashboard
├── components/
│   ├── ui/               # shadcn/ui компоненты
│   ├── Sidebar.tsx
│   └── NewVisitModal.tsx
├── lib/
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── Dockerfile
└── docker-compose.yml
```

## Возможности

- **Dashboard** — статистика за день/месяц, графики посещений (LineChart, PieChart), таблица активных визитов с кнопкой выхода
- **Посетители** — поиск с debounce, пагинация, inline-редактирование карточки, история визитов
- **Визиты** — журнал с фильтрами по дате и статусу, экспорт в CSV
- **Сотрудники** — справочник с полным CRUD
- Автогенерация пропуска: `VIS-{YYYY}-{0001}`
- Toast-уведомления, skeleton-загрузка, валидация форм через Zod
