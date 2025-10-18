/// <reference types="cypress" />
const API = 'http://127.0.0.1:8080';

describe('WishList Page', () => {
  const rows = [
    {id:1,name:'Tomato',price:25,coverImageUrl:'/p1.jpg'},
    {id:2,name:'MK Suki Sauce',price:119,coverImageUrl:'/p2.jpg'},
    {id:3,name:'Coconut',price:25,coverImageUrl:'/p3.jpg'},
  ];

  beforeEach(() => {
    cy.window().then(win => win.localStorage.setItem('pm_wishlist', JSON.stringify([2,1,3])));
    cy.intercept('GET', `${API}/api/products`, rows).as('getP');
  });

  it('โหลดรายการ wishlist จาก LS และนับจำนวนถูกต้อง', () => {
    cy.visit('/wishlist');
    cy.wait('@getP');
    cy.get('#wl-count').should('have.text', '3');
    cy.get('.wl-card').should('have.length', 3);
  });

  it('remove รายการเดี่ยว และปุ่ม Clear ทั้งหมด (มี modal ยืนยัน)', () => {
    cy.visit('/wishlist');
    cy.wait('@getP');

    // remove 1 ชิ้น
    cy.get('.wl-card').first().find('.wl-like').click();
    cy.get('.wl-card').should('have.length', 2);

    // clear all
    cy.window().then((win) => cy.stub(win, 'alert')); // ป้องกัน alert อื่นๆ
    cy.get('#wl-clear').click();
    cy.get('#confirm-modal').should('be.visible');
    cy.get('#confirm-modal .btn-danger').click();
    cy.get('#wl-count').should('have.text', '0');
    cy.get('.wl-empty').should('be.visible');
  });

  it('sort: ราคาสูง→ต่ำ', () => {
    cy.visit('/wishlist');
    cy.wait('@getP');
    cy.get('#wl-sort').select('priceDesc');
    cy.get('.wl-card').first().should('contain.text', 'MK Suki Sauce');
  });

  it('ADD TO CART กดแล้วขึ้น alert', () => {
    cy.visit('/wishlist');
    cy.wait('@getP');
    cy.window().then((win) => cy.stub(win, 'alert').as('al'));
    cy.get('.wl-card .btn-primary').first().click();
    cy.get('@al').should('have.been.called');
  });
});
