/// <reference types="cypress" />

/**
 * E2E: TrackingUserPage
 * ครอบคลุม:
 *  - Breadcrumb + Title + ORDER ID
 *  - ProgressCard แสดง step ทั้งหมด 4 ขั้น
 *  - ตรวจ progress-line.width (%) ตรงตามจำนวน step.done
 *  - OrderBox แสดงสินค้าทั้ง 3 รายการ และ subtotal ถูกต้อง
 *  - ตรวจค่า THB format ของราคาและยอดรวมย่อย
 */

const TRACKING_PATH = '/tracking/123456789';
const CURRENCY = '฿';

function parseTHB(txt) {
  const num = txt.replace(/[^\d.]/g, '');
  return parseFloat(num);
}

describe('Tracking User Page — e2e', () => {
  it('โหลดหน้า: breadcrumb, title, และ ORDER ID', () => {
    cy.visit(TRACKING_PATH);

    cy.get('.pm-breadcrumb')
      .should('contain.text', 'Home')
      .and('contain.text', 'Account')
      .and('contain.text', 'Order Tracking');

    cy.get('h1.title').should('contain.text', 'ORDER TRACKING');
    cy.contains('p', 'ORDER ID :').should('contain.text', '123456789');
  });

  it('ProgressCard: แสดง 4 ขั้น และ step.done ถูกต้อง', () => {
    cy.visit(TRACKING_PATH);

    cy.get('.progress-card').should('be.visible');
    cy.get('.progress-card .step').should('have.length', 4);

    // 3 ขั้นแรก done, ขั้นสุดท้าย pending
    cy.get('.progress-card .step.done').should('have.length', 3);
    cy.get('.progress-card .step').eq(3).should('not.have.class', 'done');

    // ตรวจความกว้าง progress line ≈ 62.5% (3 - 0.5)/4 = 0.625
    cy.get('.progress-card .line-fill')
      .invoke('attr', 'style')
      .should('include', 'width: 62.5%');
  });

  it('OrderBox: แสดง 3 รายการสินค้า และคำนวณ subtotal ถูกต้อง', () => {
    cy.visit(TRACKING_PATH);

    cy.get('.order-box').should('be.visible');
    cy.get('.order-box .order-row').should('have.length', 3);

    // ตรวจแต่ละแถวมีชื่อ, ราคา, qty, subtotal
    cy.get('.order-box .order-row').each(($row) => {
      cy.wrap($row)
        .find('.price')
        .should('contain.text', CURRENCY);
      cy.wrap($row)
        .find('.subtotal')
        .should('contain.text', CURRENCY);
      cy.wrap($row)
        .find('.qty .pill')
        .invoke('text')
        .should('match', /^\d+$/);
    });

    // ตรวจ subtotal คำนวณถูก: (179*1)+(119*1)+(25*4)=398
    let total = 0;
    cy.get('.order-box .order-row').each(($row) => {
      const price = parseTHB($row.find('.price').text());
      const qty = parseInt($row.find('.qty .pill').text());
      const subtotal = parseTHB($row.find('.subtotal').text());
      expect(subtotal).to.eq(price * qty);
      total += subtotal;
    }).then(() => {
      expect(total).to.eq(398);
    });
  });

  it('ตรวจว่า progress และ order อยู่ใน main.container', () => {
    cy.visit(TRACKING_PATH);
    cy.get('main.container.tracking')
      .should('contain', 'ORDER TRACKING')
      .find('.progress-card')
      .should('be.visible');
    cy.get('main.container.tracking .order-box').should('be.visible');
  });
});
