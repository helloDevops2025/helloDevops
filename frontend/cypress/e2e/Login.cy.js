/// <reference types="cypress" />

const el = {
  splash: '.welcome-splash',
  enterBtn: '.welcome-splash .enter-btn',
  email: '#email',
  password: '#password',
  submit: '#submitBtn',
  errorMsg: 'p[style*="crimson"]',
};

const API_LOGIN = '**/api/auth/login';

// helper ที่ใช้เฉพาะ spec นี้
const openLoginForm = () => {
  cy.visit('/login', { seedAuth: false });

  cy.get(el.splash, { timeout: 8000 }).should('be.visible');
  cy.get(el.enterBtn).click();

  cy.get(el.splash).should('not.exist');
  cy.get(el.email).should('exist');
};

describe('Login Page', () => {

  it('L1: แสดง splash → กด Enter → ฟอร์มต้องโชว์', () => {
    cy.visit('/login', { seedAuth: false });

    cy.get(el.splash).should('be.visible');
    cy.get(el.enterBtn).should('be.visible').click();

    cy.get(el.splash).should('not.exist');
    cy.get(el.email).should('exist');
    cy.get(el.password).should('exist');
  });

  it('L2: ไม่กรอก email → ขึ้น Please enter your email', () => {
    openLoginForm();

    cy.get(el.password).type('pass123');

    cy.get(el.submit).click();

    cy.get(el.errorMsg).should('contain', 'Please enter your email');
  });

  it('L3: login ผิด (401) → ขึ้น Incorrect username or password', () => {
    openLoginForm();

    cy.intercept('POST', API_LOGIN, {
      statusCode: 401,
      body: { message: 'Invalid' },
    }).as('fail');

    cy.get(el.email).type('wrong@example.com');
    cy.get(el.password).type('wrongpass');

    cy.get(el.submit).click();
    cy.wait('@fail');

    cy.get(el.errorMsg).should('contain', 'Incorrect username or password');
  });

  it('L4: login USER สำเร็จ → ไปหน้า /home', () => {
    openLoginForm();

    cy.intercept('POST', API_LOGIN, {
      statusCode: 200,
      body: {
        token: 'fake-user',
        role: 'USER',
        email: 'user@test.com',
      },
    }).as('userLogin');

    cy.get(el.email).type('user@test.com');
    cy.get(el.password).type('123456');

    cy.get(el.submit).click();
    cy.wait('@userLogin');

    cy.location('pathname').should('contain', '/home');
  });

  it('L5: login ADMIN สำเร็จ → ไปหน้า /admin/products', () => {
    openLoginForm();

    cy.intercept('POST', API_LOGIN, {
      statusCode: 200,
      body: {
        token: 'fake-admin',
        role: 'ADMIN',
        email: 'admin@test.com',
      },
    }).as('adminLogin');

    cy.get(el.email).type('admin@test.com');
    cy.get(el.password).type('admin123');

    cy.get(el.submit).click();
    cy.wait('@adminLogin');

    cy.location('pathname').should('contain', '/admin/products');
  });

  it('L6: Server error 500 → ขึ้น Cannot connect to server', () => {
    openLoginForm();

    cy.intercept('POST', API_LOGIN, {
      statusCode: 500,
      body: { error: 'Internal' },
    }).as('serverErr');

    cy.get(el.email).type('test@test.com');
    cy.get(el.password).type('123456');

    cy.get(el.submit).click();
    cy.wait('@serverErr');

    cy.get(el.errorMsg).should('contain', 'Cannot connect to server');
  });

});
