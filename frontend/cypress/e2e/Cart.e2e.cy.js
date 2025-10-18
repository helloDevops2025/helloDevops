/// <reference types="cypress" />

/**
 * E2E: Cart page
 * ครอบคลุม
 *  - โหลดตะกร้าจาก localStorage (LS_KEY = "pm_cart")
 *  - แสดง breadcrumb, ชื่อหน้า, ปุ่ม Continue shopping
 *  - เพิ่ม/ลดจำนวน (min = 1) และคำนวณยอดรวมใหม่
 *  - ลบสินค้า และสถานะว่าง (empty state)
 *  - ปุ่ม Proceed to Checkout ต้องเซฟลง LS และไป /place-order
 *
 * ปรับ CART_PATH ให้ตรง route ของโปรเจกต์ (เช่น '/cart')
 */

const CART_PATH = '/cart';
const LS_KEY = 'pm_cart';

// ใช้ชุดข้อมูลคงที่เพื่อให้ผลเทสคาดเดาได้
const seedCart = [
  { id: 2, name: 'MK Suki Sauce', price: 119, qty: 1, img: '/assets/products/p2.png' },
  { id: 3, name: 'Coconut',       price: 25,  qty: 4, img: '/assets/products/p3.png' },
];

function setCartLS(items = seedCart) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function thb(n) {
  // ให้ใกล้เคียงฟอร์แมตในหน้า (th-TH, THB) โดยเช็คแบบ contains แทนจะนิ่งกว่า
  return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
}

describe('Cart — e2e', () => {
  beforeEach(() => {
    cy.window().then(setCartLS);
  });

  it('โหลดหน้า Cart: breadcrumb, title, ปุ่ม Continue shopping และสรุปยอด รวมถึงรายการในตะกร้า', () => {
    cy.visit(CART_PATH);

    cy.get('.pm-breadcrumb').should('contain.text', 'Home').and('contain.text', 'Cart');
    cy.contains('h1.title', 'Shopping Cart').should('be.visible');
    cy.get('a.back-top-link[href="/home"]').should('be.visible');

    // มีรายการ 2 ชิ้น
    cy.get('#cartList .cart-item').should('have.length', 2);
    cy.get('#cartList .cart-item .cart-item__name').then($els => {
      const names = [...$els].map(e => e.textContent.trim());
      expect(names).to.include.members(['MK Suki Sauce', 'Coconut']);
    });

    // ตรวจยอดรวม (subtotal = 119*1 + 25*4 = 219)
    const subtotal = 119 * 1 + 25 * 4;
    cy.get('#itemsTotal').should('contain.text', thb(subtotal));
    cy.get('#discount').should('contain.text', '฿'); // ส่วนลดยัง 0 แต่หน้าแสดงมีสกุลเงิน
    cy.get('#grandTotal').should('contain.text', thb(subtotal));
  });

  it('เพิ่มจำนวน (Increase) ของ Coconut แล้ว subtotal/total ต้องอัปเดต', () => {
    cy.visit(CART_PATH);
    // หา article ของ Coconut
    cy.contains('.cart-item .cart-item__name', 'Coconut')
      .closest('.cart-item')
      .as('coco');

    // qty เดิม = 4
    cy.get('@coco').find('.qty span').should('have.text', '4');

    // กดเพิ่ม 2 ครั้ง → qty = 6
    cy.get('@coco').find('button[aria-label="Increase"]').click().click();
    cy.get('@coco').find('.qty span').should('have.text', '6');

    // subtotal ใหม่ = 119*1 + 25*6 = 269
    const subtotal = 119 + 25 * 6;
    cy.get('#itemsTotal').should('contain.text', thb(subtotal));
    cy.get('#grandTotal').should('contain.text', thb(subtotal));
  });

  it('ลดจำนวน (Decrease) ต่ำสุดต้องไม่ต่ำกว่า 1', () => {
    cy.visit(CART_PATH);
    cy.contains('.cart-item .cart-item__name', 'MK Suki Sauce')
      .closest('.cart-item')
      .as('suki');

    // เดิม qty=1 พยายามลดหลายครั้งก็ต้องยังเป็น 1
    cy.get('@suki').find('button[aria-label="Decrease"]').click().click().click();
    cy.get('@suki').find('.qty span').should('have.text', '1');
  });

  it('ลบสินค้า 1 รายการ → รายการหายและยอดรวมใหม่ต้องถูกต้อง', () => {
    cy.visit(CART_PATH);

    // ลบ Coconut (25 * 4) ออก เหลือแค่ MK Suki Sauce (119)
    cy.contains('.cart-item .cart-item__name', 'Coconut')
      .closest('.cart-item')
      .find('button.remove')
      .click();

    cy.get('#cartList .cart-item').should('have.length', 1);
    cy.get('#cartList').should('not.contain.text', 'Coconut');

    const subtotal = 119;
    cy.get('#itemsTotal').should('contain.text', thb(subtotal));
    cy.get('#grandTotal').should('contain.text', thb(subtotal));
  });

  it('ลบทุกรายการจนว่าง → แสดง empty state และปุ่ม Browse products', () => {
    // เริ่มด้วย 1 รายการ เพื่อกดลบหมดเร็ว
    cy.window().then(() => setCartLS([{ id: 2, name: 'MK Suki Sauce', price: 119, qty: 1, img: '/assets/products/p2.png' }]));
    cy.visit(CART_PATH);

    cy.get('#cartList .cart-item').should('have.length', 1);
    cy.get('#cartList .cart-item .remove').click();

    cy.get('#emptyState').should('be.visible')
      .and('contain.text', 'Your cart is empty.');

    cy.get('#emptyState a.btn.btn-primary[href="/home"]')
      .should('contain.text', 'Browse products');
  });

  it('Proceed to Checkout: ต้องบันทึก LS แล้วไป /place-order', () => {
    cy.visit(CART_PATH);

    // ยอดก่อนกด
    const subtotal = 119 * 1 + 25 * 4;

    // ปุ่มและปลายทาง
    cy.get('#goCheckout')
      .should('have.attr', 'href', '/place-order')
      .click();

    cy.location('pathname').should('eq', '/place-order');

    // ตรวจว่า LS ถูกบันทึก (โครงเท่าเดิม)
    cy.window().then((win) => {
      const saved = JSON.parse(win.localStorage.getItem(LS_KEY) || '[]');
      expect(saved).to.have.length(2);
      const sum = saved.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
      expect(sum).to.eq(subtotal);
    });
  });

  it('Continue shopping ลิงก์กลับหน้า Home', () => {
    cy.visit(CART_PATH);
    cy.get('a.back-top-link[href="/home"]').click();
    cy.location('pathname').should('eq', '/home');
  });
});
