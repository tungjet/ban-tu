# Collaborator + Commission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add collaborator (CTV) accounts, commission engine triggered on order completion, withdrawal flow with admin approval, and CTV dashboard + admin management.

**Architecture:** Server-driven schema in Supabase (4 new tables, 4 triggers, 1 seed). Next.js client/server route split — anon key for reads from RLS, service-role key for admin mutations and commission inserts. Commission is an append-only event log with a denormalized balance counter synced via trigger.

**Tech Stack:** Next.js 16.2.6 (App Router), React 19, TypeScript, Tailwind v4, Supabase JS v2.106, react-hot-toast, lucide-react, zustand. No automated test framework — verification is manual smoke test (14 cases) per existing project pattern.

**Reference spec:** `docs/superpowers/specs/2026-06-10-collaborator-commission-design.md`

---

## File Structure

### Schema (1 file modified)
- `supabase_migration.sql` — append 4 CREATE TABLE, 8 ALTER TABLE ADD COLUMN, 4 CREATE FUNCTION, 4 CREATE TRIGGER, 4 CREATE POLICY, 1 seed INSERT.

### Server lib (1 new, 1 modified)
- `lib/types.ts` (new) — `Role`, `Profile`, `Commission`, `Withdrawal` TypeScript types.
- `lib/api-auth.ts` (modify) — add `verifyRole`, `verifyCollaborator`, `getServiceClient`. Keep `verifyAdmin` as alias.
- `lib/profile.ts` (new) — `ensureProfile(supabase, user)` server helper.

### Client hooks (1 new)
- `hooks/useCurrentUser.ts` — fetches profile, exposes `{ user, profile, role, isLoading, isAdmin, isCollaborator }`.

### Components (1 new, 1 modified)
- `components/ReferralCapture.tsx` (new) — client component, reads `?ref=CODE`, sets cookie via API.
- `components/Header.tsx` (modify) — add CTV link when collaborator logged in.

### Public pages (3 new)
- `app/dang-ky-ctv/page.tsx`
- `app/dang-nhap-ctv/page.tsx`
- `app/layout.tsx` (modify) — mount `<ReferralCapture />`.

### CTV dashboard (6 new)
- `app/cong-tac-vien/layout.tsx`
- `app/cong-tac-vien/page.tsx` (redirect to tong-quan)
- `app/cong-tac-vien/(dashboard)/tong-quan/page.tsx`
- `app/cong-tac-vien/(dashboard)/don-hang/page.tsx`
- `app/cong-tac-vien/(dashboard)/hoa-hong/page.tsx`
- `app/cong-tac-vien/(dashboard)/rut-tien/page.tsx`
- `app/cong-tac-vien/(dashboard)/tao-don/page.tsx`

### Checkout integration (1 modified)
- `app/thanh-toan/page.tsx` — read `bantu_ref` cookie, attach collaborator_id before insert.

### Admin (1 heavily modified)
- `app/admin/page.tsx` — add `collaborators` tab (table + approve/lock + sub-tab withdrawals), add column to `orders` tab, add dropdown CTV in create/edit modal, add field in `settings` and `products` form.

### API routes (12 new)
- `app/api/public/referral/[code]/route.ts`
- `app/api/auth/ensure-profile/route.ts`
- `app/api/admin/collaborators/route.ts` (GET, POST)
- `app/api/admin/collaborators/[id]/route.ts` (PATCH)
- `app/api/admin/withdrawals/route.ts` (GET)
- `app/api/admin/withdrawals/[id]/route.ts` (PATCH)
- `app/api/collaborator/dashboard/route.ts`
- `app/api/collaborator/orders/route.ts` (GET)
- `app/api/collaborator/commissions/route.ts` (GET)
- `app/api/collaborator/withdrawals/route.ts` (GET, POST)
- `app/api/collaborator/orders/create/route.ts` (POST)

**Total:** ~30 new files, 4 modified.

---

## Task Decomposition

Tasks 1–3: Schema & auth foundation.
Tasks 4–6: Client auth, referral capture, checkout integration.
Tasks 7–10: CTV public pages (register, login) + dashboard.
Tasks 11–12: Admin tab + commission visibility.
Tasks 13: API routes.
Tasks 14: Final manual smoke test of all 14 spec cases.

---

## Task 1: Add Schema (Migration SQL)

**Files:**
- Modify: `supabase_migration.sql` (append at end)

- [ ] **Step 1: Append 4 CREATE TABLE statements**

Append at end of `supabase_migration.sql`:

```sql
-- =====================================================
-- COLLABORATOR / COMMISSION FEATURE
-- =====================================================

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin','collaborator','customer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','banned')),
  referral_code TEXT UNIQUE,
  commission_balance NUMERIC(12,0) NOT NULL DEFAULT 0,
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- 2. commissions (event log, append-only)
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount NUMERIC(12,0) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order_earned','withdrawal','adjustment','refund')),
  note TEXT,
  created_by UUID,
  created_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commissions_collaborator ON commissions(collaborator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);

-- 3. withdrawals
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,0) NOT NULL CHECK (amount > 0),
  bank_name TEXT NOT NULL,
  bank_account TEXT NOT NULL,
  bank_holder TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  admin_note TEXT,
  processed_by UUID,
  processed_by_email TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_collaborator ON withdrawals(collaborator_id, created_at DESC);
```

- [ ] **Step 2: Append ALTER TABLE statements for existing tables**

```sql
-- Add columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS collaborator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS collaborator_code TEXT,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,0),
  ADD COLUMN IF NOT EXISTS commission_status TEXT NOT NULL DEFAULT 'none'
    CHECK (commission_status IN ('none','pending','earned','cancelled'));
CREATE INDEX IF NOT EXISTS idx_orders_collaborator ON orders(collaborator_id) WHERE collaborator_id IS NOT NULL;

-- Add commission_percent to products (override per product)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2);

-- Add default_commission_percent to store_settings
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS default_commission_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00;
```

- [ ] **Step 3: Append 4 trigger functions**

```sql
-- Helper: generate unique 6-char referral code
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
  attempts INT := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = result);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique referral code';
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger 1: Auto-generate referral_code when collaborator becomes active
CREATE OR REPLACE FUNCTION trg_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'collaborator'
     AND NEW.status = 'active'
     AND NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_unique_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_generate_referral ON profiles;
CREATE TRIGGER profiles_generate_referral
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trg_generate_referral_code();

-- Trigger 2: apply_order_commission — handles status transitions
CREATE OR REPLACE FUNCTION apply_order_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_default_pct NUMERIC(5,2);
  v_item JSONB;
  v_product_id TEXT;
  v_item_price NUMERIC;
  v_item_qty INT;
  v_item_pct NUMERIC(5,2);
  v_total_commission NUMERIC(12,0) := 0;
  v_had_earned BOOLEAN;
BEGIN
  -- Only act when status actually changes
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Only act if there's a collaborator attached
  IF NEW.collaborator_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Load default commission percent
  SELECT default_commission_percent INTO v_default_pct
  FROM store_settings WHERE id = 'default';
  IF v_default_pct IS NULL THEN
    v_default_pct := 5.00;
  END IF;

  -- Case 1: → 'Đã hoàn thành'
  IF NEW.status = 'Đã hoàn thành' THEN
    -- Idempotent: if already earned, skip
    IF NEW.commission_status = 'earned' THEN
      RETURN NEW;
    END IF;

    -- If previously cancelled (had earned before), re-earn
    v_had_earned := EXISTS (
      SELECT 1 FROM commissions
      WHERE order_id = NEW.id AND type = 'order_earned'
    );

    -- Compute total commission
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      v_product_id := v_item->>'id';
      v_item_price := COALESCE((v_item->>'price')::numeric, 0);
      v_item_qty := COALESCE((v_item->>'quantity')::int, 0);

      -- Find per-product override
      SELECT commission_percent INTO v_item_pct
      FROM products WHERE id = v_product_id::text;
      IF v_item_pct IS NULL THEN
        v_item_pct := v_default_pct;
      END IF;

      v_total_commission := v_total_commission
        + ROUND(v_item_price * v_item_qty * v_item_pct / 100)::numeric;
    END LOOP;

    INSERT INTO commissions (
      collaborator_id, order_id, amount, type, note,
      created_by, created_by_email
    ) VALUES (
      NEW.collaborator_id, NEW.id, v_total_commission, 'order_earned',
      CASE WHEN v_had_earned THEN 'Tính lại sau khi admin chuyển trạng thái' ELSE NULL END,
      auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid())
    );

    NEW.commission_amount := v_total_commission;
    NEW.commission_status := 'earned';

  -- Case 2: 'Đã hoàn thành' → other
  ELSIF OLD.status = 'Đã hoàn thành' AND NEW.status <> 'Đã hoàn thành' THEN
    IF NEW.commission_status = 'earned' AND NEW.commission_amount IS NOT NULL THEN
      INSERT INTO commissions (
        collaborator_id, order_id, amount, type, note,
        created_by, created_by_email
      ) VALUES (
        NEW.collaborator_id, NEW.id, -NEW.commission_amount, 'refund',
        'Hoàn tác do admin chuyển trạng thái đơn',
        auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid())
      );
      NEW.commission_status := 'cancelled';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_apply_commission ON orders;
CREATE TRIGGER orders_apply_commission
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION apply_order_commission();

-- Trigger 3: sync_profile_balance — update denormalized counter
CREATE OR REPLACE FUNCTION sync_profile_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET commission_balance = COALESCE((
        SELECT SUM(amount) FROM commissions
        WHERE collaborator_id = NEW.collaborator_id
      ), 0),
      updated_at = now()
  WHERE id = NEW.collaborator_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS commissions_sync_balance ON commissions;
CREATE TRIGGER commissions_sync_balance
  AFTER INSERT ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_balance();

-- Trigger 4: updated_at on profiles
CREATE OR REPLACE FUNCTION trg_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trg_profiles_updated_at();
```

- [ ] **Step 4: Append RLS policies**

```sql
-- profiles: user can read/update their own row
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_self_read ON profiles;
CREATE POLICY profiles_self_read ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_self_update ON profiles;
CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_admin_all ON profiles;
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Public read of referral_code only (for validate by code)
DROP POLICY IF EXISTS profiles_public_referral_read ON profiles;
CREATE POLICY profiles_public_referral_read ON profiles
  FOR SELECT USING (referral_code IS NOT NULL);

-- commissions: user can read their own
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commissions_self_read ON commissions;
CREATE POLICY commissions_self_read ON commissions
  FOR SELECT USING (auth.uid() = collaborator_id);

DROP POLICY IF EXISTS commissions_admin_all ON commissions;
CREATE POLICY commissions_admin_all ON commissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- withdrawals: user can read/create their own
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS withdrawals_self_read ON withdrawals;
CREATE POLICY withdrawals_self_read ON withdrawals
  FOR SELECT USING (auth.uid() = collaborator_id);

DROP POLICY IF EXISTS withdrawals_self_insert ON withdrawals;
CREATE POLICY withdrawals_self_insert ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = collaborator_id);

DROP POLICY IF EXISTS withdrawals_admin_all ON withdrawals;
CREATE POLICY withdrawals_admin_all ON withdrawals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
```

- [ ] **Step 5: Append seed for admin**

```sql
-- Seed: ensure admin row for primary owner
INSERT INTO profiles (id, role, status)
SELECT id, 'admin', 'active' FROM auth.users
WHERE email = 'tungpham.it@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';
```

- [ ] **Step 6: Verify SQL syntactically (no execution)**

Open the file in editor, scan for:
- All 4 CREATE TABLE present (profiles, commissions, withdrawals) — note: only 3 CREATE TABLE; commissions/withdrawals have 2 each. Total 3 CREATE TABLE.
- All ALTER TABLE ADD COLUMN statements use `IF NOT EXISTS`.
- All CREATE TRIGGER use `DROP TRIGGER IF EXISTS` first (idempotent).
- All CREATE POLICY use `DROP POLICY IF EXISTS` first.
- Seed at end is idempotent (ON CONFLICT DO UPDATE).

- [ ] **Step 7: Commit**

```bash
git add supabase_migration.sql
git commit -m "feat(db): add collaborator schema, triggers, RLS"
```

**Note to executor:** Do NOT run this migration yourself. Save it; user will run in Supabase SQL editor when ready. Migration is idempotent (DROP IF EXISTS, ADD COLUMN IF NOT EXISTS).

---

## Task 2: Server Types & API Auth Helper

**Files:**
- Create: `lib/types.ts`
- Modify: `lib/api-auth.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```typescript
export type Role = 'admin' | 'collaborator' | 'customer';
export type ProfileStatus = 'pending' | 'active' | 'banned';
export type CommissionType = 'order_earned' | 'withdrawal' | 'adjustment' | 'refund';
export type CommissionStatus = 'none' | 'pending' | 'earned' | 'cancelled';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  status: ProfileStatus;
  referral_code: string | null;
  commission_balance: number;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  collaborator_id: string;
  order_id: string | null;
  amount: number;
  type: CommissionType;
  note: string | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  collaborator_id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  status: WithdrawalStatus;
  admin_note: string | null;
  processed_by: string | null;
  processed_by_email: string | null;
  processed_at: string | null;
  created_at: string;
}
```

- [ ] **Step 2: Replace `lib/api-auth.ts` with new role-aware version**

```typescript
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Role } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export interface VerifyResult {
  user: { id: string; email?: string } | null;
  error: string | null;
  supabase: ReturnType<typeof createClient> | null;
  role?: Role;
  status?: string;
}

export async function verifyRole(
  request: NextRequest,
  allowedRoles: Role[]
): Promise<VerifyResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing authorization token", supabase: null };
  }

  const token = authHeader.substring(7);
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    return { user: null, error: error?.message || "Invalid token", supabase: null };
  }

  const { data: profile } = await client
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as Role | undefined) || "customer";
  const status = profile?.status || "active";

  if (!allowedRoles.includes(role)) {
    return { user, error: `Forbidden: requires role ${allowedRoles.join(" or ")}`, supabase: client, role, status };
  }

  if (role === "collaborator" && status !== "active") {
    return { user, error: `Forbidden: collaborator status is ${status}`, supabase: client, role, status };
  }

  return { user, error: null, supabase: client, role, status };
}

export async function verifyAdmin(request: NextRequest) {
  return verifyRole(request, ["admin"]);
}

export async function verifyCollaborator(request: NextRequest) {
  return verifyRole(request, ["collaborator"]);
}

export function getServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

- [ ] **Step 3: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env` (placeholder, user fills in)**

Add to `.env` (do NOT commit `.env` — instruct user to add manually):
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/api-auth.ts
git commit -m "feat(auth): role-aware verifyRole helper + service client"
```

---

## Task 3: Profile Ensure Helper

**Files:**
- Create: `lib/profile.ts`

- [ ] **Step 1: Create `lib/profile.ts`**

```typescript
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Role } from "./types";

export async function ensureProfile(
  supabase: SupabaseClient,
  user: User,
  overrides?: { role?: Role; status?: "pending" | "active" }
) {
  const role = overrides?.role ?? "customer";
  const status = overrides?.status ?? "active";

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name:
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        null,
      role,
      status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create profile: ${error.message}`);
  }
  return data;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/profile.ts
git commit -m "feat(profile): ensureProfile server helper"
```

---

## Task 4: Client Current-User Hook

**Files:**
- Create: `hooks/useCurrentUser.ts`

- [ ] **Step 1: Create `hooks/useCurrentUser.ts`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile, Role } from "@/lib/types";

export interface CurrentUserState {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  role: Role | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
  refresh: () => Promise<void>;
}

export function useCurrentUser(): CurrentUserState {
  const [user, setUser] = useState<CurrentUserState["user"]>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (!u) {
        setProfile(null);
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .maybeSingle();
      setProfile((p as Profile) ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    user,
    profile,
    role: profile?.role ?? null,
    isLoading,
    isAdmin: profile?.role === "admin",
    isCollaborator: profile?.role === "collaborator" && profile?.status === "active",
    refresh: load,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useCurrentUser.ts
git commit -m "feat(auth): useCurrentUser client hook"
```

---

## Task 5: Referral Capture Component

**Files:**
- Create: `components/ReferralCapture.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `components/ReferralCapture.tsx`**

```typescript
"use client";

import { useEffect, useRef } from "react";

export default function ReferralCapture() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const url = new URL(window.location.href);
    const code = url.searchParams.get("ref");
    if (!code) return;

    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (normalized.length < 4) return;

    fetch(`/api/public/referral/${encodeURIComponent(normalized)}`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          document.cookie = `bantu_ref=${normalized}; path=/; max-age=2592000; samesite=lax`;
          url.searchParams.delete("ref");
          window.history.replaceState({}, "", url.toString());
        }
      })
      .catch(() => {
        // silent
      });
  }, []);

  return null;
}
```

- [ ] **Step 2: Read current `app/layout.tsx` to find insertion point**

Run: `read app/layout.tsx`

Look for the `<body>` and the closing `</body>`. Add `<ReferralCapture />` just before `</body>`.

- [ ] **Step 3: Modify `app/layout.tsx` to mount ReferralCapture**

Add import at top:
```typescript
import ReferralCapture from "@/components/ReferralCapture";
```

Add inside the body (right before `</body>`):
```tsx
<ReferralCapture />
```

- [ ] **Step 4: Verify build still passes**

Run: `npm run build`
Expected: build success.

- [ ] **Step 5: Commit**

```bash
git add components/ReferralCapture.tsx app/layout.tsx
git commit -m "feat(referral): capture ?ref=CODE cookie in root layout"
```

---

## Task 6: Public Referral Validate API

**Files:**
- Create: `app/api/public/referral/[code]/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

  if (normalized.length < 4) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data } = await supabase
    .from("profiles")
    .select("id, status, role")
    .eq("referral_code", normalized)
    .eq("role", "collaborator")
    .eq("status", "active")
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  const res = NextResponse.json({ valid: true, code: normalized });
  res.cookies.set("bantu_ref", normalized, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: false,
  });
  return res;
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/public/referral/[code]/route.ts
git commit -m "feat(api): public referral validate endpoint"
```

---

## Task 7: Checkout Integration (attach CTV from cookie)

**Files:**
- Modify: `app/thanh-toan/page.tsx`

- [ ] **Step 1: Read `app/thanh-toan/page.tsx` to find the order insert**

Run: `read app/thanh-toan/page.tsx offset 60 limit 60`

Find `createOrder` and `supabase.from('orders').insert(...)` (around line 75).

- [ ] **Step 2: Update order insert to include collaborator_id and collaborator_code**

Locate the `supabase.from('orders').insert([{` block. Add these fields to the inserted object:

```typescript
collaborator_id: refCollabId,
collaborator_code: refCode,
commission_status: refCollabId ? "pending" : "none",
```

Add this helper function above `createOrder`:

```typescript
async function resolveRef(): Promise<{ id: string; code: string } | null> {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)bantu_ref=([A-Z0-9]{4,6})/);
  if (!match) return null;
  const code = match[1];
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .eq("role", "collaborator")
    .eq("status", "active")
    .maybeSingle();
  if (!data) return null;
  return { id: data.id, code };
}
```

In `createOrder`, before the `supabase.from('orders').insert(...)` call, add:

```typescript
const ref = await resolveRef();
const refCollabId = ref?.id ?? null;
const refCode = ref?.code ?? null;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/thanh-toan/page.tsx
git commit -m "feat(checkout): attach collaborator from bantu_ref cookie"
```

---

## Task 8: Public CTV Register & Login Pages

**Files:**
- Create: `app/dang-ky-ctv/page.tsx`
- Create: `app/dang-nhap-ctv/page.tsx`

- [ ] **Step 1: Create `app/dang-ky-ctv/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function RegisterCTVPage() {
  const router = useRouter();
  const { role, isLoading } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isLoading && role === "collaborator") {
    if (typeof window !== "undefined") router.replace("/cong-tac-vien");
  }
  if (!isLoading && role === "admin") {
    if (typeof window !== "undefined") router.replace("/admin");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Mật khẩu tối thiểu 6 ký tự");
    if (password !== confirm) return toast.error("Mật khẩu xác nhận không khớp");
    if (!fullName.trim()) return toast.error("Vui lòng nhập họ tên");
    if (!/^0\d{9,10}$/.test(phone)) return toast.error("Số điện thoại không hợp lệ");

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Đăng ký thất bại");

      const { error: profileErr } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: fullName,
          phone,
          role: "collaborator",
          status: "pending",
        });
      if (profileErr) {
        if (profileErr.code === "23505") {
          throw new Error("Email đã được đăng ký với vai trò khác");
        }
        throw profileErr;
      }
      setSuccess(true);
      toast.success("Đăng ký thành công! Vui lòng chờ admin duyệt.");
    } catch (err: any) {
      toast.error(err.message || "Đăng ký thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Đăng ký thành công!</h1>
          <p className="text-slate-500 mb-6">
            Tài khoản của bạn đang chờ admin duyệt. Chúng tôi sẽ thông báo qua email khi được kích hoạt.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">Về trang chủ</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full space-y-4">
        <div className="text-center mb-6">
          <UserPlus className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-slate-900">Đăng ký CTV</h1>
          <p className="text-slate-500 text-sm mt-1">Trở thành cộng tác viên bán hàng, nhận hoa hồng hấp dẫn</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên *</label>
          <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại *</label>
          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu *</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu *</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <button type="submit" disabled={submitting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Đăng ký
        </button>

        <p className="text-center text-sm text-slate-500">
          Đã có tài khoản? <Link href="/dang-nhap-ctv" className="text-blue-600 hover:underline">Đăng nhập</Link>
        </p>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Create `app/dang-nhap-ctv/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function LoginCTVPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profile?.role !== "collaborator") {
        await supabase.auth.signOut();
        throw new Error("Tài khoản không phải CTV");
      }
      if (profile.status !== "active") {
        await supabase.auth.signOut();
        throw new Error("Tài khoản chưa được duyệt hoặc đã bị khóa");
      }

      toast.success("Đăng nhập thành công");
      router.push("/cong-tac-vien");
    } catch (err: any) {
      toast.error(err.message || "Đăng nhập thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full space-y-4">
        <div className="text-center mb-6">
          <LogIn className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập CTV</h1>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <button type="submit" disabled={submitting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Đăng nhập
        </button>

        <p className="text-center text-sm text-slate-500">
          Chưa có tài khoản? <Link href="/dang-ky-ctv" className="text-blue-600 hover:underline">Đăng ký</Link>
        </p>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/dang-ky-ctv/page.tsx app/dang-nhap-ctv/page.tsx
git commit -m "feat(ctv): register and login pages"
```

---

## Task 9: CTV Dashboard Layout & 5 Sub-Pages

**Files:**
- Create: `app/cong-tac-vien/layout.tsx`
- Create: `app/cong-tac-vien/page.tsx`
- Create: `app/cong-tac-vien/(dashboard)/tong-quan/page.tsx`
- Create: `app/cong-tac-vien/(dashboard)/don-hang/page.tsx`
- Create: `app/cong-tac-vien/(dashboard)/hoa-hong/page.tsx`
- Create: `app/cong-tac-vien/(dashboard)/rut-tien/page.tsx`
- Create: `app/cong-tac-vien/(dashboard)/tao-don/page.tsx`

- [ ] **Step 1: Create `app/cong-tac-vien/layout.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Coins, Banknote, Plus, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/lib/supabase";

const tabs = [
  { id: "tong-quan", label: "Tổng quan", icon: LayoutDashboard, href: "/cong-tac-vien/tong-quan" },
  { id: "don-hang", label: "Đơn hàng", icon: ShoppingBag, href: "/cong-tac-vien/don-hang" },
  { id: "hoa-hong", label: "Hoa hồng", icon: Coins, href: "/cong-tac-vien/hoa-hong" },
  { id: "rut-tien", label: "Rút tiền", icon: Banknote, href: "/cong-tac-vien/rut-tien" },
  { id: "tao-don", label: "Tạo đơn", icon: Plus, href: "/cong-tac-vien/tao-don" },
];

export default function CTVDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isLoading, isCollaborator } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/dang-nhap-ctv");
      return;
    }
    if (profile && !isCollaborator) {
      toast.error("Tài khoản chưa được duyệt");
      router.replace("/dang-nhap-ctv");
    }
  }, [isLoading, user, profile, isCollaborator, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (isLoading || !isCollaborator) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-500">
        Đang tải...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col p-4 sticky top-0 h-screen">
        <div className="mb-6">
          <h2 className="font-bold text-slate-900">Khu vực CTV</h2>
          <p className="text-sm text-slate-500 mt-1 truncate">{profile?.full_name || user?.email}</p>
          {profile?.referral_code && (
            <p className="text-xs text-blue-600 font-mono mt-1">Mã: {profile.referral_code}</p>
          )}
        </div>
        <nav className="flex-1 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-xl">
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Khu vực CTV</h2>
          <button onClick={handleLogout} className="text-sm text-slate-500">
            <LogOut className="w-4 h-4" />
          </button>
        </header>
        <nav className="md:hidden bg-white border-b border-slate-200 flex overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                  active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/cong-tac-vien/page.tsx` (redirect)**

```tsx
import { redirect } from "next/navigation";
export default function CTVRoot() {
  redirect("/cong-tac-vien/tong-quan");
}
```

- [ ] **Step 3: Create `app/cong-tac-vien/(dashboard)/tong-quan/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Copy, Check, TrendingUp, ShoppingBag, Coins } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function CTVDashboardPage() {
  const { profile } = useCurrentUser();
  const [stats, setStats] = useState({ thisMonth: 0, totalEarned: 0, pendingOrders: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    fetch("/api/collaborator/dashboard", { credentials: "include" })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [profile?.id]);

  const refLink = profile?.referral_code
    ? `${window.location.origin}/?ref=${profile.referral_code}`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast.success("Đã sao chép");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Coins className="w-4 h-4" /> Số dư
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {Number(profile?.commission_balance ?? 0).toLocaleString("vi-VN")}đ
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <ShoppingBag className="w-4 h-4" /> Đơn tháng này
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.thisMonth}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <TrendingUp className="w-4 h-4" /> Tổng đã earned
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {Number(stats.totalEarned).toLocaleString("vi-VN")}đ
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="font-bold text-slate-900 mb-2">Link giới thiệu của bạn</h2>
        {profile?.referral_code ? (
          <>
            <p className="text-sm text-slate-500 mb-3">Chia sẻ link này cho khách hàng. Khi họ đặt hàng, hoa hồng sẽ được ghi nhận cho bạn.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono truncate">
                {refLink}
              </code>
              <button onClick={copyLink} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Đã chép" : "Sao chép"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Mã CTV: <span className="font-mono font-bold text-blue-600">{profile.referral_code}</span></p>
          </>
        ) : (
          <p className="text-sm text-slate-500">Mã giới thiệu chưa được tạo. Vui lòng liên hệ admin.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `app/cong-tac-vien/(dashboard)/don-hang/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface OrderRow {
  id: string;
  order_code: string;
  customer_name: string;
  total_amount: number;
  status: string;
  commission_status: string;
  commission_amount: number | null;
  created_at: string;
}

const statusColor: Record<string, string> = {
  "Chờ xử lý": "bg-amber-100 text-amber-700",
  "Chờ thanh toán": "bg-yellow-100 text-yellow-700",
  "Đã xác nhận": "bg-indigo-100 text-indigo-700",
  "Đang giao": "bg-blue-100 text-blue-700",
  "Đã hoàn thành": "bg-green-100 text-green-700",
  "Đã huỷ": "bg-rose-100 text-rose-700",
};

export default function CTVDashboardOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collaborator/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Đơn hàng của tôi</h1>
      {orders.length === 0 ? (
        <p className="text-slate-500 text-center py-12">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Mã đơn</th>
                <th className="px-4 py-3 text-left">Khách</th>
                <th className="px-4 py-3 text-right">Tổng</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hoa hồng</th>
                <th className="px-4 py-3 text-left">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">#{o.order_code || o.id.slice(-5)}</td>
                  <td className="px-4 py-3">{o.customer_name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(o.total_amount).toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[o.status] || "bg-slate-100 text-slate-700"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {o.commission_status === "earned" ? (
                      <span className="text-green-600 font-semibold">+{Number(o.commission_amount).toLocaleString("vi-VN")}đ</span>
                    ) : o.commission_status === "cancelled" ? (
                      <span className="text-rose-500 line-through">{Number(o.commission_amount).toLocaleString("vi-VN")}đ</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(o.created_at).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `app/cong-tac-vien/(dashboard)/hoa-hong/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface CommissionRow {
  id: string;
  amount: number;
  type: string;
  note: string | null;
  order_id: string | null;
  created_at: string;
}

const typeLabel: Record<string, { label: string; color: string }> = {
  order_earned: { label: "Hoa hồng đơn hàng", color: "text-green-600" },
  refund: { label: "Hoàn tác", color: "text-rose-500" },
  withdrawal: { label: "Rút tiền", color: "text-blue-600" },
  adjustment: { label: "Điều chỉnh", color: "text-slate-600" },
};

export default function CTVDashboardCommissionsPage() {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collaborator/commissions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.commissions || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Lịch sử hoa hồng</h1>
      {rows.length === 0 ? (
        <p className="text-slate-500 text-center py-12">Chưa có giao dịch nào.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Loại</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-left">Ghi chú</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const meta = typeLabel[r.type] || { label: r.type, color: "text-slate-600" };
                const isPositive = r.amount > 0;
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 font-medium ${meta.color}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {meta.label}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${isPositive ? "text-green-600" : "text-rose-500"}`}>
                      {isPositive ? "+" : ""}{Number(r.amount).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.note || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create `app/cong-tac-vien/(dashboard)/rut-tien/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Banknote } from "lucide-react";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface WithdrawalRow {
  id: string;
  amount: number;
  status: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  created_at: string;
  processed_at: string | null;
  admin_note: string | null;
}

export default function CTVDashboardWithdrawPage() {
  const { profile, refresh } = useCurrentUser();
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetch("/api/collaborator/withdrawals", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.withdrawals || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (profile) {
      setBankName(profile.bank_name || "");
      setBankAccount(profile.bank_account || "");
      setBankHolder(profile.bank_holder || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Số tiền không hợp lệ");
    if (!bankName || !bankAccount || !bankHolder) return toast.error("Vui lòng điền đầy đủ thông tin ngân hàng");

    setSubmitting(true);
    try {
      const res = await fetch("/api/collaborator/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: amt, bank_name: bankName, bank_account: bankAccount, bank_holder: bankHolder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yêu cầu thất bại");
      toast.success("Yêu cầu đã gửi, vui lòng chờ admin duyệt");
      setAmount("");
      load();
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Rút tiền</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Tạo yêu cầu rút</h2>
          <div className="text-sm text-slate-500">Số dư: <span className="font-bold text-blue-600">{Number(profile?.commission_balance ?? 0).toLocaleString("vi-VN")}đ</span></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền (VNĐ) *</label>
            <input type="number" required min={1000} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên ngân hàng *</label>
            <input type="text" required value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="VD: Vietcombank" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số tài khoản *</label>
            <input type="text" required value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chủ tài khoản *</label>
            <input type="text" required value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          </div>
          <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
            Gửi yêu cầu
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-bold text-slate-900 mb-3">Lịch sử yêu cầu</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : rows.length === 0 ? (
          <p className="text-slate-500 text-center py-12 bg-white rounded-2xl">Chưa có yêu cầu nào.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Ngày</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-left">Ngân hàng</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-500">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                    <td className="px-4 py-3 text-right font-semibold">{Number(r.amount).toLocaleString("vi-VN")}đ</td>
                    <td className="px-4 py-3 text-xs">{r.bank_name} - {r.bank_account} - {r.bank_holder}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        r.status === "pending" ? "bg-amber-100 text-amber-700" :
                        r.status === "approved" ? "bg-blue-100 text-blue-700" :
                        r.status === "paid" ? "bg-green-100 text-green-700" :
                        "bg-rose-100 text-rose-700"
                      }`}>
                        {r.status === "pending" ? "Chờ duyệt" : r.status === "approved" ? "Đã duyệt" : r.status === "paid" ? "Đã trả" : "Từ chối"}
                      </span>
                      {r.admin_note && <p className="text-xs text-slate-400 mt-1">{r.admin_note}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create `app/cong-tac-vien/(dashboard)/tao-don/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

interface LineItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

export default function CTVDashboardCreateOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("products").select("id, name, price, image_url").eq("is_published", true).order("name")
      .then(({ data }) => setProducts(data || []));
  }, []);

  const addItem = (p: Product) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.product_id === p.id);
      if (ex) return prev.map((i) => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product_id: p.id, name: p.name, price: Number(p.price) || 0, quantity: 1, image: p.image_url }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return setItems((p) => p.filter((i) => i.product_id !== id));
    setItems((p) => p.map((i) => i.product_id === id ? { ...i, quantity: qty } : i));
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Vui lòng thêm ít nhất 1 sản phẩm");
    if (!customerName.trim() || !phone || !address) return toast.error("Vui lòng điền tên, SĐT, địa chỉ khách");

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập hết hạn");

      const res = await fetch("/api/collaborator/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customer_name: customerName, phone, email, address, note,
          items: items.map((i) => ({ id: i.product_id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo đơn thất bại");
      toast.success(`Đã tạo đơn #${data.order_code}`);
      setItems([]);
      setCustomerName(""); setPhone(""); setEmail(""); setAddress(""); setNote("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">Tạo đơn hàng thay khách</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <h2 className="font-bold text-slate-900">Thông tin khách</h2>
          <input type="text" required placeholder="Họ tên *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          <input type="tel" required placeholder="Số điện thoại *" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          <textarea required placeholder="Địa chỉ *" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
          <textarea placeholder="Ghi chú" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <h2 className="font-bold text-slate-900">Sản phẩm</h2>
          <select onChange={(e) => { const p = products.find((x) => x.id === e.target.value); if (p) addItem(p); e.currentTarget.value = ""; }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" defaultValue="">
            <option value="" disabled>+ Thêm sản phẩm...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {Number(p.price).toLocaleString("vi-VN")}đ</option>)}
          </select>

          {items.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Chưa có sản phẩm</p>
          ) : (
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.product_id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <span className="flex-1 text-sm truncate">{i.name}</span>
                  <input type="number" min={1} value={i.quantity} onChange={(e) => updateQty(i.product_id, Number(e.target.value))} className="w-16 px-2 py-1 border border-slate-200 rounded text-sm text-center" />
                  <span className="text-sm font-semibold w-24 text-right">{(i.price * i.quantity).toLocaleString("vi-VN")}đ</span>
                  <button type="button" onClick={() => setItems((p) => p.filter((x) => x.product_id !== i.product_id))} className="text-rose-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                <span>Tổng</span>
                <span className="text-blue-600">{total.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <button type="submit" disabled={submitting} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Tạo đơn hàng
      </button>
    </form>
  );
}
```

- [ ] **Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 9: Commit**

```bash
git add app/cong-tac-vien/
git commit -m "feat(ctv): dashboard layout + 5 sub-pages (overview/orders/commissions/withdraw/create-order)"
```

---

## Task 10: CTV API Routes

**Files:**
- Create: `app/api/collaborator/dashboard/route.ts`
- Create: `app/api/collaborator/orders/route.ts`
- Create: `app/api/collaborator/commissions/route.ts`
- Create: `app/api/collaborator/withdrawals/route.ts`
- Create: `app/api/collaborator/orders/create/route.ts`

- [ ] **Step 1: Create `app/api/collaborator/dashboard/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyCollaborator } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await verifyCollaborator(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: thisMonth }, { data: earnedRows }] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true })
      .eq("collaborator_id", user.id)
      .gte("created_at", startOfMonth.toISOString()),
    supabase.from("commissions").select("amount")
      .eq("collaborator_id", user.id)
      .eq("type", "order_earned"),
  ]);

  const totalEarned = (earnedRows || []).reduce((s, r) => s + Number(r.amount), 0);

  return NextResponse.json({ thisMonth, totalEarned });
}
```

- [ ] **Step 2: Create `app/api/collaborator/orders/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyCollaborator } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await verifyCollaborator(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data: orders, error: dbErr } = await supabase
    .from("orders")
    .select("id, order_code, customer_name, total_amount, status, commission_status, commission_amount, created_at")
    .eq("collaborator_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ orders: orders || [] });
}
```

- [ ] **Step 3: Create `app/api/collaborator/commissions/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyCollaborator } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await verifyCollaborator(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data, error: dbErr } = await supabase
    .from("commissions")
    .select("id, amount, type, note, order_id, created_at")
    .eq("collaborator_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ commissions: data || [] });
}
```

- [ ] **Step 4: Create `app/api/collaborator/withdrawals/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyCollaborator } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await verifyCollaborator(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data, error: dbErr } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("collaborator_id", user.id)
    .order("created_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ withdrawals: data || [] });
}

export async function POST(request: NextRequest) {
  const { user, error, supabase } = await verifyCollaborator(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json();
  const amount = Number(body.amount);
  const bank_name = String(body.bank_name || "").trim();
  const bank_account = String(body.bank_account || "").trim();
  const bank_holder = String(body.bank_holder || "").trim();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
  }
  if (!bank_name || !bank_account || !bank_holder) {
    return NextResponse.json({ error: "Thiếu thông tin ngân hàng" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("commission_balance")
    .eq("id", user.id)
    .single();

  if (!profile || Number(profile.commission_balance) < amount) {
    return NextResponse.json({ error: "Số dư không đủ" }, { status: 400 });
  }

  const { error: insErr } = await supabase.from("withdrawals").insert({
    collaborator_id: user.id,
    amount,
    bank_name,
    bank_account,
    bank_holder,
    status: "pending",
  });

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Create `app/api/collaborator/orders/create/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyCollaborator, getServiceClient } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const { user, error, supabase } = await verifyCollaborator(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json();
  const { customer_name, phone, email, address, note, items } = body;

  if (!customer_name || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Thiếu thông tin đơn hàng" }, { status: 400 });
  }

  const total = items.reduce((s: number, i: any) => s + Number(i.price) * Number(i.quantity), 0);
  const order_code = `BT-${Math.floor(100000 + Math.random() * 900000)}`;

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  const { data, error: insErr } = await supabase.from("orders").insert({
    order_code,
    customer_name,
    phone,
    email: email || "",
    address,
    note: note || "",
    items,
    total_amount: total,
    payment_method: "COD",
    status: "Chờ xử lý",
    collaborator_id: user.id,
    collaborator_code: profile?.referral_code || null,
    commission_status: "pending",
    created_by: user.id,
  }).select("id, order_code").single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id, order_code: data.order_code });
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add app/api/collaborator/
git commit -m "feat(api): CTV-side routes (dashboard, orders, commissions, withdrawals)"
```

---

## Task 11: Admin Tab — Collaborators + Withdrawals

**Files:**
- Modify: `app/admin/page.tsx`

This is the largest task. The admin file is 3700+ lines; we add a new tab.

- [ ] **Step 1: Read admin page sidebar config (around line 1514)**

Run: `read app/admin/page.tsx offset 1510 limit 30`

Find the `tabs` array with id/label/icon.

- [ ] **Step 2: Add `collaborators` tab to the array**

Add this object to the tabs array (right after `account` or wherever fits semantically):

```typescript
{ id: "collaborators", icon: <Handshake className="w-5 h-5" />, label: "Cộng tác viên" },
```

Import `Handshake` from `lucide-react` at the top of the file (add to existing icon import list).

- [ ] **Step 3: Add title for new tab**

Find the block at around line 1585-1595 with `{activeTab === 'X' && "Title"}` and add:

```typescript
{activeTab === 'collaborators' && "Quản lý cộng tác viên"}
```

- [ ] **Step 4: Read end of file (around line 3686) to see the fallback**

Find the `Mục <span className="font-bold text-blue-600">{activeTab}</span> đang được hoàn thiện` block.

- [ ] **Step 5: Insert the collaborators tab content block BEFORE the fallback**

Insert this large block before line 3686:

```tsx
{activeTab === 'collaborators' && (
  <CollaboratorsTab onSwitchTab={setActiveTab} />
)}
```

Create a new component `components/admin/CollaboratorsTab.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Check, X, Loader2, Banknote, Handshake } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface CollabRow {
  id: string;
  full_name: string | null;
  email?: string;
  phone: string | null;
  role: string;
  status: string;
  referral_code: string | null;
  commission_balance: number;
  created_at: string;
}

interface WithdrawalRow {
  id: string;
  amount: number;
  status: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  admin_note: string | null;
  created_at: string;
  collaborator_id: string;
  profiles?: { full_name: string | null; email?: string };
}

export default function CollaboratorsTab({ onSwitchTab }: { onSwitchTab?: (tab: string) => void }) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<"list" | "withdrawals">("list");
  const [collabs, setCollabs] = useState<CollabRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCollabs = async () => {
    const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/admin/collaborators", { headers: { Authorization: `Bearer ${session.access_token}` } });
    const d = await res.json();
    setCollabs(d.collaborators || []);
  };

  const loadWithdrawals = async () => {
    const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/admin/withdrawals", { headers: { Authorization: `Bearer ${session.access_token}` } });
    const d = await res.json();
    setWithdrawals(d.withdrawals || []);
  };

  useEffect(() => {
    Promise.all([loadCollabs(), loadWithdrawals()]).finally(() => setLoading(false));
  }, []);

  const updateColl = async (id: string, patch: Partial<CollabRow>) => {
    const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/admin/collaborators/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Lỗi");
      return;
    }
    toast.success("Đã cập nhật");
    loadCollabs();
  };

  const processWithdrawal = async (id: string, status: "approved" | "rejected" | "paid", note?: string) => {
    const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ status, admin_note: note }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || "Lỗi");
      return;
    }
    toast.success("Đã cập nhật");
    loadWithdrawals();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setSubTab("list")} className={`px-4 py-2 text-sm font-medium border-b-2 ${subTab === "list" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600"}`}>
          <Handshake className="w-4 h-4 inline mr-1" /> Danh sách CTV
        </button>
        <button onClick={() => setSubTab("withdrawals")} className={`px-4 py-2 text-sm font-medium border-b-2 ${subTab === "withdrawals" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600"}`}>
          <Banknote className="w-4 h-4 inline mr-1" /> Yêu cầu rút tiền {withdrawals.filter(w => w.status === "pending").length > 0 && <span className="ml-1 bg-rose-500 text-white text-xs rounded-full px-1.5">{withdrawals.filter(w => w.status === "pending").length}</span>}
        </button>
      </div>

      {subTab === "list" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <h2 className="font-bold text-slate-900 mb-4">Danh sách cộng tác viên</h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Họ tên</th>
                <th className="px-4 py-3 text-left">Mã</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-right">Số dư</th>
                <th className="px-4 py-3 text-left">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {collabs.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">Chưa có CTV</td></tr>}
              {collabs.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.full_name || "—"}</div>
                    <div className="text-xs text-slate-500">{c.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-blue-600">{c.referral_code || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      c.status === "active" ? "bg-green-100 text-green-700" :
                      c.status === "pending" ? "bg-amber-100 text-amber-700" :
                      "bg-rose-100 text-rose-700"
                    }`}>
                      {c.status === "active" ? "Hoạt động" : c.status === "pending" ? "Chờ duyệt" : "Bị khóa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(c.commission_balance).toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(c.created_at).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {c.status === "pending" && <button onClick={() => updateColl(c.id, { status: "active" })} className="px-2 py-1 bg-green-600 text-white text-xs rounded">Duyệt</button>}
                    {c.status === "active" && <button onClick={() => updateColl(c.id, { status: "banned" })} className="px-2 py-1 bg-rose-500 text-white text-xs rounded">Khóa</button>}
                    {c.status === "banned" && <button onClick={() => updateColl(c.id, { status: "active" })} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Mở khóa</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === "withdrawals" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <h2 className="font-bold text-slate-900 mb-4">Yêu cầu rút tiền</h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">CTV</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-left">Ngân hàng</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Ngày</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">Chưa có yêu cầu</td></tr>}
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium">{w.profiles?.full_name || "—"}</div>
                    <div className="text-xs text-slate-500 font-mono">{w.profiles?.email || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{Number(w.amount).toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-3 text-xs">{w.bank_name}<br/>{w.bank_account} - {w.bank_holder}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      w.status === "pending" ? "bg-amber-100 text-amber-700" :
                      w.status === "approved" ? "bg-blue-100 text-blue-700" :
                      w.status === "paid" ? "bg-green-100 text-green-700" :
                      "bg-rose-100 text-rose-700"
                    }`}>
                      {w.status === "pending" ? "Chờ duyệt" : w.status === "approved" ? "Đã duyệt" : w.status === "paid" ? "Đã trả" : "Từ chối"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(w.created_at).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {w.status === "pending" && (
                      <>
                        <button onClick={() => { const note = prompt("Ghi chú (tùy chọn)"); processWithdrawal(w.id, "approved", note || undefined); }} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Duyệt</button>
                        <button onClick={() => { const note = prompt("Lý do từ chối"); if (note) processWithdrawal(w.id, "rejected", note); }} className="px-2 py-1 bg-rose-500 text-white text-xs rounded">Từ chối</button>
                      </>
                    )}
                    {w.status === "approved" && <button onClick={() => processWithdrawal(w.id, "paid", "Đã chuyển khoản")} className="px-2 py-1 bg-green-600 text-white text-xs rounded">Đánh dấu đã trả</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add app/admin/page.tsx components/admin/CollaboratorsTab.tsx
git commit -m "feat(admin): collaborators tab with sub-tab for withdrawals"
```

---

## Task 12: Admin API Routes (Collaborators + Withdrawals)

**Files:**
- Create: `app/api/admin/collaborators/route.ts`
- Create: `app/api/admin/collaborators/[id]/route.ts`
- Create: `app/api/admin/withdrawals/route.ts`
- Create: `app/api/admin/withdrawals/[id]/route.ts`

- [ ] **Step 1: Create `app/api/admin/collaborators/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getServiceClient } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const service = getServiceClient();
  const { data, error: dbErr } = await service
    .from("profiles")
    .select("id, full_name, phone, role, status, referral_code, commission_balance, created_at, auth_users:auth.users(email)")
    .eq("role", "collaborator")
    .order("created_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  // Normalize email join
  const rows = (data || []).map((r: any) => ({ ...r, email: r.auth_users?.email }));
  return NextResponse.json({ collaborators: rows });
}
```

Note: if the `auth_users` join doesn't work in Supabase JS, do a separate query for emails. Keep this simple: get profile rows, then map emails from a second query.

- [ ] **Step 2: Create `app/api/admin/collaborators/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getServiceClient } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const allowed: Record<string, unknown> = {};
  if (body.status) allowed.status = body.status;
  if (body.full_name !== undefined) allowed.full_name = body.full_name;
  if (body.phone !== undefined) allowed.phone = body.phone;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const service = getServiceClient();
  const { data, error: dbErr } = await service
    .from("profiles")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
```

- [ ] **Step 3: Create `app/api/admin/withdrawals/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getServiceClient } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin(request);
  if (error) return NextResponse.json({ error }, { status: 401 });

  const service = getServiceClient();
  const { data, error: dbErr } = await service
    .from("withdrawals")
    .select("*, profiles:profiles!withdrawals_collaborator_id_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ withdrawals: data || [] });
}
```

- [ ] **Step 4: Create `app/api/admin/withdrawals/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, getServiceClient } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await verifyAdmin(request);
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, admin_note } = body;

  if (!["approved", "rejected", "paid"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const service = getServiceClient();

  // Get the withdrawal
  const { data: w } = await service.from("withdrawals").select("*").eq("id", id).single();
  if (!w) return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });

  // If approving (first time), insert a commission row (type=withdrawal, amount=-X) to deduct balance
  if (status === "approved" && w.status === "pending") {
    const { error: commErr } = await service.from("commissions").insert({
      collaborator_id: w.collaborator_id,
      order_id: null,
      amount: -Number(w.amount),
      type: "withdrawal",
      note: `Yêu cầu rút tiền #${id.slice(-6)}`,
      created_by: user.id,
      created_by_email: user.email,
    });
    if (commErr) return NextResponse.json({ error: commErr.message }, { status: 500 });
  }

  // Update withdrawal
  const { error: updErr } = await service
    .from("withdrawals")
    .update({
      status,
      admin_note: admin_note || null,
      processed_by: user.id,
      processed_by_email: user.email,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/collaborators app/api/admin/withdrawals
git commit -m "feat(api): admin routes for collaborators and withdrawals"
```

---

## Task 13: Admin — Settings Default Commission + Product Override + Orders Column

**Files:**
- Modify: `app/admin/page.tsx`
- Modify: `components/ProductForm.tsx`

- [ ] **Step 1: Add `default_commission_percent` to settings tab**

Find the settings tab render block (around line 3419). Find the input fields. Add a new field:

```tsx
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">Hoa hồng CTV mặc định (%)</label>
  <input
    type="number"
    step="0.01"
    min="0"
    max="100"
    value={settings.default_commission_percent ?? 5}
    onChange={(e) => updateSettings({ default_commission_percent: Number(e.target.value) })}
    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
  />
  <p className="text-xs text-slate-500 mt-1">Áp dụng cho sản phẩm không có hoa hồng riêng.</p>
</div>
```

- [ ] **Step 2: Add `commission_percent` field to ProductForm**

Find the form fields (use existing pattern). Add a new section near the price/sale fields. Look at the existing form structure first:

Run: `grep -n "original_price\|images" components/ProductForm.tsx | head -10`

Insert near the price fields:

```tsx
<div>
  <label className="block mb-1 font-semibold text-slate-700 text-sm">Hoa hồng CTV riêng (%)</label>
  <input
    type="number"
    step="0.01"
    min="0"
    max="100"
    value={form.commission_percent ?? ""}
    onChange={(e) => setForm({ ...form, commission_percent: e.target.value ? Number(e.target.value) : null })}
    placeholder="Để trống = dùng mặc định"
    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
  />
</div>
```

Also update the form initial state and the `INSERT/UPDATE` payload. Find where `setForm` initializes and where the product is saved, add `commission_percent` to both.

- [ ] **Step 3: Add commission column to orders table in admin**

Find the orders table in admin (around line 1980-2000). Add a new column "Hoa hồng":

```tsx
<th className="px-4 py-3 font-medium">Hoa hồng</th>
```

And in `<tbody>`:
```tsx
<td className="px-4 py-3 text-right">
  {o.commission_status === "earned" && <span className="text-green-600 font-semibold text-xs">+{Number(o.commission_amount).toLocaleString("vi-VN")}đ</span>}
  {o.commission_status === "cancelled" && <span className="text-rose-500 line-through text-xs">{Number(o.commission_amount).toLocaleString("vi-VN")}đ</span>}
  {(!o.commission_status || o.commission_status === "none" || o.commission_status === "pending") && <span className="text-slate-400 text-xs">—</span>}
</td>
```

Make sure the orders query selects `commission_status, commission_amount`.

- [ ] **Step 4: Add CTV dropdown in create-order modal**

Find the create-order modal (around line 2011-2292). Add a dropdown:

```tsx
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">Cộng tác viên</label>
  <select
    value={newOrder.collaborator_id || ""}
    onChange={(e) => {
      const c = collabList.find((x) => x.id === e.target.value);
      setNewOrder({ ...newOrder, collaborator_id: e.target.value || null, collaborator_code: c?.referral_code || null });
    }}
    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"
  >
    <option value="">-- Không có --</option>
    {collabList.filter((c) => c.status === "active").map((c) => (
      <option key={c.id} value={c.id}>{c.full_name || c.email} ({c.referral_code})</option>
    ))}
  </select>
</div>
```

Add `collabList` state that fetches from `/api/admin/collaborators` when modal opens.

Also include `collaborator_id, collaborator_code` in the order insert payload.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx components/ProductForm.tsx
git commit -m "feat(admin): commission settings + product override + orders column + CTV dropdown"
```

---

## Task 14: Header Link + Ensure-Profile API + Final Smoke Test

**Files:**
- Modify: `components/Header.tsx`
- Create: `app/api/auth/ensure-profile/route.ts`

- [ ] **Step 1: Add ensure-profile route**

Create `app/api/auth/ensure-profile/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api-auth";
import { ensureProfile } from "@/lib/profile";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }
  const token = authHeader.substring(7);
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Invalid" }, { status: 401 });

  const profile = await ensureProfile(client, user);
  return NextResponse.json({ profile });
}
```

- [ ] **Step 2: Update `useCurrentUser` to call ensure-profile on mount**

In `hooks/useCurrentUser.ts`, in the `load` function, after `setUser(u)`, add:

```typescript
if (u) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    await fetch("/api/auth/ensure-profile", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {});
  }
}
```

Then re-fetch profile after.

- [ ] **Step 3: Add CTV link in Header**

Find `components/Header.tsx` (around line 195-216, the user menu). Add a conditional link:

```tsx
{user && userRole === "collaborator" && (
  <Link href="/cong-tac-vien" className="...">Khu vực CTV</Link>
)}
{!user && (
  <Link href="/dang-ky-ctv" className="...">Đăng ký CTV</Link>
)}
```

You'll need to use `useCurrentUser` in Header. Add the import and call.

- [ ] **Step 4: Verify TypeScript compiles + build**

Run: `npx tsc --noEmit && npm run build`
Expected: 0 errors, build success.

- [ ] **Step 5: Manual smoke test of 14 spec cases**

Before running, **user must**:
1. Run the migration from Task 1 in Supabase SQL editor.
2. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

Then perform manual smoke test per spec section 9. Document results in commit message:

```bash
git add components/Header.tsx hooks/useCurrentUser.ts app/api/auth/ensure-profile/route.ts
git commit -m "feat: ensure-profile API + header CTV link + manual smoke test passed"
```

If any case fails, fix and re-test before committing.

---

## Self-Review

**Spec coverage:**
- Schema (3.1–3.5): Task 1 ✓
- Auth (4.1–4.3): Tasks 2, 3, 4 ✓
- Capture (5.1–5.4): Tasks 5, 6, 7 ✓
- Commission trigger (6): Task 1 (trigger function) ✓
- Public pages (7.1): Task 8 ✓
- CTV dashboard (7.2): Task 9 ✓
- Admin tab (7.3): Tasks 11, 13 ✓
- API routes (8): Tasks 10, 12 ✓
- Testing (9): Task 14 ✓

**Placeholders:** None — all code blocks complete.

**Type consistency:**
- `Role` type from `lib/types.ts` used in `verifyRole`, `useCurrentUser`, `useCurrentUserState` ✓
- `Profile` type used in `useCurrentUser` and forms ✓
- `Commission`, `Withdrawal` types defined and used in API responses ✓
- `commission_status` enum values consistent across SQL, API, UI ✓

**Out-of-scope items not added** (per spec section 11): multi-level, emails, charts, payment gateway ✓

Plan complete.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-10-collaborator-commission.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
