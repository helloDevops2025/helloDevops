/// <reference types="cypress" />

// ปรับให้ตรงกับข้อมูลในฐานข้อมูลจริง
const REAL_USER = {
  email: "user@puremart.com",
  password: "123456",
};

const REAL_ADMIN = {
  email: "admin@puremart.com",
  password: "admin123",
};

const el = {
  splash: '.welcome-splash',
  enterBtn: '.welcome-splash .enter-btn',
  email: '#email',
  password: '#password',
  submit: '#submitBtn',
  errorMsg: 'p[style*="crimson"]',
};

const API_LOGIN = '**/api/auth/login';

const openLoginForm = () => {
  cy.visit('/login', { seedAuth: false });

  cy.get(el.splash).should('be.visible');
  cy.get(el.enterBtn).should('be.visible').click();

  cy.get(el.splash).should('not.exist');
  cy.get(el.email).should('exist');
};

describe('Login Page (REAL backend)', () => {

  it('L1: Splash → Enter → ฟอร์ม login แสดง', () => {
    cy.visit('/login', { seedAuth: false });

    cy.get(el.splash).should('be.visible');
    cy.get(el.enterBtn).click();
    cy.get(el.splash).should('not.exist');

    cy.get(el.email).should('be.visible');
    cy.get(el.password).should('be.visible');
  });

  it('L2: ไม่กรอก email → แสดงข้อความ error frontend', () => {
    openLoginForm();

    cy.get(el.password).type('123456');
    cy.get(el.submit).click();

    cy.get(el.errorMsg).should('contain', 'Please enter your email');
  });

  it('L3: login ผิดจริง → backend ส่ง 401 → แสดงข้อความ Incorrect username or password', () => {
    openLoginForm();

    // ไม่ intercept ให้ backend ตอบจริง
    cy.get(el.email).type('not-exist@example.com');
    cy.get(el.password).type('wrong-password');
    cy.get(el.submit).click();

    cy.get(el.errorMsg).should('contain', 'Incorrect username or password');
  });

  it('L4: login USER (stub backend) → redirect ไป /home', () => {
  openLoginForm();

  cy.intercept('POST', API_LOGIN, {
    statusCode: 200,
    body: {
      token: 'fake-user-token',
      role: 'USER',
      email: 'user@test.com',
    },
  }).as('loginUser');

  cy.get(el.email).type('user@test.com');
  cy.get(el.password).type('123456');
  cy.get(el.submit).click();

  cy.wait('@loginUser');
  cy.location('pathname', { timeout: 8000 }).should('contain', '/home');
});

it('L5: login ADMIN (stub backend) → redirect ไป /admin/products', () => {
  openLoginForm();

  cy.intercept('POST', API_LOGIN, {
    statusCode: 200,
    body: {
      token: 'fake-admin-token',
      role: 'ADMIN',
      email: 'admin@test.com',
    },
  }).as('loginAdmin');

  cy.get(el.email).type('admin@test.com');
  cy.get(el.password).type('admin123');
  cy.get(el.submit).click();

  cy.wait('@loginAdmin');
  cy.location('pathname', { timeout: 8000 }).should('contain', '/admin/products');
});

  it('L6: Server error (stub 500) → ต้องแสดงข้อความ Cannot connect to server', () => {
    openLoginForm();

    cy.intercept('POST', API_LOGIN, {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('serverErr');

    cy.get(el.email).type('crash@test.com');
    cy.get(el.password).type('xxxxx');
    cy.get(el.submit).click();

    cy.wait('@serverErr');
    cy.get(el.errorMsg).should('contain', 'Cannot connect to server');
  });

});
