# BuildForge ⚡ — High-Performance PC Hardware & Custom System Builder

BuildForge is a production-grade full-stack e-commerce and custom PC configurator platform. It couples a real-time hardware compatibility & bottleneck analysis engine with a storefront, public build sharing gallery, customer order & RMA return management, and a privileged administrative control suite.

---

## 🌟 Key Features

### 1. Smart PC Part Builder & Compatibility Engine
* **Heuristic Clearance Matrix**:
  * **Socket Validation**: Ensures CPU socket matches motherboard (e.g. AM5, LGA1700, AM4).
  * **Memory Compatibility**: Verifies DDR4 vs DDR5 RAM generation, motherboard slot count, and max supported capacity.
  * **Power Budgeting**: Dynamic total system draw calculation with recommended PSU headroom (+20% safety margin).
  * **Physical Clearances**: GPU length vs Case clearance, Cooler height vs Case clearance, Radiator compatibility.
* **Bottleneck & Performance Advisor**:
  * Multi-resolution FPS projection (1080p, 1440p, 4K) across AAA and E-Sports titles.
  * Balance ratio analyzer indicating CPU vs GPU utilization limits.
* **Algorithmic Auto-Build**:
  * Generates balanced, 100% compatible component configurations from user-specified budget, use case (Gaming, Workstation, Budget, Creator), and target resolution.

### 2. Public Build Gallery & Instant Sharing
* **Unique Shareable URLs** (`/builds/:shareId`): Short public links renderable without login.
* **Live Re-Validation**: Re-evaluates component compatibility dynamically against current inventory.
* **One-Click Actions**:
  * **Clone to My Builder**: Copies parts into user's builder for customization.
  * **Add All to Cart**: Adds all in-stock build items directly to the shopping cart.
* **Public Gallery** (`/gallery`): Search, filter by use case & budget, and sort by view count, newest, or price.

### 3. Full E-Commerce Storefront
* **Product Catalog & Filtering**: Category navigation, price sliders, brand filters, specification faceted search.
* **Product Comparison Matrix**: Side-by-side spec comparison table for up to 4 components.
* **Cart & Coupon Engine**: Multi-item cart, promo code verification (flat discount & percentage caps).
* **Multi-Step Checkout & Payments**:
  * Address book management.
  * Shipping zone calculation & tax computation.
  * **Razorpay Test Mode Integration**: Idempotent order checkout with secure payment signature verification.
* **Verified Customer Experience**:
  * Order timeline with live status milestones (`ORDER_PLACED` → `PROCESSING` → `SHIPPED` → `DELIVERED`).
  * **7-Day RMA Returns**: Returns restricted to delivered items within eligible return window.
  * **Verified Reviews & Moderated Q&A**: Reviews allowed exclusively for verified purchasers.

### 4. Admin Operations & Governance Portal (`/admin`)
* **Analytics Dashboard**: Real-time revenue metrics, orders-by-status donuts, 30-day sales charts via Recharts, and low-stock alerts.
* **Product & Inventory Management**: CRUD products, image uploads, stock adjustment, threshold alerts.
* **Order & RMA Return Moderation**: Order fulfillment, return approval with safe gateway refund handling and auto-restock.
* **Role-Based Access Control**: Server-side enforced `ADMIN` vs `SUPPORT` vs `CUSTOMER` roles with self-demotion and last-admin lockout prevention.
* **Audit Trail**: Every privileged mutation (price adjustment, stock change, role promotion, return decision) is immutably logged.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Recharts, React Router v6 |
| **Performance & UI** | `React.lazy()` route splitting, Skeletons, Persisted Dark/Light Mode, SEO JSON-LD structured data |
| **Backend** | Node.js, Express.js (Layered Architecture: Route → Controller → Service → Repo → Prisma) |
| **Database & ORM** | PostgreSQL (Neon DB / Supabase), Prisma ORM |
| **Security & Middleware** | Helmet (with Razorpay CSP), `express-rate-limit`, JWT Auth, Zod Validation, Pino Logger |
| **Testing** | Vitest (13 suites, 92+ unit and integration tests) |

---

## 🌐 Production Deployment Architecture

```
┌───────────────────────────┐      ┌───────────────────────────┐
│     Vercel (Frontend)     │      │  Render/Railway (Backend) │
│  React 18 + Vite SPA App  ├─────►│  Express API + Helmet CSP │
│  SPA Rewrite: vercel.json │ CORS │  sameSite: 'none' Cookies │
└─────────────┬─────────────┘      └─────────────┬─────────────┘
              │                                  │
              │                                  │ Prisma ORM
              │                                  ▼
              │                    ┌───────────────────────────┐
              │                    │   Neon DB (PostgreSQL)    │
              └───────────────────►│  48 Components & Seeds    │
                Razorpay Checkout  └───────────────────────────┘
```

---

## ⚙️ Environment Variables Reference

### 1. Frontend — Vercel (`client`)

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the deployed backend API (must include `/api/v1`) | `https://buildforge-api.onrender.com/api/v1` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay publishable test key | `rzp_test_TQW63mLyI3l37U` |

### 2. Backend — Render / Railway (`server`)

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment (enables cross-origin secure cookies) | `production` |
| `PORT` | Web server listening port (automatically set by Render/Railway) | `5000` |
| `DATABASE_URL` | Hosted PostgreSQL connection pooler string | `postgresql://neondb_owner:***@ep-***-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `JWT_SECRET` | Cryptographically secure string for access token signing | `b9f3e498c11e74a1209f984a...` (min 32 chars) |
| `JWT_REFRESH_SECRET` | Cryptographically secure string for refresh token signing | `84c98a31e84d2f0991a0b38c...` (min 32 chars) |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated for multiple | `https://buildforge.vercel.app,http://localhost:5173` |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID (Test mode) | `rzp_test_TQW63mLyI3l37U` |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret (Test mode) | `9mNdrK2nMc44L41b4Y0HzaWi` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret for signature validation | `9mNdrK2nMc44L41b4Y0HzaWi` |
| `SMTP_HOST` | SMTP server host (Ethereal for dev / SendGrid / Resend) | `smtp.ethereal.email` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `mfdvma2yztuyznxg@ethereal.email` |
| `SMTP_PASS` | SMTP password | `SznE5RnVZ4BDUWBTkZ` |
| `SMTP_FROM` | From address for outgoing emails | `noreply@buildforge.com` |

---

## 🚢 Deployment Step-by-Step

### 1. Database Setup (Neon PostgreSQL)
1. Create a serverless PostgreSQL database at [Neon.tech](https://neon.tech).
2. Copy the pooled connection string into `DATABASE_URL`.
3. Apply schema migrations and populate initial catalog data:
   ```bash
   cd server
   npx prisma migrate deploy
   node prisma/seed.js
   ```

### 2. Backend Deployment (Render / Railway)
1. Connect your GitHub repository (`llris/buildforge`).
2. Create a new **Web Service** with the root directory set to `server`.
3. Set **Build Command**: `npm install && npx prisma generate`
4. Set **Start Command**: `node index.js`
5. Configure the environment variables from the Backend Matrix above.
6. Note the public service URL (e.g., `https://buildforge-api.onrender.com`).

### 3. Frontend Deployment (Vercel)
1. Import the repository in [Vercel](https://vercel.com).
2. Set root directory to `client` (or use the included `client/vercel.json` rewrites).
3. Set **Build Command**: `npm run build`
4. Set **Output Directory**: `dist`
5. Configure `VITE_API_URL` to point to `https://buildforge-api.onrender.com/api/v1`.
6. Configure `VITE_RAZORPAY_KEY_ID`.
7. Deploy!

### 4. Razorpay Webhook Configuration
1. Open the [Razorpay Dashboard](https://dashboard.razorpay.com/) → **Settings** → **Webhooks**.
2. Add Webhook URL: `https://buildforge-api.onrender.com/api/v1/orders/webhook`
3. Secret: Enter the value configured in `RAZORPAY_WEBHOOK_SECRET`.
4. Active Events: Select `payment.captured` and `order.paid`.

---

## ✅ Post-Deployment Verification Checklist

Execute the automated end-to-end verification script against any live deployment:
```bash
node scratch/verify_post_deploy.js
```

| # | Verification Check | Endpoint / Action | Status | Notes |
| :-: | :--- | :--- | :-: | :--- |
| **1** | Health & Readiness Probes | `GET /api/v1/health`, `GET /api/v1/ready` | ✅ PASS | Returns `200 OK` and active database connection |
| **2** | User Registration & Auth | `POST /auth/register`, `POST /auth/login` | ✅ PASS | Accepts Terms of Service (`termsAcceptedAt`), issues JWT & `httpOnly` secure cookies |
| **3** | Catalog Database Load | `GET /products?limit=50` | ✅ PASS | Loads all 48 seeded components with categories & stock |
| **4** | Builder Compatibility Engine | `POST /builder/validate` | ✅ PASS | Validates socket (AM5), DDR5 RAM, GPU clearance & 413W power calculation |
| **5** | Test Checkout & Order Creation | `POST /orders/checkout` | ✅ PASS | Creates order, reserves inventory, issues Razorpay order ID & idempotency check |
| **6** | Razorpay Webhook & Payment Capture | `POST /orders/webhook` | ✅ PASS | Verifies HMAC SHA-256 signature, fulfills inventory, transitions order to `PAID` |
| **7** | Notifications & Confirmation | `GET /notifications` | ✅ PASS | Dispatches non-blocking order confirmation email & in-app notification |
| **8** | Admin Analytics & Governance | `GET /admin/analytics/summary` | ✅ PASS | Verified `ADMIN` role authentication, aggregate revenue calculation, order breakdown |

---

## 👥 Demo & Test Credentials

### User Accounts
| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@buildforge.com` | `Password123!` | Full admin console (`/admin`), revenue analytics, stock adjustments, RMA approval, audit logs |
| **Support** | `support@buildforge.com` | `Password123!` | Order moderation, return inspection, support ticket dashboard |
| **Customer** | `customer@buildforge.com` | `Password123!` | PC builder, cart, order history, verified reviews, 7-day RMA requests |

### Razorpay Test Payment Credentials
* **Test Key ID**: `rzp_test_TQW63mLyI3l37U`
* **Test Cards**:
  * Any 16-digit card starting with `4111 1111 1111 1111`
  * Expiration: Any future date (e.g. `12/28`)
  * CVV: `123`
  * OTP: Any 4-6 digit numeric code (e.g. `123456`)

---

## 🧪 Local Testing Suite

Run backend Vitest test suites (Unit, Service, Advisor, and Schema tests):
```bash
cd server
npx vitest run
```
*Expected: 13 / 13 test suites passed (92+ tests).*

---

## 📜 License
This project is licensed under the MIT License.
