/// <reference types="cypress" />

describe('Order History Page', () => {
  beforeEach(() => {
    // Ensure authenticated session for guarded routes
    cy.window().then((win) => {
      win.sessionStorage.setItem('token', 'e2e-dummy-token');
      win.sessionStorage.setItem('role', 'USER');
      win.sessionStorage.setItem('user', JSON.stringify({ email: 'e2e@test.local' }));
      win.sessionStorage.setItem('email', 'e2e@test.local');
    });

    cy.intercept('GET', /\/api\/orders.*/, { statusCode: 500, body: 'fail' }).as('orders'); // บังคับใช้ mock
  });

  it('โหลด HERO + breadcrumb + รายการ mock + pager', () => {
    cy.visit('/orders'); // ปรับให้ตรง route จริง
    cy.get('.wl-title').should('contain.text', 'ORDER HISTORY');
    cy.get('.custom-breadcrumb').should('contain.text', 'HOME').and('contain.text', 'SHOP').and('contain.text','ORDER HISTORY');
    cy.get('.hx-list .hx-card').should('have.length.at.least', 1);
    cy.get('.hx-pager').should('exist');
  });

  it('Tabs: Completed / Cancelled กรองได้, Search ใช้ได้', () => {
    cy.visit('/orders');
    cy.contains('.hx-tabs .hx-tab', 'Completed').click();
    cy.get('.hx-list .hx-card .hx-status-right.ok').should('have.length.at.least', 1);

    cy.contains('.hx-tabs .hx-tab', 'Cancelled').click();
    cy.get('.hx-list .hx-card .hx-status-right.bad').should('have.length.at.least', 1);

    cy.get('.hx-tabs .hx-tab').contains('All').click();
    cy.get('.hx-search input[aria-label="Search order"]').type('PM-2025-');
    cy.get('.hx-search button').click();
    cy.get('.hx-list .hx-card').should('have.length.at.least', 1);
  });

  it('Buy Again เรียก alert และ View Details เป็นลิงก์ไป /orders/:id', () => {
    cy.visit('/orders');
    cy.window().then((win) => cy.stub(win, 'alert').as('al'));
    cy.get('.hx-card').first().within(() => {
      cy.contains('.hx-actions .hx-btn.primary', 'Buy Again').click();
      cy.get('.hx-actions a.hx-btn.ghost').should('have.attr', 'href').and('match', /\/orders\/PM-2025-/);
    });
    cy.get('@al').should('have.been.called');
  });

  it('Pager กด Next/Prev ทำงาน', () => {
    cy.visit('/orders');
    cy.get('.hx-pager .hx-page[aria-label="Next page"]').click();
    cy.get('.hx-pager .hx-page.is-current').should('exist');
    cy.get('.hx-pager .hx-page[aria-label="Previous page"]').click();
  });
});
