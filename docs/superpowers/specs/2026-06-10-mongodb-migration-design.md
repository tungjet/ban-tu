# Spec: Migrate Supabase Data + Auth to MongoDB Atlas

**Ngày:** 2026-06-10
**Trạng thái:** Draft — chờ duyệt
**Phạm vi:** Phase 1 — Migrate toàn bộ data layer (Postgres) + auth (Supabase Auth) sang MongoDB Atlas. GIỮ Supabase Storage (ảnh sản phẩm + avatar). BỎ Realtime.

---

## 1. Tổng quan

Project hiện dùng Supabase cho 4 thứ: **Postgres DB, Auth, Storage, Realtime**. Spec này migrate **DB + Auth** sang MongoDB Atlas + NextAuth.js. **Storage giữ nguyên Supabase** (ảnh sản phẩm + avatar). **Realtime bỏ** (admin dashboard dùng polling thủ công nếu cần).

**Mục tiêu:**
- Single source of truth: MongoDB Atlas cluster
- Auth: NextAuth.js v5 (Auth.js) với Credentials Provider + JWT
- ODM: Mongoose 8.x
- Password: bcryptjs
- 24 API routes + 14 client files cùng refactor trong 1 phase (Big Bang)

**Connection string (Atlas):**
```
mongodb+srv://ashleycaseysalten_db_user:GXDdJ45IgODPBeUa@cluster0.c26ksoa.mongodb.net/?appName=Cluster0
```

**Lưu ý:** Connection string đang được commit vào file này (private spec, không public). Khi deploy production, dùng secret khác.

---

## 2. Stack mới

| Component | Trước | Sau |
|---|---|---|
| Database | Supabase Postgres | MongoDB Atlas |
| ODM / Driver | `@supabase/supabase-js` (PostgREST) | `mongoose` 8.x |
| Auth | `supabase.auth` | `next-auth@beta` v5 (Auth.js) + Credentials Provider |
| Session | Supabase JWT (HttpOnly cookie) | NextAuth JWT (HttpOnly cookie) |
| Password hashing | (handled by Supabase) | `bcryptjs` |
| Storage | Supabase Storage | **GIỮ Supabase Storage** (không đổi) |
| Realtime | Supabase channel | **BỎ** (không có realtime trong phase 1) |

**File `lib/supabase.ts` GIỮ NGUYÊN** — chỉ dùng cho storage client.

---

## 3. Data Modeling

### 3.1 Mapping Postgres → MongoDB

| Postgres table | Mongoose collection | Mongoose model |
|---|---|---|
| `profiles` (id UUID) | `users` (_id ObjectId) | `User.ts` |
| `orders` | `orders` | `Order.ts` |
| `products` | `products` | `Product.ts` |
| `categories` | `categories` | `Category.ts` |
| `commissions` | `commissions` | `Commission.ts` |
| `withdrawals` | `withdrawals` | `Withdrawal.ts` |
| `testimonials` | `testimonials` | `Testimonial.ts` |
| `homepage_features` | `homepagefeatures` (lowercase) | `HomepageFeature.ts` |
| `comments` | `comments` | `Comment.ts` |
| `reviews` | `reviews` | `Review.ts` |
| `order_logs` | `orderlogs` | `OrderLog.ts` |
| `store_settings` | `storesettings` (singleton) | `StoreSettings.ts` |

**Nguyên tắc đặt tên:**
- File model: `PascalCase.ts` (vd: `User.ts`, `OrderLog.ts`)
- Collection: `camelCase` (vd: `homepageFeatures`, `orderLogs`)
- Field names: `camelCase` (vd: `commissionBalance`, `createdAt`)
- Foreign keys: ObjectId string references (vd: `collaboratorId: String`)
- UUID từ Postgres → ObjectId từ MongoDB (auto-generated)

### 3.2 Indexes (tương đương Postgres)

- `User`: `email` (unique), `referralCode` (unique sparse), `role`, `status`
- `Order`: `collaboratorId`, `status`, `createdAt desc`, `deletedAt`, compound `(collaboratorId, createdAt desc)`, `orderCode` (unique sparse)
- `Commission`: `collaboratorId + createdAt desc`, `orderId`
- `Withdrawal`: `status + createdAt desc`, `collaboratorId + createdAt desc`
- `Product`: `isPublished + createdAt desc`, `slug` (unique sparse), `categoryId`
- `Category`: `displayOrder`
- `Comment`, `Review`: `productId + createdAt desc`
- `OrderLog`: `orderId`, `createdAt desc`

### 3.3 Schemas (chi tiết)

**User schema (`lib/models/User.ts`):**
```ts
{
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, default: null },
  phone: { type: String, default: null },
  role: { type: String, enum: ["admin", "collaborator", "customer"], default: "customer" },
  status: { type: String, enum: ["pending", "active", "banned"], default: "active" },
  referralCode: { type: String, default: null, unique: true, sparse: true },
  commissionBalance: { type: Number, default: 0 },
  bankName: { type: String, default: null },
  bankAccount: { type: String, default: null },
  bankHolder: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}
```

**Order schema (key fields):**
```ts
{
  orderCode: { type: String, unique: true, sparse: true },
  customerName: String,
  phone: String,
  email: { type: String, default: "" },
  address: String,
  note: { type: String, default: "" },
  paymentMethod: { type: String, default: "COD" },
  paymentStatus: { type: String, default: "Chưa nhận tiền" },
  paymentNote: { type: String, default: "" },
  paymentProofUrl: { type: String, default: null },
  paymentProofUrls: { type: [String], default: [] },
  paymentReceivedAt: { type: Date, default: null },
  paymentReceivedBy: { type: String, default: null },
  paymentReceivedByEmail: { type: String, default: null },
  totalAmount: Number,
  status: { type: String, default: "Chờ xử lý" },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    slug: String,
  }],
  // CTV (collaborator) fields
  collaboratorId: { type: String, default: null },
  collaboratorCode: { type: String, default: null },
  commissionAmount: { type: Number, default: null },
  commissionStatus: { type: String, default: "none" },
  // Audit
  createdBy: { type: String, default: null },
  createdByEmail: { type: String, default: null },
  updatedBy: { type: String, default: null },
  updatedByEmail: { type: String, default: null },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: String, default: null },
  deletedByEmail: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}
```

**Commission, Withdrawal, Product, Category, Testimonial, HomepageFeature, Comment, Review, OrderLog, StoreSettings** — schemas tương tự Postgres schema hiện tại, chuyển sang camelCase.

### 3.4 Commission trigger → Service layer

Chuyển từ SQL trigger sang service function trong `lib/services/commission.ts`:

```ts
export async function applyOrderStatusCommission(
  orderId: string,
  newStatus: string,
  previousStatus: string
): Promise<void> {
  if (newStatus === previousStatus) return;
  
  const order = await Order.findById(orderId);
  if (!order || !order.collaboratorId) return;
  
  if (newStatus === "Đã hoàn thành") {
    // Idempotency: skip if already earned
    if (order.commissionStatus === "earned") return;
    
    const hadEarnedBefore = await Commission.exists({
      orderId: order._id,
      type: "order_earned",
    });
    const isReEarn = !!hadEarnedBefore;
    
    // Compute commission from items × effective percent
    const settings = await StoreSettings.findOne().lean();
    const defaultPct = settings?.defaultCommissionPercent ?? 5;
    
    let total = 0;
    for (const item of order.items) {
      const product = await Product.findById(item.id).select("commissionPercent").lean();
      const pct = product?.commissionPercent ?? defaultPct;
      total += Math.round(item.price * item.quantity * pct / 100);
    }
    
    // Insert commission
    await Commission.create({
      collaboratorId: order.collaboratorId,
      orderId: order._id,
      amount: total,
      type: "order_earned",
      note: isReEarn ? "Tính lại sau khi admin chuyển trạng thái" : null,
    });
    
    // Update order
    order.commissionAmount = total;
    order.commissionStatus = "earned";
    await order.save();
    
    // Atomic balance increment
    await User.findByIdAndUpdate(order.collaboratorId, {
      $inc: { commissionBalance: total },
    });
  } else if (previousStatus === "Đã hoàn thành" && order.commissionStatus === "earned") {
    // Refund path
    await Commission.create({
      collaboratorId: order.collaboratorId,
      orderId: order._id,
      amount: -order.commissionAmount,
      type: "refund",
      note: "Hoàn tác do admin chuyển trạng thái đơn",
    });
    order.commissionStatus = "cancelled";
    await order.save();
    await User.findByIdAndUpdate(order.collaboratorId, {
      $inc: { commissionBalance: -order.commissionAmount },
    });
  }
}
```

**Atomicity note:** M0 free Atlas cluster KHÔNG hỗ trợ transactions. Dùng atomic `findOneAndUpdate` với điều kiện balance đủ (cho withdrawal) thay thế. Nếu cần transactions chính thức, upgrade lên M10+ (paid).

### 3.5 Audit fields

Mongoose `timestamps: true` option tự quản lý `createdAt`/`updatedAt`. `createdBy`/`updatedBy` set qua service layer (pass `userId` từ session vào service call). Bỏ `handle_audit_fields` SQL trigger.

### 3.6 OrderLog middleware

```ts
// In Order model
orderLogSchema.post('save', async function(doc) {
  if (this.isNew) {
    await OrderLog.create({ orderId: doc._id, action: 'created', newStatus: doc.status, ... });
  }
});

orderLogSchema.pre('findOneAndUpdate', async function(next) {
  const docToUpdate = await this.model.findOne(this.getFilter());
  this._oldStatus = docToUpdate?.status;
  next();
});

orderLogSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && this._oldStatus !== doc.status) {
    await OrderLog.create({ orderId: doc._id, action: 'status_changed', oldStatus: this._oldStatus, newStatus: doc.status, ... });
  }
});
```

### 3.7 Referral code

```ts
// lib/services/referralCode.ts
export async function generateUniqueReferralCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const exists = await User.exists({ referralCode: code });
    if (!exists) return code;
  }
  throw new Error("Could not generate unique referral code");
}
```

---

## 4. Auth: NextAuth.js v5

### 4.1 Config (`auth.ts` at project root)

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        await connectDB();
        const user = await User.findOne({ email: creds.email.toLowerCase().trim() }).lean();
        if (!user) return null;
        const valid = await bcrypt.compare(creds.password, user.passwordHash);
        if (!valid) return null;
        if (user.status === "banned") return null;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/dang-nhap-ctv" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.status = token.status;
      return session;
    },
  },
});
```

### 4.2 Helpers (`lib/auth-helpers.ts`)

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function requireAdmin(req: NextRequest): Promise<Session | NextResponse> {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return session;
}

export async function requireCollaborator(req: NextRequest): Promise<Session | NextResponse> {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "collaborator") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (session.user.status !== "active") return NextResponse.json({ error: "CTV not active" }, { status: 403 });
  return session;
}
```

### 4.3 Type augmentation (`types/next-auth.d.ts`)

```ts
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "admin" | "collaborator" | "customer";
    status: "pending" | "active" | "banned";
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: "admin" | "collaborator" | "customer";
      status: "pending" | "active" | "banned";
    };
  }
}
```

### 4.4 Registration flow

`app/api/auth/ctv-register/route.ts`:
- Validate input
- `bcrypt.hash(password, 10)` → passwordHash
- `User.create({ email, passwordHash, fullName, phone, role: 'collaborator', status: 'pending' })`
- Return success (user phải signIn thủ công qua NextAuth signIn)
- **Không cần email verification** (Supabase Auth đã được thay)

### 4.5 Client migration từ supabase.auth

- `useCurrentUser` hook → dùng `useSession()` từ `next-auth/react`
- `supabase.auth.signInWithPassword(email, password)` → `signIn('credentials', { email, password, redirect: false })`
- `supabase.auth.signOut()` → `signOut()`
- `supabase.auth.getUser()` (server) → `auth()` từ `@/auth`

---

## 5. API Routes (24 files)

**Pattern mới cho mỗi route:**

```ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (session instanceof NextResponse) return session;
  
  await connectDB();
  const orders = await Order.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .lean();
  
  return NextResponse.json({ orders: orders.map(serializeOrder) });
}
```

**24 routes breakdown:**
- 16 admin routes (requireAdmin) — đổi `.from('X')` → `Model.find/findById/create/updateOne`
- 5 collaborator routes (requireCollaborator) — same
- 5 public/auth routes — no auth, direct DB
- All routes return `{ ... }` JSON, errors via `NextResponse.json({ error }, { status })`

**Helper: `lib/serialize.ts`** — convert Mongoose documents to plain objects với id thay _id (for client compatibility).

---

## 6. Client files (14)

| File | Migration |
|---|---|
| `hooks/useCurrentUser.ts` | Dùng `useSession()` |
| `components/Header.tsx` | Dùng `useSession()`, `signIn()`, `signOut()` |
| `components/ProductAdminEditButton.tsx` | Dùng `useSession()` |
| `app/admin/page.tsx` (~3000 lines) | ~50+ call sites từ `supabase.from()` → `fetch('/api/...')` |
| `app/thanh-toan/page.tsx` | Dùng `fetch('/api/public/orders')` (đã làm trong phase trước) |
| `app/san-pham/(list)/page.tsx` | Direct queries → `fetch('/api/products')` |
| `app/danh-muc/page.tsx` | Same |
| `app/gioi-thieu/page.tsx` | Same |
| `app/yeu-thich/page.tsx` | Dùng session + fetch |
| `app/cong-tac-vien/(dashboard)/*` (5 files) | Dùng `fetch('/api/collaborator/...')` (đã có) |
| `app/dang-ky-ctv/page.tsx` | Form submit → `signIn('credentials')` sau khi register |
| `app/dang-nhap-ctv/page.tsx` | `signIn('credentials', { email, password, redirect: false })` |
| `app/sitemap.xml/route.ts` | Fetch từ MongoDB qua service helper |
| `app/robots.txt/route.ts` | Static, no change |
| `app/thu-vien/route.ts` | Read từ MongoDB |

---

## 7. Env Variables

Thêm vào `.env`:
```
MONGODB_URI=mongodb+srv://ashleycaseysalten_db_user:GXDdJ45IgODPBeUa@cluster0.c26ksoa.mongodb.net/?appName=Cluster0
NEXTAUTH_SECRET=generate-random-32-bytes
NEXTAUTH_URL=http://localhost:3000
```

**Bỏ (không còn dùng):** `SUPABASE_SERVICE_ROLE_KEY`.

**GIỮ:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (cho Storage).

---

## 8. RLS → App-layer

Bỏ toàn bộ RLS policies. Thay bằng:
- `requireAdmin()` / `requireCollaborator()` check ở API entry
- Service layer thêm ownership check (vd: CTV chỉ xem commission của mình, không xem của người khác)
- Public routes validate input schema
- Không có RLS = app code phải đảm bảo mọi access control (audit cẩn thận)

---

## 9. File Structure

```
project root/
├── auth.ts                            # NextAuth config (NEW)
├── types/
│   └── next-auth.d.ts                 # Session type augmentation (NEW)
├── lib/
│   ├── db.ts                          # Mongoose connection (NEW)
│   ├── auth-helpers.ts                # requireAdmin, requireCollaborator (NEW)
│   ├── serialize.ts                   # doc → plain object helpers (NEW)
│   ├── supabase.ts                    # GIỮ — chỉ cho storage
│   ├── types.ts                       # Type aliases (giữ)
│   ├── price.ts                       # (giữ)
│   ├── profile.ts                     # BỎ — logic move vào User model
│   └── services/                      # NEW
│       ├── commission.ts              # applyOrderStatusCommission
│       ├── orderLog.ts                # createOrderLog helper
│       └── referralCode.ts            # generateUniqueReferralCode
└── lib/models/                        # NEW (12 files)
    ├── User.ts
    ├── Order.ts
    ├── Product.ts
    ├── Category.ts
    ├── Commission.ts
    ├── Withdrawal.ts
    ├── Testimonial.ts
    ├── HomepageFeature.ts
    ├── Comment.ts
    ├── Review.ts
    ├── OrderLog.ts
    └── StoreSettings.ts
```

---

## 10. Migration Steps (sau khi spec approve)

1. **Install deps:** `npm i mongoose next-auth@beta bcryptjs && npm i -D @types/bcryptjs`
2. **Env:** Thêm `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Bỏ `SUPABASE_SERVICE_ROLE_KEY`.
3. **Mongoose setup:** `lib/db.ts` với connection cache.
4. **Models:** Tạo 12 Mongoose models.
5. **Auth:** Setup NextAuth với Credentials provider. Update types.
6. **Helpers:** Tạo `lib/auth-helpers.ts` (requireAdmin, requireCollaborator).
7. **API routes:** Refactor 24 routes theo pattern mới.
8. **Client migration:** Update 14 files dùng `useSession()` thay `useCurrentUser`.
9. **Commission service:** Implement `lib/services/commission.ts`.
10. **Smoke test:** Chạy lại 14 cases từ spec collaborator + admin flow.

---

## 11. Rollout

1. Tạo Atlas cluster (free M0), copy connection string vào `.env`.
2. Generate `NEXTAUTH_SECRET` (`openssl rand -base64 32`).
3. Deploy code. Atlas cluster tự tạo collections khi models insert đầu tiên.
4. **Data migration:** KHÔNG migrate data cũ (admin user cũ sẽ mất → cần đăng ký lại).
5. Manual smoke test 14 cases từ spec collaborator + admin flow.

---

## 12. Out of Scope (Phase 2+)

- Realtime (đã bỏ phase 1)
- Email verification (đã bỏ — auto confirm)
- Multi-level referral
- Search / full-text search
- Atlas triggers (DB-level automation)
- Caching layer (Redis)
- File CDN optimization
- Backup / point-in-time recovery setup

---

## 13. Risks

| Rủi ro | Giảm thiểu |
|---|---|
| M0 free Atlas KHÔNG hỗ trợ transactions | Dùng atomic `findOneAndUpdate` với condition. Withdrawals check balance trước khi deduct. |
| NextAuth v5 còn beta | Pin version cụ thể. Nếu breaking change → xử lý tại chỗ. |
| 24 API routes refactor cùng lúc | Mỗi route có 1 file riêng, dễ verify bằng `npx tsc --noEmit` từng batch. |
| Data cũ mất (admin user) | User tạo lại qua `/dang-ky-ctv` hoặc manual insert. Document rõ trong rollout. |
| Connection string leak | File này là private spec, không public. Production dùng secret khác. |
| Atomic withdrawal race | Dùng `User.findOneAndUpdate({ _id, commissionBalance: { $gte: amount } }, { $inc: { commissionBalance: -amount } })`. Nếu modifiedCount=0 → reject 400. |
| Commission balance drift nếu service throw giữa chỉ làm 1 nửa | Wrap trong try/catch với compensating action. Log error. Manual reconciliation script. |
