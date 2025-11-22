/// <reference types="cypress" />

describe('E2E-Signup-101: Sign Up Page', () => {

  // ต้องปิด seedAuth (เพราะ overwrite ของคุณ auto seed sessionStorage)
  beforeEach(() => {
    cy.visit('/signup', { seedAuth: false });
  });

  it('S1: สมัครสำเร็จ → แสดง Toast → redirect ไป /login', () => {
    cy.intercept('POST', '**/api/auth/signup', {
      statusCode: 201,
      body: { id: 1 }
    }).as('signupApi');

    cy.get('#email').type('newuser@puremart.com');
    cy.get('#phone').type('0891234567'); // ระบบจะ format เอง เป็น 089-123-4567
    cy.get('#password').type('123456');
    cy.get('#confirm-password').type('123456');

    cy.get('#submitBtn').click();

    cy.wait('@signupApi');

    cy.get('.pm-toast', { timeout: 4000 })
      .should('be.visible')
      .and('contain', 'Sign up successful! Please log in.');

    cy.location('pathname', { timeout: 7000 }).should('eq', '/login');
  });

  it('S2: รหัสผ่านไม่ตรงกัน → แสดง error และไม่ redirect', () => {
    cy.get('#email').type('mismatch@puremart.com');
    cy.get('#phone').type('0811111111');
    cy.get('#password').type('abcdef');
    cy.get('#confirm-password').type('abcdeg');

    cy.get('#submitBtn').click();

    cy.contains('Passwords do not match').should('be.visible');
    cy.location('pathname').should('eq', '/signup');
  });

  it('S3: รหัสผ่านสั้นเกินไป (<6) → แสดง error', () => {
    cy.get('#email').type('short@puremart.com');
    cy.get('#phone').type('0892222222');
    cy.get('#password').type('12345');
    cy.get('#confirm-password').type('12345');

    cy.get('#submitBtn').click();

    cy.contains('Password must be at least 6 characters.').should('be.visible');
  });

  it('S4: เบอร์โทรไม่ถูกต้อง → แสดง error', () => {
    cy.get('#email').type('phonebad@puremart.com');
    cy.get('#phone').type('08123'); // ระบบจะ format เป็น 081-23
    cy.get('#password').type('123456');
    cy.get('#confirm-password').type('123456');

    cy.get('#submitBtn').click();

    cy.contains(
      'Please enter a valid Thai mobile number (e.g. 0xx-xxx-xxxx)'
    ).should('be.visible');
  });

  it('S5: อีเมลซ้ำ (409) → แสดง This email is already registered.', () => {
    cy.intercept('POST', '**/api/auth/signup', {
      statusCode: 409,
      body: { message: 'Duplicate email' }
    }).as('signup409');

    cy.get('#email').type('duplicate@puremart.com');
    cy.get('#phone').type('0893333333');
    cy.get('#password').type('123456');
    cy.get('#confirm-password').type('123456');

    cy.get('#submitBtn').click();
    cy.wait('@signup409');

    cy.contains('This email is already registered.').should('be.visible');
    cy.location('pathname').should('eq', '/signup');
  });

  it('S6: backend 500 → ดึง message จาก backend', () => {
    cy.intercept('POST', '**/api/auth/signup', {
      statusCode: 500,
      body: { message: 'DB down' }
    }).as('signup500');

    cy.get('#email').type('crash@puremart.com');
    cy.get('#phone').type('0894444444');
    cy.get('#password').type('123456');
    cy.get('#confirm-password').type('123456');

    cy.get('#submitBtn').click();
    cy.wait('@signup500');

    cy.contains('DB down').should('be.visible');
  });

  it('S7: ปุ่มตา toggle password/confirm-password ทำงาน', () => {
    // password
    cy.get('#password').should('have.attr', 'type', 'password');
    cy.get('#password').parent().find('.toggle-eye').click();
    cy.get('#password').should('have.attr', 'type', 'text');
    cy.get('#password').parent().find('.toggle-eye').click();
    cy.get('#password').should('have.attr', 'type', 'password');

    // confirm
    cy.get('#confirm-password').should('have.attr', 'type', 'password');
    cy.get('#confirm-password').parent().find('.toggle-eye').click();
    cy.get('#confirm-password').should('have.attr', 'type', 'text');
    cy.get('#confirm-password').parent().find('.toggle-eye').click();
    cy.get('#confirm-password').should('have.attr', 'type', 'password');
  });

  it('S8: ไม่กรอกอะไรเลย → Browser validation ป้องกัน → ไม่มี API call', () => {
    cy.intercept('POST', '**/api/auth/signup').as('blocked');

    cy.get('#submitBtn').click();

    cy.wait(300);

    cy.get('@blocked.all').should('have.length', 0);
  });

});
