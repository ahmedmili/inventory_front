# Frontend – Gestion de Stock Pro (Next.js)

Next.js (App Router) frontend for Gestion de Stock – Version Pro. It delivers role-aware dashboards, CRUD flows, barcode scanning, and file uploads, consuming the NestJS API.

---

## 🚀 Quick Start

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Default dev server: `http://localhost:3000`

---

## 📁 Structure (planned scaffold)

```
frontend/
├── src/
│   ├── app/                 # App Router routes
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Dashboard
│   │   ├── (auth)/login/
│   │   ├── products/
│   │   ├── warehouses/
│   │   ├── movements/
│   │   ├── purchases/
│   │   ├── sales/
│   │   ├── suppliers/
│   │   ├── customers/
│   │   ├── reports/
│   │   └── admin/
│   ├── components/          # Table, Form, Modal, Chart, BarcodeScanner
│   ├── lib/                 # API client (fetch wrapper, axios or fetch)
│   ├── hooks/               # React Query hooks, auth helpers
│   ├── providers/           # Theme, auth, query clients
│   └── styles/              # Tailwind or CSS modules
├── public/                  # Static assets (logos, icons)
├── Dockerfile
└── package.json
```

---

## ⚙️ Environment Variables (`.env.example`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Base URL for backend (e.g., `http://localhost:4000`) |
| `NEXT_PUBLIC_WS_URL` | Optional WebSocket endpoint |
| `NEXT_PUBLIC_STORAGE_URL` | Base for media assets/S3 |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional monitoring |

Backend issues cookies for refresh tokens; ensure your domain/port config matches.

---

## 🐳 Docker Deployment

### Using Docker Compose

Le projet inclut un `docker-compose.yml` pour déployer le frontend.

```bash
# Démarrer le service
docker-compose up -d

# Voir les logs
docker-compose logs -f frontend

# Arrêter le service
docker-compose down

# Rebuild et redémarrer
docker-compose up -d --build
```

### Using Docker Only

```bash
# Build l'image
docker build -t gestion-stock-frontend .

# Run le container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://your-backend-url:4000 \
  gestion-stock-frontend
```

**Note** : Assurez-vous que `NEXT_PUBLIC_API_URL` pointe vers l'URL de votre backend.

## 🧪 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Run ESLint (once configured) |
| `npm run test` | Unit tests (Jest/RTL) – to be added |

---

## 🔐 Auth Flow

1. User logs in → backend returns access token + refresh token cookie (HTTP-only).
2. Access token stored in memory (React Query context) for API calls.
3. Refresh token rotation handled via `/auth/refresh` endpoint; tokens refreshed via fetcher interceptors.
4. Protected routes use server-side auth checks (Next middleware/route handlers) + client guards.

---

## 📦 UI Building Blocks

- **react-query (TanStack Query)** for data fetching & cache.
- **react-hook-form + zod** for form validation.
- **Tailwind CSS** or styled components for styling (choose in scaffold).
- **Recharts / Chart.js** for dashboard visualizations.
- **Barcode scanning**: hardware scanner input focus + camera scanning via `@zxing/browser`.
- **File uploads**: fetch signed URL from backend → upload to S3/local backend → store metadata.

---

## 🐳 Docker

Dockerfile (to be added) will:

1. Install deps
2. Build Next.js app
3. Run `next start` under Node 18+

Use `docker-compose.yml` at repo root to run alongside backend + DB services.

---

## 🛣️ Roadmap

- Implement full page set for Products, Warehouses, Transfers, Movements, Purchases, Sales, Reports.
- Add PDF preview (fetch generated PDFs from backend).
- Integrate notifications panel with WebSockets or SSE.
- Provide e2e tests (Playwright) and component tests (RTL).

---

## 🧰 Troubleshooting

- **CORS/session issues**: align backend `FRONTEND_URL` and Next `NEXT_PUBLIC_API_URL`, ensure credentials include cookies (`fetch(..., { credentials: 'include' })`).
- **Barcode camera access**: site must be served over HTTPS (required by browsers).
- **File upload size limits**: keep below backend limits (configurable in Nest).

Happy hacking on the frontend! 🎨

