// /// <reference types="cypress" />
//
// /**
//  * E2E: Cart page (อัปเดตให้ตรงกับ CartPage.jsx)
//  * ครอบคลุม:
//  *  - breadcrumb, title, ปุ่ม Continue shopping
//  *  - แสดงสินค้า 5 รายการ
//  *  - เพิ่ม/ลดจำนวน (min = 1) และอัปเดตยอดรวม
//  *  - ลบสินค้า และสถานะว่าง (empty state)
//  *  - ปุ่ม Proceed to Checkout ต้องเซฟลง localStorage แล้วไป /place-order
//  *
//  * NOTE:
//  *  - ROUTE: ปรับ CART_PATH ให้ตรงกับโปรเจกต์จริงนะ (เช่น '/cart')
//  *  - LS_KEY = "pm_cart" ให้ตรงกับหน้า
//  */
//
// const CART_PATH = '/cart';
// const LS_KEY = 'pm_cart';
//
// // mock ตรงกับ defaultCart ในหน้า CartPage.jsx
// const defaultCart = [
//     { id: '#00001', name: 'ข้าวขาวหอมมะลิใหม่100% 5กก.',                price: 165.00, qty: 1, img: '/products/001.jpg' },
//     { id: '#00007', name: 'ซูเปอร์เชฟ หมูเด้ง แช่แข็ง 220 กรัม แพ็ค 3',   price: 180.00, qty: 4, img: '/products/007.jpg' },
//     { id: '#00018', name: 'มะม่วงน้ำดอกไม้สุก',                             price: 120.00, qty: 2, img: '/products/018.jpg' },
//     { id: '#00011', name: 'ซีพี ชิคแชค เนื้อไก่ปรุงรสทอดกรอบแช่แข็ง 800 กรัม', price: 179.00, qty: 2, img: '/products/011.jpg' },
//     { id: '#00004', name: 'โกกิแป้งทอดกรอบ 500ก.',                           price: 45.00,  qty: 2, img: '/products/004.jpg' },
// ];
//
// // ให้เลขแบบหน้า (th-TH, THB) – ใน assertion จะเช็คแบบ contains
// const thb = (n) => n.toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
//
// // subtotal เริ่มต้น = 1,573
// const initialSubtotal = 165*1 + 180*4 + 120*2 + 179*2 + 45*2; // = 1573
//
// // ✅ รับ win (window) แยกกับ items เพื่อกัน circular JSON
// function seedCartLS(win, items = defaultCart) {
//     win.localStorage.setItem(LS_KEY, JSON.stringify(items));
// }
//
// describe('Cart — e2e (updated)', () => {
//     // ✅ แก้: ใส่ win ลงไปใน seedCartLS แทนการส่ง win เป็น items
//     beforeEach(() => {
//         cy.window().then((win) => {
//             // seed cart localStorage
//             seedCartLS(win);
//             // ensure the app sees an authenticated session (RequireAuth checks sessionStorage token)
//             win.sessionStorage.setItem('token', 'e2e-dummy-token');
//             win.sessionStorage.setItem('role', 'USER');
//             win.sessionStorage.setItem('user', JSON.stringify({ email: 'e2e@test.local' }));
//             win.sessionStorage.setItem('email', 'e2e@test.local');
//         });
//     });
//
//     it('โหลดหน้า: breadcrumb, title, ปุ่ม Continue shopping และมี 5 รายการ + ยอดรวมถูกต้อง', () => {
//         cy.visit(CART_PATH);
//
//         cy.get('.pm-breadcrumb')
//             .should('contain.text', 'Home')
//             .and('contain.text', 'Cart');
//
//         cy.contains('h1.title', 'Shopping Cart').should('be.visible');
//         cy.get('a.back-top-link[href="/home"]').should('be.visible');
//
//         // มี 5 รายการตาม mock
//         cy.get('#cartList .cart-item').should('have.length', 5);
//
//         // ตรวจชื่อสินค้าตามจริง
//         cy.get('#cartList')
//             .should('contain.text', 'ข้าวขาวหอมมะลิใหม่100% 5กก.')
//             .and('contain.text', 'ซูเปอร์เชฟ หมูเด้ง แช่แข็ง 220 กรัม แพ็ค 3')
//             .and('contain.text', 'มะม่วงน้ำดอกไม้สุก')
//             .and('contain.text', 'ซีพี ชิคแชค เนื้อไก่ปรุงรสทอดกรอบแช่แข็ง 800 กรัม')
//             .and('contain.text', 'โกกิแป้งทอดกรอบ 500ก.');
//
//         // subtotal/discount/total (discount แสดงสกุลเงินด้วย)
//         cy.get('#itemsTotal').should('contain.text', thb(initialSubtotal));
//         cy.get('#discount').should('contain.text', '฿');
//         cy.get('#grandTotal').should('contain.text', thb(initialSubtotal));
//     });
//
//     it('เพิ่มจำนวน: “โกกิแป้งทอดกรอบ 500ก.” จาก 2 → 3 แล้วยอดรวม +45 = 1,618', () => {
//         cy.visit(CART_PATH);
//
//         cy.contains('.cart-item .cart-item__name', 'โกกิแป้งทอดกรอบ 500ก.')
//             .closest('.cart-item')
//             .as('flour');
//
//         cy.get('@flour').find('.qty span').should('have.text', '2');
//
//         // เพิ่ม 1 ครั้ง → qty = 3
//         cy.get('@flour').find('button[aria-label="Increase"]').click();
//         cy.get('@flour').find('.qty span').should('have.text', '3');
//
//         const newSubtotal = initialSubtotal + 45; // 1573 + 45 = 1618
//         cy.get('#itemsTotal').should('contain.text', thb(newSubtotal));
//         cy.get('#grandTotal').should('contain.text', thb(newSubtotal));
//     });
//
//     it('ลดจำนวนต่ำสุดต้องไม่ต่ำกว่า 1: “ข้าวขาวหอมมะลิใหม่100% 5กก.” คงที่ที่ 1', () => {
//         cy.visit(CART_PATH);
//
//         cy.contains('.cart-item .cart-item__name', 'ข้าวขาวหอมมะลิใหม่100% 5กก.')
//             .closest('.cart-item')
//             .as('rice');
//
//         cy.get('@rice').find('.qty span').should('have.text', '1');
//
//         // พยายามลดหลายครั้ง → ยังต้องเท่าเดิม = 1
//         cy.get('@rice').find('button[aria-label="Decrease"]').click().click().click();
//         cy.get('@rice').find('.qty span').should('have.text', '1');
//     });
//
//     it('ลบ “มะม่วงน้ำดอกไม้สุก” (120*2) ออก → เหลือ 4 รายการ และยอดรวม 1,333', () => {
//         cy.visit(CART_PATH);
//
//         cy.contains('.cart-item .cart-item__name', 'มะม่วงน้ำดอกไม้สุก')
//             .closest('.cart-item')
//             .find('button.remove')
//             .click();
//
//         cy.get('#cartList .cart-item').should('have.length', 4);
//         cy.get('#cartList').should('not.contain.text', 'มะม่วงน้ำดอกไม้สุก');
//
//         const newSubtotal = initialSubtotal - (120*2); // 1573 - 240 = 1333
//         cy.get('#itemsTotal').should('contain.text', thb(newSubtotal));
//         cy.get('#grandTotal').should('contain.text', thb(newSubtotal));
//     });
//
//     it('ลบทุกรายการจนว่าง → แสดง empty state และปุ่ม Browse products', () => {
//         // เริ่มด้วย 1 รายการเพื่อจบไว
//         cy.window().then((win) =>
//             seedCartLS(win, [
//                 { id: '#00001', name: 'ข้าวขาวหอมมะลิใหม่100% 5กก.', price: 165.00, qty: 1, img: '/products/001.jpg' },
//             ])
//         );
//
//         cy.visit(CART_PATH);
//
//         cy.get('#cartList .cart-item').should('have.length', 1);
//         cy.get('#cartList .cart-item .remove').click();
//
//         cy.get('#emptyState')
//             .should('be.visible')
//             .and('contain.text', 'Your cart is empty.');
//
//         cy.get('#emptyState a.btn.btn-primary[href="/home"]')
//             .should('contain.text', 'Browse products');
//     });
//
//     it('Proceed to Checkout: ต้องบันทึกลง LS แล้วไป /place-order', () => {
//         cy.visit(CART_PATH);
//
//         cy.get('#goCheckout')
//             .should('have.attr', 'href', '/place-order')
//             .click();
//
//         cy.location('pathname').should('eq', '/place-order');
//
//         // ตรวจว่า LS ถูกบันทึกและโครงข้อมูลยังครบ
//         cy.window().then((win) => {
//             const saved = JSON.parse(win.localStorage.getItem(LS_KEY) || '[]');
//             expect(saved).to.have.length(5);
//             const sum = saved.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
//             expect(sum).to.eq(initialSubtotal);
//         });
//     });
//
//     it('Continue shopping ลิงก์กลับหน้า Home', () => {
//         cy.visit(CART_PATH);
//         cy.get('a.back-top-link[href="/home"]').click();
//         cy.location('pathname').should('eq', '/home');
//     });
// });
