describe('Login only admin can access admin area', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('ADMIN: login แล้วต้องพาไป /admin/products', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake', role: 'ADMIN', email: 'admin@puremart.com', user: { role: 'ADMIN' } }
    }).as('loginApi');

    cy.get('#email').type('admin');     // โค้ดจะเติม @gmail.com ให้เองก็ได้
    cy.get('#password').type('123456');
    cy.get('#submitBtn').click();
    cy.wait('@loginApi');

    cy.location('pathname').should('eq', '/admin/products');
  });

  it('USER: login แล้วต้องไม่พาไปหน้าแอดมิน (ไป /home)', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake', role: 'USER', email: 'user@puremart.com', user: { role: 'USER' } }
    }).as('loginApi');

    cy.get('#email').type('user');
    cy.get('#password').type('123456');
    cy.get('#submitBtn').click();
    cy.wait('@loginApi');

    cy.location('pathname').should('eq', '/home');

    // กันการเข้าหน้าแอดมินโดยตรง (ถ้ามี route guard)
    cy.visit('/admin/products');
    cy.location('pathname').should('not.eq', '/admin/products');
  });

  it('ฟอร์มว่าง: แสดงข้อความแจ้งเตือน (กรุณากรอกอีเมล)', () => {
    cy.get('#submitBtn').click();
    cy.contains('กรุณากรอกอีเมล').should('be.visible');
  });

  it('เมื่อ backend ตอบ 401 ต้องเห็น “ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง”', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { message: 'Bad credentials' }
    }).as('login401');

    cy.get('#email').type('admin');
    cy.get('#password').type('wrong');
    cy.get('#submitBtn').click();
    cy.wait('@login401');

    cy.contains('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });
});
