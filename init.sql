-- ==============================================
-- init.sql  (Normalized schema + safe seeds + promotions)
-- Compatible with MySQL/MariaDB
-- ==============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1) Reference tables
CREATE TABLE IF NOT EXISTS categories (
  id   BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS brands (
  id   BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) Products
CREATE TABLE IF NOT EXISTS products (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id  VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price       DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity    INT NOT NULL DEFAULT 0,
  in_stock    BOOLEAN NOT NULL DEFAULT TRUE,

  category_id BIGINT NULL,
  brand_id    BIGINT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_products_brand
    FOREIGN KEY (brand_id)    REFERENCES brands(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) Product images  (support URL/file; unique (product_id_fk, filename))
CREATE TABLE IF NOT EXISTS product_images (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id_fk BIGINT NOT NULL,
    image_url     VARCHAR(512)  NULL,
    is_cover      BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order    INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    content       MEDIUMBLOB NULL,
    content_type  VARCHAR(100) NULL,
    filename      VARCHAR(255) NULL,

    INDEX idx_pi_product (product_id_fk),
    CONSTRAINT fk_product_images_product
      FOREIGN KEY (product_id_fk) REFERENCES products(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_product_image UNIQUE (product_id_fk, filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) Users & Addresses
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('USER','ADMIN') DEFAULT 'USER',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    street VARCHAR(255),
    subdistrict VARCHAR(100),
    district VARCHAR(100),
    province VARCHAR(100),
    zipcode VARCHAR(10),
    status ENUM('DEFAULT', 'NON_DEFAULT') DEFAULT 'NON_DEFAULT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_userid FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5) Orders
CREATE TABLE IF NOT EXISTS orders (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_code    VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  shipping_address TEXT NOT NULL,
  payment_method ENUM('COD','BANK_TRANSFER','CREDIT_CARD') DEFAULT 'COD',
  shipping_method ENUM('STANDARD','EXPRESS') DEFAULT 'STANDARD',
  order_status ENUM('PENDING','PREPARING','READY_TO_SHIP','SHIPPING','DELIVERED','CANCELLED') DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6) Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id_fk BIGINT NOT NULL,
  product_id_fk BIGINT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id_fk) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id_fk) REFERENCES products(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7) Order status history (track each status change)
CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL,     -- e.g. PREPARING, READY_TO_SHIP, ...
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  note VARCHAR(255),
  INDEX idx_osh_order (order_id),
  CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8) Extend orders: lifecycle + totals (kept as ALTER like your style)
ALTER TABLE orders
  ADD COLUMN preparing_at DATETIME NULL,
  ADD COLUMN ready_at DATETIME NULL,
  ADD COLUMN shipping_at DATETIME NULL,
  ADD COLUMN delivered_at DATETIME NULL,
  ADD COLUMN cancelled_at DATETIME NULL,
  ADD COLUMN subtotal DECIMAL(12,2) NULL,
  ADD COLUMN discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN shipping_fee DECIMAL(12,2) NULL,
  ADD COLUMN tax_total DECIMAL(12,2) NULL,
  ADD COLUMN grand_total DECIMAL(12,2) NULL,
  ADD COLUMN paid_at DATETIME NULL,
  ADD COLUMN expected_ship_at DATETIME NULL,
  ADD COLUMN expected_delivery_at DATETIME NULL;

-- ===========================================================
-- 9) PROMOTIONS CORE (admin-managed)
-- ===========================================================
CREATE TABLE IF NOT EXISTS promotions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NULL,
  description TEXT NULL,

  promo_type ENUM('PERCENT_OFF','AMOUNT_OFF','BUY_X_GET_Y','FIXED_PRICE','SHIPPING_DISCOUNT')
            NOT NULL DEFAULT 'PERCENT_OFF',

  scope ENUM('ORDER','PRODUCT','CATEGORY','BRAND') NOT NULL DEFAULT 'ORDER',

  percent_off DECIMAL(5,2) NULL,      -- e.g., 50.00 = 50%
  amount_off  DECIMAL(12,2) NULL,     -- flat discount
  fixed_price DECIMAL(12,2) NULL,     -- for FIXED_PRICE deals
  buy_qty     INT NULL,               -- X in buy X get Y
  get_qty     INT NULL,               -- Y in buy X get Y
  applies_to_shipping BOOLEAN NOT NULL DEFAULT FALSE,

  min_order_amount DECIMAL(12,2) NULL,
  min_quantity INT NULL,

  stack_mode ENUM('EXCLUSIVE','STACKABLE','PRIORITY') NOT NULL DEFAULT 'EXCLUSIVE',
  priority INT NOT NULL DEFAULT 100,

  max_redemptions INT NULL,
  max_redemptions_per_user INT NULL,
  used_count INT NOT NULL DEFAULT 0,

  status ENUM('DRAFT','ACTIVE','PAUSED','EXPIRED') NOT NULL DEFAULT 'DRAFT',
  start_at DATETIME NULL,
  end_at   DATETIME NULL,
  timezone VARCHAR(64) NULL,

  created_by BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_promotions_code (code),
  KEY idx_promotions_active (status, start_at, end_at),
  KEY idx_promotions_scope (scope, promo_type, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS promotion_products (
  promotion_id BIGINT NOT NULL,
  product_id   BIGINT NOT NULL,
  PRIMARY KEY (promotion_id, product_id),
  CONSTRAINT fk_promo_products_promo FOREIGN KEY (promotion_id) REFERENCES promotions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_promo_products_prod FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS promotion_categories (
  promotion_id BIGINT NOT NULL,
  category_id  BIGINT NOT NULL,
  PRIMARY KEY (promotion_id, category_id),
  CONSTRAINT fk_promo_categories_promo FOREIGN KEY (promotion_id) REFERENCES promotions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_promo_categories_cat FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS promotion_brands (
  promotion_id BIGINT NOT NULL,
  brand_id     BIGINT NOT NULL,
  PRIMARY KEY (promotion_id, brand_id),
  CONSTRAINT fk_promo_brands_promo FOREIGN KEY (promotion_id) REFERENCES promotions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_promo_brands_brand FOREIGN KEY (brand_id) REFERENCES brands(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS promotion_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  promotion_id BIGINT NOT NULL,
  code VARCHAR(100) NOT NULL,
  usage_limit INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  expires_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_promotion_codes (code),
  KEY idx_promotion_codes (promotion_id, expires_at),
  CONSTRAINT fk_promo_codes_promo FOREIGN KEY (promotion_id) REFERENCES promotions(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================
-- 10) DISCOUNT / REDEMPTION LOGS (freeze applied amounts)
-- ===========================================================
CREATE TABLE IF NOT EXISTS order_discounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  promotion_id BIGINT NULL,
  code_used VARCHAR(100) NULL,
  amount DECIMAL(12,2) NOT NULL,      -- positive number: amount deducted (order-level)
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_discounts (order_id),
  CONSTRAINT fk_order_discounts_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_discounts_promo FOREIGN KEY (promotion_id) REFERENCES promotions(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_item_discounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_item_id BIGINT NOT NULL,
  promotion_id BIGINT NULL,
  amount DECIMAL(12,2) NOT NULL,      -- positive number: amount deducted (per item)
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_item_discounts (order_item_id),
  CONSTRAINT fk_oid_item FOREIGN KEY (order_item_id) REFERENCES order_items(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_oid_promo FOREIGN KEY (promotion_id) REFERENCES promotions(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS promotion_redemptions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  promotion_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  user_id BIGINT NULL,
  code_used VARCHAR(100) NULL,
  redeemed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  discount_amount DECIMAL(12,2) NOT NULL,
  INDEX idx_redemptions_promo (promotion_id),
  INDEX idx_redemptions_user (user_id),
  CONSTRAINT fk_red_promo FOREIGN KEY (promotion_id) REFERENCES promotions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_red_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_red_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ===========================
-- SEED (Category & Brand)
-- ===========================
INSERT INTO categories (name) VALUES
  ('Meats'),
  ('Fruits & Vegetables'),
  ('Frozen Foods'),
  ('Dried Foods')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO brands (name) VALUES
  ('Chat'),
  ('Raw Food'),
  ('SEAlect'),
  ('GOGI'),
  ('MK'),
  ('ARO'),
  ('SUPER CHEF'),
  ('U FARM'),
  ('Q FRESH'),
  ('CP'),
  ('LAMB WESTON'),
  ('OISHI EATO'),
  ('SLOANES'),
  ('SUPER FRESH'),
  ('LOTUSS NO BRAND'),
  ('No brand')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ===========================
-- SEED Products (20 items)
-- ===========================
INSERT INTO products
(product_id, name, description, price, quantity, in_stock, category_id, brand_id)
VALUES
-- Dried Foods
('#00001','100% Jasmine Rice 5 kg','Premium Thai jasmine rice; new-crop harvest. Soft, fragrant grains in a 5 kg bag.',165.00,30,TRUE,
  (SELECT id FROM categories WHERE name='Dried Foods'),
  (SELECT id FROM brands    WHERE name='Chat')
),
('#00002','Organic Brown Jasmine Rice 1 kg','High-fiber organic brown jasmine rice. Nutty aroma; 1 kg pack.',150.00,25,TRUE,
  (SELECT id FROM categories WHERE name='Dried Foods'),
  (SELECT id FROM brands    WHERE name='Raw Food')
),
('#00003','SEAlect Fit Tuna Steak in Mineral Water 165 g','Ready-to-eat tuna steak in mineral water; lean protein source.',59.00,40,TRUE,
  (SELECT id FROM categories WHERE name='Dried Foods'),
  (SELECT id FROM brands    WHERE name='SEAlect')
),
('#00004','GOGI Crispy Frying Flour 500 g','Crispy tempura/frying mix for light, crunchy coating.',45.00,35,TRUE,
  (SELECT id FROM categories WHERE name='Dried Foods'),
  (SELECT id FROM brands    WHERE name='GOGI')
),
('#00005','MK Original Suki Sauce 830 g','Signature MK suki dipping sauce; savory and mildly sweet.',120.00,20,TRUE,
  (SELECT id FROM categories WHERE name='Dried Foods'),
  (SELECT id FROM brands    WHERE name='MK')
),

-- Meats
('#00006','ARO RED Beef Belly Steak 300 g','Well-marbled beef belly cut; tender and flavorful; 300 g.',220.00,30,TRUE,
  (SELECT id FROM categories WHERE name='Meats'),
  (SELECT id FROM brands    WHERE name='ARO')
),
('#00007','SUPER CHEF Pork Paste Frozen 220 g (Pack of 3)','Versatile frozen pork paste for soups, stir-fries, or dumplings.',180.00,25,TRUE,
  (SELECT id FROM categories WHERE name='Meats'),
  (SELECT id FROM brands    WHERE name='SUPER CHEF')
),
('#00008','U FARM Chicken Breast 2 kg','Boneless, skinless chicken breast; family-size 2 kg pack.',350.00,20,TRUE,
  (SELECT id FROM categories WHERE name='Meats'),
  (SELECT id FROM brands    WHERE name='U FARM')
),
('#00009','Coho Salmon Chunks Frozen 100 g','Convenient salmon chunks; quickly thaw and cook; 100 g.',99.00,30,TRUE,
  (SELECT id FROM categories WHERE name='Meats'),
  (SELECT id FROM brands    WHERE name='Q FRESH')
),
('#00010','CP Pacific Shrimp (21–25) 500 g','Pacific white shrimp ~21–25 pcs/lb; cleaned; 500 g net.',300.00,15,TRUE,
  (SELECT id FROM categories WHERE name='Meats'),
  (SELECT id FROM brands    WHERE name='CP')
),

-- Frozen Foods
('#00011','CP Chick Chack Crispy Seasoned Chicken 800 g (Frozen)','Crispy seasoned chicken bites; oven or air-fryer friendly.',179.00,25,TRUE,
  (SELECT id FROM categories WHERE name='Frozen Foods'),
  (SELECT id FROM brands    WHERE name='CP')
),
('#00012','LAMB WESTON Crinkle-Cut Fries 1 kg (Frozen)','Classic crinkle-cut French fries; restaurant-grade quality.',120.00,20,TRUE,
  (SELECT id FROM categories WHERE name='Frozen Foods'),
  (SELECT id FROM brands    WHERE name='LAMB WESTON')
),
('#00013','Q FRESH Garlic & Black Pepper Popcorn Shrimp 150 g (Frozen)','Bite-size shrimp with garlic & black pepper seasoning.',89.00,30,TRUE,
  (SELECT id FROM categories WHERE name='Frozen Foods'),
  (SELECT id FROM brands    WHERE name='Q FRESH')
),
('#00014','OISHI EATO Pork Gyoza 240 g (12 pcs, Frozen)','Pan-fry or steam for juicy dumplings; 12 pieces.',150.00,25,TRUE,
  (SELECT id FROM categories WHERE name='Frozen Foods'),
  (SELECT id FROM brands    WHERE name='OISHI EATO')
),
('#00015','SLOANES Italian Pork Sausage 500 g (Frozen)','Rich, herby Italian-style pork sausage; 500 g.',140.00,20,TRUE,
  (SELECT id FROM categories WHERE name='Frozen Foods'),
  (SELECT id FROM brands    WHERE name='SLOANES')
),

-- Fruits & Vegetables
('#00016','Premium Plum Tomatoes (per kg)','Firm, sweet plum tomatoes ideal for salad, salsa, or sauces.',85.00,50,TRUE,
  (SELECT id FROM categories WHERE name='Fruits & Vegetables'),
  (SELECT id FROM brands    WHERE name='No brand')
),
('#00017','SUPER FRESH Garden Salad Mix (per pack)','Ready-to-eat salad greens; rinse and serve.',35.00,60,TRUE,
  (SELECT id FROM categories WHERE name='Fruits & Vegetables'),
  (SELECT id FROM brands    WHERE name='SUPER FRESH')
),
('#00018','Nam Dok Mai Mango (ripe)','Fragrant, sweet Thai mango variety; perfect for dessert.',120.00,40,TRUE,
  (SELECT id FROM categories WHERE name='Fruits & Vegetables'),
  (SELECT id FROM brands    WHERE name='No brand')
),
('#00019','Green Apple M (4 pcs per pack)','Crisp and refreshing green apples; pack of 4.',69.00,45,TRUE,
  (SELECT id FROM categories WHERE name='Fruits & Vegetables'),
  (SELECT id FROM brands    WHERE name='LOTUSS NO BRAND')
),
('#00020','Australian Strawberries – Big Pack','Juicy, aromatic strawberries; family-size pack.',299.00,30,TRUE,
  (SELECT id FROM categories WHERE name='Fruits & Vegetables'),
  (SELECT id FROM brands    WHERE name='No brand')
)
ON DUPLICATE KEY UPDATE
  name=VALUES(name),
  description=VALUES(description),
  price=VALUES(price),
  quantity=VALUES(quantity),
  in_stock=VALUES(in_stock),
  category_id=VALUES(category_id),
  brand_id=VALUES(brand_id),
  updated_at=CURRENT_TIMESTAMP;

-- SEED Cover images (20 items)
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/001.jpg', '001.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00001';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/002.jpg', '002.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00002';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/003.jpg', '003.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00003';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/004.jpg', '004.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00004';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/005.jpg', '005.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00005';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/006.jpg', '006.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00006';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/007.jpg', '007.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00007';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/008.jpg', '008.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00008';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/009.jpg', '009.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00009';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/010.jpg', '010.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00010';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/011.jpg', '011.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00011';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/012.jpg', '012.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00012';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/013.jpg', '013.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00013';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/014.jpg', '014.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00014';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/015.jpg', '015.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00015';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/016.jpg', '016.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00016';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/017.jpg', '017.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00017';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/018.jpg', '018.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00018';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/019.jpg', '019.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00019';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/020.jpg', '020.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00020';

-- ===========================
-- SEED: Orders (sample)
-- ===========================
INSERT INTO orders (
  order_code, customer_name, customer_phone, shipping_address,
  payment_method, shipping_method, order_status
) VALUES (
  '#ORD001', 'Somsak Suksun', '0812345678',
  '999 Road, Bangkok, Thailand 10110',
  'COD', 'STANDARD', 'DELIVERED'
);

-- SEED: Order items (for #ORD001)
INSERT INTO order_items (order_id_fk, product_id_fk, quantity)
SELECT o.id, p.id, 2
FROM orders o JOIN products p ON p.product_id = '#00001'
WHERE o.order_code = '#ORD001';

-- ===========================
-- SEED: Promotions (examples)
-- ===========================
-- A) 50% off for product #00011 during Nov 2025
INSERT INTO promotions
(name, description, promo_type, scope, percent_off, status, start_at, end_at, stack_mode, priority)
VALUES
('50% Off CP Chick Chack 800g',
 'Product #00011 gets 50% off in November 2025',
 'PERCENT_OFF','PRODUCT', 50.00, 'ACTIVE',
 '2025-11-01 00:00:00','2025-11-30 23:59:59','EXCLUSIVE', 10);

INSERT INTO promotion_products (promotion_id, product_id)
SELECT pr.id, p.id
FROM promotions pr
JOIN products p ON p.product_id = '#00011'
WHERE pr.name = '50% Off CP Chick Chack 800g';

-- B) Buy 2 Get 1 for product #00012 during 1–15 Nov 2025
INSERT INTO promotions
(name, description, promo_type, scope, buy_qty, get_qty, status, start_at, end_at, stack_mode, priority)
VALUES
('Buy 2 Get 1 Fries',
 'Buy 2 Get 1 for LAMB WESTON Crinkle-Cut Fries 1 kg',
 'BUY_X_GET_Y','PRODUCT', 2, 1, 'ACTIVE',
 '2025-11-01 00:00:00','2025-11-15 23:59:59','EXCLUSIVE', 20);

INSERT INTO promotion_products (promotion_id, product_id)
SELECT pr.id, p.id
FROM promotions pr
JOIN products p ON p.product_id = '#00012'
WHERE pr.name = 'Buy 2 Get 1 Fries';

-- C) Coupon TEST01: 10% off entire order (min 500), up to 1,000 redemptions
INSERT INTO promotions
(name, code, description, promo_type, scope, percent_off, min_order_amount, status, start_at, end_at, stack_mode, priority, max_redemptions)
VALUES
('Cart 10% Off (Min 500)','TEST01',
 '10% off whole cart with minimum spend 500',
 'PERCENT_OFF','ORDER', 10.00, 500.00, 'ACTIVE',
 '2025-11-01 00:00:00','2025-12-31 23:59:59','EXCLUSIVE', 50, 1000);

-- ===========================
-- SEED: Order status history for #ORD001 (no hard-coded id)
-- ===========================
INSERT INTO order_status_history (order_id, status, changed_at)
SELECT o.id, 'PREPARING', '2025-11-05 10:30:00' FROM orders o WHERE o.order_code = '#ORD001';
INSERT INTO order_status_history (order_id, status, changed_at)
SELECT o.id, 'READY_TO_SHIP', '2025-11-05 11:15:00' FROM orders o WHERE o.order_code = '#ORD001';
INSERT INTO order_status_history (order_id, status, changed_at)
SELECT o.id, 'SHIPPING', '2025-11-05 13:00:00' FROM orders o WHERE o.order_code = '#ORD001';
INSERT INTO order_status_history (order_id, status, changed_at)
SELECT o.id, 'DELIVERED', '2025-11-05 15:20:00' FROM orders o WHERE o.order_code = '#ORD001';

-- ===========================
-- PATCH: Add Beverage + sample drinks
-- ===========================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1) Add new Category (Beverage)
INSERT INTO categories (name) VALUES ('Beverage')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2) Add new Brands (safe)
INSERT INTO brands (name) VALUES
  ('Nestlé Pure Life'),
  ('Malee COCO'),
  ('Pokka'),
  ('Coca-Cola'),
  ('Fuji Cha')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 3) Seed Beverage Products (#00021 - #00025)
INSERT INTO products
(product_id, name, description, price, quantity, in_stock, category_id, brand_id)
VALUES
  ('#00021',
   'Nestlé Pure Life Drinking Water 600 ml (Pack of 12)',
   'Purified drinking water in convenient 600 ml bottles; 12-pack for home or on-the-go.',
   85.00, 30, TRUE,
   (SELECT id FROM categories WHERE name='Beverage'),
   (SELECT id FROM brands    WHERE name='Nestlé Pure Life')
  ),
  ('#00022',
   'Malee COCO 100% Coconut Water UHT 1 L',
   '100% coconut water; naturally refreshing and hydrating; shelf-stable UHT 1-liter carton.',
   65.00, 40, TRUE,
   (SELECT id FROM categories WHERE name='Beverage'),
   (SELECT id FROM brands    WHERE name='Malee COCO')
  ),
  ('#00023',
   'Pokka Unsweetened Green Tea 500 ml',
   'Japanese-style green tea with no sugar; smooth and clean taste in a 500 ml PET bottle.',
   28.00, 50, TRUE,
   (SELECT id FROM categories WHERE name='Beverage'),
   (SELECT id FROM brands    WHERE name='Pokka')
  ),
  ('#00024',
   'Coca-Cola Original 1.5 L',
   'Classic cola taste in a family-size 1.5-liter bottle; perfect for sharing.',
   35.00, 60, TRUE,
   (SELECT id FROM categories WHERE name='Beverage'),
   (SELECT id FROM brands    WHERE name='Coca-Cola')
  ),
  ('#00025',
   'Fuji Cha Roasted Rice Tea 500 ml',
   'Genmaicha-style roasted rice tea; lightly toasted aroma with a smooth finish; 500 ml bottle.',
   30.00, 40, TRUE,
   (SELECT id FROM categories WHERE name='Beverage'),
   (SELECT id FROM brands    WHERE name='Fuji Cha')
  )
ON DUPLICATE KEY UPDATE
  name=VALUES(name),
  description=VALUES(description),
  price=VALUES(price),
  quantity=VALUES(quantity),
  in_stock=VALUES(in_stock),
  category_id=VALUES(category_id),
  brand_id=VALUES(brand_id),
  updated_at=CURRENT_TIMESTAMP;

-- 4) Cover images for #00021 - #00025
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order) 
SELECT p.id, '/products/021.jpg', '021.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00021';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/022.jpg', '022.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00022';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/023.jpg', '023.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00023';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/024.jpg', '024.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00024';
INSERT IGNORE INTO product_images (product_id_fk, image_url, filename, content_type, is_cover, sort_order)
SELECT p.id, '/products/025.jpg', '025.jpg', 'image/jpeg', TRUE, 0 FROM products p WHERE p.product_id='#00025';

SET FOREIGN_KEY_CHECKS = 1;