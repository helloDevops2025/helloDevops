/// <reference types="cypress" />

const API = 'http://127.0.0.1:8080';
const PID = 101;

describe('Detail Page', () => {
  const product = { id: PID, name: 'Tomato', price: 25, quantity: 5, productId: 'SKU-TMT', categoryId: 1, brandId: 2, description: 'Fresh tomato' };
  const images = [{ isCover: true, imageUrl: `${API}/static/tomato.jpg` }];
  const cats = [{ id: 1, name: 'Fruits & Vegetables' }];
  const brands = [{ id: 2, name: 'Pure Farm' }];

  it('แสดง Loading → สำเร็จ: breadcrumb, title, brand, sku, price, stock', () => {
    cy.intercept('GET', `${API}/api/products/${PID}`, product).as('getP');
    cy.intercept('GET', `${API}/api/products/${PID}/images`, images).as('getImgs');
    cy.intercept('GET', `${API}/api/categories`, cats).as('getCats');
    cy.intercept('GET', `${API}/api/brands`, brands).as('getBrands');

    cy.visit(`/detail/${PID}`);
    cy.contains('Loading product...').should('be.visible');

    cy.wait(['@getP','@getImgs','@getCats','@getBrands']);
    cy.get('.pm-breadcrumb').should('contain.text', 'HOME').and('contain.text', 'FRUITS & VEGETABLES');
    cy.get('.product__title').should('have.text', 'Tomato');
    cy.contains('.meta', 'Brand:').should('contain.text', 'Pure Farm');
    cy.contains('.meta', 'SKU:').should('contain.text', 'SKU-TMT');
    cy.get('.price').should('contain.text', '฿').and('contain.text', '25.00');
    cy.get('.stock').should('contain.text', '5 in stock');
  });

  it('รูป cover เสีย → ใช้ FALLBACK (trigger onError)', () => {
    cy.intercept('GET', `${API}/api/products/${PID}`, product);
    cy.intercept('GET', `${API}/api/products/${PID}/images`, [{ isCover: true, imageUrl: '/broken.jpg' }]);
    cy.intercept('GET', `${API}/api/categories`, cats);
    cy.intercept('GET', `${API}/api/brands`, brands);
    cy.visit(`/detail/${PID}`);
    cy.get('.product__img img').then(($img) => {
      $img[0].dispatchEvent(new Event('error'));
    });
    cy.get('.product__img img').should('have.attr', 'src').and('include', 'data:image/svg+xml'); // FALLBACK svg ในไฟล์
  });

  it('qty ปรับได้ (min=1) และ wish toggle ได้', () => {
    cy.intercept('GET', `${API}/api/products/${PID}`, product);
    cy.intercept('GET', `${API}/api/products/${PID}/images`, images);
    cy.intercept('GET', `${API}/api/categories`, cats);
    cy.intercept('GET', `${API}/api/brands`, brands);
    cy.visit(`/detail/${PID}`);

    cy.get('.qty__input').should('have.value', '1');
    cy.get('.qty__btn[aria-label="increase"]').click().click();
    cy.get('.qty__input').should('have.value', '3');
    cy.get('.qty__btn[aria-label="decrease"]').click().click().click();
    cy.get('.qty__input').should('have.value', '1'); // ไม่ต่ำกว่า 1

    cy.get('.wish .heart-toggle').should('not.be.checked').click().should('be.checked');
  });

  it('stock = 0 → ปุ่ม ADD TO CART / BUY NOW ต้อง disabled และขึ้น error เมื่อ API ล้มเหลว', () => {
    const out = { ...product, quantity: 0 };
    cy.intercept('GET', `${API}/api/products/${PID}`, out);
    cy.intercept('GET', `${API}/api/products/${PID}/images`, images);
    cy.intercept('GET', `${API}/api/categories`, cats);
    cy.intercept('GET', `${API}/api/brands`, brands);
    cy.visit(`/detail/${PID}`);
    cy.contains('.buy-row .btn.btn--primary', 'ADD TO CART').should('be.disabled');
    cy.contains('.buy-row .btn.btn--gradient', 'BUY NOW').should('be.disabled');

    // เคส error
    cy.intercept('GET', `${API}/api/products/9999`, { statusCode: 404, body: {} });
    cy.visit('/detail/9999');
    cy.contains('เกิดข้อผิดพลาด').should('be.visible');
  });
});
