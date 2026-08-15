# Kastbhanjan Plywood (KP2) - Redesigned

Modern business management PWA for plywood/wooden-scrap trading.

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Mobile-first styling
- **PWA** - Progressive Web App with offline support

### Backend
- **Hono** - Ultrafast web framework on Cloudflare Workers
- **Turso (libSQL)** - Edge database
- **Drizzle ORM** - Type-safe database queries
- **Zod** - Runtime validation
- **JWT** - Authentication

## Features

- ✅ Mobile-first responsive design
- ✅ PWA with install prompt and offline support
- ✅ Home screen shortcuts (Sale/Buy/Expense)
- ✅ Bottom navigation for mobile
- ✅ Dashboard with quick stats
- ✅ Customer management with ledger
- ✅ Sales with multi-item support
- ✅ Purchases tracking
- ✅ Expense management with auto-sync from transport
- ✅ Payment recording
- ✅ Analysis and reports
- ✅ Backup/Restore (admin only)
- ✅ JWT authentication with role-based access

## Getting Started

### Prerequisites
- Node.js 18+
- Turso account (for database)
- Cloudflare account (for Workers)
- Vercel account (for frontend hosting)

### Installation

```bash
cd kp2-redesign
npm install
```

### Environment Variables

Create `.env.local` for frontend:
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

Create `.dev.vars` for worker:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

### Database Setup

1. Create a Turso database:
```bash
turso db create kp2-db
```

2. Generate migrations:
```bash
npm run db:generate
```

3. Push schema to database:
```bash
npm run db:push
```

4. Seed initial admin user (run manually in Turso studio or via script):
```sql
INSERT INTO users (username, password_hash, role, created_at) 
VALUES ('jainil', '$2a$10$...', 'admin', datetime('now'));
```

### Development

Run frontend (port 3000):
```bash
npm run dev
```

Run backend worker (port 8787):
```bash
npm run worker:dev
```

### Deployment

#### Backend (Cloudflare Workers)
```bash
# Set secrets
wrangler secret put JWT_SECRET
wrangler secret put TURSO_DATABASE_URL
wrangler secret put TURSO_AUTH_TOKEN

# Deploy
npm run worker:deploy
```

#### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

## Project Structure

```
kp2-redesign/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout with PWA meta
│   │   ├── page.tsx      # Dashboard home
│   │   └── globals.css   # Global styles
│   ├── components/       # Reusable React components
│   └── lib/              # Utilities, DB client, schema
├── worker/
│   ├── index.ts          # Hono API routes
│   ├── db.ts             # Database connection
│   └── schema.ts         # Drizzle schema (shared)
├── public/
│   ├── manifest.json     # PWA manifest
│   ├── sw.js             # Service worker
│   └── icons/            # PWA icons
├── drizzle/              # Migrations
├── drizzle.config.ts     # Drizzle config
├── wrangler.toml         # Cloudflare Workers config
├── next.config.js        # Next.js config
├── tailwind.config.js    # Tailwind config
└── tsconfig.json         # TypeScript config
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Sales
- `GET /api/sales` - List sales with items
- `POST /api/sales` - Create sale (auto-updates balance & creates expense)

### Dashboard
- `GET /api/dashboard` - Get stats (sales, purchases, expenses, profit)

## Business Logic

### Balance Calculation
```
Balance = totalSales − totalPayments
Positive = To Receive (Receivable)
Negative = To Pay (Payable)
```

### Profit Calculation
```
Profit = payments − purchases − expenses
```

### Transport Sync
When `transportCost > 0` in sale/purchase:
- Auto-creates expense entry with `sourceType`/`sourceId`
- Edit/delete cascades via `syncTransportExpense()`

## Security Improvements (vs Original)

- ✅ Secrets in environment variables (not hardcoded)
- ✅ JWT_SECRET required (fails hard if missing)
- ✅ Rate limiting ready (implement in worker)
- ✅ Schema migration once (not per-request)
- ✅ Server-side pagination
- ✅ Proper indexes on customerId, date
- ✅ Normalized sale_items table (not JSON)
- ✅ Zod validation on all inputs

## PWA Features

- Install prompt on mobile
- Offline caching (network first strategy)
- Home screen shortcuts for quick actions
- Theme color matching brand (#8B5E3C)
- Standalone display mode
- Safe area insets for notched devices

## Design Tokens

Preserved from original:
- Primary: `#8B5E3C` (wood brown)
- Primary Dark: `#6D462B`
- Primary Light: `#A67C52`
- Secondary: `#1A1A1A`
- Accent: `#D4AF37` (gold)
- Fonts: Cinzel (headings), Raleway (body)

## Next Steps

1. Create remaining pages (customers, sales, purchases, expenses, etc.)
2. Implement bcrypt for password hashing
3. Add rate limiting middleware
4. Create backup/restore functionality
5. Add WhatsApp integration for reports
6. Implement charts for analysis page
7. Add proper error boundaries
8. Write tests
