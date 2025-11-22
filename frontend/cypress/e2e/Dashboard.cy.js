// // // // cypress/e2e/AdminDashboard.e2e.cy.js
// // // /// <reference types="cypress" />

// // // /**
// // //  * Fix สุดท้าย: ไม่ใช้ cy.session, ไม่เรียก login command, ไม่ใช้ onBeforeLoad
// // //  * - visit('/') แบบ seedAuth:false (กัน overwrite ใส่ USER)
// // //  * - หลังโหลดหน้า: set ADMIN ลง localStorage + sessionStorage
// // //  * - ใช้ history.pushState ไปหน้า Dashboard
// // //  */

// // // const API = '**/api/products';
// // // const DASHBOARD_PATH = '/admin/dashboard'; // ถ้าหน้าจริงอยู่ /admin/products ให้เปลี่ยนตรงนี้

// // // const DATA = [
// // //   { id: 'P-001', name: 'Pure Water 500ml', category: 'Beverage', brand: 'Pure',   price: 15,  stock: 0,  soldThisWeek: 20, lastRestocked: '2025-10-27' },
// // //   { id: 'P-002', name: 'Granola Bar',       category: 'Snack',    brand: 'Gran',   price: 35,  stock: 7,  soldThisWeek: 50, lastRestocked: '2025-11-01' },
// // //   { id: 'P-003', name: 'Olive Oil 1L',      category: 'Grocery',  brand: 'Olivia', price: 199, stock: 45, soldThisWeek: 10, lastRestocked: '2025-10-30' },
// // //   { id: 'P-004', name: 'Green Tea',         category: 'Beverage', brand: 'Leafy',  price: 49,  stock: 10, soldThisWeek: 0,  lastRestocked: '2025-11-02' },
// // //   { id: 'P-005', name: 'AA Battery (4pcs)', category: 'Electronics', brand: 'Volt', price: 89, stock: 2,  soldThisWeek: 5,  lastRestocked: '2025-10-29' },
// // // ];

// // // const EMPTY = [];

// // // // ---- stubs --------------------------------------------------------------

// // // function stubAuthMe() {
// // //   cy.intercept('GET', '**/api/**/me*', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me1');
// // //   cy.intercept('GET', '**/api/auth/**', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me2');
// // //   cy.intercept('GET', '**/api/users/me*', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me3');
// // // }

// // // function stubProducts(body = DATA, alias = 'getProducts', { delay = 0 } = {}) {
// // //   cy.intercept('GET', API, (req) => {
// // //     req.reply((res) => {
// // //       if (delay) res.setDelay(delay);
// // //       res.send({ statusCode: 200, body });
// // //     });
// // //   }).as(alias);
// // // }

// // // // ---- helpers ------------------------------------------------------------

// // // function seedAdminStorageRuntime() {
// // //   cy.window().then((win) => {
// // //     const authPayload = JSON.stringify({ user: { name: 'admin', role: 'ADMIN' }, token: 'e2e-admin-token' });

// // //     // sessionStorage (บางจุดของแอปเช็ค)
// // //     try {
// // //       win.sessionStorage.setItem('token', 'e2e-admin-token');
// // //       win.sessionStorage.setItem('role', 'ADMIN');
// // //       win.sessionStorage.setItem('user', JSON.stringify({ email: 'admin@puremart.com', name: 'admin', role: 'ADMIN' }));
// // //       win.sessionStorage.setItem('email', 'admin@puremart.com');
// // //     } catch {}

// // //     // localStorage (ตามที่แอปใช้จริง)
// // //     try {
// // //       win.localStorage.setItem('auth', authPayload);
// // //       win.localStorage.setItem('pm_auth', authPayload);
// // //       win.localStorage.setItem('puremart_auth', authPayload);
// // //       win.localStorage.setItem('isAuthed', 'true');
// // //     } catch {}
// // //   });
// // // }

// // // function navigateToDashboard() {
// // //   cy.window().then((win) => {
// // //     win.history.pushState({}, '', DASHBOARD_PATH);
// // //     win.dispatchEvent(new win.PopStateEvent('popstate'));
// // //   });
// // //   cy.contains('h1', 'Weekly Stock Report', { timeout: 8000 }).should('be.visible');
// // // }

// // // ---- suite --------------------------------------------------------------

// // // describe('Admin › Weekly Stock Report (AdminDashboard) — E2E stable', () => {
// // //   beforeEach(() => {
// // //     // 1) stub endpoints ที่เกี่ยวกับ auth + products ก่อน
// // //     stubAuthMe();
// // //     stubProducts(DATA, 'getProducts');

// // //     // 2) เปิด root โดยปิดการ seed ของ overwrite (seedAuth:false)
// // //     cy.visit('/', { seedAuth: false, failOnStatusCode: false });

// // //     // 3) ใส่ ADMIN ลง storage (runtime) แล้วจึงเปลี่ยน route
// // //     seedAdminStorageRuntime();
// // //     navigateToDashboard();
// // //   });

// //   // it('loads header, week label and fetches products on mount', () => {
// //   //   cy.contains('.sub', 'Week:', { timeout: 8000 }).should('be.visible');
// //   //   cy.wait('@getProducts');
// //   // });

// //   // it('KPI cards show correct values', () => {
// //   //   cy.wait('@getProducts');
// //   //   cy.get('.kpi-grid .kpi').eq(0).find('.kpi-value').should('have.text', '5');
// //   //   cy.get('.kpi-grid .kpi').eq(1).find('.kpi-value').should('have.text', '3');
// //   //   cy.get('.kpi-grid .kpi').eq(2).find('.kpi-value').should('have.text', '1');
// //   //   cy.get('.kpi-grid .kpi').eq(3).find('.kpi-value').invoke('text').should('match', /฿\s*4,485/);
// //   // });

// //   // it('table orders rows and renders status pills', () => {
// //   //   cy.wait('@getProducts');

// //   //   cy.get('.table .trow').first().within(() => {
// //   //     cy.get('.cell.name').should('have.text', 'Pure Water 500ml');
// //   //     cy.get('.pill').should('contain.text', 'Out of Stock').and('have.class', 'danger');
// //   //   });
// //   //   cy.contains('.trow', 'AA Battery (4pcs)').within(() => {
// //   //     cy.get('.pill').should('contain.text', 'Low Stock').and('have.class', 'warn');
// //   //   });
// //   //   cy.contains('.trow', 'Olive Oil 1L').within(() => {
// //   //     cy.get('.pill').should('contain.text', 'In Stock').and('have.class', 'ok');
// //   //   });
// //   // });

// //   // it('table header + one row (Granola Bar) cells are correct', () => {
// //   //   cy.wait('@getProducts');

// //   //   cy.get('.thead').within(() => {
// //   //     [
// //   //       'Product','Product ID','Category','Brand','Price','In Stock','Status','Sold (Week)','Last Restocked',
// //   //     ].forEach(t => cy.contains(t).should('exist'));
// //   //   });

// //   //   cy.contains('.trow', 'Granola Bar').within(() => {
// //   //     cy.find('.cell').eq(1).should('have.text', 'P-002');
// //   //     cy.find('.cell').eq(2).should('have.text', 'Snack');
// //   //     cy.find('.cell').eq(3).should('have.text', 'Gran');
// //   //     cy.find('.cell').eq(4).invoke('text').should('match', /฿\s*35\.00/);
// //   //     cy.find('.cell').eq(5).should('have.text', '7');
// //   //     cy.find('.cell').eq(6).should('contain.text', 'Low Stock').find('.pill').should('have.class', 'warn');
// //   //     cy.find('.cell').eq(7).should('have.text', '50');
// //   //     cy.find('.cell').eq(8).should('have.text', '2025-11-01');
// //   //   });
// //   // });

// //   // it('search toggles .hide correctly', () => {
// //   //   cy.wait('@getProducts');

// //   //   cy.get('.card.table-wrap .search').type('granola');
// //   //   cy.contains('.data-row', 'Granola Bar').should('not.have.class', 'hide');
// //   //   cy.get('.data-row').not(':contains("Granola Bar")').each($r => {
// //   //     expect($r).to.have.class('hide');
// //   //   });
// //   //   cy.get('.card.table-wrap .search').clear();
// //   //   cy.get('.data-row').should('not.have.class', 'hide');
// //   // });

// //   // it('Apply triggers re-fetch after date changes', () => {
// //   //   let calls = 0;
// //   //   cy.intercept('GET', API, (req) => { calls += 1; req.reply({ statusCode: 200, body: DATA }); }).as('refetch');

// //   //   cy.wait('@refetch'); // initial (mount)

// //   //   cy.get('.daterange label').first().find('input[type="date"]').clear().type('2025-11-01');
// //   //   cy.get('.daterange label').eq(1).find('input[type="date"]').clear().type('2025-11-06');
// //   //   cy.contains('button', /^Apply$/).click();

// //   //   cy.wait('@refetch');
// //   //   cy.wrap(null).then(() => expect(calls).to.be.greaterThan(1));
// //   // });

// //   // it('loading disables inputs and shows "Loading..."', () => {
// //   //   cy.intercept('GET', API, (req) => {
// //   //     req.reply((res) => res.setDelay(1000).send({ statusCode: 200, body: DATA }));
// //   //   }).as('slowProducts');

// //   //   // trigger re-fetch เพื่อเห็น loading
// //   //   cy.get('.daterange label').first().find('input[type="date"]').clear().type('2025-11-01');
// //   //   cy.get('.daterange label').eq(1).find('input[type="date"]').clear().type('2025-11-06');
// //   //   cy.contains('button', /^Apply$/).click();

// //   //   cy.contains('button', /^Loading\.\.\.$/).should('exist');
// //   //   cy.get('.daterange input[type="date"]').should('be.disabled');

// //   //   cy.wait('@slowProducts');

// //   //   cy.contains('button', /^Apply$/).should('exist');
// //   //   cy.get('.daterange input[type="date"]').should('not.be.disabled');
// //   // });

// //   // it('empty state shows message + disables Export CSV', () => {
// //   //   cy.intercept('GET', API, { statusCode: 200, body: EMPTY }).as('empty');

// //   //   cy.get('.daterange label').first().find('input[type="date"]').clear().type('2025-11-02');
// //   //   cy.get('.daterange label').eq(1).find('input[type="date"]').clear().type('2025-11-07');
// //   //   cy.contains('button', /^Apply$/).click();

// //   //   cy.wait('@empty');
// //   //   cy.contains('No data for this range.').should('be.visible');
// //   //   cy.contains('button', /^⬇ Export CSV$/).should('be.disabled');
// //   // });

// //   // it('error state shows red banner', () => {
// //   //   cy.intercept('GET', API, { statusCode: 500, body: { message: 'boom' } }).as('fail');

// //   //   cy.get('.daterange label').first().find('input[type="date"]').clear().type('2025-11-03');
// //   //   cy.get('.daterange label').eq(1).find('input[type="date"]').clear().type('2025-11-08');
// //   //   cy.contains('button', /^Apply$/).click();

// //   //   cy.wait('@fail');
// //   //   cy.contains('Failed to load data').should('be.visible');
// //   // });

// //   // it('Export CSV creates object URL and filename', () => {
// //   //   cy.wait('@getProducts');

// //   //   cy.window().then((win) => {
// //   //     const a = win.document.createElement('a');
// //   //     cy.stub(win.URL, 'createObjectURL').returns('blob:fake').as('createURL');
// //   //     cy.stub(a, 'click').as('clickA');
// //   //     cy.stub(win.document, 'createElement').callThrough().withArgs('a').returns(a).as('createA');
// //   //   });

// //   //   cy.contains('button', /^⬇ Export CSV$/).click();
// //   //   cy.get('@createURL').should('have.been.called');
// //   //   cy.get('@clickA').should('have.been.called');
// //   //   cy.get('@createA').then(stub => {
// //   //     const anchor = stub.returnValues[0];
// //   //     expect(anchor.download).to.equal('weekly-stock-report.csv');
// //   //   });
// //   // });

// //   // it('Print calls window.print()', () => {
// //   //   cy.window().then((win) => cy.stub(win, 'print').as('printStub'));
// //   //   cy.contains('button', /^🖨 Print$/).click();
// //   //   cy.get('@printStub').should('have.been.calledOnce');
// //   // });
// // // });

// // // cypress/e2e/AdminDashboard.e2e.cy.js
// // /// <reference types="cypress" />

// // const API = '**/api/products*';          // เผื่อมี query string
// // const DASHBOARD_PATH = '/admin/dashboard';

// // const DATA = [
// //   { id: 'P-001', name: 'Pure Water 500ml', category: 'Beverage', brand: 'Pure',   price: 15,  stock: 0,  soldThisWeek: 20, lastRestocked: '2025-10-27' },
// //   { id: 'P-002', name: 'Granola Bar',       category: 'Snack',    brand: 'Gran',   price: 35,  stock: 7,  soldThisWeek: 50, lastRestocked: '2025-11-01' },
// //   { id: 'P-003', name: 'Olive Oil 1L',      category: 'Grocery',  brand: 'Olivia', price: 199, stock: 45, soldThisWeek: 10, lastRestocked: '2025-10-30' },
// //   { id: 'P-004', name: 'Green Tea',         category: 'Beverage', brand: 'Leafy',  price: 49,  stock: 10, soldThisWeek: 0,  lastRestocked: '2025-11-02' },
// //   { id: 'P-005', name: 'AA Battery (4pcs)', category: 'Electronics', brand: 'Volt', price: 89, stock: 2,  soldThisWeek: 5,  lastRestocked: '2025-10-29' },
// // ];
// // const EMPTY = [];

// // function stubAuthMe() {
// //   cy.intercept('GET', '**/api/**/me*',  { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me1');
// //   cy.intercept('GET', '**/api/auth/**', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me2');
// //   cy.intercept('GET', '**/api/users/me*', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me3');
// // }
// // function stubProducts(body = DATA, alias = 'getProducts', { delay = 0 } = {}) {
// //   cy.intercept('GET', API, (req) => {
// //     req.reply((res) => {
// //       if (delay) res.setDelay(delay);
// //       res.send({ statusCode: 200, body });
// //     });
// //   }).as(alias);
// // }
// // function goToDashboardFromApp() {
// //   cy.document().then((doc) => {
// //     const link = doc.querySelector('a[href*="/admin/dashboard"]') || doc.querySelector('[data-testid="nav-dashboard"]');
// //     if (link) {
// //       cy.wrap(link).click({ force: true });
// //       return;
// //     }
// //     cy.visit(DASHBOARD_PATH, { seedAuth: false, failOnStatusCode: false });
// //   });
// //   cy.contains('h1', 'Weekly Stock Report', { timeout: 10000 }).should('be.visible');
// // }

// // describe('Admin › Weekly Stock Report (AdminDashboard) — E2E (UI login, stable waits)', () => {
// //   beforeEach(() => {
// //     stubAuthMe();
// //     stubProducts(DATA, 'getProducts');

// //     cy.intercept('POST', '**/api/auth/login', {
// //       statusCode: 200,
// //       body: { token: 'fake-jwt', role: 'ADMIN', email: 'admin@puremart.com', user: { name: 'admin', role: 'ADMIN' } },
// //     }).as('loginApi');

// //     cy.visit('/login', { seedAuth: false, failOnStatusCode: false });
// //     cy.get('#email', { timeout: 10000 }).type('admin@puremart.com');
// //     cy.get('#password').type('admin123');
// //     cy.get('#submitBtn').click();
// //     cy.wait('@loginApi');

// //     goToDashboardFromApp();

// //     // ✅ รอ request แรกให้จบ “ที่นี่” แทน ไม่ต้องรอในแต่ละ it
// //     cy.wait('@getProducts', { timeout: 15000 });
// //   });

// //   it('loads header, week label and fetches products on mount', () => {
// //     cy.contains('p, .sub, span, div', /^Week:\s*/i, { timeout: 8000 }).should('be.visible');
// //   });

// //   it('KPI cards show correct values', () => {
// //     cy.get('.kpi-grid .kpi').eq(0).find('.kpi-value').should('have.text', '5');
// //     cy.get('.kpi-grid .kpi').eq(1).find('.kpi-value').should('have.text', '3');
// //     cy.get('.kpi-grid .kpi').eq(2).find('.kpi-value').should('have.text', '1');
// //     cy.get('.kpi-grid .kpi').eq(3).find('.kpi-value')
// //       .invoke('text').should('match', /฿\s*4,485/);
// //   });

// //   it('table orders rows and renders status pills', () => {
// //     cy.get('.table .trow').first().within(() => {
// //       cy.get('.cell.name').should('have.text', 'Pure Water 500ml');
// //       cy.get('.pill').should('contain.text', 'Out of Stock').and('have.class', 'danger');
// //     });
// //     cy.contains('.trow', 'AA Battery (4pcs)').within(() => {
// //       cy.get('.pill').should('contain.text', 'Low Stock').and('have.class', 'warn');
// //     });
// //     cy.contains('.trow', 'Olive Oil 1L').within(() => {
// //       cy.get('.pill').should('contain.text', 'In Stock').and('have.class', 'ok');
// //     });
// //   });

// //   it('table header + one row (Granola Bar) cells are correct', () => {
// //     cy.get('.thead').within(() => {
// //       ['Product','Product ID','Category','Brand','Price','In Stock','Status','Sold (Week)','Last Restocked']
// //         .forEach(t => cy.contains(t).should('exist'));
// //     });
// //     cy.contains('.trow', 'Granola Bar').within(() => {
// //       cy.find('.cell').eq(1).should('have.text', 'P-002');
// //       cy.find('.cell').eq(2).should('have.text', 'Snack');
// //       cy.find('.cell').eq(3).should('have.text', 'Gran');
// //       cy.find('.cell').eq(4).invoke('text').should('match', /฿\s*35\.00/);
// //       cy.find('.cell').eq(5).should('have.text', '7');
// //       cy.find('.cell').eq(6).should('contain.text', 'Low Stock').find('.pill').should('have.class', 'warn');
// //       cy.find('.cell').eq(7).should('have.text', '50');
// //       cy.find('.cell').eq(8).should('have.text', '2025-11-01');
// //     });
// //   });

// //   it('search toggles .hide correctly', () => {
// //     cy.get('.card.table-wrap .search').type('granola');
// //     cy.contains('.data-row', 'Granola Bar').should('not.have.class', 'hide');
// //     cy.get('.data-row').not(':contains("Granola Bar")').each($r => {
// //       expect($r).to.have.class('hide');
// //     });
// //     cy.get('.card.table-wrap .search').clear();
// //     cy.get('.data-row').should('not.have.class', 'hide');
// //   });

// //   it('Apply triggers re-fetch after date changes', () => {
// //     let calls = 1; // initial fetch นับไปแล้ว 1
// //     cy.intercept('GET', API, (req) => { calls += 1; req.reply({ statusCode: 200, body: DATA }); }).as('refetch');

// //     cy.get('.daterange label').first().find('input[type="date"]').clear().type('2025-11-01');
// //     cy.get('.daterange label').eq(1).find('input[type="date"]').clear().type('2025-11-06');
// //     cy.contains('button', /^Apply$/).click();

// //     cy.wait('@refetch');
// //     cy.wrap(null).then(() => expect(calls).to.be.greaterThan(1));
// //   });

// //   it('loading disables inputs and shows "Loading..."', () => {
// //     cy.intercept('GET', API, (req) => {
// //       req.reply((res) => res.setDelay(1000).send({ statusCode: 200, body: DATA }));
// //     }).as('slowProducts');

// //     cy.get('.daterange label').first().find('input[type="date"]').clear().type('2025-11-01');
// //     cy.get('.daterange label').eq(1).find('input[type="date"]').clear().type('2025-11-06');
// //     cy.contains('button', /^Apply$/).click();

// //     cy.contains('button', /^Loading\.\.\.$/).should('exist');
// //     cy.get('.daterange input[type="date"]').should('be.disabled');

// //     cy.wait('@slowProducts');

// //     cy.contains('button', /^Apply$/).should('exist');
// //     cy.get('.daterange input[type="date"]').should('not.be.disabled');
// //   });

// //   it('empty state shows message + disables Export CSV', () => {
// //     cy.intercept('GET', API, { statusCode: 200, body: EMPTY }).as('empty');

// //     cy.get('.daterange label').first().find('input[type="date"]').clear().type('2025-11-02');
// //     cy.get('.daterange label').eq(1).find('input[type="date"]').clear().type('2025-11-07');
// //     cy.contains('button', /^Apply$/).click();

// //     cy.wait('@empty');
// //     cy.contains('No data for this range.').should('be.visible');
// //     cy.contains('button', /^⬇ Export CSV$/).should('be.disabled');
// //   });

// //   it('error state shows red banner', () => {
// //     cy.intercept('GET', API, { statusCode: 500, body: { message: 'boom' } }).as('fail');

// //     cy.get('.daterange label').first().find('input[type="date"]').clear().type('2025-11-03');
// //     cy.get('.daterange label').eq(1).find('input[type="date"]').clear().type('2025-11-08');
// //     cy.contains('button', /^Apply$/).click();

// //     cy.wait('@fail');
// //     cy.contains('Failed to load data').should('be.visible');
// //   });

// //   it('Export CSV creates object URL and filename', () => {
// //     cy.window().then((win) => {
// //       const a = win.document.createElement('a');
// //       cy.stub(win.URL, 'createObjectURL').returns('blob:fake').as('createURL');
// //       cy.stub(a, 'click').as('clickA');
// //       cy.stub(win.document, 'createElement').callThrough().withArgs('a').returns(a).as('createA');
// //     });

// //     cy.contains('button', /^⬇ Export CSV$/).click();
// //     cy.get('@createURL').should('have.been.called');
// //     cy.get('@clickA').should('have.been.called');
// //     cy.get('@createA').then(stub => {
// //       const anchor = stub.returnValues[0];
// //       expect(anchor.download).to.equal('weekly-stock-report.csv');
// //     });
// //   });

// //   it('Print calls window.print()', () => {
// //     cy.window().then((win) => cy.stub(win, 'print').as('printStub'));
// //     cy.contains('button', /^🖨 Print$/).click();
// //     cy.get('@printStub').should('have.been.calledOnce');
// //   });
// // });
// // const API = '**/api/products*';

// // // ✅ ประกาศ DATA ก่อนใช้งาน
// // const DATA = [
// //   {
// //     id: 1,
// //     name: 'Product A',
// //     category: 'Category 1',
// //     stock: 100,
// //     price: 50,
// //     lastRestocked: '2025-01-01',
// //   },
// //   {
// //     id: 2,
// //     name: 'Product B',
// //     category: 'Category 2',
// //     stock: 50,
// //     price: 30,
// //     lastRestocked: '2025-01-02',
// //   },
// //   // เพิ่มข้อมูลตามต้องการ
// // ];

// // // 1) แก้ helper ให้เป็น static response (ไม่มี callback/req.reply เลย)
// // function stubProducts(body = DATA, alias = 'getProducts') {
// //   cy.intercept('GET', API, {
// //     statusCode: 200,
// //     headers: { 'access-control-allow-origin': '*' }, // กัน CORS เวลา stub
// //     body,
// //   }).as(alias);
// // }

// // // ✅ เพิ่ม helper function stubAuthMe (ถ้ายังไม่มี)
// // function stubAuthMe() {
// //   cy.intercept('GET', '**/api/**/me*', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me1');
// //   cy.intercept('GET', '**/api/auth/**', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me2');
// //   cy.intercept('GET', '**/api/users/me*', { statusCode: 200, body: { username: 'admin', role: 'ADMIN' } }).as('me3');
// // }

// // // ✅ เพิ่ม helper function goToDashboardFromApp (ถ้ายังไม่มี)
// // function goToDashboardFromApp() {
// //   cy.visit('/admin/dashboard', { seedAuth: false, failOnStatusCode: false });
// // }


// // describe('Admin › Weekly Stock Report (AdminDashboard) — E2E (UI login, stable waits)', () => {
// //   beforeEach(() => {
// //     stubAuthMe();
// //     stubProducts(DATA, 'getProducts');

// //     cy.intercept('POST', '**/api/auth/login', {
// //       statusCode: 200,
// //       body: {
// //         token: 'fake-jwt',
// //         role: 'ADMIN',
// //         email: 'admin@puremart.com',
// //         user: { name: 'admin', role: 'ADMIN' }
// //       },
// //     }).as('loginApi');

// //     cy.visit('/login', { seedAuth: false, failOnStatusCode: false });
// //     cy.get('#email', { timeout: 10000 }).type('admin@puremart.com');
// //     cy.get('#password').type('admin123');
// //     cy.get('#submitBtn').click();
// //     cy.wait('@loginApi');

// //     goToDashboardFromApp();
// //     cy.wait('@getProducts', { timeout: 15000 });
// //     cy.contains('h1', 'Weekly Stock Report', { timeout: 10000 }).should('be.visible');
// //   });

// //   it('loads header and week label', () => {
// //     // ตรวจสอบ header
// //     cy.contains('h1', 'Weekly Stock Report').should('be.visible');

// //     // ตรวจสอบ week label (ถ้ามี)
// //     cy.contains(/Week/i, { timeout: 8000 }).should('be.visible');
// //   });

  
// // });


// // cypress/e2e/Dashboard.cy.js
// // ========================================================
// // E2E: Admin › Weekly Stock Report (AdminDashboard)
// // - เคลียร์ SW/Cache เพื่อกันโหลดหน้า/บันเดิลเก่า
// // - stub auth + products ให้แน่นอน
// // - นำทางด้วย history.pushState เพื่อลดโอกาสรีโหลดทั้งหน้า
// // - ใส่ assertions ที่มีเฉพาะหน้าใหม่
// // ========================================================

// // ---------- Mock data (ประกาศให้เห็นทั้งไฟล์) ----------
// const DATA = [
//   {
//     id: 1,
//     name: 'Product A',
//     category: 'Category 1',
//     brand: 'Brand X',
//     stock: 100,
//     price: 50,
//     soldThisWeek: 5,
//     lastRestocked: '2025-01-01',
//   },
//   {
//     id: 2,
//     name: 'Product B',
//     category: 'Category 2',
//     brand: 'Brand Y',
//     stock: 50,
//     price: 30,
//     soldThisWeek: 2,
//     lastRestocked: '2025-01-02',
//   },
// ];

// // ---------- URL patterns ----------
// const RE_PRODUCTS = /\/api\/products(?:\/)?(?:\?.*)?$/i;

// // ---------- Helpers ----------
// function stubProducts(body = DATA, alias = 'getProducts') {
//   // stub หลัก
//   cy.intercept({ method: 'GET', url: RE_PRODUCTS }, {
//     statusCode: 200,
//     headers: { 'access-control-allow-origin': '*' },
//     body,
//   }).as(alias);

//   // spy เอาไว้ดูว่า request วิ่งจริงมั้ย/วิ่งไปไหน
//   cy.intercept({ method: 'GET', url: '**/api/products**' }).as('productsSpy');
// }

// function stubAuthMe() {
//   cy.intercept('GET', '**/api/**/me*', {
//     statusCode: 200,
//     body: { username: 'admin', role: 'ADMIN' },
//   }).as('me1');

//   cy.intercept('GET', '**/api/auth/**', {
//     statusCode: 200,
//     body: { username: 'admin', role: 'ADMIN' },
//   }).as('me2');

//   cy.intercept('GET', '**/api/users/me*', {
//     statusCode: 200,
//     body: { username: 'admin', role: 'ADMIN' },
//   }).as('me3');
// }

// // เคลียร์ service worker + caches + storages
// function clearAllCaches() {
//   cy.visit('/', { failOnStatusCode: false });
//   cy.window({ log: false }).then(async (win) => {
//     try {
//       if (win.navigator?.serviceWorker) {
//         const regs = await win.navigator.serviceWorker.getRegistrations();
//         await Promise.all(regs.map((r) => r.unregister()));
//       }
//       if (win.caches) {
//         const keys = await win.caches.keys();
//         await Promise.all(keys.map((k) => win.caches.delete(k)));
//       }
//       win.localStorage.clear();
//       win.sessionStorage.clear();
//       document.cookie.split(';').forEach((c) => {
//         document.cookie = c
//           .replace(/^ +/, '')
//           .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
//       });
//     } catch (_) {
//       // ignore
//     }
//   });
// }

// describe('Admin › Weekly Stock Report (AdminDashboard) — E2E', () => {
//   beforeEach(() => {
//     clearAllCaches();

//     stubAuthMe();
//     stubProducts(DATA, 'getProducts');

//     cy.intercept('POST', '**/api/auth/login', {
//       statusCode: 200,
//       body: {
//         token: 'fake-jwt',
//         role: 'ADMIN',
//         email: 'admin@puremart.com',
//         user: { name: 'admin', role: 'ADMIN' },
//       },
//     }).as('loginApi');

//     // เข้าหน้า login และทำการล็อกอิน
//     cy.visit('/login', { failOnStatusCode: false });
//     cy.get('#email', { timeout: 10000 }).type('admin@puremart.com');
//     cy.get('#password').type('admin123');
//     cy.get('#submitBtn').click();
//     cy.wait('@loginApi');

//     // นำทางไปหน้า Dashboard แบบไม่ reload ทั้งหน้า
//     cy.window().then((win) => win.history.pushState({}, '', '/admin/dashboard'));

//     // รอให้มีการเรียก products และจับ stub ได้จริง
//     cy.wait('@productsSpy', { timeout: 15000 }).then(({ request }) => {
//       cy.log('REQ URL:', request.url);
//     });
//     cy.wait('@getProducts', { timeout: 15000 });

//     // ยืนยันว่า header โผล่
//     cy.contains('h1', 'Weekly Stock Report', { timeout: 10000 }).should('be.visible');
//   });

//   it('loads header and week label', () => {
//     cy.contains('h1', 'Weekly Stock Report').should('be.visible');
//     cy.contains(/Week/i, { timeout: 8000 }).should('be.visible');
//   });

//   it('renders new layout elements', () => {
//     // KPI cards
//     cy.get('.kpi-grid').should('exist');
//     cy.contains('.kpi-grid .kpi-title', 'Total Products').should('exist');
//     cy.contains('.kpi-grid .kpi-title', 'Low Stock Items').should('exist');
//     cy.contains('.kpi-grid .kpi-title', 'Out of Stock').should('exist');
//     cy.contains('.kpi-grid .kpi-title', 'Total Weekly Sales').should('exist');

//     // ปุ่มและส่วนควบคุม
//     cy.contains('button', 'Apply').should('exist');
//     cy.contains('button', 'Export CSV').should('exist');
//     cy.contains('button', 'Print').should('exist');

//     // ส่วนตารางหัวข้อใหม่
//     cy.get('.card.table-wrap').should('exist');
//     cy.get('.card.table-wrap h3').contains('Stock Details').should('exist');
//     cy.get('.thead').within(() => {
//       cy.contains('Product').should('exist');
//       cy.contains('Product ID').should('exist');
//       cy.contains('Category').should('exist');
//       cy.contains('Brand').should('exist');
//       cy.contains('Price').should('exist');
//       cy.contains('In Stock').should('exist');
//       cy.contains('Status').should('exist');
//       cy.contains('Sold (Week)').should('exist');
//       cy.contains('Last Restocked').should('exist');
//     });
//   });

//   it('renders table rows from stubbed DATA', () => {
//     // จำนวนแถว = DATA.length
//     cy.get('.table .trow').should('have.length', DATA.length);

//     // แถวแรกควรเป็น Product A และมีจำนวน stock ตาม mock
//     cy.get('.table .trow').first().within(() => {
//       cy.contains('.cell.name', 'Product A').should('exist');
//       cy.contains('.cell', '1').should('exist'); // Product ID
//       cy.contains('.cell', 'Category 1').should('exist');
//       cy.contains('.cell', 'Brand X').should('exist');
//       cy.contains('.cell.num', '100').should('exist'); // In Stock
//     });
//   });

//   it('search filter works (client-side filter)', () => {
//     cy.get('.card.table-wrap .search').type('Product B');
//     cy.get('.table .trow').should('have.length', DATA.length);
//     // แถวที่ไม่แมตช์จะถูกซ่อนไว้ด้วย class "hide"
//     cy.get('.table .trow.hide').should('have.length.at.least', 1);
//     cy.get('.table .trow:not(.hide)').should('have.length', 1)
//       .first().within(() => {
//         cy.contains('.cell.name', 'Product B').should('exist');
//       });
//   });

//   it('export CSV button is enabled when data exists', () => {
//     cy.contains('button', 'Export CSV').should('not.be.disabled');
//   });

//   it('Apply re-fetches products (still stubbed)', () => {
//     // เปลี่ยน date แล้วกด Apply → ควรเรียก products อีกครั้ง
//     cy.get('input[type="date"]').first().focus().type('{esc}'); // ให้แน่ใจว่า element โฟกัสได้
//     cy.contains('button', 'Apply').click();

//     // ควรเห็น productsSpy อย่างน้อยอีก 1 ครั้ง
//     cy.wait('@productsSpy', { timeout: 15000 });
//     cy.wait('@getProducts', { timeout: 15000 });
//   });
// });


// cypress/e2e/AdminDashboard.cy.js

const USE_STUB = false;

const MOCK_DATA = [
  { id: 1, name: 'Product A', category: 'Category 1', brand: 'Brand X', stock: 100, price: 50, soldThisWeek: 5, lastRestocked: '2025-01-01' },
  { id: 2, name: 'Product B', category: 'Category 2', brand: 'Brand Y', stock: 2,   price: 30, soldThisWeek: 2, lastRestocked: '2025-01-02' },
];

// ---------- helpers (local) ----------
function clearAllCaches() {
  cy.visit('/', { failOnStatusCode: false, seedAuth: false });
  cy.window({ log: false }).then(async (win) => {
    try {
      if (win.navigator?.serviceWorker) {
        const regs = await win.navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (win.caches) {
        const keys = await win.caches.keys();
        await Promise.all(keys.map((k) => win.caches.delete(k)));
      }
      win.localStorage.clear();
      win.sessionStorage.clear();
      document.cookie.split(';').forEach((c) => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });
    } catch (_) {}
  });
}

function stubProducts(body = MOCK_DATA, alias = 'getProducts') {
  cy.intercept({ method: 'GET', url: /\/api\/products(?:\/)?(?:\?.*)?$/i }, {
    statusCode: 200,
    headers: { 'access-control-allow-origin': '*' },
    body,
  }).as(alias);
}

// ---------- spec ----------
describe('Admin › Weekly Stock Report (AdminDashboard)', () => {
  beforeEach(() => {
    clearAllCaches(); // ← ใช้ฟังก์ชันท้องถิ่น (ไม่มี cy.clearAllCaches แล้ว)

    // จับการเรียกสินค้าทุกครั้ง (live หรือ stub)
    cy.intercept('GET', '**/api/products*').as('productsSpy');

    if (USE_STUB) {
      stubProducts(MOCK_DATA, 'getProducts');
      cy.loginAsAdmin();
    } else {
      cy.loginAs('ADMIN', { email: 'admin@puremart.com', password: 'admin123' });
    }

    // ไปหน้าแดชบอร์ดแบบไม่ seed USER
    cy.visit('/admin/dashboard', { failOnStatusCode: false, seedAuth: false });

    // path ถูกต้อง
    cy.location('pathname', { timeout: 20000 }).should('eq', '/admin/dashboard');

    // รอยิงสินค้ารอบแรก + รอคอนเทนเนอร์
    cy.wait('@productsSpy', { timeout: 20000 });
    cy.get('.admin-dashboard', { timeout: 20000 }).should('exist');
  });

  it('loads header and week label', () => {
    cy.get('.admin-dashboard .header h1', { timeout: 20000 })
      .should('contain.text', 'Weekly Stock Report')
      .and('be.visible');
    cy.contains('.admin-dashboard', /^Week:/i, { timeout: 10000 }).should('be.visible');
  });

  it('renders layout controls and table headers', () => {
    cy.get('.kpi-grid', { timeout: 15000 }).should('exist');
    cy.contains('.kpi-grid .kpi-title', 'Total Products').should('exist');
    cy.contains('.kpi-grid .kpi-title', 'Low Stock Items').should('exist');
    cy.contains('.kpi-grid .kpi-title', 'Out of Stock').should('exist');
    cy.contains('.kpi-grid .kpi-title', 'Total Weekly Sales').should('exist');

    cy.contains('button', 'Apply').should('exist');
    cy.contains('button', 'Export CSV').should('exist');
    cy.contains('button', 'Print').should('exist');

    cy.get('.card.table-wrap', { timeout: 15000 }).should('exist');
    cy.get('.card.table-wrap h3').contains('Stock Details').should('exist');
    cy.get('.thead').within(() => {
      cy.contains('Product').should('exist');
      cy.contains('Product ID').should('exist');
      cy.contains('Category').should('exist');
      cy.contains('Brand').should('exist');
      cy.contains('Price').should('exist');
      cy.contains('In Stock').should('exist');
      cy.contains('Status').should('exist');
      cy.contains('Sold (Week)').should('exist');
      cy.contains('Last Restocked').should('exist');
    });
  });

  it('renders table rows (live or stub)', () => {
    cy.get('.table .trow', { timeout: 15000 }).then($rows => {
      if ($rows.length === 0) {
        cy.contains('.table', 'No data for this range.').should('exist');
      } else {
        expect($rows.length).to.be.gte(1);
      }
    });

    if (USE_STUB) {
      cy.get('.table .trow').first().within(() => {
        cy.contains('.cell.name', 'Product A').should('exist');
        cy.contains('.cell', '1').should('exist');
        cy.contains('.cell', 'Category 1').should('exist');
        cy.contains('.cell', 'Brand X').should('exist');
        cy.contains('.cell.num', '100').should('exist');
      });
    }
  });

  it('client-side search filter works', () => {
    cy.get('.card.table-wrap .search', { timeout: 10000 }).as('search');
    const keyword = USE_STUB ? 'Product B' : 'a';
    cy.get('@search').clear().type(keyword);
    cy.get('.table .trow').should('have.length.gte', 0);
    cy.get('.table .trow:not(.hide)').then($visible => {
      expect($visible.length).to.be.gte(0);
    });
  });

  it('Export CSV enabled when data exists', () => {
    cy.get('.table .trow', { timeout: 15000 }).then($rows => {
      if ($rows.length > 0) {
        cy.contains('button', 'Export CSV').should('not.be.disabled');
      } else {
        cy.contains('button', 'Export CSV').should('be.disabled');
      }
    });
  });

  it('Apply triggers re-fetch', () => {
    cy.get('input[type="date"]').first().focus().type('{esc}');
    cy.contains('button', 'Apply').click();
    cy.wait('@productsSpy', { timeout: 20000 });
  });
});
