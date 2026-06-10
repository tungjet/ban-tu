-- Chạy SQL này trong Supabase Dashboard > SQL Editor
-- Link: https://supabase.com/dashboard/project/nndpowcvfhmmxonaadyu/sql/new

-- =====================================================
-- 1. STORE SETTINGS (đã có từ trước)
-- =====================================================
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  phone TEXT DEFAULT '',
  zalo TEXT DEFAULT '',
  facebook TEXT DEFAULT '',
  address TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO store_settings (id, phone, zalo, facebook, address)
VALUES ('default', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read store_settings" ON store_settings;
CREATE POLICY "Public can read store_settings" ON store_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update store_settings" ON store_settings;
CREATE POLICY "Anyone can update store_settings" ON store_settings
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert store_settings" ON store_settings;
CREATE POLICY "Anyone can insert store_settings" ON store_settings
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 1.1. STORAGE - bucket ảnh sản phẩm / danh mục / avatar
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
CREATE POLICY "Public can read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
CREATE POLICY "Authenticated can upload product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated can update product images" ON storage.objects;
CREATE POLICY "Authenticated can update product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated can delete product images" ON storage.objects;
CREATE POLICY "Authenticated can delete product images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');

-- =====================================================
-- 2. PRODUCTS - bổ sung các cột thiếu
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price'
  ) THEN
    ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
  END IF;
END $$;


-- =====================================================
-- 3. CATEGORIES - thêm display_order để sắp xếp
-- =====================================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- =====================================================
-- 4. TESTIMONIALS - đánh giá khách hàng ở trang chủ
-- =====================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  initial TEXT DEFAULT '',
  product_label TEXT DEFAULT '',
  rating INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read testimonials" ON testimonials;
CREATE POLICY "Public can read testimonials" ON testimonials
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Anyone can manage testimonials" ON testimonials;
CREATE POLICY "Anyone can manage testimonials" ON testimonials
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 5. HOMEPAGE FEATURES - 3 ưu điểm trên trang chủ
-- =====================================================
CREATE TABLE IF NOT EXISTS homepage_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon TEXT DEFAULT 'shield',
  -- icon name lookup từ lucide-react: droplets, bug-off, shield-check, ...
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  color_theme TEXT DEFAULT 'blue',
  -- blue, orange, green, red, amber, purple
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE homepage_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read homepage_features" ON homepage_features;
CREATE POLICY "Public can read homepage_features" ON homepage_features
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Anyone can manage homepage_features" ON homepage_features;
CREATE POLICY "Anyone can manage homepage_features" ON homepage_features
  FOR ALL USING (true) WITH CHECK (true);

-- Seed dữ liệu mặc định nếu chưa có
INSERT INTO homepage_features (icon, title, description, color_theme, display_order)
SELECT * FROM (VALUES
  ('droplets', 'Chống nước 100%', 'Hoàn toàn không ngấm nước, không ẩm mốc hay phồng rộp như gỗ công nghiệp.', 'blue', 1),
  ('bug-off', 'Không mối mọt', 'Chất liệu nhựa nguyên sinh và nhôm loại bỏ hoàn toàn nguy cơ bị mối mọt tấn công.', 'orange', 2),
  ('shield-check', 'Độ bền vượt trội', 'Bảo hành vật liệu lên đến 10 năm. Chịu lực tốt, không cong vênh dưới tác động thời tiết.', 'green', 3)
) AS v(icon, title, description, color_theme, display_order)
WHERE NOT EXISTS (SELECT 1 FROM homepage_features);

-- =====================================================
-- 6. COMMENTS - hỏi đáp trên trang chi tiết sản phẩm
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_name TEXT,
  content TEXT NOT NULL,
  reply TEXT DEFAULT NULL,
  replied_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_product_id ON comments(product_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read comments" ON comments;
CREATE POLICY "Public can read comments" ON comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert comments" ON comments;
CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can manage comments" ON comments;
CREATE POLICY "Anyone can manage comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 7. REVIEWS - đánh giá có sao trên trang chi tiết sản phẩm
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_name TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  variant_label TEXT DEFAULT '',
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read reviews" ON reviews;
CREATE POLICY "Public can read reviews" ON reviews
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Anyone can insert reviews" ON reviews;
CREATE POLICY "Anyone can insert reviews" ON reviews
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can manage reviews" ON reviews;
CREATE POLICY "Anyone can manage reviews" ON reviews
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 8. ORDERS - bổ sung cột chi tiết đơn từ trang thanh toán
-- =====================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_by_email TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Chưa nhận tiền';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_received_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_received_by UUID DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_received_by_email TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_note TEXT DEFAULT '';

-- Đảm bảo policy cho phép insert đơn từ trang khách hàng (anon)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY orders_admin_insert ON orders
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Anyone can read orders" ON orders;
CREATE POLICY "Anyone can read orders" ON orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update orders" ON orders;
CREATE POLICY orders_admin_update ON orders
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Anyone can delete orders" ON orders;
CREATE POLICY "Anyone can delete orders" ON orders
  FOR DELETE USING (true);

-- =====================================================
-- 9. AUDIT FIELDS - Thêm thông tin người tạo, người sửa
-- =====================================================

-- 9.1. Tạo Function tự động lấy thông tin user từ Supabase Auth
CREATE OR REPLACE FUNCTION handle_audit_fields()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.created_by_email = auth.jwt() ->> 'email';
    NEW.updated_by = auth.uid();
    NEW.updated_by_email = auth.jwt() ->> 'email';
    -- Đặt updated_at cho INSERT
    BEGIN
      NEW.updated_at = now();
    EXCEPTION WHEN undefined_column THEN
      -- Bỏ qua nếu cột không tồn tại (sẽ không xảy ra vì đã thêm cột ở dưới)
    END;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
    NEW.updated_by_email = auth.jwt() ->> 'email';
    BEGIN
      NEW.updated_at = now();
    EXCEPTION WHEN undefined_column THEN
      -- Bỏ qua
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9.2. Block tự động thêm cột và trigger vào các bảng
DO $$
DECLARE
  t_name text;
  -- Danh sách các bảng cần thêm Audit
  tables text[] := ARRAY['products', 'categories', 'orders', 'testimonials', 'homepage_features', 'comments', 'reviews', 'store_settings'];
BEGIN
  FOREACH t_name IN ARRAY tables
  LOOP
    -- Thêm các cột audit (nếu chưa có)
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by UUID', t_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by_email TEXT', t_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_by UUID', t_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_by_email TEXT', t_name);
    
    -- Thêm updated_at nếu chưa có
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()', t_name);

    -- Xoá trigger cũ nếu tồn tại
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON %I', t_name, t_name);

    -- Tạo trigger mới
    EXECUTE format('
      CREATE TRIGGER trg_audit_%I
      BEFORE INSERT OR UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION handle_audit_fields();
    ', t_name, t_name);
  END LOOP;
END;
$$;

-- =====================================================
-- 10. PRODUCT VISIBILITY - Ẩn/Hiện sản phẩm
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Đảm bảo tất cả sản phẩm hiện có đều được đặt là true
UPDATE products SET is_published = true WHERE is_published IS NULL;


-- =====================================================
-- 11. UPDATE ORDERS STATUS CHECK CONSTRAINT
-- =====================================================
-- Xoá check constraint cũ của status nếu có và thêm check constraint mới hỗ trợ trạng thái "Đã xác nhận"
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('Chờ xử lý', 'Đã xác nhận', 'Đang giao', 'Đã hoàn thành', 'Đã huỷ'));


-- =====================================================
-- 12. ORDER LOGS - Lich su thay doi don hang
-- =====================================================
CREATE TABLE IF NOT EXISTS order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT,
  order_code TEXT,
  action TEXT NOT NULL CHECK (action IN ('created', 'status_changed', 'updated', 'deleted', 'merged')),
  old_status TEXT,
  new_status TEXT,
  changed_by UUID,
  changed_by_email TEXT,
  snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_code ON order_logs(order_code);
CREATE INDEX IF NOT EXISTS idx_order_logs_created_at ON order_logs(created_at DESC);

ALTER TABLE order_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE order_logs DROP CONSTRAINT IF EXISTS order_logs_action_check;
ALTER TABLE order_logs ADD CONSTRAINT order_logs_action_check CHECK (action IN ('created', 'status_changed', 'updated', 'deleted', 'merged'));

DROP POLICY IF EXISTS "Anyone can read order logs" ON order_logs;
CREATE POLICY "Anyone can read order logs" ON order_logs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert order logs" ON order_logs;
DROP POLICY IF EXISTS "Anyone can manage order logs" ON order_logs;

CREATE POLICY "Anyone can insert order logs" ON order_logs
  FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION handle_order_logs()
RETURNS trigger AS $$
DECLARE
  log_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO order_logs (
      order_id,
      order_code,
      action,
      old_status,
      new_status,
      changed_by,
      changed_by_email,
      snapshot
    )
    VALUES (
      NEW.id::text,
      NEW.order_code,
      'created',
      NULL,
      NEW.status,
      auth.uid(),
      auth.jwt() ->> 'email',
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    log_action := CASE
      WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN 'deleted'
      WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed'
      ELSE 'updated'
    END;

    INSERT INTO order_logs (
      order_id,
      order_code,
      action,
      old_status,
      new_status,
      changed_by,
      changed_by_email,
      snapshot
    )
    VALUES (
      NEW.id::text,
      COALESCE(NEW.order_code, OLD.order_code),
      log_action,
      OLD.status,
      NEW.status,
      auth.uid(),
      auth.jwt() ->> 'email',
      jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO order_logs (
      order_id,
      order_code,
      action,
      old_status,
      new_status,
      changed_by,
      changed_by_email,
      snapshot
    )
    VALUES (
      OLD.id::text,
      OLD.order_code,
      'deleted',
      OLD.status,
      NULL,
      auth.uid(),
      auth.jwt() ->> 'email',
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_logs ON orders;
CREATE TRIGGER trg_order_logs
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_order_logs();

-- =====================================================
-- COLLABORATOR / COMMISSION FEATURE
-- =====================================================

-- -----------------------------------------------------
-- 1. TABLES
-- -----------------------------------------------------

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

-- -----------------------------------------------------
-- 2. ALTER TABLE ADDITIONS
-- -----------------------------------------------------

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS collaborator_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS collaborator_code TEXT;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,0);
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS commission_status TEXT NOT NULL DEFAULT 'none'
    CHECK (commission_status IN ('none','pending','earned','cancelled'));

CREATE INDEX IF NOT EXISTS idx_orders_collaborator
  ON orders(collaborator_id) WHERE collaborator_id IS NOT NULL;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2);

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS default_commission_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00;

-- -----------------------------------------------------
-- 3. TRIGGER FUNCTIONS
-- -----------------------------------------------------

-- 3.1 Generate a unique 6-char referral code
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code TEXT;
  v_attempts INT := 0;
BEGIN
  LOOP
    v_attempts := v_attempts + 1;
    v_code := '';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = v_code);
    IF v_attempts >= 10 THEN
      RAISE EXCEPTION 'Could not generate unique referral code after 10 attempts';
    END IF;
  END LOOP;
  RETURN v_code;
END;
$$;

-- 3.2 BEFORE UPDATE on profiles: assign referral code
CREATE OR REPLACE FUNCTION trg_generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role = 'collaborator' AND NEW.status = 'active' AND NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_unique_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_generate_referral ON profiles;
CREATE TRIGGER profiles_generate_referral
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trg_generate_referral_code();

-- 3.3 Apply commission on order status change
CREATE OR REPLACE FUNCTION trg_apply_order_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_default_pct NUMERIC(5,2);
  v_total_commission NUMERIC(12,0) := 0;
  v_item_pct NUMERIC(5,2);
  v_item JSONB;
  v_item_id TEXT;
  v_item_price NUMERIC;
  v_item_qty NUMERIC;
  v_admin_email TEXT;
  v_had_earned BOOLEAN;
BEGIN
  IF NEW.status = OLD.status OR NEW.collaborator_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT default_commission_percent
    INTO v_default_pct
    FROM store_settings
   WHERE id = 'default';

  IF v_default_pct IS NULL THEN
    v_default_pct := 5.00;
  END IF;

  IF NEW.status = 'Đã hoàn thành' THEN
    IF NEW.commission_status = 'earned' THEN
      RETURN NEW;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM commissions WHERE order_id = NEW.id AND type = 'order_earned'
    ) INTO v_had_earned;

    IF NEW.items IS NOT NULL AND jsonb_typeof(NEW.items) = 'array' THEN
      CREATE TEMP TABLE IF NOT EXISTS _order_product_rates (
        product_id TEXT,
        pct NUMERIC(5,2)
      ) ON COMMIT DROP;
      DELETE FROM _order_product_rates;
      INSERT INTO _order_product_rates (product_id, pct)
      SELECT id::text, commission_percent
        FROM products
       WHERE id::text IN (SELECT (i->>'id') FROM jsonb_array_elements(NEW.items) i);

      FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
      LOOP
        v_item_id := v_item->>'id';
        v_item_price := COALESCE((v_item->>'price')::numeric, 0);
        v_item_qty := COALESCE((v_item->>'quantity')::numeric, 0);

        SELECT pct INTO v_item_pct
          FROM _order_product_rates
         WHERE product_id = v_item_id;

        IF v_item_pct IS NULL THEN
          v_item_pct := v_default_pct;
        END IF;

        v_total_commission := v_total_commission
          + ROUND(v_item_price * v_item_qty * v_item_pct / 100);
      END LOOP;
    END IF;

    SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

    IF NOT v_had_earned THEN
      INSERT INTO commissions (
        collaborator_id, order_id, amount, type, note, created_by, created_by_email
      ) VALUES (
        NEW.collaborator_id,
        NEW.id,
        v_total_commission,
        'order_earned',
        NULL,
        auth.uid(),
        v_admin_email
      );
    END IF;

    NEW.commission_amount := v_total_commission;
    NEW.commission_status := 'earned';

  ELSIF OLD.status = 'Đã hoàn thành' AND NEW.status <> 'Đã hoàn thành' THEN
    IF NEW.commission_status = 'earned' AND NEW.commission_amount IS NOT NULL THEN
      SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

      INSERT INTO commissions (
        collaborator_id, order_id, amount, type, note, created_by, created_by_email
      ) VALUES (
        NEW.collaborator_id,
        NEW.id,
        -NEW.commission_amount,
        'refund',
        'Hoàn tác do admin chuyển trạng thái đơn',
        auth.uid(),
        v_admin_email
      );

      NEW.commission_status := 'cancelled';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_apply_commission ON orders;
CREATE TRIGGER orders_apply_commission
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION trg_apply_order_commission();

-- 3.4 Sync profile.commission_balance on commission insert
CREATE OR REPLACE FUNCTION trg_sync_profile_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
     SET commission_balance = commission_balance + NEW.amount,
         updated_at = now()
   WHERE id = NEW.collaborator_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS commissions_sync_balance ON commissions;
CREATE TRIGGER commissions_sync_balance
AFTER INSERT ON commissions
FOR EACH ROW
EXECUTE FUNCTION trg_sync_profile_balance();

-- 3.5 Auto-update profiles.updated_at
CREATE OR REPLACE FUNCTION trg_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trg_profiles_updated_at();

-- -----------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- -----------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS profiles_self_read ON profiles;
CREATE POLICY profiles_self_read ON profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_self_update ON profiles;
CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_admin_all ON profiles;
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS profiles_public_referral_read ON profiles;

CREATE OR REPLACE VIEW public_profiles_referral AS
SELECT id, referral_code, full_name
  FROM profiles
 WHERE referral_code IS NOT NULL
   AND role = 'collaborator'
   AND status = 'active';

ALTER VIEW public_profiles_referral SET (security_invoker = on);

GRANT SELECT ON public_profiles_referral TO anon, authenticated;

-- commissions policies
DROP POLICY IF EXISTS commissions_self_read ON commissions;
CREATE POLICY commissions_self_read ON commissions
  FOR SELECT
  USING (auth.uid() = collaborator_id);

DROP POLICY IF EXISTS commissions_admin_all ON commissions;
CREATE POLICY commissions_admin_all ON commissions
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- withdrawals policies
DROP POLICY IF EXISTS withdrawals_self_read ON withdrawals;
CREATE POLICY withdrawals_self_read ON withdrawals
  FOR SELECT
  USING (auth.uid() = collaborator_id);

DROP POLICY IF EXISTS withdrawals_self_insert ON withdrawals;
CREATE POLICY withdrawals_self_insert ON withdrawals
  FOR INSERT
  WITH CHECK (auth.uid() = collaborator_id);

DROP POLICY IF EXISTS withdrawals_admin_all ON withdrawals;
CREATE POLICY withdrawals_admin_all ON withdrawals
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- -----------------------------------------------------
-- 5. SEED
-- -----------------------------------------------------

INSERT INTO profiles (id, role, status)
SELECT id, 'admin', 'active' FROM auth.users
WHERE email = 'tungpham.it@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';
