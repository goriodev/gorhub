# GorHub 🚀

A full-stack business management platform — e-commerce inventory, order management, and kanban task tracking in one secure app.

**Stack:** Next.js 14 (App Router) · PostgreSQL · Prisma ORM · NextAuth.js · Tailwind CSS · TypeScript · Zod

---

## Features

- **Auth** — Secure login/register with bcrypt password hashing, JWT sessions, route-level middleware
- **Products** — Full CRUD with SKU, stock, category, status management
- **Orders** — Create orders from products, update status, expandable item view
- **Tasks** — Kanban board (Todo → In Progress → In Review → Done) with priorities and projects
- **Dashboard** — Revenue, order, product, and task stats at a glance
- **Security** — Rate limiting, Zod input validation, security headers, auth guards on every API route

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/gorhub.git
cd gorhub
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/gorhub?schema=public"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed demo data (optional)
npm run db:seed
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:** `demo@gorhub.com` / `Demo1234!`

---

## Push to GitHub

```bash
# 1. Create a new repo on github.com (no README, no .gitignore)
# 2. Initialize and push:
git init
git add .
git commit -m "Initial commit: GorHub full-stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gorhub.git
git push -u origin main
```

---

## Deploy to Vercel

1. Push to GitHub (above)
2. Go to [vercel.com](https://vercel.com) → Import project → select your repo
3. Add environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
4. Deploy — Vercel auto-detects Next.js

> **Tip:** Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for a free hosted PostgreSQL database.

---

## API Reference

All endpoints require authentication (session cookie).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard metrics |
| GET/POST | `/api/products` | List/create products |
| PATCH/DELETE | `/api/products/:id` | Update/delete product |
| GET/POST | `/api/orders` | List/create orders |
| PATCH | `/api/orders/:id` | Update order status |
| GET/POST | `/api/tasks` | List/create tasks |
| PATCH/DELETE | `/api/tasks/:id` | Update/delete task |
| POST | `/api/auth/register` | Register new user |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login & register     # Auth pages
│   ├── api/                        # API routes (products, orders, tasks, stats)
│   └── dashboard/                  # Protected dashboard pages
├── components/dashboard/           # Sidebar, TopBar
└── lib/
    ├── prisma.ts                   # Singleton Prisma client
    ├── auth.ts                     # NextAuth config
    └── rate-limit.ts               # In-memory rate limiter
prisma/
    ├── schema.prisma               # Database models
    └── seed.ts                     # Demo data seeder
```
