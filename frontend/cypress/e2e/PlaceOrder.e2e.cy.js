/// <reference types="cypress" />

/**
 * E2E: Place Order Page
 * ครอบคลุม:
 *  - breadcrumb, title
 *  - แสดง Order Summary ตรงตามตะกร้า mock ภายในหน้า
 *  - ฟอร์มที่อยู่: validate ค่าว่าง, validate เบอร์มือถือไทย, auto-format 66xxxxxxxxx -> 0xx-xxx-xxxx
 *  - เพิ่มที่อยู่ใหม่, ตั้งค่า default, แก้ไข/ลบ และการเลื่อน default อัตโนมัติเมื่อมีการลบ
 *  - ปุ่ม "ยืนยันคำสั่งซื้อ" (การ์ด + sticky bar) ต้อง disabled จนกว่าจะมีที่อยู่ default และเมื่อกดยืนยันให้ไป /tracking/:id
 *
 * NOTE: selector/text อ้างจาก PlaceOrderPage.jsx โดยตรง
 */

const PLACE_PATH = '/place-order';
const CURRENCY_SIGN = '฿'; // ตรวจแบบ contains เลี่ยง locale แตกต่าง

// ตัวช่วยอ่าน number จากข้อความเงิน (แค่ดึงตัวเลขหยาบ ๆ มาตรวจ)
function grabNumber(txt) {
  // รับทั้ง , และ .
  const m = txt.replace(/[^\d.]/g, '');
  return Number(m);
}

describe('PlaceOrder — e2e', () => {
  it('โหลดหน้า: breadcrumb + title + โครง grid', () => {
    cy.visit(PLACE_PATH);

    cy.get('.pm-breadcrumb').should('contain.text', 'Home')
      .and('contain.text', 'Cart')
      .and('contain.text', 'Checkout');

    cy.contains('h1.title', 'Checkout Page').should('be.visible');
    cy.get('.checkout-grid').should('be.visible');
    cy.get('.card.form-card').should('be.visible');      // ส่วนที่อยู่
    cy.get('aside.card.summary-card').should('be.visible'); // Order summary
  });

  it('Order Summary: แสดง 3 รายการ + ยอดรวมถูกต้อง และมีหน่วยสกุลเงิน', () => {
    cy.visit(PLACE_PATH);

    // มี 3 รายการตาม mock ในหน้า (179*1, 119*1, 25*4)
    cy.get('#order-list .order-item').should('have.length', 3);
    cy.get('#order-list').should('contain.text', 'Oishi Gyoza')
      .and('contain.text', 'MK Suki Sauce')
      .and('contain.text', 'Coconut');

    // ตรวจ Totals (subtotal = 179 + 119 + 25*4 = 398)
    cy.get('.totals .line').contains('Item(s) total')
      .siblings().last().should('contain.text', CURRENCY_SIGN);

    cy.get('.totals .line.total .price')
      .should('contain.text', CURRENCY_SIGN)
      .invoke('text')
      .then(txt => {
        const n = grabNumber(txt);
        expect(n).to.eq(398);
      });

    // จำนวนชิ้นควรเป็น 6 (1+1+4)
    cy.get('.totals .line.total')
      .should('contain.text', 'Total (6 items)');
  });

  it('เริ่มต้นยังไม่มีที่อยู่ → โหมด add form, ปุ่มยืนยันถูก disable ทั้งสองตำแหน่ง', () => {
    cy.visit(PLACE_PATH);

    cy.get('.address-form').should('be.visible'); // mode "add"
    cy.get('aside.summary-card .btn-primary').should('be.disabled');
    cy.get('.sticky-checkout-bar .btn-primary').should('be.disabled');
  });

  it('ฟอร์ม: ค่าว่าง → alert เตือน, โทรไม่ผ่าน pattern → alert เตือน, โทรแบบ 66… → auto-format เป็น 0xx-xxx-xxxx และบันทึกได้', () => {
    cy.visit(PLACE_PATH);

    // stub alert
    cy.window().then((win) => cy.stub(win, 'alert').as('alert'));

    // กด Save ตอนว่าง → เตือนกรอกฟิลด์ที่จำเป็น
    cy.get('.address-form .btn-save').click();
    cy.get('@alert').should('have.been.calledWithMatch', /Please fill in all required fields/i);

    // กรอกข้อมูล (ยกเว้นโทร)
    cy.get('#addr-name').type('Fluke Tester');
    cy.get('.address-form').within(() => {
      cy.get('input[placeholder="0xx-xxx-xxxx"]').type('0123456789'); // เบอร์ขึ้นต้น 0 แต่ไม่ใช่ 06/08/09
      cy.get('input[type="text"]').eq(1).type('99/9');        // house
      cy.get('input[type="text"]').eq(3).type('Lat Phrao');   // subdistrict
      cy.get('input[type="text"]').eq(4).type('Chatuchak');   // district
      cy.get('select').select('Bangkok');                     // province
      cy.get('input[type="text"]').eq(5).type('10900');       // zipcode
    });

    cy.get('.address-form .btn-save').click();
    cy.get('@alert').should('have.been.calledWithMatch', /valid Thai mobile/i);

    // ปรับเป็นเบอร์แบบขึ้นต้น 66 เพื่อทดสอบ auto-format
    cy.get('.address-form input[placeholder="0xx-xxx-xxxx"]')
      .clear()
      .type('66812345678')
      .should('have.value', '081-234-5678'); // ถูก format อัตโนมัติ :contentReference[oaicite:1]{index=1}

    // Save ผ่าน
    cy.get('.address-form .btn-save').click();

    // กลับสู่โหมด list และมีรายการที่อยู่
    cy.get('.saved-addresses').should('be.visible')
      .within(() => {
        cy.get('.address-option').should('have.length', 1)
          .first().should('contain.text', 'Fluke Tester')
          .and('contain.text', 'Default'); // อันแรกจะถูกเซ็ต default อัตโนมัติ :contentReference[oaicite:2]{index=2}
      });

    // ปุ่มยืนยันต้อง enabled แล้ว (มี default address)
    cy.get('aside.summary-card .btn-primary').should('not.be.disabled');
    cy.get('.sticky-checkout-bar .btn-primary').should('not.be.disabled');
  });

  it('เพิ่มที่อยู่ใหม่อีกอัน → set as default ทำงาน, ปุ่ม Edit/Delete ใช้ได้ และถ้าลบ default ต้องย้าย default ไปตัวอื่น', () => {
    cy.visit(PLACE_PATH);

    // เพิ่มที่อยู่ชุดแรกให้พร้อมใช้งาน (สั้นๆ)
    const fillAndSave = (name, phone) => {
      cy.get('.address-form #addr-name').clear().type(name);
      cy.get('.address-form input[placeholder="0xx-xxx-xxxx"]').clear().type(phone);
      cy.get('.address-form input[type="text"]').eq(1).clear().type('1/1');
      cy.get('.address-form input[type="text"]').eq(3).clear().type('Sub');
      cy.get('.address-form input[type="text"]').eq(4).clear().type('Dist');
      cy.get('.address-form select').select('Bangkok');
      cy.get('.address-form input[type="text"]').eq(5).clear().type('10110');
      cy.get('.address-form .btn-save').click();
    };

    // ที่อยู่ #1
    fillAndSave('User A', '66912345678'); // => format 091-234-5678

    // กด "+ Add new address"
    cy.contains('.saved-addresses .btn-add-inline', '+ Add new address').click();
    cy.get('.address-form').should('be.visible');

    // ที่อยู่ #2
    fillAndSave('User B', '0891234567');

    // ตอนนี้มี 2 รายการ: A(default), B(not default)
    cy.get('.address-option').should('have.length', 2);
    cy.get('.address-option').first().should('contain.text', 'User A').and('contain.text', 'Default');
    cy.get('.address-option').last().should('contain.text', 'User B').and('contain.text', 'Set as default');

    // กด "Set as default" บน User B
    cy.get('.address-option').last().find('.set-default-link').click();
    cy.get('.address-option').last().should('contain.text', 'Default');
    cy.get('.address-option').first().should('not.contain.text', 'Default');

    // ทดสอบ Edit: แก้ชื่อ B -> B Edited
    cy.get('.address-option').last().within(() => {
      cy.get('button[aria-label="Edit address"]').click();
    });
    cy.get('.address-form').within(() => {
      cy.get('#addr-name').clear().type('User B Edited');
      cy.get('.btn-save').click();
    });
    cy.get('.address-option').last().should('contain.text', 'User B Edited');

    // ทดสอบ Delete: ลบ default (B Edited) -> default ต้องย้ายไปอีกตัวโดยอัตโนมัติ
    cy.window().then((win) => cy.stub(win, 'confirm').returns(true)); // ยอมลบ
    cy.get('.address-option').last().within(() => {
      cy.get('button[aria-label="Delete address"]').click();
    });

    cy.get('.address-option').should('have.length', 1)
      .first().should('contain.text', 'User A')
      .and('contain.text', 'Default'); // ถูกย้าย default มา A อัตโนมัติ :contentReference[oaicite:3]{index=3}
  });

  it('ยืนยันคำสั่งซื้อ: ปุ่ม (การ์ด) พาไป /tracking/:id และปุ่ม (sticky bar) ก็ทำงานเหมือนกัน', () => {
    cy.visit(PLACE_PATH);

    // สร้างที่อยู่ default ให้ก่อน
    cy.get('.address-form #addr-name').type('Buyer');
    cy.get('.address-form input[placeholder="0xx-xxx-xxxx"]').type('0681234567');
    cy.get('.address-form input[type="text"]').eq(1).type('77/7');
    cy.get('.address-form input[type="text"]').eq(3).type('Sub');
    cy.get('.address-form input[type="text"]').eq(4).type('Dist');
    cy.get('.address-form select').select('Bangkok');
    cy.get('.address-form input[type="text"]').eq(5).type('10230');
    cy.get('.address-form .btn-save').click();

    // ปุ่มใน summary card
    cy.get('aside.summary-card .btn-primary').should('not.be.disabled').click();
    cy.location('pathname').should('match', /^\/tracking\/\d+$/);

    // ย้อนกลับมาลองปุ่ม sticky bar
    cy.visit(PLACE_PATH);
    // ทำ default address อีกครั้งแบบย่อ
    cy.get('.address-form #addr-name').type('Buyer2');
    cy.get('.address-form input[placeholder="0xx-xxx-xxxx"]').type('0812345678');
    cy.get('.address-form input[type="text"]').eq(1).type('1');
    cy.get('.address-form input[type="text"]').eq(3).type('S');
    cy.get('.address-form input[type="text"]').eq(4).type('D');
    cy.get('.address-form select').select('Bangkok');
    cy.get('.address-form input[type="text"]').eq(5).type('10000');
    cy.get('.address-form .btn-save').click();

    cy.get('.sticky-checkout-bar .btn-primary').should('not.be.disabled').click();
    cy.location('pathname').should('match', /^\/tracking\/\d+$/);
  });
});
