# JEE Test Platform — Master Scaffolding

This is the scaffolded monorepo structure for the production-ready JEE (Mains + Advanced) Test Platform.

---

## 🛠️ Prerequisites
- **Node.js**: v20.x or higher
- **PostgreSQL**: v14 or higher (Database)
- **Redis**: v6.x or higher (Caching & Leaderboards)

---

## 📂 Project Structure
- `/backend`: Express API with MVC architecture and Prisma client configuration.
- `/frontend`: Next.js 14 (App Router) client with Tailwind CSS, custom color theme, Lucide icons, and MathJax integration.
- `/database`: Prisma schema (`schema.prisma`) and DB seed configurations.

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env` in the root:
```bash
cp .env.example .env
```
And customize your PostgreSQL connection URL, Redis path, and service credentials.

---

### 2. Installation
To install all dependencies across root, backend, and frontend directories concurrently, run:
```bash
npm run install:all
```
*Alternatively, you can install individually:*
- **Backend**: `cd backend && npm install`
- **Frontend**: `cd frontend && npm install`
- **Root**: `npm install` (Installs `concurrently`)

---

### 3. Database Migrations & Seeding
From the `/backend` directory or root, perform the initial database migration:
```bash
# Execute migrations
npx prisma migrate dev --name init --schema=../database/schema.prisma

# Launch Prisma Studio to visualize database tables
npx prisma studio --schema=../database/schema.prisma
```

To seed the database with initial values, execute the placeholder seed script:
```bash
node database/seed.js
```

---

### 4. Running the Applications
Run both backend and frontend applications concurrently from the root directory:
```bash
npm run dev
```

#### Individual Commands:
- Run Backend Dev Server (Port 3001): `npm run backend:dev`
- Run Frontend Dev Server (Port 3000): `npm run frontend:dev`

---

## 📡 API Endpoints Summary
All backend endpoints are prefixed with `/api/v1`.
- **Health Check**: `GET /api/v1/health`
- **Auth**: `POST /auth/register`, `POST /auth/login`, `POST /auth/send-otp`, `POST /auth/verify-otp`
- **Questions**: `GET /questions`, `POST /questions`, `PUT /questions/:id`, `DELETE /questions/:id`
- **Tests**: `GET /tests`, `POST /tests`, `GET /tests/:id`, `POST /tests/:id/start`, `POST /tests/:id/submit`, `GET /tests/:id/result`
- **Analytics & Leaderboard**: `GET /analytics/me`, `GET /analytics/test/:id`, `GET /leaderboard/:test_id`
- **Payments**: `POST /payments/create-order`, `POST /payments/verify`
