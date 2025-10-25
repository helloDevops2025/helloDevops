/// <reference types="cypress" />

// ----- ค่าคงที่ -----
const HOME_PATH   = '/home';
const PRODUCTS_RE = /\/api\/products(?:\?.*)?$/;
const CATS_RE     = /\/api\/categories(?:\?.*)?$/;

// ----- ชุดข้อมูลตัวอย่าง -----
function sampleProductsBase() {
  const now = new Date().toISOString();
  return [
    { id: 11, name: 'Apple Fuji',   price: 25, quantity: 3, updatedAt: now },
    { id: 12, name: 'Banana',       price: 10, quantity: 6, updatedAt: now },
    { id: 13, name: 'Coconut',      price: 15, quantity: 1, updatedAt: now },
    { id: 14, name: 'Dragon Fruit', price: 39, quantity: 9, updatedAt: now },
    { id: 15, name: 'Eggplant',     price: 18, quantity: 2, updatedAt: now },
    { id: 16, name: 'Fish Sauce',   price: 22, quantity: 8, updatedAt: now },
    { id: 17, name: 'Garlic',       price: 12, quantity: 7, updatedAt: now },
    { id: 18, name: 'Honey',        price: 99, quantity: 4, updatedAt: now },
    // อันนี้ qty=0 ไม่ควรติด Best Sellers แต่ยังอยู่ใน All Products
    { id: 19, name: 'Ice Cream',    price: 49, quantity: 0, updatedAt: now },
    // อันนี้ตั้งใจให้รูปแตก เพื่อเทส fallback
    { id: 20, name: 'Jam (broken img)', price: 59, quantity: 5, updatedAt: now, imageUrl: 'http://127.0.0.1:9/nope.jpg' },
  ];
}

function sampleCategories() {
  return [
    { id: 1, name: 'Canned Fish' },
    { id: 2, name: 'Dried Foods' },
    { id: 3, name: 'Fruits & Vegetables' },
    { id: 4, name: 'Frozen Foods' },
  ];
}

// ----- เทสรวมทุกฟีเจอร์ในไฟล์เดียว -----
describe('HOME — e2e รวมทุกฟีเจอร์หน้าโฮม', () => {
  beforeEach(() => {
    // Ensure authenticated session for guarded /home route
    cy.window().then((win) => {
      win.sessionStorage.setItem('token', 'e2e-dummy-token');
      win.sessionStorage.setItem('role', 'USER');
      win.sessionStorage.setItem('user', JSON.stringify({ email: 'e2e@test.local' }));
      win.sessionStorage.setItem('email', 'e2e@test.local');
    });

    // ดีฟอลต์: หน้าโฮมโหลด products & categories
    cy.intercept('GET', PRODUCTS_RE, { statusCode: 200, body: sampleProductsBase() }).as('getProducts');
    cy.intercept('GET', CATS_RE,     { statusCode: 200, body: sampleCategories() }).as('getCats');
  });

  it('โหลดโครงหน้าโฮมครบ (Best Sellers / Categories / All Products)', () => {
    cy.visit(HOME_PATH);

    cy.contains('#best-sellers h2', 'Best Sellers.').should('be.visible');
    cy.contains('#categories h3', 'Browse by Category').should('be.visible');
    cy.contains('.all-products h3', 'All Products').should('be.visible');

    cy.wait('@getProducts');
    cy.wait('@getCats');
  });

  it('Best Sellers: มีสินค้าที่ qty>0 และมีปุ่ม add-to-cart / ไม่รวมสินค้าที่ qty=0', () => {
    cy.visit(HOME_PATH);
    cy.wait('@getProducts');

    cy.get('#best-sellers .products .product').should('have.length.at.least', 1);
    cy.get('#best-sellers .products .product .product__body .add-to-cart')
      .first().should('be.visible');

    cy.get('#best-sellers .products').should('not.contain.text', 'Ice Cream'); // qty=0
  });

  

  it('All Products: แสดงรายการ และลิงก์ไป /detail/:id', () => {
    const list = sampleProductsBase();
    cy.visit(HOME_PATH);
    cy.wait('@getProducts');

    cy.get('.all-products .products .product')
      .should('have.length.at.least', list.length - 1);

    cy.get('.all-products .products .product').first()
      .invoke('attr', 'href')
      .should('match', /\/detail\/\d+/);
  });


  it('Banner → anchor scroll ไป #best-sellers', () => {
    cy.visit(HOME_PATH);
    cy.get('a.hero-card[href="/home#best-sellers"]').first().click();
    cy.location('hash').should('eq', '#best-sellers');
    cy.get('#best-sellers').should('be.visible');
  });

  it('Banner → anchor scroll ไป #categories', () => {
    cy.visit(HOME_PATH);
    cy.get('a.hero-card[href="#categories"]').first().click();
    cy.location('hash').should('eq', '#categories');
    cy.get('#categories').should('be.visible');
  });

  it('หลัง “เพิ่มสินค้าใหม่” (stub ผลลัพธ์) หน้าโฮมต้องเห็นสินค้าตัวใหม่ใน Best Sellers และ All Products', () => {
    // สร้าง base ก่อน แล้วตั้ง timestamp ของสินค้าที่เพิ่มให้ใหม่กว่า base (+1s)
    const base = sampleProductsBase();
    const now = new Date(Date.now() + 1000).toISOString();

    const newProduct = {
      id: 1001,
      productId: 'SKU-TST-001',
      name: 'Tomato Premium',
      description: 'Fresh & sweet',
      price: 25,
      quantity: 3,
      inStock: true,
      categoryId: 1,
      brandId: 1,
      updatedAt: now, // ใหม่ เพื่อให้ติด Best Sellers
    };

    // Override intercept เฉพาะเคสนี้ให้ products มีของใหม่
    cy.intercept('GET', PRODUCTS_RE, {
      statusCode: 200,
      body: [...base, newProduct],
    }).as('getProductsAfterAdd');

    cy.visit(HOME_PATH);
    cy.wait('@getProductsAfterAdd');

    cy.get('#best-sellers .products').should('contain.text', newProduct.name);
    cy.get('.all-products .products').should('contain.text', newProduct.name);
  });
});
