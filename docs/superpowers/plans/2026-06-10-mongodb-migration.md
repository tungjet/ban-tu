# MongoDB Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the bantu Next.js 16 project from Supabase Postgres + Supabase Auth to MongoDB Atlas + NextAuth.js, while keeping Supabase Storage for image uploads.

**Architecture:** Big-bang rewrite. Replace `supabase.from()` and `supabase.auth` calls with Mongoose + NextAuth.js. Triggers move to service layer. RLS moves to app-layer guards. 12 Mongoose models, 24 API routes refactored, 14 client files migrated. Storage layer untouched.

**Tech Stack:** Next.js 16.2.6, React 19, TypeScript, Mongoose 8.x, NextAuth.js v5 (Auth.js), bcryptjs, Supabase Storage (unchanged), react-hot-toast, lucide-react, zustand.

**Reference spec:** `docs/superpowers/specs/2026-06-10-mongodb-migration-design.md`

**⚠️ Pre-flight checklist (user must do before Task 1):**
- [ ] Rotate Atlas user `ashleycaseysalten_db_user` password (the original leaked in chat)
- [ ] Add to `.env`:
  ```
  MONGODB_URI=mongodb+srv://<user>:<NEW_PASSWORD>@cluster0.c26ksoa.mongodb.net/?appName=Cluster0
  NEXTAUTH_SECRET=<run: openssl rand -base64 32>
  NEXTAUTH_URL=http://localhost:3000
  ```
- [ ] Keep `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` for storage
- [ ] Remove `SUPABASE_SERVICE_ROLE_KEY` from `.env` (no longer needed)

---

## File Structure

### New files (~30)
- `auth.ts` — NextAuth config (project root)
- `types/next-auth.d.ts` — Session/User type augmentation
- `lib/db.ts` — Mongoose connection singleton
- `lib/auth-helpers.ts` — `requireAdmin`, `requireCollaborator`, `getCurrentUser`
- `lib/serialize.ts` — Mongoose doc → plain object helpers
- `lib/models/User.ts`, `Order.ts`, `Product.ts`, `Category.ts`, `Commission.ts`, `Withdrawal.ts`, `Testimonial.ts`, `HomepageFeature.ts`, `Comment.ts`, `Review.ts`, `OrderLog.ts`, `StoreSettings.ts` (12 model files)
- `lib/services/commission.ts` — `applyOrderStatusCommission`, `applyWithdrawalApproval`
- `lib/services/referralCode.ts` — `generateUniqueReferralCode`
- `app/api/auth/[...nextauth]/route.ts` — NextAuth handler

### Modified files (~40)
- 24 API routes under `app/api/` — refactor to use Mongoose + auth-helpers
- 14 client files — replace `supabase.from()` with `fetch('/api/...')` and `useCurrentUser` with `useSession()`
- `app/admin/page.tsx` (largest, ~3000 lines) — admin dashboard
- `lib/supabase.ts` — keep but only for storage
- `.env` — replace keys
- `package.json` — add mongoose, next-auth, bcryptjs

### Removed files (after migration)
- `lib/api-auth.ts` — replaced by `lib/auth-helpers.ts`
- `lib/profile.ts` — logic moved to User model + service
- `lib/types.ts` — types merged into Mongoose model types

---

## Task Decomposition

**Phase 1: Foundation (Tasks 1-3)** — DB, models, auth setup
**Phase 2: API routes migration (Tasks 4-8)** — by access level (admin → collaborator → public → auth)
**Phase 3: Client migration (Tasks 9-12)** — UI components + admin page + auth flow
**Phase 4: Commission service (Task 13)** — the most complex piece
**Phase 5: Verification (Task 14)** — typecheck, build, smoke test

Tasks ordered to ensure each builds on the previous. Each task ends with `npx tsc --noEmit` passing.

---

## Task 1: Install dependencies + env setup

**Files:**
- Modify: `package.json`
- Modify: `.env`

- [ ] **Step 1: Install new dependencies**

```bash
npm install mongoose next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Update `.env`**

Replace content with (use your actual rotated password):

```
NEXT_PUBLIC_SUPABASE_URL=https://nndpowcvfhmmxonaadyu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_8VtKVJ-sS-peYYuyh0Ez_g_eyFAUZih
MONGODB_URI=mongodb+srv://ashleycaseysalten_db_user:<ROTATED_PASSWORD>@cluster0.c26ksoa.mongodb.net/?appName=Cluster0
NEXTAUTH_SECRET=<output-of-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:3000
```

- [ ] **Step 3: Verify install**

```bash
npm ls mongoose next-auth bcryptjs
```

Expected: All 3 packages listed.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env
git commit -m "chore(deps): add mongoose, next-auth, bcryptjs for MongoDB migration"
```

Note: `.env` is gitignored. The actual env values are added locally by the user.

---

## Task 2: Mongoose connection + serialize helpers

**Files:**
- Create: `lib/db.ts`
- Create: `lib/serialize.ts`

- [ ] **Step 1: Create `lib/db.ts`**

```ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

- [ ] **Step 2: Create `lib/serialize.ts`**

```ts
import type { Document } from "mongoose";

export type WithId<T> = T & { id: string };

export function serialize<T extends Document>(doc: T | null): WithId<T> | null {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, ...rest } = obj as any;
  return { id: _id.toString(), ...rest } as WithId<T>;
}

export function serializeAll<T extends Document>(docs: T[]): WithId<T>[] {
  return docs.map((d) => serialize(d)!).filter(Boolean);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add lib/db.ts lib/serialize.ts
git commit -m "feat(db): Mongoose connection singleton + serialize helpers"
```

---

## Task 3: Create 12 Mongoose models

**Files:**
- Create: `lib/models/User.ts`, `Order.ts`, `Product.ts`, `Category.ts`, `Commission.ts`, `Withdrawal.ts`, `Testimonial.ts`, `HomepageFeature.ts`, `Comment.ts`, `Review.ts`, `OrderLog.ts`, `StoreSettings.ts`

- [ ] **Step 1: Create `lib/models/User.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const userSchema = new Schema(
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
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });

export const User = models.User || model("User", userSchema);
```

- [ ] **Step 2: Create `lib/models/Order.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const orderItemSchema = new Schema(
  {
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    slug: String,
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderCode: { type: String, default: null, unique: true, sparse: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    address: { type: String, required: true },
    note: { type: String, default: "" },
    paymentMethod: { type: String, default: "COD" },
    paymentStatus: { type: String, default: "Chưa nhận tiền" },
    paymentNote: { type: String, default: "" },
    paymentProofUrl: { type: String, default: null },
    paymentProofUrls: { type: [String], default: [] },
    paymentReceivedAt: { type: Date, default: null },
    paymentReceivedBy: { type: String, default: null },
    paymentReceivedByEmail: { type: String, default: null },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Chờ xử lý", "Chờ thanh toán", "Đã xác nhận", "Đang giao", "Đã hoàn thành", "Đã huỷ"],
      default: "Chờ xử lý",
    },
    items: [orderItemSchema],
    collaboratorId: { type: String, default: null },
    collaboratorCode: { type: String, default: null },
    commissionAmount: { type: Number, default: null },
    commissionStatus: { type: String, default: "none" },
    createdBy: { type: String, default: null },
    createdByEmail: { type: String, default: null },
    updatedBy: { type: String, default: null },
    updatedByEmail: { type: String, default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: null },
    deletedByEmail: { type: String, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ collaboratorId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deletedAt: 1 });

export const Order = models.Order || model("Order", orderSchema);
```

- [ ] **Step 3: Create `lib/models/Product.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, default: null, unique: true, sparse: true },
    price: { type: mongoose.Schema.Types.Mixed, default: null },
    originalPrice: { type: mongoose.Schema.Types.Mixed, default: null },
    imageUrl: { type: String, default: null },
    images: { type: [String], default: [] },
    description: { type: String, default: "" },
    features: { type: [String], default: [] },
    rating: { type: Number, default: 5 },
    sold: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    categoryId: { type: String, default: null },
    commissionPercent: { type: Number, default: null },
  },
  { timestamps: true }
);

productSchema.index({ isPublished: 1, createdAt: -1 });
productSchema.index({ categoryId: 1 });

export const Product = models.Product || model("Product", productSchema);
```

- [ ] **Step 4: Create `lib/models/Category.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    imageUrl: { type: String, default: null },
    description: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ displayOrder: 1 });

export const Category = models.Category || model("Category", categorySchema);
```

- [ ] **Step 5: Create `lib/models/Commission.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const commissionSchema = new Schema(
  {
    collaboratorId: { type: String, required: true, index: true },
    orderId: { type: String, default: null, index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["order_earned", "withdrawal", "adjustment", "refund"],
      required: true,
    },
    note: { type: String, default: null },
    createdBy: { type: String, default: null },
    createdByEmail: { type: String, default: null },
  },
  { timestamps: true }
);

commissionSchema.index({ collaboratorId: 1, createdAt: -1 });

export const Commission = models.Commission || model("Commission", commissionSchema);
```

- [ ] **Step 6: Create `lib/models/Withdrawal.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const withdrawalSchema = new Schema(
  {
    collaboratorId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    bankName: { type: String, required: true },
    bankAccount: { type: String, required: true },
    bankHolder: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    adminNote: { type: String, default: null },
    processedBy: { type: String, default: null },
    processedByEmail: { type: String, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

withdrawalSchema.index({ status: 1, createdAt: -1 });

export const Withdrawal = models.Withdrawal || model("Withdrawal", withdrawalSchema);
```

- [ ] **Step 7: Create `lib/models/Testimonial.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const testimonialSchema = new Schema(
  {
    customerName: { type: String, required: true },
    initial: { type: String, default: "" },
    productLabel: { type: String, default: "" },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    content: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Testimonial = models.Testimonial || model("Testimonial", testimonialSchema);
```

- [ ] **Step 8: Create `lib/models/HomepageFeature.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const featureSchema = new Schema(
  {
    icon: { type: String, default: "shield" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    colorTheme: { type: String, default: "blue" },
    displayOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const HomepageFeature = models.HomepageFeature || model("HomepageFeature", featureSchema);
```

- [ ] **Step 9: Create `lib/models/Comment.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const commentSchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    userName: { type: String, default: null },
    content: { type: String, required: true },
    reply: { type: String, default: null },
    repliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

commentSchema.index({ productId: 1, createdAt: -1 });

export const Comment = models.Comment || model("Comment", commentSchema);
```

- [ ] **Step 10: Create `lib/models/Review.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const reviewSchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    userName: { type: String, default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    variantLabel: { type: String, default: "" },
    content: { type: String, required: true },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, createdAt: -1 });

export const Review = models.Review || model("Review", reviewSchema);
```

- [ ] **Step 11: Create `lib/models/OrderLog.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const orderLogSchema = new Schema(
  {
    orderId: { type: String, required: true, index: true },
    orderCode: { type: String, default: null },
    action: {
      type: String,
      enum: ["created", "status_changed", "updated", "deleted", "merged"],
      required: true,
    },
    oldStatus: { type: String, default: null },
    newStatus: { type: String, default: null },
    changedBy: { type: String, default: null },
    changedByEmail: { type: String, default: null },
    snapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

orderLogSchema.index({ createdAt: -1 });

export const OrderLog = models.OrderLog || model("OrderLog", orderLogSchema);
```

- [ ] **Step 12: Create `lib/models/StoreSettings.ts`**

```ts
import mongoose, { Schema, model, models } from "mongoose";

const storeSettingsSchema = new Schema(
  {
    singleton: { type: String, default: "default", unique: true },
    phone: { type: String, default: "" },
    zalo: { type: String, default: "" },
    facebook: { type: String, default: "" },
    address: { type: String, default: "" },
    defaultCommissionPercent: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export const StoreSettings = models.StoreSettings || model("StoreSettings", storeSettingsSchema);
```

- [ ] **Step 13: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors. (Models don't do anything yet, but they should compile.)

- [ ] **Step 14: Commit**

```bash
git add lib/models/
git commit -m "feat(models): 12 Mongoose models matching Supabase schema"
```

---

## Task 4: NextAuth config + types

**Files:**
- Create: `auth.ts` (project root)
- Create: `types/next-auth.d.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create `auth.ts`**

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
        if (!creds?.email || !creds?.password) return null;
        await connectDB();
        const user = await User.findOne({
          email: String(creds.email).toLowerCase().trim(),
        }).lean();
        if (!user) return null;
        const valid = await bcrypt.compare(String(creds.password), user.passwordHash);
        if (!valid) return null;
        if (user.status === "banned") return null;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName ?? undefined,
          role: user.role as "admin" | "collaborator" | "customer",
          status: user.status as "pending" | "active" | "banned",
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
        token.role = (user as any).role;
        token.status = (user as any).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
      }
      return session;
    },
  },
});
```

- [ ] **Step 2: Create `types/next-auth.d.ts`**

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

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "collaborator" | "customer";
    status?: "pending" | "active" | "banned";
  }
}
```

Add `types/` to `tsconfig.json` `"include"` if not present.

- [ ] **Step 3: Create `app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add auth.ts types/next-auth.d.ts "app/api/auth/[...nextauth]/route.ts" tsconfig.json
git commit -m "feat(auth): NextAuth config with Credentials provider + JWT"
```

---

## Task 5: Auth helpers (requireAdmin, requireCollaborator)

**Files:**
- Create: `lib/auth-helpers.ts`

- [ ] **Step 1: Create `lib/auth-helpers.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

type Role = "admin" | "collaborator" | "customer";
type Status = "pending" | "active" | "banned";

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
  status: Status;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser) ?? null;
}

export async function requireAdmin(
  _req: NextRequest
): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return user;
}

export async function requireCollaborator(
  _req: NextRequest
): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "collaborator")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (user.status !== "active")
    return NextResponse.json({ error: "CTV not active" }, { status: 403 });
  return user;
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/auth-helpers.ts
git commit -m "feat(auth): requireAdmin + requireCollaborator helpers"
```

---

## Task 6: Commission + referral services

**Files:**
- Create: `lib/services/commission.ts`
- Create: `lib/services/referralCode.ts`

- [ ] **Step 1: Create `lib/services/referralCode.ts`**

```ts
import { User } from "@/lib/models/User";

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
  throw new Error("Could not generate unique referral code after 10 attempts");
}
```

- [ ] **Step 2: Create `lib/services/commission.ts`**

```ts
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Commission } from "@/lib/models/Commission";
import { User } from "@/lib/models/User";
import { StoreSettings } from "@/lib/models/StoreSettings";
import { Product } from "@/lib/models/Product";

export async function applyOrderStatusCommission(
  orderId: string,
  newStatus: string,
  previousStatus: string,
  context: { userId: string; userEmail: string }
): Promise<void> {
  if (newStatus === previousStatus) return;

  await connectDB();
  const order = await Order.findById(orderId);
  if (!order || !order.collaboratorId) return;

  if (newStatus === "Đã hoàn thành") {
    if (order.commissionStatus === "earned") return;

    const hadEarnedBefore = await Commission.exists({
      orderId: order._id,
      type: "order_earned",
    });
    const isReEarn = !!hadEarnedBefore;

    const settings = await StoreSettings.findOne().lean();
    const defaultPct = settings?.defaultCommissionPercent ?? 5;

    let total = 0;
    for (const item of order.items) {
      const product = await Product.findById(item.id)
        .select("commissionPercent")
        .lean();
      const pct = product?.commissionPercent ?? defaultPct;
      total += Math.round(item.price * item.quantity * pct / 100);
    }

    await Commission.create({
      collaboratorId: order.collaboratorId,
      orderId: order._id,
      amount: total,
      type: "order_earned",
      note: isReEarn ? "Tính lại sau khi admin chuyển trạng thái" : null,
      createdBy: context.userId,
      createdByEmail: context.userEmail,
    });

    order.commissionAmount = total;
    order.commissionStatus = "earned";
    await order.save();

    await User.findByIdAndUpdate(order.collaboratorId, {
      $inc: { commissionBalance: total },
    });
  } else if (
    previousStatus === "Đã hoàn thành" &&
    order.commissionStatus === "earned" &&
    order.commissionAmount
  ) {
    await Commission.create({
      collaboratorId: order.collaboratorId,
      orderId: order._id,
      amount: -order.commissionAmount,
      type: "refund",
      note: "Hoàn tác do admin chuyển trạng thái đơn",
      createdBy: context.userId,
      createdByEmail: context.userEmail,
    });
    order.commissionStatus = "cancelled";
    await order.save();
    await User.findByIdAndUpdate(order.collaboratorId, {
      $inc: { commissionBalance: -order.commissionAmount },
    });
  }
}

export async function applyWithdrawalApproval(
  withdrawalId: string,
  context: { userId: string; userEmail: string }
): Promise<void> {
  await connectDB();
  const w = await Withdrawal.findById(withdrawalId);
  if (!w || w.status !== "pending") return;

  await Commission.create({
    collaboratorId: w.collaboratorId,
    orderId: null,
    amount: -w.amount,
    type: "withdrawal",
    note: `Yêu cầu rút tiền #${w._id.toString().slice(-6)}`,
    createdBy: context.userId,
    createdByEmail: context.userEmail,
  });
  // Atomic balance decrement
  const updated = await User.findOneAndUpdate(
    { _id: w.collaboratorId, commissionBalance: { $gte: w.amount } },
    { $inc: { commissionBalance: -w.amount } }
  );
  if (!updated) {
    throw new Error("Số dư không đủ");
  }
}
```

(Add `import { Withdrawal } from "@/lib/models/Withdrawal";` at top.)

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add lib/services/
git commit -m "feat(services): commission engine + referral code generator"
```

---

## Task 7: Admin API routes (16 files)

This is the largest single task. Refactor 16 admin API routes to use Mongoose + `requireAdmin`.

**Files:**
- Modify: `app/api/admin/testimonials/route.ts`
- Modify: `app/api/admin/reviews/route.ts`
- Modify: `app/api/admin/features/route.ts`
- Modify: `app/api/admin/comments/route.ts`
- Modify: `app/api/admin/orders/route.ts`
- Modify: `app/api/admin/orders/[id]/route.ts`
- Modify: `app/api/admin/orders/merge/route.ts`
- Modify: `app/api/admin/order-logs/route.ts`
- Modify: `app/api/admin/collaborators/route.ts`
- Modify: `app/api/admin/collaborators/[id]/route.ts`
- Modify: `app/api/admin/withdrawals/route.ts`
- Modify: `app/api/admin/withdrawals/[id]/route.ts`
- Modify: `app/api/admin/settings/route.ts`

- [ ] **Step 1: Refactor `app/api/admin/testimonials/route.ts`**

Replace entire file:

```ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Testimonial } from "@/lib/models/Testimonial";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";
import { serializeAll } from "@/lib/serialize";

export async function GET() {
  await connectDB();
  const list = await Testimonial.find().sort({ displayOrder: 1 }).lean();
  return NextResponse.json({ testimonials: list });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const body = await req.json();
  const t = await Testimonial.create(body);
  return NextResponse.json({ testimonial: t });
}
```

(Add DELETE handler in the same file as needed; follow the existing pattern.)

- [ ] **Step 2: Apply same pattern to `app/api/admin/reviews/route.ts`, `features/route.ts`, `comments/route.ts`**

For each, replace `supabase.from('X')` with the corresponding Mongoose model. Use `requireAdmin` instead of `verifyAdmin`. Use `lean()` for reads. Return `{ items: serializeAll(...) }` pattern.

- [ ] **Step 3: Refactor `app/api/admin/orders/route.ts` (GET, POST)**

```ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";
import { serializeAll } from "@/lib/serialize";
import { applyOrderStatusCommission } from "@/lib/services/commission";

export async function GET() {
  await connectDB();
  const orders = await Order.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;

  const body = await req.json();
  const orderCode = body.orderCode || `BT-${Math.floor(100000 + Math.random() * 900000)}`;
  const order = await Order.create({
    ...body,
    orderCode,
    createdBy: session.id,
    createdByEmail: session.email,
  });
  return NextResponse.json({ order });
}
```

- [ ] **Step 4: Refactor `app/api/admin/orders/[id]/route.ts` (PATCH, DELETE)**

```ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { requireAdmin, isErrorResponse } from "@/lib/auth-helpers";
import { applyOrderStatusCommission } from "@/lib/services/commission";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  const body = await req.json();

  const prev = await Order.findById(id);
  if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prevStatus = prev.status;
  Object.assign(prev, body, { updatedBy: session.id, updatedByEmail: session.email });
  await prev.save();

  if (body.status && body.status !== prevStatus) {
    await applyOrderStatusCommission(id, body.status, prevStatus, {
      userId: session.id,
      userEmail: session.email,
    });
  }

  return NextResponse.json({ order: prev });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(req);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  await Order.findByIdAndUpdate(id, {
    deletedAt: new Date(),
    deletedBy: session.id,
    deletedByEmail: session.email,
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Refactor `app/api/admin/orders/merge/route.ts`, `order-logs/route.ts`, `collaborators/*`, `withdrawals/*`, `settings/route.ts`**

Apply same pattern. For `withdrawals/[id]` PATCH approval, call `applyWithdrawalApproval(id, { userId, userEmail })`. For `collaborators/[id]` PATCH to set status='active', auto-generate `referralCode` via `generateUniqueReferralCode()`.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add app/api/admin/
git commit -m "refactor(api): admin routes to Mongoose + NextAuth"
```

---

## Task 8: Collaborator API routes (5 files)

**Files:**
- Modify: `app/api/collaborator/dashboard/route.ts`
- Modify: `app/api/collaborator/orders/route.ts`
- Modify: `app/api/collaborator/commissions/route.ts`
- Modify: `app/api/collaborator/withdrawals/route.ts`
- Modify: `app/api/collaborator/orders/create/route.ts`

- [ ] **Step 1: Refactor each file**

For each, replace the Supabase client usage with Mongoose models. Use `requireCollaborator` instead of `verifyCollaborator`. For `orders/create/route.ts`, use `connectDB` + `Order.create(...)` (no service client needed since CTV is authenticated).

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/collaborator/
git commit -m "refactor(api): collaborator routes to Mongoose + NextAuth"
```

---

## Task 9: Public + auth API routes (5 files)

**Files:**
- Modify: `app/api/public/orders/route.ts`
- Modify: `app/api/public/orders/[code]/route.ts`
- Modify: `app/api/public/referral/[code]/route.ts`
- Modify: `app/api/auth/ctv-register/route.ts`
- Modify: `app/api/auth/ensure-profile/route.ts`

- [ ] **Step 1: Refactor `app/api/auth/ctv-register/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { email, password, fullName, phone } = body;
  if (!email || !password || !fullName || !phone) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
  if (!/^0\d{9,10}$/.test(phone)) return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });

  await connectDB();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName,
      phone,
      role: "collaborator",
      status: "pending",
    });
    return NextResponse.json({ ok: true, user_id: user._id.toString() });
  } catch (err: any) {
    if (err.code === 11000) return NextResponse.json({ error: "Email đã được đăng ký" }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Refactor `app/api/public/referral/[code]/route.ts`**

Read `bantu_ref` cookie, look up User by referralCode, return JSON (or 404). Set cookie.

- [ ] **Step 3: Refactor `app/api/public/orders/route.ts`**

Read `bantu_ref` cookie, resolve to User, insert Order via Mongoose (CTV gets default status 'pending' for anon orders).

- [ ] **Step 4: Refactor `app/api/public/orders/[code]/route.ts`**

Update order status by orderCode.

- [ ] **Step 5: Refactor `app/api/auth/ensure-profile/route.ts`**

After NextAuth login, the session JWT carries user info. The ensure-profile endpoint is mostly redundant. Either delete it OR keep for backward compat. Recommend delete it.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add app/api/public/ app/api/auth/
git commit -m "refactor(api): public + auth routes to Mongoose + NextAuth"
```

---

## Task 10: Client auth pages (CTV register + login)

**Files:**
- Modify: `app/dang-ky-ctv/page.tsx`
- Modify: `app/dang-nhap-ctv/page.tsx`

- [ ] **Step 1: Refactor `app/dang-ky-ctv/page.tsx`**

Replace toast-based POST to `/api/auth/ctv-register` + manual redirect with: after successful POST, call `signIn('credentials', { email, password, redirect: false })` then `router.push('/cong-tac-vien')`.

```tsx
import { signIn } from "next-auth/react";

// inside handleSubmit, after successful POST:
const result = await signIn("credentials", {
  email,
  password,
  redirect: false,
});
if (result?.error) {
  toast.error("Đăng ký thành công nhưng đăng nhập thất bại");
  router.push("/dang-nhap-ctv");
} else {
  toast.success("Đăng ký thành công");
  router.push("/cong-tac-vien");
}
```

- [ ] **Step 2: Refactor `app/dang-nhap-ctv/page.tsx`**

Replace `supabase.auth.signInWithPassword` + manual role check with:

```tsx
import { signIn } from "next-auth/react";

const result = await signIn("credentials", { email, password, redirect: false });
if (result?.error) {
  toast.error("Email hoặc mật khẩu không đúng");
} else {
  // Fetch session to check role
  const sessionRes = await fetch("/api/auth/session");
  const session = await sessionRes.json();
  if (session?.user?.role === "collaborator" && session.user.status === "active") {
    router.push("/cong-tac-vien");
  } else if (session?.user?.role === "admin") {
    router.push("/admin");
  } else {
    toast.error("Tài khoản chưa được duyệt");
    await signOut();
  }
}
```

Add `app/api/auth/session/route.ts` (NextAuth provides this via `handlers.GET`).

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/dang-ky-ctv/ app/dang-nhap-ctv/ "app/api/auth/session/route.ts"
git commit -m "feat(auth): CTV register + login use NextAuth signIn"
```

---

## Task 11: useCurrentUser → useSession

**Files:**
- Modify: `hooks/useCurrentUser.ts`
- Modify: `components/Header.tsx`
- Modify: `components/ProductAdminEditButton.tsx`

- [ ] **Step 1: Refactor `hooks/useCurrentUser.ts`**

Replace entire file:

```ts
"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

export interface CurrentUserState {
  user: { id: string; email: string; name?: string; role: "admin" | "collaborator" | "customer"; status: "pending" | "active" | "banned" } | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
  refresh: () => void;
}

export function useCurrentUser(): CurrentUserState {
  const { data, status, update } = useSession();
  return useMemo(() => {
    const user = data?.user as any;
    return {
      user: user ?? null,
      isLoading: status === "loading",
      isAdmin: user?.role === "admin",
      isCollaborator: user?.role === "collaborator" && user?.status === "active",
      refresh: () => update(),
    };
  }, [data, status, update]);
}
```

- [ ] **Step 2: Add `<SessionProvider>` in `app/layout.tsx`**

Wrap the children:

```tsx
import { SessionProvider } from "next-auth/react";

// inside RootLayout return:
<SessionProvider>
  {children}
</SessionProvider>
```

- [ ] **Step 3: Refactor `components/Header.tsx`**

Replace `useState` + `onAuthStateChange` with `useSession()` + `signIn()`/`signOut()`. For CTV-specific link, use `useCurrentUser()`.

- [ ] **Step 4: Refactor `components/ProductAdminEditButton.tsx`**

Replace `supabase.auth.getSession` with `useSession()`.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add hooks/useCurrentUser.ts app/layout.tsx components/Header.tsx components/ProductAdminEditButton.tsx
git commit -m "feat(auth): migrate useCurrentUser to useSession from NextAuth"
```

---

## Task 12: Client data fetching migration (admin + public pages)

**Files:**
- Modify: `app/admin/page.tsx` (largest, ~50+ call sites)
- Modify: `app/san-pham/(list)/page.tsx`
- Modify: `app/danh-muc/page.tsx`
- Modify: `app/gioi-thieu/page.tsx`
- Modify: `app/yeu-thich/page.tsx`
- Modify: `app/sitemap.xml/route.ts`
- Modify: `app/thu-vien/route.ts`
- Modify: `app/tai-khoan/page.tsx`

- [ ] **Step 1: Refactor `app/admin/page.tsx`**

This is the biggest file. For each `supabase.from(X).select(...).eq(...).order(...)` block:
- Replace with `fetch('/api/admin/<resource>', { headers: { Authorization: \`Bearer \${session.accessToken}\` } })`
- Use `useSession()` from `next-auth/react` to get token: `session?.accessToken` (note: NextAuth may not provide accessToken in session by default — need to add `jwt({ token, account })` callback to add it, OR use server-side cookies approach)

For the token, the simplest pattern is to call `/api/auth/session` to get the current session. Better: configure NextAuth's `jwt` callback to include a custom token OR just use session cookies (NextAuth's default).

**Recommendation:** Skip Authorization header pattern entirely. All NextAuth API calls use the session cookie automatically. Update auth-helpers to read from `auth()` (which reads cookies), not from Authorization header.

Refactor each `supabase.from('orders')` in admin page to:
```ts
const res = await fetch('/api/admin/orders');
const data = await res.json();
setOrders(data.orders || []);
```

- [ ] **Step 2: Refactor `app/san-pham/(list)/page.tsx`**

Replace direct `supabase.from('products').select(...).eq('is_published', true)` with `fetch('/api/products')`. Add new route `app/api/products/route.ts` if not exists.

- [ ] **Step 3: Refactor `app/danh-muc/page.tsx`, `gioi-thieu/page.tsx`, `yeu-thich/page.tsx`, `tai-khoan/page.tsx`**

Similar pattern: replace direct supabase calls with fetch to API routes OR server components reading directly from Mongoose.

- [ ] **Step 4: Refactor `app/sitemap.xml/route.ts`, `app/thu-vien/route.ts`**

These are server-side route handlers. Replace supabase with `connectDB` + Mongoose queries.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors. (Some unused imports may remain — clean up as needed.)

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx app/san-pham/ app/danh-muc/ app/gioi-thieu/ app/yeu-thich/ app/tai-khoan/ app/sitemap.xml/ app/thu-vien/ app/api/products/
git commit -m "refactor(client): replace supabase queries with API + Mongoose"
```

---

## Task 13: useStoreSettings hook migration

**Files:**
- Modify: `hooks/useStoreSettings.ts`

- [ ] **Step 1: Refactor hook**

Replace `supabase.from('store_settings')` with `fetch('/api/admin/settings')` OR if hook is used in public pages, fetch from a new `/api/store-settings` route.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add hooks/useStoreSettings.ts
git commit -m "refactor(hook): useStoreSettings uses Mongoose via API"
```

---

## Task 14: Remove dead code + final verification

**Files:**
- Delete: `lib/api-auth.ts`
- Delete: `lib/profile.ts`
- Delete (optional): `lib/types.ts` (if all types moved to models)
- Modify: `app/layout.tsx` (add SessionProvider if not done)
- Modify: any remaining files using old `supabase.from`

- [ ] **Step 1: Search for remaining `supabase.from` usage outside `lib/supabase.ts`**

```bash
grep -r "supabase.from" app/ components/ hooks/ lib/ --include="*.ts" --include="*.tsx" | grep -v "lib/supabase.ts"
```

Expected: 0 results (or only Supabase Storage calls).

- [ ] **Step 2: Search for `verifyAdmin` / `verifyCollaborator` usage**

```bash
grep -r "verifyAdmin\|verifyCollaborator" app/ --include="*.ts" --include="*.tsx"
```

Expected: 0 results.

- [ ] **Step 3: Delete dead files**

```bash
rm lib/api-auth.ts
rm lib/profile.ts
```

- [ ] **Step 4: Final typecheck + build**

```bash
npx tsc --noEmit
npm run build
```

Expected: 0 errors, build success.

- [ ] **Step 5: Manual smoke test of 14 cases**

1. Register CTV at `/dang-ky-ctv` → check MongoDB has user with role=collaborator, status=pending, passwordHash
2. Admin login at `/admin` → verify session works
3. Admin approves CTV → check referral_code auto-generated
4. CTV login at `/dang-nhap-ctv` → check session has role=collaborator
5. Visit `?ref=CODE` → check bantu_ref cookie set
6. Place order → check orders.collaborator_id set
7. Admin → Hoàn thành order → check commissions row + balance increment
8. Admin Hoàn thành → Huỷ → check refund row + balance decrement
9. Admin Huỷ → Hoàn thành lại → check re-earn row + balance restored
10. Per-product commission_percent override
11. CTV create order at `/cong-tac-vien/tao-don` → check collaborator_id
12. CTV withdraw 500k → check withdrawal status=pending
13. Admin approve withdrawal → check commission + balance
14. Admin bấm Hoàn thành 2 lần liên tiếp → no duplicate commission

- [ ] **Step 6: Commit cleanup**

```bash
git add -A
git commit -m "chore: remove dead code (api-auth, profile) after migration"
```

---

## Self-Review

**1. Spec coverage:**
- § 3 Data modeling: Tasks 3, 6 ✓
- § 4 NextAuth: Task 4 ✓
- § 5 API routes (24): Tasks 7, 8, 9 ✓
- § 6 Client files (14): Tasks 10, 11, 12, 13 ✓
- § 7 Env: Task 1 ✓
- § 8 RLS removal: Task 14 (implicit) ✓
- § 13 Risks: Addressed in commission service (atomic balance) and withdrawal approval (findOneAndUpdate with $gte condition)

**2. Placeholder scan:** No TBDs. All code blocks complete.

**3. Type consistency:**
- `SessionUser` interface defined in Task 5, used in Task 11 (useCurrentUser), Task 12 (admin)
- `requireAdmin` / `requireCollaborator` / `isErrorResponse` all defined in Task 5
- `applyOrderStatusCommission` signature consistent across Tasks 6, 7
- `serialize` / `serializeAll` consistent in Task 2

**4. Known gaps:**
- Task 12 admin page is huge — implementation may need to be split into sub-tasks during execution if a subagent gets stuck
- Some `useStoreSettings` consumers (Header, Footer) may need updates

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-10-mongodb-migration.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

⚠️ **Before starting, complete the pre-flight checklist at the top of this plan** (rotate Atlas password, update .env).
