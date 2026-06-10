# Spec: Cộng tác viên (CTV) + Hoa hồng

**Ngày:** 2026-06-10
**Trạng thái:** Draft — chờ duyệt
**Phạm vi:** Phase 1 (có tài khoản CTV, dashboard 3 tab + tạo đơn, rút tiền có duyệt, hoa hồng tự động theo đơn hoàn thành)

---

## 1. Tổng quan

Hệ thống hiện tại (bantu) là shop bán nội thất nhựa, checkout ẩn danh, không có role, không có commission. Spec này thêm:

- **CTV (collaborator)** — người giúp bán hàng, có tài khoản riêng, nhận hoa hồng.
- **2 cách gắn CTV vào đơn:** khách click link `?ref=CODE`, hoặc CTV tự tạo đơn thay khách từ dashboard của họ.
- **Hoa hồng cộng dồn** theo tỷ lệ % (global default + override từng sản phẩm), trigger khi đơn `Đã hoàn thành`. Có reversal/re-earn khi admin sửa trạng thái nhầm.
- **Rút tiền** có duyệt (CTV tạo yêu cầu, admin duyệt → trừ balance).

**Không thuộc phase 1:** multi-level, email tự động, chart nâng cao, payment gateway cho rút tiền.

## 2. Actors & luồng

| Actor | Hành vi |
|---|---|
| **Visitor** | Vào `?ref=CODE` → cookie `bantu_ref` 30 ngày → đặt hàng → đơn gắn CTV. |
| **CTV (chưa đăng ký)** | Vào `/dang-ky-ctv` → điền form → status `pending` → chờ admin duyệt. |
| **CTV (đã active)** | Login `/dang-nhap-ctv` → `/cong-tac-vien` xem 3 tab + tạo đơn + rút tiền. |
| **Admin** | Login `/admin` → tab `collaborators` (duyệt/khóa) + tab `withdrawals` (duyệt rút) + tab `orders` (chỉnh CTV cho đơn) + tab `settings` (sửa % mặc định + sửa % từng sản phẩm). |

## 3. Schema

### 3.1 Bảng mới

**`profiles`** — mở rộng `auth.users`:
```
id              UUID PK (FK → auth.users.id ON DELETE CASCADE)
full_name       TEXT
phone           TEXT
role            TEXT NOT NULL CHECK (role IN ('admin','collaborator','customer'))
status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','banned'))
referral_code   TEXT UNIQUE  -- chỉ fill cho collaborator
commission_balance NUMERIC(12,0) NOT NULL DEFAULT 0
bank_name       TEXT
bank_account    TEXT
bank_holder     TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

**`commissions`** — event log, append-only:
```
id              UUID PK
collaborator_id UUID NOT NULL FK → profiles.id
order_id        UUID FK → orders.id  -- NULL cho adjustment
amount          NUMERIC(12,0) NOT NULL  -- dương = cộng, âm = trừ
type            TEXT NOT NULL CHECK (type IN ('order_earned','withdrawal','adjustment','refund'))
note            TEXT
created_by      UUID
created_by_email TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

**`withdrawals`** — yêu cầu rút tiền:
```
id              UUID PK
collaborator_id UUID NOT NULL FK → profiles.id
amount          NUMERIC(12,0) NOT NULL CHECK (amount > 0)
bank_name       TEXT NOT NULL
bank_account    TEXT NOT NULL
bank_holder     TEXT NOT NULL
status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid'))
admin_note      TEXT
processed_by    UUID
processed_by_email TEXT
processed_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

### 3.2 Cột thêm vào bảng có sẵn

**`orders`:**
- `collaborator_id UUID NULL FK → profiles.id` (CTV phụ trách)
- `collaborator_code TEXT NULL` (mã ref tại thời điểm đặt, giữ nguyên kể cả khi CTV đổi mã)
- `commission_amount NUMERIC(12,0) NULL` (snapshot khi earned)
- `commission_status TEXT NOT NULL DEFAULT 'none' CHECK (commission_status IN ('none','pending','earned','cancelled'))`

**`products`:**
- `commission_percent NUMERIC(5,2) NULL` (override riêng. NULL → dùng global default)

**`store_settings`:**
- `default_commission_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00`

### 3.3 Trigger functions

1. **Tạo profile tự động** — Trên một số plan Supabase không cho trigger `auth.users`. Cách dùng: helper server `lib/profile.ts` → `ensureProfile(user)` được gọi từ:
   - Sau mỗi `supabase.auth.signUp` (client + server) — signInWithPassword cũng gọi để backfill nếu user cũ thiếu profile.
   - Server route `/api/auth/ensure-profile` (idempotent) gọi lúc mount app lần đầu.
   - `ensureProfile` insert `profiles` (role='customer', status='active') nếu chưa có row với `id = user.id`. Dùng `ON CONFLICT DO NOTHING`.
2. **`apply_order_commission()`** — AFTER UPDATE trên `orders` (khi `status` thay đổi). Logic theo bảng phần 5b.
3. **`sync_profile_balance()`** — AFTER INSERT trên `commissions` → UPDATE `profiles.commission_balance` = (SELECT COALESCE(SUM(amount),0) FROM commissions WHERE collaborator_id = NEW.collaborator_id).
4. **`generate_referral_code()`** — BEFORE UPDATE trên `profiles` khi chuyển `status` từ `pending` → `active` và role='collaborator' và `referral_code IS NULL` → generate 6-char A-Z0-9 unique.

### 3.4 RLS

- `profiles`: user đọc/update row của mình (`auth.uid() = id`); admin đọc tất cả qua service_role.
- `commissions`: user đọc row của mình (`auth.uid() = collaborator_id`).
- `withdrawals`: user đọc/tạo row của mình.
- Tất cả ghi admin → dùng service_role key (server-side route).

### 3.5 Seed

```sql
INSERT INTO profiles (id, role)
SELECT id, 'admin' FROM auth.users
WHERE email = 'tungpham.it@gmail.com'
ON CONFLICT (id) DO NOTHING;
```

## 4. Auth & Role Gating

### 4.1 Sửa `lib/api-auth.ts`

- Thêm `Role = 'admin' | 'collaborator' | 'customer'`.
- Thêm `verifyRole(request, allowedRoles: Role[])` — load `profiles.role, status` qua anon client với Bearer token; 401 nếu không có user, 403 nếu role không khớp hoặc status !== 'active'.
- `verifyAdmin` → gọi `verifyRole(request, ['admin'])`.

### 4.2 Client hooks

- `hooks/useCurrentUser.ts` — trả về `{ user, profile, role, isLoading, isAdmin, isCollaborator }`. Cache trong `useState` + fetch 1 lần khi mount.

### 4.3 Page guards

- `/admin` — nếu `!isAdmin` → redirect `/`.
- `/cong-tac-vien/**` — nếu `!isCollaborator` → redirect `/dang-nhap-ctv`.
- `/dang-ky-ctv` — nếu đã login với role !== customer → redirect `/cong-tac-vien`.

## 5. Capture & Attribution (gắn CTV vào đơn)

### 5.1 Visitor vào link `?ref=CODE`

1. `components/ReferralCapture.tsx` mount trong `app/layout.tsx` (client component, render 1 lần).
2. Đọc `?ref=CODE` từ URL → gọi `GET /api/public/referral/[code]`:
   - **200** → set cookie `bantu_ref=CODE`, `path=/`, `max-age=2592000` (30 ngày), `SameSite=Lax`. Xóa `?ref` khỏi URL bằng `history.replaceState`.
   - **404 / 410** → bỏ qua silent (không log).

### 5.2 Sửa `app/thanh-toan/page.tsx`

- Trước khi insert order, đọc cookie `bantu_ref` (server: `next/headers cookies()`).
- Nếu có, lookup `collaborator_id` qua service client (admin context).
- Insert order với `collaborator_id`, `collaborator_code`, `commission_status='pending'`.

### 5.3 Admin tạo/sửa đơn

- Modal tạo/sửa đơn trong `app/admin/page.tsx` (~line 2011): thêm dropdown chọn CTV (lọc từ `profiles` role='collaborator' status='active'). Khi chọn → fill `collaborator_id` + `collaborator_code`.

### 5.4 Đơn do CTV tạo từ `/cong-tac-vien/tao-don`

- Insert với `collaborator_id = CTV user id`, `created_by` + `created_by_email` của CTV, status='Chờ xử lý'. Không cần cookie.

## 6. Commission Trigger & Reversal

Trigger `apply_order_commission()` chạy khi `orders.status` UPDATE, theo bảng:

| Transition | `commission_status` trước | Hành động | Sau |
|---|---|---|---|
| → Hoàn thành | `none` | Insert `commissions` type=`order_earned` +X | `earned` |
| → Hoàn thành | `cancelled` (đã có row earned cũ) | Insert `order_earned` +X (note: "Tính lại") | `earned` |
| → Hoàn thành | `earned` | Không làm gì (idempotent) | `earned` |
| Hoàn thành → khác | `earned` | Insert `commissions` type=`refund` −X | `cancelled` |
| Hoàn thành → khác | `cancelled` | Không làm gì | `cancelled` |
| Bất kỳ → khác (không qua Hoàn thành) | bất kỳ | Không làm gì | giữ nguyên |

**Công thức X:** `X = SUM(item.price * item.quantity * effective_percent / 100)` cho từng item trong `orders.items` (effective_percent = `products.commission_percent` nếu không NULL, ngược lại `store_settings.default_commission_percent`).

**Cú pháp check idempotent:**
```sql
-- Khi → Hoàn thành, nếu đã có row order_earned và status='cancelled':
EXISTS (SELECT 1 FROM commissions WHERE order_id = NEW.id AND type = 'order_earned')
```

## 7. Trang mới

### 7.1 Public

- `app/dang-ky-ctv/page.tsx` — form (họ tên, SĐT, email, password, xác nhận). Submit → `supabase.auth.signUp` + insert `profiles` (role='collaborator', status='pending'). Hiển thị "Đang chờ duyệt".
- `app/dang-nhap-ctv/page.tsx` — form login email/password. Redirect → `/cong-tac-vien`.
- `components/ReferralCapture.tsx` — client component mount trong root layout, xử lý `?ref=CODE`.
- Header thêm 2 link: "Đăng ký CTV" (chưa login) / "Khu vực CTV" (đã login CTV).

### 7.2 CTV Dashboard

- `app/cong-tac-vien/layout.tsx` — guard role=collaborator. Sidebar nav 4 tab.
- `app/cong-tac-vien/(dashboard)/tong-quan/page.tsx` — số dư, đơn tháng này, tổng earned, link giới thiệu + copy button, QR landing.
- `app/cong-tac-vien/(dashboard)/don-hang/page.tsx` — bảng đơn do mình phụ trách.
- `app/cong-tac-vien/(dashboard)/hoa-hong/page.tsx` — lịch sử `commissions` (gồm cả row âm).
- `app/cong-tac-vien/(dashboard)/rut-tien/page.tsx` — form rút (số tiền, ngân hàng) + bảng yêu cầu.
- `app/cong-tac-vien/(dashboard)/tao-don/page.tsx` — form tạo đơn thay khách: chọn sản phẩm từ catalog, điền thông tin khách, submit. Order tự gắn `collaborator_id = mình`.

### 7.3 Admin thêm tab

- `app/admin/page.tsx` thêm tab `collaborators` (icon `Handshake`):
  - Bảng CTV: tên, email, mã, status, balance, ngày tạo, actions (Duyệt / Khóa / Sửa).
  - Sub-tab Yêu cầu rút: bảng `withdrawals` filter status=pending, nút Duyệt/Từ chối.
- Tab `settings` thêm field `default_commission_percent`.
- Tab `orders` thêm cột "Hoa hồng" (amount + status badge) + dropdown CTV trong modal tạo/sửa.
- Tab `products` thêm field `commission_percent` trong form sửa.

## 8. API Routes

| Method | Path | Auth | Mục đích |
|---|---|---|---|
| GET | `/api/public/referral/[code]` | Public | Validate mã, set cookie |
| GET | `/api/admin/collaborators` | Admin | List CTV |
| POST | `/api/admin/collaborators` | Admin | Tạo CTV tay |
| PATCH | `/api/admin/collaborators/[id]` | Admin | Duyệt / khóa / sửa |
| GET | `/api/admin/withdrawals` | Admin | List withdrawals |
| PATCH | `/api/admin/withdrawals/[id]` | Admin | Duyệt / từ chối |
| GET | `/api/collaborator/dashboard` | Collaborator | Stats |
| GET | `/api/collaborator/orders` | Collaborator | Đơn của mình |
| GET | `/api/collaborator/commissions` | Collaborator | Lịch sử hoa hồng |
| GET | `/api/collaborator/withdrawals` | Collaborator | List của mình |
| POST | `/api/collaborator/withdrawals` | Collaborator | Tạo yêu cầu |
| POST | `/api/collaborator/orders/create` | Collaborator | Tạo đơn thay khách |

Mỗi route dùng `verifyRole` phù hợp, mutation ghi qua service-role key (server-side).

## 9. Testing — 14 case tối thiểu

1. Visitor `?ref=VALID` → cookie set, URL sạch.
2. Visitor đặt hàng → order có `collaborator_id` đúng.
3. Admin → Hoàn thành → `commissions` +X, balance tăng, `commission_status='earned'`.
4. Admin Hoàn thành → Huỷ → `commissions` −X, balance giảm, `commission_status='cancelled'`.
5. Admin Huỷ → Hoàn thành lại → row earned mới (note "Tính lại"), balance phục hồi.
6. Sản phẩm có `commission_percent=10` → commission tính 10%, không phải global 5%.
7. CTV tạo đơn qua `/cong-tac-vien/tao-don` → order có `collaborator_id = mình`.
8. CTV rút 500k (balance 1000k) → status pending, balance chưa đổi.
9. Admin duyệt withdrawal → status=paid, `commissions` type=withdrawal −500k, balance=500k.
10. CTV rút > balance → server reject 400.
11. Đăng ký CTV → status=pending → admin duyệt → status=active, `referral_code` auto-gen unique.
12. Cookie `bantu_ref` cũ bị ghi đè bởi cookie mới khi vào link ref khác.
13. `/cong-tac-vien` không có session → redirect `/dang-nhap-ctv`.
14. Admin bấm "Đã hoàn thành" 2 lần liên tiếp → không insert row thứ 2 (idempotent).

## 10. Rollout

1. Chạy migration trên Supabase production.
2. Verify admin row seed (email `tungpham.it@gmail.com`).
3. Deploy Next.js code.
4. Smoke test thủ công 14 case trên với tài khoản thật.
5. Không cần feature flag (mặc định: ref link hoạt động, CTV chỉ active sau khi admin duyệt).

## 11. Out of scope (phase 2+)

- Multi-level referral (CTV giới thiệu CTV).
- Email tự động (khi đăng ký, khi có hoa hồng, khi rút tiền).
- Chart thống kê nâng cao trong dashboard CTV.
- Thanh toán tự động qua cổng (thay vì admin chuyển khoản tay).
- API public cho CTV lấy catalog qua JSON.
- Top sản phẩm theo CTV.

## 12. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Race condition: 2 trigger cùng update balance | Trigger dùng `SUM()` aggregate từ bảng `commissions`, idempotent. |
| Admin sửa items trong đơn đã hoàn thành | Trigger chỉ chạy khi `status` thay đổi, không trigger khi items/total đổi. |
| Cookie bị share nhầm | Max-age 30 ngày, ghi đè khi gặp ref mới (LIFO). |
| CTV đăng ký email đã tồn tại (với role khác) | Server check `profiles.role` trước khi signUp; nếu đã có → trả lỗi. |
| Referral code trùng | UNIQUE constraint + retry 3 lần khi generate. |
