CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) DEFAULT 0,
  category VARCHAR(100),
  brand VARCHAR(100),
  quantity INT DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE
);

INSERT INTO products (product_id,name,price,category,brand,quantity,in_stock) VALUES
--  ('#00001','Apple',35.00,'Fruits','-',10,TRUE),
--  ('#00002','Banana',20.00,'Fruits','-',12,TRUE),
--  ('#00003','Orange',25.50,'Fruits','-',8,TRUE)
 ('#00001','Chatra 100% Jasmine Rice 5kg',165.00,'Jasmine Rice','Chatra',30,TRUE),
('#00002','Rawfood Organic Brown Jasmine Rice 1kg',95.00,'Brown Rice','Rawfood',24,TRUE),
('#00003','Rai Thip White Glutinous Rice 1kg',48.00,'Glutinous Rice','Rai Thip',28,TRUE),
('#00004','Sealext Tuna Steak in Mineral Water 165g',59.00,'Canned Fish','Sealext',40,TRUE),
('#00005','Roza Sardines in Tomato Sauce 155g',28.00,'Canned Fish','ROZA',50,TRUE),

-- Meat
('#00006','ARO Red Beef Flank Steak 300g',149.00,'Beef','ARO',18,TRUE),
('#00007','Nuatair Angus Neck Slice 200g (Frozen)',189.00,'Beef (Frozen)','NUATAIR BUTCHERY',16,TRUE),
('#00008','Super Chef Pork Ball Frozen 220g (Pack of 3)',129.00,'Pork','SUPER CHEF',22,TRUE),
('#00009','CP Magic Chef Pork Ball 200g',65.00,'Marinated Pork','CP MAGIC CHEF',26,TRUE),
('#00010','Betagro Pork & Chicken Mince Seasoned 500g (Frozen)',95.00,'Seasoned Pork (Frozen)','BETAGRO',20,TRUE),

-- Ready-to-Cook
('#00011','CP Chick-Shack Crispy Fried Chicken 800g (Frozen)',179.00,'Fried Chicken (Frozen)','CP',25,TRUE),
('#00012','Sunny Day Chicken Nuggets 1kg (Frozen)',169.00,'Fried Chicken (Frozen)','SUNNY DAY',30,TRUE),
('#00013','Lotus New Orleans Chicken Wings 500g (Frozen)',155.00,'Fried Chicken (Frozen)','LOTUSS',18,TRUE),
('#00014','S Pure Original Baked Chicken Breast 450g (Frozen)',129.00,'Fried Chicken (Frozen)','S PURE',20,TRUE),
('#00015','Tyson Tender Grilled Chicken 200g (Frozen)',89.00,'Fried Chicken (Frozen)','TYSON',32,TRUE),

-- Vegetables & Fruits
('#00016','Garlic (Trimmed Roots) 500g',55.00,'Garlic & Onion','NO BRAND',35,TRUE),
('#00017','Yellow Bell Pepper 120g (per piece)',35.00,'Vegetables (Root & Fruit)','LOTUSS',40,TRUE),
('#00018','Premium Cherry Tomato (per kg)',85.00,'Vegetables (Root & Fruit)','LOTUSS',25,TRUE),
('#00019','Plum Tomato 150g (per pack)',45.00,'Vegetables (Root & Fruit)','LOTUSS',30,TRUE),
('#00020','Cabbage (per kg)',49.00,'Vegetables (Root & Fruit)','NO BRAND',22,TRUE),
('#00021','Holland Papaya (per kg)',49.00,'Thai Fruit','-',20,TRUE),
('#00022','White Mushroom 250g',69.00,'Mushroom','NO BRAND',28,TRUE),
('#00023','Dried Dates 250g',79.00,'Dried Fruit','-',16,TRUE),
('#00024','Kyoho Grapes 500g',89.00,'Imported Fruit','LOTUSS NO BRAND',18,TRUE),
('#00025','Green Apple M (4 pcs per pack)',69.00,'Imported Fruit','LOTUSS NO BRAND',26,TRUE);
ON DUPLICATE KEY UPDATE name=VALUES(name);
 

--  -- ===== Schema แบบย่อ (ไม่มี cat_main/cat_sub/link) =====
-- CREATE TABLE IF NOT EXISTS products (
--   id BIGINT PRIMARY KEY AUTO_INCREMENT,
--   product_id VARCHAR(50) UNIQUE,
--   name VARCHAR(255) NOT NULL,
--   price DECIMAL(12,2) DEFAULT 0,
--   category VARCHAR(100),
--   brand VARCHAR(100),
--   quantity INT DEFAULT 0,
--   in_stock BOOLEAN DEFAULT TRUE
-- );

-- -- ===== Data จากรายการทั้งหมด (25 รายการ) =====
-- INSERT INTO products (product_id,name,price,category,brand,quantity,in_stock) VALUES
-- -- ของแห้ง
-- ('#00001','ฉัตรข้าวขาวหอมมะลิใหม่100% 5กก.',165.00,'ของแห้ง > ข้าว > ข้าวหอมมะลิ','ฉัตร',30,TRUE),
-- ('#00002','รอว์ฟู้ด ข้าวกล้องหอมมะลิ ออร์แกนิค 1 กก.',95.00,'ของแห้ง > ข้าว > ข้าวกล้อง','รอว์ฟู้ด',24,TRUE),
-- ('#00003','ไร่ทิพย์ ข้าวเหนียวขาว 1 กก.',48.00,'ของแห้ง > ข้าว > ข้าวเหนียว','ไร่ทิพย์',28,TRUE),
-- ('#00004','ซีเล็คฟิตต์ ทูน่าสเต็กในน้ำแร่ 165 ก.',59.00,'ของแห้ง > อาหารกระป๋อง > ปลากระป๋อง','sealext',40,TRUE),
-- ('#00005','โรซ่า ปลาซาร์ดีนในซอสมะเขือเทศ 155 ก.',28.00,'ของแห้ง > อาหารกระป๋อง > ปลากระป๋อง','ROZA',50,TRUE),

-- -- เนื้อสัตว์
-- ('#00006','ARO RED เนื้อชายท้องสเต็ก 300 กรัม',149.00,'เนื้อสัตว์ > เนื้อวัว > เนื้อวัว','ARO',18,TRUE),
-- ('#00007','เนื้อแท้ สันคอแองกัสขุน สไลซ์ 200 ก.',189.00,'เนื้อสัตว์ > เนื้อวัว > เนื้อวัว แช่แข็ง','NUATAIR BUTCHERY',16,TRUE),
-- ('#00008','ซูเปอร์เชฟ หมูเด้ง แช่แข็ง 220 กรัม (แพ็ค 3)',129.00,'เนื้อสัตว์ > เนื้อหมู > เนื้อหมู','SUPER CHEF',22,TRUE),
-- ('#00009','ซีพี เมจิกเชฟ หมูเด้ง 200 กรัม',65.00,'เนื้อสัตว์ > เนื้อหมู > เนื้อหมูหมักปรุงรส','CP MAGIC CHEF',26,TRUE),
-- ('#00010','เบทาโกร หมูบดปรุงรสหมูผสมไก่บด แช่แข็ง 500 ก.',95.00,'เนื้อสัตว์ > เนื้อหมู > เนื้อหมูหมักปรุงรสแช่แข็ง','BETAGRO',20,TRUE),

-- -- อาหารพร้อมปรุง
-- ('#00011','ซีพี ชิคแชค เนื้อไก่ปรุงรสทอดกรอบแช่แข็ง 800 กรัม',179.00,'อาหารพร้อมปรุง > อาหารทอดแช่แข็ง > ไก่ทอดแช่แข็ง','CP',25,TRUE),
-- ('#00012','ซันนี่เดย์ นักเก็ตไก่แช่แข็ง 1 กก.',169.00,'อาหารพร้อมปรุง > อาหารทอดแช่แข็ง > ไก่ทอดแช่แข็ง','SUNNY DAY',30,TRUE),
-- ('#00013','โลตัส ปีกกลางไก่นิวออลีนส์แช่แข็ง 500 ก.',155.00,'อาหารพร้อมปรุง > อาหารทอดแช่แข็ง > ไก่ทอดแช่แข็ง','LOTUSS',18,TRUE),
-- ('#00014','เอสเพียว อกไก่อบ ออริจินัล แช่แข็ง 450 กรัม',129.00,'อาหารพร้อมปรุง > อาหารทอดแช่แข็ง > ไก่ทอดแช่แข็ง','S PURE',20,TRUE),
-- ('#00015','ไทสัน ไก่ย่างเนื้อนุ่มแช่แข็ง 200 กรัม',89.00,'อาหารพร้อมปรุง > อาหารทอดแช่แข็ง > ไก่ทอดแช่แข็ง','TYSON',32,TRUE),

-- -- ผักและผลไม้
-- ('#00016','กระเทียมตัดจุก แพ็ค 500 ก.',55.00,'ผักและผลไม้ > ผัก > หอม กระเทียม','NO BRAND',35,TRUE),
-- ('#00017','พริกหวานเหลือง 120 กรัม (ลูกละ)',35.00,'ผักและผลไม้ > ผัก > ผักหัวและผักผล','LOTUSS',40,TRUE),
-- ('#00018','มะเขือเทศสีดา พรีเมี่ยม (กก.ละ)',85.00,'ผักและผลไม้ > ผัก > ผักหัวและผักผล','LOTUSS',25,TRUE),
-- ('#00019','มะเขือเทศท้อ 150 กรัม (แพ็คละ)',45.00,'ผักและผลไม้ > ผัก > ผักหัวและผักผล','LOTUSS',30,TRUE),
-- ('#00020','กะหล่ำปลี (กก.ละ)',49.00,'ผักและผลไม้ > ผัก > ผักหัวและผักผล','NO BRAND',22,TRUE),
-- ('#00021','มะละกอฮอลแลนด์ (กก.ละ)',49.00,'ผักและผลไม้ > ผลไม้ > ผลไม้ไทย','-',20,TRUE),
-- ('#00022','เห็ดแชมปิญองขาว 250 กรัม',69.00,'ผักและผลไม้ > ผัก > เห็ด','NO BRAND',28,TRUE),
-- ('#00023','อินทผาลัมอบแห้ง 250 กรัม',79.00,'ผักและผลไม้ > ผลไม้ > ผลไม้อบแห้ง','-',16,TRUE),
-- ('#00024','องุ่นเคียวโฮ 500 กรัม',89.00,'ผักและผลไม้ > ผลไม้ > ผลไม้นำเข้า','LOTUSS NO BRAND',18,TRUE),
-- ('#00025','แอปเปิ้ลเขียว M (แพ็ค 4 ลูก)',69.00,'ผักและผลไม้ > ผลไม้ > ผลไม้นำเข้า','LOTUSS NO BRAND',26,TRUE);

-- ON DUPLICATE KEY UPDATE
--   name = VALUES(name),
--   price = VALUES(price),
--   category = VALUES(category),
--   brand = VALUES(brand),
--   quantity = VALUES(quantity),
--   in_stock = VALUES(in_stock);