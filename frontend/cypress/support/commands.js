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

    //  บังคับ auth state ฝั่ง client (ครอบทุกชื่อ key ที่พบบ่อย)
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
  cy.session([role, payload.email], () => {
    cy.visit('/login');
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt',
        role,
        email: payload.email || 'admin@puremart.com',
        user: { name: 'admin', role }
      }
    }).as('loginApi');

    cy.get('#email').type(payload.email || 'admin@puremart.com');
    cy.get('#password').type(payload.password || 'admin123');
    cy.get('#submitBtn').click();
    cy.wait('@loginApi');
  });
});

// Overwrite cy.visit to seed sessionStorage auth keys by default so guarded routes
// don't immediately redirect tests to /login. Tests that want to visit /login
// for real auth flows should pass { seedAuth: false } or visit '/login' directly.
Cypress.Commands.overwrite('visit', (originalFn, url, options = {}) => {
  // If caller explicitly opts out, skip seeding
  if (options && options.seedAuth === false) {
    return originalFn(url, options);
  }

  // If visiting login page, don't seed (tests that exercise login flow need a clean state)
  const urlStr = (typeof url === 'string') ? url : '';
  if (urlStr.includes('/login') || urlStr.includes('/signup')) {
    return originalFn(url, options);
  }

  const seedAuth = (win) => {
    try {
      win.sessionStorage.setItem('token', 'e2e-dummy-token');
      win.sessionStorage.setItem('role', 'USER');
      win.sessionStorage.setItem('user', JSON.stringify({ email: 'e2e@test.local' }));
      win.sessionStorage.setItem('email', 'e2e@test.local');
    } catch (e) {
      // ignore if sessionStorage is unavailable
    }
    if (options && typeof options.onBeforeLoad === 'function') {
      options.onBeforeLoad(win);
    }
  };

  // NOTE: keep this overwrite minimal and only seed sessionStorage in onBeforeLoad.
  // Avoid calling Cypress commands (cy.intercept, etc.) here to prevent unexpected
  // command queue issues. Tests that require API stubbing should add intercepts
  // themselves (or use helper commands) inside test context.
  return originalFn(url, { ...options, onBeforeLoad: seedAuth });
});

