/// <reference types="cypress" />

const HOME_PATH = '/home';

describe('HOME — Real backend only (no mock)', () => {
    // ถ้าใน commands.js มี overwrite ของ cy.visit ที่ seed auth ให้อยู่แล้ว
    // เราไม่ต้องทำอะไรเพิ่ม แค่ visit('/home') ได้เลย

    it('H1: โหลดโครงหน้า Home ครบ (Best Sellers / Categories / All Products)', () => {
        cy.visit(HOME_PATH);  // ใช้ backend จริง

        // Best Sellers อยู่บนจอเลย → เห็นได้ทันที
        cy.contains('#best-sellers h2', 'Best Sellers.').should('be.visible');

        // Categories, All Products ใช้ IntersectionObserver ทำ fade-in
        // ต้อง scroll ให้เข้า viewport ก่อนถึงจะ visible
        cy.get('#categories').scrollIntoView();
        cy.contains('#categories h3', 'Browse by Category').should('be.visible');

        cy.get('.all-products').scrollIntoView();
        cy.contains('.all-products h3', 'All Products').should('be.visible');
    });

    it('H2: Best Sellers / All Products มีสินค้าและปุ่ม Add-to-cart (ใช้ data จริง)', () => {
        cy.visit(HOME_PATH);

        // Best Sellers ต้องมีสินค้าอย่างน้อย 1 ชิ้น
        cy.get('#best-sellers .products .product')
            .its('length')
            .should('be.greaterThan', 0);

        // มีปุ่ม add-to-cart อย่างน้อย 1 ปุ่ม
        cy.get('#best-sellers .products .product .add-to-cart')
            .first()
            .should('be.visible');

        // All Products ต้องมีสินค้าอย่างน้อย 1 ชิ้นเหมือนกัน
        cy.get('.all-products .products .product')
            .its('length')
            .should('be.greaterThan', 0);

        // ลิงก์ของสินค้าตัวแรกควรเป็น /detail/:id (ไม่ fix ว่า id ไหน ใช้ regex แทน)
        cy.get('.all-products .products .product')
            .first()
            .invoke('attr', 'href')
            .should('match', /\/detail\/.+/);
    });

    it('H3: ปุ่ม Hero ทำงานกับ backend จริง (Shop Best Sellers / Browse Categories)', () => {
        cy.visit(HOME_PATH);

        // ปุ่ม Shop Best Sellers → พาไป /shop?best=1 (ไม่แตะ API ใด ๆ เรียกจริงทั้งหมด)
        cy.contains('Shop Best Sellers')
            .should('have.attr', 'href', '/shop?best=1')
            .click();

        cy.location('pathname').should('eq', '/shop');
        cy.location('search').should('eq', '?best=1');

        // กลับมาหน้า Home แล้วกด Browse Categories → hash ต้องเป็น #categories
        cy.visit(HOME_PATH);
        cy.contains('Browse Categories')
            .should('have.attr', 'href', '#categories')
            .click();

        cy.location('hash').should('eq', '#categories');
        cy.get('#categories').should('exist');
    });

    it('H4: ถ้า backend มีโปรโมชันผูกกับสินค้า → badge ต้องมีข้อความไม่ว่างเปล่า', () => {
        cy.visit(HOME_PATH);

        // ไม่รู้แน่ชัดว่า DB จะมี promo หรือไม่ → ทำแบบยืดหยุ่น:
        // ถ้าไม่มี badge เลย → ไม่ fail
        // ถ้ามี badge → ข้อความต้องไม่ว่าง
        cy.get('body').then(($body) => {
            const hasBadge = $body.find('.product__promo-badge').length > 0;
            if (hasBadge) {
                cy.get('.product__promo-badge')
                    .first()
                    .invoke('text')
                    .should((txt) => {
                        expect(txt.trim().length).to.be.greaterThan(0);
                    });
            }
        });
    });
});