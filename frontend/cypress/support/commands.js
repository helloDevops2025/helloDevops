// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// cypress/support/commands.js
Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin-session', () => {
    // กันเคสที่หน้า app ยิงตรวจสิทธิ์พวก /api/**/me
    cy.intercept('GET', '**/api/**/me*', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me1');
    cy.intercept('GET', '**/api/auth/**', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me2');
    cy.intercept('GET', '**/api/users/me*', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me3');

    cy.visit('/login');
    cy.get('#email').type('admin');
    cy.get('#password').type('admin123');
    cy.get('#submitBtn').click();

    // ✅ มาถึงหน้า list แล้ว
    cy.location('pathname', { timeout: 10000 }).should('include', '/admin/products');

    // ✅ บังคับ auth state ฝั่ง client (ครอบทุกชื่อ key ที่พบบ่อย)
    cy.window().then((w) => {
      const authPayload = JSON.stringify({ user: { name: 'admin', role: 'ADMIN' }, token: 'test-token' });
      // ใส่หลาย key ไว้ก่อน — ถ้าระบบคุณใช้ key ใด key หนึ่งก็จะจับได้
      w.localStorage.setItem('auth', authPayload);
      w.localStorage.setItem('pm_auth', authPayload);
      w.localStorage.setItem('puremart_auth', authPayload);
      w.localStorage.setItem('isAuthed', 'true');
    });
  });
});



