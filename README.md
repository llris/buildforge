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
  * Order timeline with live status milestones (`ORDER_PLACED` &rarr; `PROCESSING` &rarr; `SHIPPED` &rarr; `DELIVERED`).
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
| **Backend** | Node.js, Express.js (Layered Architecture: Route &rarr; Controller &rarr; Service &rarr; Repo &rarr; Prisma) |
| **Database & ORM** | PostgreSQL (Neon DB), Prisma ORM |
| **Security & Middleware** | Helmet (with Razorpay CSP), `express-rate-limit`, JWT Auth, Zod Validation, Pino Logger |
| **Testing** | Vitest (13 suites, 92+ unit and integration tests) |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** v18.0.0 or higher
* **npm** v9.0.0 or higher
* **PostgreSQL Database** (e.g. Neon DB, Supabase, or local PostgreSQL)

---

### Backend Setup (`server`)

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `server/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://user:password@host/buildforge?sslmode=require"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key"
   JWT_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="7d"
   CLIENT_URL="http://localhost:5173"
   RAZORPAY_KEY_ID="rzp_test_YourKeyHere"
   RAZORPAY_KEY_SECRET="YourSecretHere"
   ```

4. Apply database migrations:
   ```bash
   npx prisma migrate deploy
   ```

5. (Optional) Seed the database:
   ```bash
   npx prisma db seed
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *Express API will run on `http://localhost:5000`.*

---

### Frontend Setup (`client`)

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure `client/.env`:
   ```env
   VITE_API_URL="http://localhost:5000/api/v1"
   VITE_RAZORPAY_KEY_ID="rzp_test_YourKeyHere"
   ```

4. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *Client application will run on `http://localhost:5173`.*

5. Build for production:
   ```bash
   npm run build
   ```

---

## 🧪 Testing

Run backend Vitest test suites (Unit, Service, Advisor, and Schema tests):
```bash
cd server
npx vitest run
```
*Expected: 13 / 13 test suites passed (92+ tests).*

---

## 🛡 Security & Hardening Highlights
1. **Helmet & Razorpay CSP**: Custom Content Security Policy allows Razorpay modal frames (`checkout.razorpay.com`) while preventing XSS.
2. **Rate Limiting**: Tiered limiters on Auth (`/auth/*`), Orders (`/orders/*`), and Global API (`/api/v1/*`), automatically bypassed during test runs (`NODE_ENV=test`).
3. **Idempotent Checkout**: Order creation enforces unique idempotency keys to eliminate double-charges on network retries.
4. **Resilient Gateway Refunds**: Razorpay test-mode refund errors never block RMA approvals; state is handled defensively with explicit audit logs.
5. **Brand Deduplication**: Custom title formatter standardizes strings such as `"AMD AMD Ryzen 7"` &rarr; `"AMD Ryzen 7"`.
6. **Code Splitting**: All page routes lazy-loaded via `React.lazy()` with `<Suspense>` fallback.

---

## 👥 Demo & Test Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@buildforge.com` | `Password123!` | Full access to `/admin` operations, analytics, stock, RMA, coupons |
| **Support** | `support@buildforge.com` | `Password123!` | Read access to orders, RMA, customer tickets |
| **Customer** | *Any registered account* | *User defined* | Catalog browsing, PC builder, saved builds, checkout, reviews |

---

## 📜 License
This project is licensed under the MIT License.
