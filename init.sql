
-- ==============================================
-- init.sql  (Normalized schema + safe seeds)
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

-- 3) Product images
CREATE TABLE IF NOT EXISTS product_images (
                                              id            BIGINT PRIMARY KEY AUTO_INCREMENT,
                                              product_id_fk BIGINT NOT NULL,
                                              image_url     VARCHAR(512) NOT NULL,
    is_cover      BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order    INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_pi_product (product_id_fk),
    CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id_fk) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_product_image UNIQUE (product_id_fk, image_url)   -- กันซ้ำตอน seed
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ===========================
-- SEED (Category & Brand)
-- ===========================
INSERT INTO categories (name) VALUES
                                  ('Jasmine Rice'), ('Canned Fish'), ('Fried Chicken (Frozen)'),
                                  ('Garlic & Onion'), ('Imported Fruit')
    ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO brands (name) VALUES
                              ('Chatra'), ('Sealext'), ('CP'), ('NO BRAND'), ('LOTUSS NO BRAND')
    ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ===========================
-- SEED Products (5 ชิ้น)
-- ===========================
INSERT INTO products
(product_id, name, description, price, quantity, in_stock, category_id, brand_id)
VALUES
    ('#00001','Chatra 100% Jasmine Rice 5kg','Premium Thai jasmine rice 5kg pack.',165.00,30,TRUE,
     (SELECT id FROM categories WHERE name='Jasmine Rice'),
     (SELECT id FROM brands    WHERE name='Chatra')
    ),
    ('#00004','Sealext Tuna Steak in Mineral Water 165g','Tuna steak in mineral water 165g.',59.00,40,TRUE,
     (SELECT id FROM categories WHERE name='Canned Fish'),
     (SELECT id FROM brands    WHERE name='Sealext')
    ),
    ('#00011','CP Chick-Shack Crispy Fried Chicken 800g (Frozen)','Crispy fried chicken 800g (frozen).',179.00,25,TRUE,
     (SELECT id FROM categories WHERE name='Fried Chicken (Frozen)'),
     (SELECT id FROM brands    WHERE name='CP')
    ),
    ('#00016','Garlic (Trimmed Roots) 500g','Garlic 500g (trimmed roots).',55.00,35,TRUE,
     (SELECT id FROM categories WHERE name='Garlic & Onion'),
     (SELECT id FROM brands    WHERE name='NO BRAND')
    ),
    ('#00025','Green Apple M (4 pcs per pack)','Green apple size M, 4 pcs per pack.',69.00,26,TRUE,
     (SELECT id FROM categories WHERE name='Imported Fruit'),
     (SELECT id FROM brands    WHERE name='LOTUSS NO BRAND')
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
-- SEED Cover images (idempotent ด้วย UNIQUE)
-- ===========================
INSERT IGNORE INTO product_images (product_id_fk, image_url, is_cover, sort_order)
SELECT p.id, '/products/001.jpg', TRUE, 0 FROM products p WHERE p.product_id = '#00001';

INSERT IGNORE INTO product_images (product_id_fk, image_url, is_cover, sort_order)
SELECT p.id, '/products/002.jpg', TRUE, 0 FROM products p WHERE p.product_id = '#00004';

INSERT IGNORE INTO product_images (product_id_fk, image_url, is_cover, sort_order)
SELECT p.id, '/products/003.jpg', TRUE, 0 FROM products p WHERE p.product_id = '#00011';

INSERT IGNORE INTO product_images (product_id_fk, image_url, is_cover, sort_order)
SELECT p.id, '/products/004.jpg', TRUE, 0 FROM products p WHERE p.product_id = '#00016';

INSERT IGNORE INTO product_images (product_id_fk, image_url, is_cover, sort_order)
SELECT p.id, '/products/005.jpg', TRUE, 0 FROM products p WHERE p.product_id = '#00025';
