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

// เปิด dropdown มุมขวาบน แล้วกด Logout (เวอร์ชันทนทาน ไม่ใช้ :contains ของ jQuery)
Cypress.Commands.add('logoutUI', () => {
  cy.scrollTo('top');

  // 1) หา header ก่อน (ลองได้หลาย selector)
  cy.get('header, .header, [data-testid="app-header"]', { timeout: 10000 }).should('exist');

  // 2) คลิกตัวเปิดเมนู "admin" แบบ case-insensitive โดยใช้ Cypress.contains (ไม่ใช่ jQuery)
  //    ทำในขอบเขต header ก่อน ถ้าไม่เจอค่อย fallback ไปทั้งหน้า
  cy.get('header, .header, [data-testid="app-header"]').then($hdr => {
    const hasAdmin = $hdr.find('*:contains("admin"), *:contains("Admin")').length > 0;
    if (hasAdmin) {
      cy.wrap($hdr).contains(/^admin$/i, { matchCase: false }).click({ force: true });
    } else {
      // เผื่อ DOM ของปุ่มอยู่นอกแท็ก header
      cy.contains(/^admin$/i, { matchCase: false }).click({ force: true });
    }
  });

  // 3) คลิกปุ่ม Logout (รองรับหลายแบบ)
  cy.contains(/^\s*Logout\s*$/i, { timeout: 5000 }).click({ force: true });
});


// cypress/support/commands.js
Cypress.Commands.add('loginAs', (role = 'ADMIN', payload = {}) => {
  cy.intercept('POST', '**/api/auth/login', (req) => {
    req.reply({
      statusCode: 200,
      body: {
        token: 'fake-jwt',
        role,
        email: payload.email || (role === 'ADMIN' ? 'admin@puremart.com' : 'user@puremart.com'),
        user: { role }
      }
    });
  }).as('loginApi');

  cy.get('#email').clear().type(payload.email || (role === 'ADMIN' ? 'admin' : 'user'));
  cy.get('#password').clear().type(payload.password || '123456');
  cy.get('#submitBtn').click();
  cy.wait('@loginApi');
});
