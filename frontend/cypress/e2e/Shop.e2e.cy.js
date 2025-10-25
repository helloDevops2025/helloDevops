/// <reference types="cypress" />
function data() {
  const cats = [{id:1,name:'Fruits & Vegetables'},{id:2,name:'Sauce'}];
  const brands = [{id:10,name:'Pure Farm'},{id:11,name:'MK'}];
  const rows = [
    {id:1,name:'Tomato',price:25,categoryId:1,brandId:10,coverImageUrl:'/p1.jpg'},
    {id:2,name:'Cucumber',price:15,categoryId:1,brandId:10,coverImageUrl:'/p2.jpg'},
    {id:3,name:'MK Suki Sauce',price:119,categoryId:2,brandId:11,coverImageUrl:'/p3.jpg'},
  ];
  return {cats,brands,rows};
}

describe('Shop Page', () => {
  beforeEach(() => {
    const {cats,brands,rows} = data();
    // Ensure tests run with an authenticated session if the app checks sessionStorage
    cy.window().then((win) => {
      win.sessionStorage.setItem('token', 'e2e-dummy-token');
      win.sessionStorage.setItem('role', 'USER');
      win.sessionStorage.setItem('user', JSON.stringify({ email: 'e2e@test.local' }));
      win.sessionStorage.setItem('email', 'e2e@test.local');
    });
    // Use host-agnostic intercepts so tests don't depend on backend host/port
    cy.intercept('GET', '**/api/products', { body: rows }).as('getP');
    cy.intercept('GET', '**/api/categories', { body: cats }).as('getC');
    cy.intercept('GET', '**/api/brands', { body: brands }).as('getB');
  });

  it('โหลดสำเร็จ: HERO, result-count, cards', () => {
    cy.visit('/shop');
    cy.contains('.wl-title', 'SHOP').should('be.visible');
    cy.wait(['@getP','@getC','@getB']);
    cy.get('.grid article.card').should('have.length', 3);
    cy.get('.result-count').should('contain.text', '3 items found');
  });

  it('filter: เลือกหมวดหมู่ + กำหนดราคา + ลบ chip', () => {
    cy.visit('/shop');
    cy.wait(['@getP','@getC','@getB']);
    cy.contains('.filters .filter-block h3', 'Product Categories').parents('.filter-block').within(() => {
      cy.get('input[type="checkbox"]').first().check({force:true}); // Fruits & Vegetables
    });
    cy.get('.chips .chip').should('have.length', 1);

    // กำหนดราคา min=20 max=30 → เหลือ Tomato เท่านั้น
  cy.contains('.filters .filter-block h3', 'Price').parents('.filter-block').within(() => {
      // defensive: topbar may overlay inputs (pm-topbar). Hide it using window.document
      // Use cy.window() because we're inside a `.within()` scope — cy.get('body') would be scoped and fail.
      cy.window().then((win) => {
        const topbar = win.document.querySelector('.pm-topbar');
        if (topbar) topbar.style.display = 'none';
      });
      cy.get('input[placeholder="min"]').then($el => {
        if ($el.is(':visible')) {
          cy.wrap($el).clear().type('20');
        } else {
          cy.wrap($el).clear().type('20', { force: true });
        }
      });
      cy.get('input[placeholder="max"]').then($el => {
        if ($el.is(':visible')) {
          cy.wrap($el).clear().type('30');
        } else {
          cy.wrap($el).clear().type('30', { force: true });
        }
      });
      cy.contains('button','Apply').click();
    });
    // restore topbar visibility for remaining page interactions
    cy.window().then((win) => {
      const topbar = win.document.querySelector('.pm-topbar');
      if (topbar) topbar.style.display = '';
    });
    cy.get('.grid article.card').should('have.length', 1).and('contain.text', 'Tomato');

  // ลบ chip ราคา — ensure we click a single button (avoid multiple match error)
  cy.contains('.chips .chip', '฿20–30').parent().find('button').first().click();
    cy.get('.grid article.card').should('have.length.at.least', 1);
  });

  it('sort: price-desc แล้วใบแรกต้องแพงสุด', () => {
    cy.visit('/shop');
    cy.wait(['@getP','@getC','@getB']);
    cy.get('#sort').select('price-desc');
    cy.get('.grid .card .p-price').first().should('contain.text', '119.00');
  });

  it('wishlist: ปุ่ม "ADD TO WISHLIST" toggle และเก็บ pm_wishlist', () => {
    cy.visit('/shop');
    cy.wait(['@getP','@getC','@getB']);
    cy.contains('.card .p-wishline span','ADD TO WISHLIST').first().click();
    cy.contains('.card .p-wishline.on span','ADDED TO WISHLIST').should('exist');
    cy.window().then(w => {
      const ids = JSON.parse(w.localStorage.getItem('pm_wishlist')||'[]');
      expect(ids.length).to.be.greaterThan(0);
    });
  });

  it('รองรับ URL ?cat=Fruits & Vegetables (แสดงเฉพาะ category นั้น)', () => {
    cy.visit('/shop?cat=Fruits%20%26%20Vegetables');
    cy.wait(['@getP','@getC','@getB']);
    cy.get('.grid article.card').should('have.length', 2).and('contain.text', 'Tomato');
  });
});
