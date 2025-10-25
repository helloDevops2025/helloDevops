-- ==============================================
-- init.sql  (Normalized schema + safe seeds)
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

-- 3) Product images  (คงคอนเซปต์เดิม: รองรับทั้ง URL/ไฟล์ เน้น unique ที่ (product_id_fk, filename))
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
-- SEED Products (20 ชิ้น)
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

-- ===========================
-- SEED Cover images (20 ชิ้น)
-- (คงสไตล์เดิม: ใช้ INSERT ... SELECT + IGNORE และมี filename, content_type)
-- ===========================
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

-- USERS table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('USER','ADMIN') DEFAULT 'USER',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_addresses (
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

    CONSTRAINT fk_userid
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ===========================
-- 4) Orders (ตารางคำสั่งซื้อ)
-- ===========================
CREATE TABLE IF NOT EXISTS orders (
                                      id            BIGINT PRIMARY KEY AUTO_INCREMENT,
                                      order_code    VARCHAR(50) NOT NULL UNIQUE,        -- เช่น #ORD0001
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    shipping_address TEXT NOT NULL,
    payment_method ENUM('COD','BANK_TRANSFER','CREDIT_CARD') DEFAULT 'COD',
    shipping_method ENUM('STANDARD','EXPRESS') DEFAULT 'STANDARD',
    order_status ENUM('PENDING','PREPARING','READY_TO_SHIP','SHIPPING','DELIVERED','CANCELLED') DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================
-- 5) Order Items (สินค้าที่อยู่ในแต่ละออเดอร์)
-- ===========================
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id_fk BIGINT NOT NULL,
    product_id_fk BIGINT NULL,


    quantity      INT NOT NULL DEFAULT 1,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id_fk) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id_fk) REFERENCES products(id)
    ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================
-- SEED: Orders
-- ===========================
INSERT INTO orders (
    order_code,
    customer_name,
    customer_phone,
    shipping_address,
    payment_method,
    shipping_method,
    order_status
) VALUES
    (
        '#ORD001',
        'Somsak Suksun',
        '0812345678',
        '999 Road, Bangkok, Thailand 10110',
        'COD',
        'STANDARD',
        'DELIVERED'
    );

-- ===========================
-- SEED: Order items (ของ Order #ORD001)
-- ===========================
INSERT INTO order_items (order_id_fk, product_id_fk, quantity)
SELECT
    o.id AS order_id_fk,
    p.id AS product_id_fk,
    2 AS quantity
FROM orders o JOIN products p ON p.product_id = '#00001'   -- ตัวอย่างเลือกสินค้ารหัส #00001
WHERE o.order_code = '#ORD001';

ALTER TABLE orders
ADD COLUMN preparing_at DATETIME NULL,
ADD COLUMN ready_at DATETIME NULL,
ADD COLUMN shipping_at DATETIME NULL,
ADD COLUMN delivered_at DATETIME NULL,
ADD COLUMN cancelled_at DATETIME NULL;

/* ===========================
   PATCH: Add Beverage + sample drinks
   (Safe-upsert, no destructive change)
   =========================== */

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
-- หมายเหตุ: ใช้ subquery อ้างอิง category_id/brand_id เพื่อไม่แตะ key อื่น ๆ
INSERT INTO products
(product_id, name, description, price, quantity, in_stock, category_id, brand_id)
VALUES
  -- #00021: น้ำดื่ม Nestlé Pure Life
  ('#00021',
   'Nestlé Pure Life Drinking Water 600 ml (Pack of 12)',
   'Purified drinking water in convenient 600 ml bottles; 12-pack for home or on-the-go.',
   85.00, 30, TRUE,
   (SELECT id FROM categories WHERE name='Beverage'),
   (SELECT id FROM brands    WHERE name='Nestlé Pure Life')
  ),

  -- #00022: Malee COCO น้ำมะพร้าว
  ('#00022',
   'Malee COCO 100% Coconut Water UHT 1 L',
   '100% coconut water; naturally refreshing and hydrating; shelf-stable UHT 1-liter carton.',
   65.00, 40, TRUE,
   (SELECT id FROM categories WHERE name='Beverage'),
   (SELECT id FROM brands    WHERE name='Malee COCO')
  ),

  -- #00023: Pokka ชาเขียวไม่หวาน
  ('#00023',
   'Pokka Unsweetened Green Tea 500 ml',
   'Japanese-style green tea with no sugar; smooth and clean taste in a 500 ml PET bottle.',
   28.00, 50, TRUE,
   (SELECT id FROM categories WHERE name='Beverage'),
   (SELECT id FROM brands    WHERE name='Pokka')
  ),

  -- #00024: Coca-Cola 1.5 ลิตร
  ('#00024',
   'Coca-Cola Original 1.5 L',
   'Classic cola taste in a family-size 1.5-liter bottle; perfect for sharing.',
   35.00, 60, TRUE,
   (SELECT id FROM categories WHERE name='Beverage'),
   (SELECT id FROM brands    WHERE name='Coca-Cola')
  ),

  -- #00025: Fuji Cha ชาข้าวคั่ว
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

-- 4) Cover images for #00021 - #00025 (ตามที่ให้มา)
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
