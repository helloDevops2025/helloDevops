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
('#00001','ข้าวขาวหอมมะลิใหม่100% 5กก.','',165.00,30,TRUE,
  (SELECT id FROM categories WHERE name='Dried Foods'),
  (SELECT id FROM brands    WHERE name='Chat')
),
('#00002','ข้าวกล้องหอมมะลิ ออร์แกนิค1กก.','',150.00,25,TRUE,
  (SELECT id FROM categories WHERE name='Dried Foods'),
  (SELECT id FROM brands    WHERE name='Raw Food')
),
('#00003','ซีเล็คฟิตต์ทูน่าสเต็กน้ำแร่ 165ก.','',59.00,40,TRUE,
  (SELECT id FROM categories WHERE name='Dried Foods'),
  (SELECT id FROM brands    WHERE name='SEAlect')
),
('#00004','โกกิแป้งทอดกรอบ 500ก.','',45.00,35,TRUE,
  (SELECT id FROM categories WHERE name='Dried Foods'),
  (SELECT id FROM brands    WHERE name='GOGI')
),
('#00005','เอ็มเคน้ำจิ้มสุกี้สูตรต้นตำรับ 830กรัม','',120.00,20,TRUE,
  (SELECT id FROM categories WHERE name='Dried Foods'),
  (SELECT id FROM brands    WHERE name='MK')
),

-- Meats
('#00006','ARO RED เนื้อชายท้องสเต็ก 300 กรัม','',220.00,30,TRUE,
  (SELECT id FROM categories WHERE name='Meats'),
  (SELECT id FROM brands    WHERE name='ARO')
),
('#00007','ซูเปอร์เชฟ หมูเด้ง แช่แข็ง 220 กรัม แพ็ค 3','',180.00,25,TRUE,
  (SELECT id FROM categories WHERE name='Meats'),
  (SELECT id FROM brands    WHERE name='SUPER CHEF')
),
('#00008','ยูฟาร์ม อกไก่ 2 กก.','',350.00,20,TRUE,
  (SELECT id FROM categories WHERE name='Meats'),
  (SELECT id FROM brands    WHERE name='U FARM')
),
('#00009','แซลมอน โคโฮหั่นชิ้น แช่แข็ง 100 กรัม','',99.00,30,TRUE,
  (SELECT id FROM categories WHERE name='Meats'),
  (SELECT id FROM brands    WHERE name='Q FRESH')
),
('#00010','CP กุ้งแปซิฟิกถุงตาข่าย (21-25) 500 กรัม','',300.00,15,TRUE,
  (SELECT id FROM categories WHERE name='Meats'),
  (SELECT id FROM brands    WHERE name='CP')
),

-- Frozen Foods
('#00011','ซีพี ชิคแชค เนื้อไก่ปรุงรสทอดกรอบแช่แข็ง 800 กรัม','',179.00,25,TRUE,
  (SELECT id FROM categories WHERE name='Frozen Foods'),
  (SELECT id FROM brands    WHERE name='CP')
),
('#00012','แลมบ์เวสตัน มันฝรั่งเส้นหยักแช่แข็ง 1 กก.','',120.00,20,TRUE,
  (SELECT id FROM categories WHERE name='Frozen Foods'),
  (SELECT id FROM brands    WHERE name='LAMB WESTON')
),
('#00013','คิวเฟรช กุ้งป๊อบรสกระเทียมพริกไทยดำ150ก.','',89.00,30,TRUE,
  (SELECT id FROM categories WHERE name='Frozen Foods'),
  (SELECT id FROM brands    WHERE name='Q FRESH')
),
('#00014','โออิชิ เกี๊ยวซ่าแช่แข็ง ไส้หมู 240 ก. 12 ชิ้น','',150.00,25,TRUE,
  (SELECT id FROM categories WHERE name='Frozen Foods'),
  (SELECT id FROM brands    WHERE name='OISHI EATO')
),
('#00015','สโลนส์ ไส้กรอกหมูอิตาเลี่ยนแช่แข็ง 500 กรัม','',140.00,20,TRUE,
  (SELECT id FROM categories WHERE name='Frozen Foods'),
  (SELECT id FROM brands    WHERE name='SLOANES')
),

-- Fruits & Vegetables
('#00016','มะเขือเทศสีดา พรีเมี่ยม กก.ละ ฿85.00','',85.00,50,TRUE,
  (SELECT id FROM categories WHERE name='Fruits & Vegetables'),
  (SELECT id FROM brands    WHERE name='No brand')
),
('#00017','ซุปเปอร์เฟรช การ์เด้นสลัดมิกซ์ แพ็คละ ฿35.00','',35.00,60,TRUE,
  (SELECT id FROM categories WHERE name='Fruits & Vegetables'),
  (SELECT id FROM brands    WHERE name='SUPER FRESH')
),
('#00018','มะม่วงน้ำดอกไม้สุก','',120.00,40,TRUE,
  (SELECT id FROM categories WHERE name='Fruits & Vegetables'),
  (SELECT id FROM brands    WHERE name='No brand')
),
('#00019','แอปเปิ้ลเขียว M 4 ลูก แพ็คละ ฿69.00','',69.00,45,TRUE,
  (SELECT id FROM categories WHERE name='Fruits & Vegetables'),
  (SELECT id FROM brands    WHERE name='LOTUSS NO BRAND')
),
('#00020','ออสเตรเลีย สตรอเบอร์รี่ บิ๊กแพ็ค ฿299.00','',299.00,30,TRUE,
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

