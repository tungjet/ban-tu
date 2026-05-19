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

-- Đảm bảo policy cho phép insert đơn từ trang khách hàng (anon)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY "Anyone can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read orders" ON orders;
CREATE POLICY "Anyone can read orders" ON orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update orders" ON orders;
CREATE POLICY "Anyone can update orders" ON orders
  FOR UPDATE USING (true) WITH CHECK (true);

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

