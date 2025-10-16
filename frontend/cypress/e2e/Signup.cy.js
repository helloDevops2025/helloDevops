// cypress/e2e/signup.cy.js
describe('Sign Up Page', () => {
  beforeEach(() => {
    cy.visit('/signup');
  });

  it('สมัครสำเร็จ → แสดง alert แล้ว redirect ไป /login', () => {
    // ดัก alert ของหน้าต่าง
    cy.window().then((win) => cy.stub(win, 'alert').as('alert'));

    // ตอบกลับสำเร็จจาก backend
    cy.intercept('POST', '**/api/auth/signup', {
      statusCode: 201,
      body: { id: 1 }
    }).as('signupApi');

    cy.get('#email').type('newuser@puremart.com');
    cy.get('#phone').type('0891234567');         // อย่างน้อย 9 หลัก
    cy.get('#password').type('123456');          // >= 6
    cy.get('#confirm-password').type('123456');
    cy.get('#submitBtn').click();

    cy.wait('@signupApi');
    cy.get('@alert').should('have.been.calledWith', 'Sign up successful! Please log in.');
    cy.location('pathname').should('eq', '/login');
  });

  it('รหัสผ่านไม่ตรงกัน → แสดง error', () => {
    cy.get('#email').type('mismatch@puremart.com');
    cy.get('#phone').type('0811111111');
    cy.get('#password').type('abcdef');
    cy.get('#confirm-password').type('abcdeg');  // ไม่ตรงกัน
    cy.get('#submitBtn').click();

    cy.contains('Passwords do not match.').should('be.visible');
    // ต้องยังอยู่หน้า signup
    cy.location('pathname').should('eq', '/signup');
  });

  it('รหัสผ่านสั้นเกินไป (<6) → แสดง error', () => {
    cy.get('#email').type('short@puremart.com');
    cy.get('#phone').type('0892222222');
    cy.get('#password').type('12345');           // สั้น
    cy.get('#confirm-password').type('12345');
    cy.get('#submitBtn').click();

    cy.contains('Password must be at least 6 characters.').should('be.visible');
  });

  it('เบอร์โทรไม่ถูกต้อง (<9 ตัว) → แสดง error', () => {
    cy.get('#email').type('phonebad@puremart.com');
    cy.get('#phone').type('08123');              // สั้นไป
    cy.get('#password').type('123456');
    cy.get('#confirm-password').type('123456');
    cy.get('#submitBtn').click();

    cy.contains('Please enter a valid phone number.').should('be.visible');
  });

  it('อีเมลซ้ำ (409) → แสดงข้อความ This email is already registered.', () => {
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

  it('backend ล่ม (500) → ดึง message จาก backend มาแสดง', () => {
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

  it('ปุ่มตา: toggle password/confirm-password เปลี่ยน type ได้จริง', () => {
    // password field
    cy.get('#password').should('have.attr', 'type', 'password');
    cy.get('#password').parent().find('.toggle-eye').click();
    cy.get('#password').should('have.attr', 'type', 'text');
    cy.get('#password').parent().find('.toggle-eye').click();
    cy.get('#password').should('have.attr', 'type', 'password');

    // confirm-password field
    cy.get('#confirm-password').should('have.attr', 'type', 'password');
    cy.get('#confirm-password').parent().find('.toggle-eye').click();
    cy.get('#confirm-password').should('have.attr', 'type', 'text');
    cy.get('#confirm-password').parent().find('.toggle-eye').click();
    cy.get('#confirm-password').should('have.attr', 'type', 'password');
  });

  it('HTML5 validation: ถ้าปล่อยว่าง ไม่ควรยิง API', () => {
    // ตั้ง intercept ไว้ก่อน แล้ว assert ว่าไม่ถูกเรียก
    cy.intercept('POST', '**/api/auth/signup').as('signupBlocked');

    // ปล่อยว่างทั้งหมดแล้วกด
    cy.get('#submitBtn').click();

    // รอแป๊บเพื่อยืนยันว่าไม่มี request ออก
    cy.wait(500);
    cy.get('@signupBlocked.all').should('have.length', 0);
  });
});
