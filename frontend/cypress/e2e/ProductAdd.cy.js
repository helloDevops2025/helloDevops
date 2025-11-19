// // cypress/e2e/ProductAdd.all.cy.js
// /// <reference types="cypress" />

// /** ======== PATHS (ปรับตามโปรเจกต์) ======== */
// const ADD_PATH = '/admin/products/new';    // ถ้าใช้ /add ให้แก้เป็น '/admin/products/add'
// const LIST_PATH = '/admin/products';

// // const ADD_PATH  = '/admin/products/add';
// // const LIST_PATH = '/admin/products';


// /** ======== SELECTORS (ใช้ร่วมทุก suite) ======== */
// const el = {
//   // form fields
//   productId: 'input[name="productId"]',
//   name: 'input[name="name"]',
//   description: 'textarea[name="description"]',
//   price: 'input[name="price"]',
//   quantity: 'input[name="quantity"]',
//   category: 'select[name="categoryId"]',
//   brand: 'select[name="brandId"]',
//   // buttons
//   saveBtn: '.btn.primary',
//   cancelBtn: '.btn.ghost',
//   // misc
//   msg: 'p[style*="white-space"]', // กล่องข้อความด้านล่าง
// };

// /** ======== INTERCEPT HELPERS (ใช้ร่วม) ======== */
// // ดัก master data แบบไม่ผูก host/port และเผื่อมี query
// const CATS_RE = /\/api\/categories(?:\?.*)?$/;
// const BRANDS_RE = /\/api\/brands(?:\?.*)?$/;

// function stubMasterDataOk() {
//   const cats = [
//     { id: 1, name: 'Jasmine Rice' },
//     { id: 2, name: 'Canned Fish' },
//   ];
//   const brands = [
//     { id: 1, name: 'Chatra' },
//     { id: 2, name: 'Sealext' },
//   ];
//   cy.intercept({ method: 'GET', url: CATS_RE }, { statusCode: 200, body: cats }).as('getCategories');
//   cy.intercept({ method: 'GET', url: BRANDS_RE }, { statusCode: 200, body: brands }).as('getBrands');
// }

// /** ======== SMOKE: เข้าได้จริง ======== */
// describe('E2E-PROD-ADD-101 เข้าหน้า Add Product ได้', () => {
//   beforeEach(() => {
//     cy.loginAsAdmin();
//     // เผื่อมีหน้า guard ที่เรียก /me
//     cy.intercept('GET', '**/api/**/me*', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me');
//     cy.intercept('GET', '**/api/auth/**', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('auth');
//   });

//   it('เปิดหน้า Add แล้วเห็นหัวข้อ Add PRODUCT', () => {
//     cy.visit(ADD_PATH);
//     cy.location('pathname', { timeout: 10000 }).should('eq', ADD_PATH);
//     cy.contains('h1', 'Add PRODUCT', { timeout: 10000 }).should('be.visible');
//   });
// });

// /** ======== NAV: Cancel ======== */
// describe('E2E-PROD-ADD-102 ปุ่ม Cancel กลับไป /admin/products', () => {
//   beforeEach(() => {
//     cy.loginAsAdmin();
//   });

//   it('กด Cancel แล้วกลับหน้า Product List', () => {
//     cy.visit(ADD_PATH);
//     cy.location('pathname', { timeout: 10000 }).should('eq', ADD_PATH);
//     cy.contains('button', /^cancel$/i).should('be.visible').click();
//     cy.location('pathname', { timeout: 10000 }).should('eq', LIST_PATH);
//   });
// });

// /** ======== MASTER DATA: dropdown ต้องมี option ======== */
// describe('E2E-PROD-103 โหลด Categories/Brands สำเร็จ → dropdown มี option', () => {
//   beforeEach(() => {
//     cy.loginAsAdmin();
//     stubMasterDataOk();              // intercept ก่อน visit
//     cy.visit(ADD_PATH);
//     cy.wait('@getCategories', { timeout: 15000 }).its('response.statusCode').should('eq', 200);
//     cy.wait('@getBrands', { timeout: 15000 }).its('response.statusCode').should('eq', 200);
//   });

//   it('dropdown Category/Brand มี option อย่างน้อย 1 รายการ', () => {
//     cy.get(el.category).find('option').its('length').should('be.gte', 1);
//     cy.get(el.brand).find('option').its('length').should('be.gte', 1);
//   });

//   it('มี Jasmine Rice / Canned Fish และ Chatra / Sealext', () => {
//     cy.get(el.category).find('option').then($ops => {
//       const texts = [...$ops].map(o => o.textContent.trim());
//       expect(texts).to.include('Jasmine Rice').and.to.include('Canned Fish');
//     });
//     cy.get(el.brand).find('option').then($ops => {
//       const texts = [...$ops].map(o => o.textContent.trim());
//       expect(texts).to.include('Chatra').and.to.include('Sealext');
//     });
//   });
// });

// /** ======== VALIDATION BUNDLE (103-1–103-5) ======== */
// describe('E2E-PROD-104 Validation bundle (301–305)', () => {
//   beforeEach(() => {
//     cy.loginAsAdmin();
//     stubMasterDataOk();
//     cy.visit(ADD_PATH);
//     cy.wait('@getCategories');
//     cy.wait('@getBrands');
//   });

//   // 103-1 — Product ID ตัดเว้นวรรคอัตโนมัติ
//   it('104-1 Product ID trims spaces → "A B 001" => "AB001"', () => {
//     cy.get(el.productId).type('  A B  001  ');
//     cy.get(el.productId).should(($i) => {
//       expect($i.val()).to.eq('AB001');
//     });
//   });


//   // 103-2 — Quantity: ต้องไม่ว่าง + clamp ≤ 1,000,000
//   it('104-2 Quantity requires value and clamps to 1,000,000', () => {
//     // 1) ใส่เลขก่อนให้มีค่าแน่ ๆ
//     cy.get(el.quantity).type('7').should('have.value', '7');

//     // 2) ล้างค่าให้ว่าง -> ควรขึ้น "กรุณากรอกจำนวนสต็อก"
//     cy.get(el.quantity).type('{selectall}{backspace}').should('have.value', '').blur();

//     // หาเฉพาะ small ของ error (ใน .field เดียวกัน)
//     cy.get(el.quantity)
//       .closest('.field')
//       .find('small')
//       .should('contain', 'กรุณากรอกจำนวนสต็อก')
//       .and('be.visible');

//     cy.get(el.saveBtn).should('be.disabled');

//     // 3) กรอกเกินล้าน -> ถูก clamp เป็น 1000000 และ error ต้องหาย
//     cy.get(el.quantity).type('9999999').blur();
//     cy.get(el.quantity).should('have.value', '1000000');

//     // ตอนนี้ยังมี small ของ "Status: In stock" อยู่ แต่ error ต้องไม่มี
//     cy.get(el.quantity)
//       .closest('.field')
//       .find('small')
//       .should('not.contain', 'กรุณากรอกจำนวนสต็อก')
//       .and('contain', 'Status: In stock');
//   });

//   // 103-3 — Quantity เปลี่ยน → Status เปลี่ยน
//   it('104-3 Quantity 0 => Out of stock, ≥1 => In stock', () => {
//     cy.get(el.quantity).type('0');
//     cy.contains('small', 'Status: Out of stock').should('be.visible');

//     cy.get(el.quantity).clear().type('3');
//     cy.contains('small', 'Status: In stock').should('be.visible');
//   });

//   // 103-4 — Price: ต้องเป็นตัวเลขไม่ติดลบ; ใช้ -1 เพื่อให้ error
//   it('104-4 Negative price shows "ราคาไม่ถูกต้อง" และไม่ redirect', () => {
//     // กรอกขั้นต่ำให้ onSave ไปถึงจุดตรวจราคา
//     cy.get(el.quantity).type('5');
//     cy.get(el.productId).type('SKU-ABC');
//     cy.get(el.name).type('Apple Fuji');

//     // ราคาเป็นค่าติดลบ -> โยน error
//     cy.get(el.price).type('-1');
//     cy.get(el.saveBtn).click();

//     cy.get(el.msg).should('contain', 'ราคาไม่ถูกต้อง');
//     cy.location('pathname').should('eq', ADD_PATH); // ยังอยู่หน้า add/new
//   });

//   // 103-5 — Required fields ว่าง → กด Save แล้วแจ้งเตือน
//   it('104-5 Required empties block submission (Product ID, Name)', () => {
//     // 1) Product ID ว่าง
//     cy.get(el.quantity).type('1');
//     cy.get(el.price).type('0');

//     cy.on('window:alert', (txt) => {
//       expect(txt).to.include('กรุณากรอกราคา');
//       expect(txt).to.include('กรุณาเลือก Category');
//       expect(txt).to.include('กรุณาเลือก Brand');
//     });

//     cy.get(el.saveBtn).click();

//     // 2) Name ว่าง
//     cy.get(el.productId).type('SKU-001');

//     cy.on('window:alert', (txt) => {
//       expect(txt).to.include('กรุณากรอกชื่อสินค้า');
//     });

//     cy.get(el.saveBtn).click();
//   });


// });

// // cypress/e2e/ProductAdd.image.cy.js
// /// <reference types="cypress" />


// // ===== SELECTORS เฉพาะภาพ =====
// const elImg = {
//   dropzone: '#dropzone',
//   fileInput: '#filePicker',   // input[type=file][hidden]
//   hint: '#hint',
//   removeBtn: '.cover-remove',
// };

// // ===== STUB master data (wildcard กัน host/port/query) =====
// function stubMasterData() {
//   cy.intercept('GET', '**/api/categories*', {
//     statusCode: 200,
//     body: [
//       { id: 1, name: 'Jasmine Rice' },
//       { id: 2, name: 'Canned Fish' },
//     ],
//   }).as('getCategories');

//   cy.intercept('GET', '**/api/brands*', {
//     statusCode: 200,
//     body: [
//       { id: 1, name: 'Chatra' },
//       { id: 2, name: 'Sealext' },
//     ],
//   }).as('getBrands');
// }

// // ===== helper สร้างไฟล์จาก fixture (19.webp) =====
// function makeFileFromFixture(fixturePath = 'images/19.webp') {
//   return cy.fixture(fixturePath, 'base64').then((b64) => ({
//     contents: Cypress.Buffer.from(b64, 'base64'),
//     fileName: '19.webp',
//     mimeType: 'image/webp',
//   }));
// }

// describe('E2E-PROD-105 Upload/Remove รูปภาพ', () => {
//   beforeEach(() => {
//     cy.loginAsAdmin();
//     stubMasterData();
//     cy.visit(ADD_PATH);
//     cy.wait('@getCategories');
//     cy.wait('@getBrands');
//   });

//   // 104-1: อัปโหลดรูป (drag-drop + file picker) แล้วเห็นพรีวิว
//   it('105-1: drag-drop และ file picker แล้วเห็นพรีวิว', () => {
//     // (A) drag & drop
//     makeFileFromFixture().then((file) => {
//       cy.get(elImg.dropzone).selectFile(file, { action: 'drag-drop' });
//     });

//     cy.get(elImg.dropzone).should('have.class', 'has-image');
//     cy.get(elImg.dropzone).find(elImg.removeBtn).should('be.visible');
//     cy.get(elImg.hint).should('not.be.visible');

//     // (B) reload แล้วทดสอบ file picker
//     cy.reload();
//     stubMasterData(); // ต้อง stub ใหม่หลัง reload
//     cy.wait('@getCategories');
//     cy.wait('@getBrands');

//     makeFileFromFixture().then((file) => {
//       cy.get(elImg.fileInput).selectFile(file, { force: true });
//     });

//     cy.get(elImg.dropzone).should('have.class', 'has-image');
//     cy.get(elImg.dropzone).find(elImg.removeBtn).should('be.visible');
//     cy.get(elImg.hint).should('not.be.visible');
//   });

//   // 104-2: ลบรูป → confirm → พรีวิวหาย
//   it('105-2: ลบรูปพร้อม confirm = true แล้วพรีวิวถูกลบ', () => {
//     // เตรียมให้มีรูปก่อน (ผ่าน file picker)
//     makeFileFromFixture().then((file) => {
//       cy.get(elImg.fileInput).selectFile(file, { force: true });
//     });

//     // ก่อนลบต้องมีพรีวิวและปุ่มลบ
//     cy.get(elImg.dropzone).should('have.class', 'has-image');
//     cy.get(elImg.dropzone).find(elImg.removeBtn).should('exist');

//     // ยืนยันลบ
//     cy.window().then((w) => cy.stub(w, 'confirm').returns(true));
//     cy.get(elImg.dropzone).find(elImg.removeBtn).click();

//     // ผลลัพธ์หลัก: ไม่มีพรีวิว + ปุ่มลบหาย
//     cy.get(elImg.dropzone).should('not.have.class', 'has-image');
//     cy.get(elImg.dropzone).find(elImg.removeBtn).should('not.exist');

//     // #hint เป็น div ว่าง ทำให้ height=0 -> ไม่ใช้ 'be.visible'
//     // เช็คเพียงว่ามันไม่ได้ถูกซ่อน (display ไม่ใช่ none) และยังอยู่ใน DOM
//     cy.get(elImg.hint)
//       .should('exist')
//       .and('not.have.css', 'display', 'none');
//   });

// });

// /** ======== E2E-PROD-102-2: Save -> redirect + list แสดงสินค้าใหม่ ======== */
// describe('E2E-PROD-106 Create success -> redirect + list shows new item', () => {
//   beforeEach(() => {
//     cy.loginAsAdmin();
//   });

//   it('กด Save แล้วไป /admin/products และเห็นแถวสินค้าที่เพิ่งสร้าง', () => {
//     // --- Arrange ---
//     stubMasterDataOk(); // ให้ dropdown โหลดได้
//     const newProduct = {
//       id: 1001,
//       productId: 'SKU-TST-001',
//       name: 'Tomato Premium',
//       description: 'Fresh & sweet',
//       price: 25,
//       quantity: 3,
//       inStock: true,
//       categoryId: 1,
//       brandId: 1,
//     };

//     // สร้างสำเร็จ -> คืน id + body ที่ส่งมา
//     cy.intercept('POST', '**/api/products', (req) => {
//       // แปลง body เป็น object เสมอ (กันกรณีเป็น string)
//       const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

//       // ตรวจว่ามีฟิลด์หลักครบ (ไม่ต้องตรงเป๊ะทุก key เผื่อ backend ใส่ field อื่นเพิ่ม)
//       expect(body).to.include.keys([
//         'productId', 'name', 'description', 'price', 'quantity', 'inStock', 'categoryId', 'brandId'
//       ]);

//       // (ออปชัน) ตรวจค่าบางตัวอย่างหยาบ ๆ
//       expect(body.productId).to.equal(newProduct.productId);
//       expect(body.name).to.equal(newProduct.name);
//       expect(body.quantity).to.equal(newProduct.quantity);
//       expect(body.inStock).to.equal(true);

//       req.reply({ statusCode: 201, body: { id: newProduct.id, ...body } });
//     }).as('create');

//     // เมื่อ redirect ไปหน้า list ให้ตอบรายการที่มีสินค้าที่เพิ่งสร้างปนอยู่
//     cy.intercept('GET', '**/api/products*', {
//       statusCode: 200,
//       body: [
//         { id: 55, productId: 'SKU-OLD', name: 'Old Item', price: 10, quantity: 2, categoryId: 2, brandId: 2, inStock: true },
//         newProduct,
//       ],
//     }).as('listAfterCreate');

//     // --- Act ---
//     cy.visit(ADD_PATH);
//     cy.wait('@getCategories');
//     cy.wait('@getBrands');

//     cy.get(el.productId).type(newProduct.productId);
//     cy.get(el.name).type(newProduct.name);
//     cy.get(el.description).type(newProduct.description);
//     cy.get(el.category).select(String(newProduct.categoryId));
//     cy.get(el.brand).select(String(newProduct.brandId));
//     cy.get(el.price).type(String(newProduct.price));
//     cy.get(el.quantity).type(String(newProduct.quantity));

//     cy.get(el.saveBtn).click();

//     // --- Assert ---
//     cy.wait('@create');
//     cy.location('pathname', { timeout: 10000 }).should('eq', LIST_PATH);
//     cy.wait('@listAfterCreate');
//     cy.contains(newProduct.name, { matchCase: false }).should('be.visible');

//   });
// });

// describe('E2E-AUTH-107: Logout → redirect to /login', () => {
//   beforeEach(() => {
//     cy.loginAsAdmin();
//     cy.visit('/admin/products');
//     cy.get('[data-page="AdminProductListPage"]', { timeout: 15000 }).should('exist');
//     cy.get('h1.title', { timeout: 10000 }).should('contain.text', 'PRODUCT LIST');
//   });

//   it('กด Logout แล้วไปหน้า /login + ฟอร์ม login แสดงผล', () => {
//     cy.logoutUI();           // <-- คลิกปุ่มมุมขวาบน + Logout
//     cy.location('pathname').should('match', /\/login$/);
//     cy.get('#email').should('exist');
//     cy.get('#password').should('exist');
//   });
// });


/// <reference types="cypress" />

/** ======== PATHS (ปรับตามโปรเจกต์) ======== */
const ADD_PATH = '/admin/products/new';   // ถ้าใช้ /add ให้แก้เป็น '/admin/products/add'
const LIST_PATH = '/admin/products';

/** ======== SELECTORS (ใช้ร่วมทุก suite) ======== */
const el = {
  // form fields
  productId: 'input[name="productId"]',
  name: 'input[name="name"]',
  description: 'textarea[name="description"]',
  price: 'input[name="price"]',
  quantity: 'input[name="quantity"]',
  category: 'select[name="categoryId"]',
  brand: 'select[name="brandId"]',
  // buttons
  saveBtn: '.btn.primary, button[type="submit"].primary',
  cancelBtn: '.btn.ghost, [data-testid="btn-cancel"]',
  // misc
  msg: 'p[style*="white-space"]', // กล่องข้อความด้านล่าง (ข้อความ error/แจ้งเตือนในฟอร์ม)
};

/** ======== INTERCEPT HELPERS (ครอบกรณี path/query/singular) ======== */
function stubMasterDataOk() {
  const cats = [
    { id: 1, name: 'Jasmine Rice' },
    { id: 2, name: 'Canned Fish' },
  ];
  const brands = [
    { id: 1, name: 'Chatra' },
    { id: 2, name: 'Sealext' },
  ];

  // รองรับ /api/categories, /api/category และมี query ต่อท้าย
  cy.intercept('GET', '**/api/categories**', { statusCode: 200, body: cats }).as('getCategories');
  cy.intercept('GET', '**/api/category**', { statusCode: 200, body: cats }).as('getCategory');

  // รองรับ /api/brands, /api/brand และมี query ต่อท้าย
  cy.intercept('GET', '**/api/brands**', { statusCode: 200, body: brands }).as('getBrands');
  cy.intercept('GET', '**/api/brand**', { statusCode: 200, body: brands }).as('getBrand');
}

/** ======== SMOKE: เข้าได้จริง ======== */
describe('E2E-PROD-ADD-101 เข้าหน้า Add Product ได้', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    // กันหน้า guard เรียก /me
    cy.intercept('GET', '**/api/**/me*', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me');
    cy.intercept('GET', '**/api/auth/**', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('auth');
  });

  it('เปิดหน้า Add แล้วเห็นหัวข้อ Add PRODUCT', () => {
    cy.visit(ADD_PATH, { seedAuth: false });
    cy.location('pathname', { timeout: 10000 }).should('eq', ADD_PATH);
    cy.contains('h1', /add\s+product/i, { timeout: 10000 }).should('be.visible');
  });
});

/** ======== NAV: Cancel ======== */
// cypress/e2e/ProductAdd.cy.js
describe('E2E-PROD-ADD-102 ปุ่ม Cancel กลับไป /admin/products', () => {
  const ADD_PATH = '/admin/products/new';
  const LIST_PATH = '/admin/products';

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('กด Cancel แล้วกลับหน้า Product List', () => {
    // เข้าหน้า Add Product
    cy.visit(ADD_PATH, { seedAuth: false });
    cy.location('pathname', { timeout: 10000 }).should('eq', ADD_PATH);

    // ✅ รอให้หน้าโหลดเสร็จ เช่น มี title หรือข้อความหลักบนหน้า
    cy.get('body', { timeout: 15000 }).should('contain.text', 'Add Product');

    // ✅ หาปุ่ม Cancel (รองรับหลายแบบ)
    cy.get('button, a', { timeout: 10000 })
      .filter((i, el) => {
        const txt = el.textContent.trim().toLowerCase();
        return (
          txt === 'cancel' ||
          txt === 'ยกเลิก' ||
          el.dataset.testid === 'cancel-btn' ||
          el.dataset.testid === 'btn-cancel'
        );
      })
      .first()
      .should('exist')
      .click({ force: true });

    // ✅ ตรวจว่ากลับไปหน้า /admin/products สำเร็จ
    cy.location('pathname', { timeout: 10000 }).should('eq', LIST_PATH);

    // ✅ optional: ตรวจว่ามี list แสดงจริง
    cy.get('[data-page="AdminProductListPage"]', { timeout: 10000 }).should('exist');
  });
});


/** ======== MASTER DATA: dropdown ต้องมี option ======== */
describe('E2E-PROD-103 โหลด Categories/Brands สำเร็จ → dropdown มี option', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    stubMasterDataOk();                        // intercept ก่อน visit
    cy.visit(ADD_PATH, { seedAuth: false });
    // รอ DOM แสดงผลว่ามี select ปรากฎ (แทนการ rely ที่ alias)
    cy.get(el.category, { timeout: 15000 }).should('exist');
    cy.get(el.brand, { timeout: 15000 }).should('exist');
  });

  it('dropdown Category/Brand มี option อย่างน้อย 1 รายการ', () => {
    cy.get(el.category).find('option', { timeout: 15000 }).its('length').should('be.gte', 1);
    cy.get(el.brand).find('option', { timeout: 15000 }).its('length').should('be.gte', 1);
  });

  it('มี Jasmine Rice / Canned Fish และ Chatra / Sealext', () => {
    cy.get(el.category).find('option', { timeout: 15000 }).then($ops => {
      const texts = [...$ops].map(o => o.textContent.trim());
      expect(texts).to.include('Jasmine Rice').and.to.include('Canned Fish');
    });
    cy.get(el.brand).find('option', { timeout: 15000 }).then($ops => {
      const texts = [...$ops].map(o => o.textContent.trim());
      expect(texts).to.include('Chatra').and.to.include('Sealext');
    });
  });
});



/** ======== VALIDATION BUNDLE (เปิดเฉพาะตัวที่คุณใช้) ======== */
describe('E2E-PROD-104 Validation bundle (301–305)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    stubMasterDataOk();
    cy.visit(ADD_PATH, { seedAuth: false });

    // ✅ รอให้หน้า Add PRODUCT โหลดเสร็จแน่ ๆ
    cy.contains('Add PRODUCT', { timeout: 15000 }).should('be.visible');
    cy.get('input[name="productId"]', { timeout: 10000 }).should('be.visible');
  });




  // 104-1 — Product ID รับเฉพาะตัวเลข (ช่องว่าง/ตัวอักษรหายไป) และยาวสุด 5 หลัก
  it('104-1 Product ID trims to digits only → "A B 001" => "001"', () => {
    cy.get(el.productId).type('  A B  001  ');
    cy.get(el.productId).should(($i) => {
      expect($i.val()).to.eq('001'); // โค้ดหน้า add กรองให้เหลือเฉพาะตัวเลข
    });
  });


  // 104-2 — Quantity ต้องมีค่า และ clamp ที่ 1,000,000
  it('104-2 Quantity requires value and clamps to 1,000,000', () => {
    // กรอกและลบให้ว่าง → โชว์ข้อความ "กรุณากรอกจำนวนสต็อก"
    cy.get(el.quantity).type('7').should('have.value', '7');
    cy.get(el.quantity).type('{selectall}{backspace}').should('have.value', '').blur();
    cy.get(el.quantity)
      .closest('.field')
      .find('small')
      .should('contain', 'กรุณากรอกจำนวนสต็อก')
      .and('be.visible');

    // clamp > 1,000,000 → ถูกตัดเหลือ 1000000 + สถานะ In stock แสดงใน <small> แยกอีกตัว
    cy.get(el.quantity).type('9999999').blur();
    cy.get(el.quantity).should('have.value', '1000000');
    cy.contains('small', 'Status: In stock').should('be.visible');
  });

  // 104-3 — Quantity 0 → Out of stock, ≥1 → In stock
  it('104-3 Quantity 0 => Out of stock, ≥1 => In stock', () => {
    cy.get(el.quantity).clear().type('0');
    cy.contains('small', 'Status: Out of stock').should('be.visible');
    cy.get(el.quantity).clear().type('3');
    cy.contains('small', 'Status: In stock').should('be.visible');
  });


  // 104-4 — ราคา: ต้องมากกว่า 0 (ข้อความขึ้นหลังจากกด Save)
  it('104-4 price validation appears in modal when other fields missing', () => {
    cy.get(el.price).clear().type('0');
    cy.get(el.saveBtn).click();

    cy.contains('โปรดตรวจสอบ').should('be.visible');
    cy.get('ul').within(() => {
      cy.contains('ราคาต้องมากกว่า 0').should('exist');
    });
  });




  //104-5 — Required fields ว่าง → แสดง modal "โปรดตรวจสอบ" พร้อมรายการที่ขาด
  it('104-5 Required empties block submission with modal list', () => {
    // ปล่อยให้ name, price, quantity, category, brand ว่าง แล้วกด Save
    cy.get(el.saveBtn).click();

    // หน้าใช้ modal รวม error (ไม่ใช่ window.alert)
    cy.contains('โปรดตรวจสอบ').should('be.visible');
    cy.get('ul').within(() => {
      cy.contains('กรุณากรอกชื่อสินค้า').should('exist');
      cy.contains('กรุณากรอกราคา').should('exist');
      cy.contains('กรุณากรอกจำนวนสต็อก').should('exist');
      cy.contains('กรุณาเลือก Category').should('exist');
      cy.contains('กรุณาเลือก Brand').should('exist');
    });

    // ปิด modal
    cy.contains('button', 'ตกลง').click();
    cy.contains('โปรดตรวจสอบ').should('not.exist');

    // เติมเพิ่มบางช่อง แล้วกด Save อีกรอบ → modal ควรเหลือเฉพาะอันที่ยังขาด
    cy.get(el.price).type('9.99');
    cy.get(el.quantity).type('10');
    cy.get(el.category).select(1); // เลือกตัวแรกที่ไม่ใช่ disabled
    cy.get(el.brand).select(1);

    cy.get(el.saveBtn).click();
    cy.contains('โปรดตรวจสอบ').should('be.visible');
    cy.get('ul').within(() => {
      cy.contains('กรุณากรอกชื่อสินค้า').should('exist'); // ยังขาด name
      cy.contains('กรุณากรอกราคา').should('not.exist');
      cy.contains('กรุณากรอกจำนวนสต็อก').should('not.exist');
      cy.contains('กรุณาเลือก Category').should('not.exist');
      cy.contains('กรุณาเลือก Brand').should('not.exist');
    });
  });
});


/** ======== E2E-PROD-106: Save -> redirect + list แสดงสินค้าใหม่ ======== */
// E2E-PROD-106: Create success -> redirect + list shows new item
// cypress/e2e/ProductAdd.cy.js
describe('E2E-PROD-106 Create success -> redirect + list shows new item', () => {
  const ADD_PATH = '/admin/products/new';
  const LIST_PATH = '/admin/products';

  const el = {
    productId: 'input[name="productId"]',
    name: 'input[name="name"]',
    description: 'textarea[name="description"]',
    category: 'select[name="categoryId"]',
    brand: 'select[name="brandId"]',
    price: 'input[name="price"]',
    quantity: 'input[name="quantity"]',
    saveBtn: 'button.btn.primary',
  };

  beforeEach(() => {
    cy.loginAsAdmin();

    // --- Stub master data ---
    cy.intercept('GET', '**/api/categories', [
      { id: 1, name: "Jasmine Rice" },
      { id: 2, name: "Canned Fish" },
    ]).as('getCategories');

    cy.intercept('GET', '**/api/brands', [
      { id: 1, name: "Chatra" },
      { id: 2, name: "Sealext" },
    ]).as('getBrands');
  });

  it('กด Save แล้วไป /admin/products และเห็นแถวสินค้าที่เพิ่งสร้าง', () => {
    const newProduct = {
      id: 1001,
      productId: 'SKU-TST-001',   // ฟรอนต์จะ normalize เหลือ "001"
      name: 'Tomato Premium',
      description: 'Fresh & sweet',
      price: 25,
      quantity: 3,
      inStock: true,
      categoryId: 1,
      brandId: 1,
    };

    let created = false;
    let normalizedPid = null;

    // ---- ดัก GET /api/products ทั้งหมด (กันตรวจซ้ำ) ----
    cy.intercept('GET', '**/api/products*', (req) => {
      const url = new URL(req.url);
      const q = Object.fromEntries(url.searchParams.entries());
      const path = url.pathname;

      // ตรวจซ้ำ: productId, all, list, size => ตอบ [] (ไม่ซ้ำ)
      const isDupQuery =
        'productId' in q ||
        path.endsWith('/api/products/all') ||
        path.endsWith('/api/products/list') ||
        ('size' in q);

      if (isDupQuery) {
        return req.reply({ statusCode: 200, body: [] });
      }

      // ก่อนสร้าง => []
      // หลังสร้าง => ลิสต์ใหม่
      if (!created) {
        return req.reply({ statusCode: 200, body: [] });
      } else {
        return req.reply({
          statusCode: 200,
          body: [
            { id: 55, productId: 'SKU-OLD', name: 'Old Item', price: 10, quantity: 2, categoryId: 2, brandId: 2, inStock: true },
            {
              ...newProduct,
              productId: normalizedPid || '001', // ใช้ productId ที่ normalize แล้ว
            },
          ],
        });
      }
    }).as('productsAny');

    // ---- ดัก POST /api/products ----
    cy.intercept('POST', '**/api/products', (req) => {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // ฟิลด์ต้องครบ
      expect(body).to.include.keys([
        'productId', 'name', 'description', 'price', 'quantity', 'inStock', 'categoryId', 'brandId'
      ]);

      // ✅ หน้า Add จะ normalize productId เหลือเลข เช่น "001"
      const expectedPid = newProduct.productId.replace(/\D/g, '').slice(0, 5) || '0';
      expect(body.productId).to.equal(expectedPid);

      // เก็บค่า normalize ไว้ใช้ตอน list หลัง redirect
      normalizedPid = body.productId;
      created = true;

      req.reply({ statusCode: 201, body: { id: newProduct.id, ...body } });
    }).as('create');

    // ---- ไปหน้า Add ----
    cy.visit('/admin/products/new', { seedAuth: false });
    cy.wait('@getCategories');
    cy.wait('@getBrands');

    // ---- กรอกฟอร์ม ----
    cy.get('input[name="productId"]').type(newProduct.productId);
    cy.get('input[name="name"]').type(newProduct.name);
    cy.get('textarea[name="description"]').type(newProduct.description);
    cy.get('select[name="categoryId"]').select(String(newProduct.categoryId));
    cy.get('select[name="brandId"]').select(String(newProduct.brandId));
    cy.get('input[name="price"]').type(String(newProduct.price));
    cy.get('input[name="quantity"]').type(String(newProduct.quantity));

    // ---- กด Save ----
    cy.get('button.btn.primary').click();

    // ---- ตรวจ Assertions ----
    cy.wait('@create');
    cy.location('pathname', { timeout: 10000 }).should('eq', '/admin/products');
    cy.contains(newProduct.name, { matchCase: false }).should('be.visible');
  });


});




/** ======== E2E-AUTH-107: Logout → redirect to /login ======== */
describe('E2E-AUTH-107: Logout → redirect to /login', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/admin/products', { seedAuth: false });
    cy.get('[data-page="AdminProductListPage"]', { timeout: 15000 }).should('exist');
    cy.get('h1.title', { timeout: 10000 }).should('contain.text', 'PRODUCT LIST');
  });

  it('กด Logout แล้วไปหน้า /login + ฟอร์ม login แสดงผล', () => {
    cy.logoutUI();           // คลิกปุ่มมุมขวาบน + Logout
    cy.location('pathname').should('match', /\/login$/);
    cy.get('#email').should('exist');
    cy.get('#password').should('exist');
  });
});
