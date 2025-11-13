

// ===============================================
// E2E-PROD-001: แสดงรายการสินค้า (login flow)
// ===============================================

describe('E2E-PROD-001 แสดงรายการสินค้า (flow: login -> admin/products)', () => {
  it('เข้าสู่ระบบ (mock ฝั่ง frontend) แล้วตรวจ Product List', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts');

    // อย่าปล่อยให้ visit overwrite seed เป็น USER
    cy.visit('/login', { seedAuth: false });

    cy.get('#email').type('admin');
    cy.get('#password').type('admin123');
    cy.get('#submitBtn').click();

    // มาถึงหน้า admin/products
    cy.location('pathname', { timeout: 10000 }).should('include', '/admin/products');

    // ดึงสินค้าสำเร็จ
    cy.wait('@getProducts', { timeout: 20000 });

    // หน้า list พร้อม (มี page marker หรือ table card)
    cy.get('[data-page="AdminProductListPage"], .table-card', { timeout: 20000 }).should('exist');

    // ✅ Header บางธีมไม่มี .table-header → ตรวจแบบยืดหยุ่น
    cy.then(() => {
      return cy.get('body').then(($b) => {
        const hasHeader = $b.find('.table-header, thead, .table-card .table-row.header, .table-head').length > 0;
        if (hasHeader) {
          // พยายามหา label หลัก ๆ แบบหลวม (รองรับ "ID", "#", "Qty")
          const headerCandidates = [
            /product\b/i,
            /(product\s*id|^id$|^#)$/i,
            /price/i,
            /category/i,
            /brand/i,
            /(qty|quantity)/i,
            /stock/i,
            /action/i,
          ];
          cy.wrap($b).within(() => {
            headerCandidates.forEach((re) => cy.contains(re).should('exist'));
          });
        } else {
          cy.log('No explicit table header found; skipping header assertions.');
        }
      });
    });

    // ต้องมีแถวข้อมูล (ไม่นับ state ขณะโหลด/ว่าง/ผิดพลาด)
    cy.get('.table-row', { timeout: 10000 })
      .filter(
        (_, el) =>
          !el.textContent.includes('Loading products…') &&
          !el.textContent.includes('Error:') &&
          !el.textContent.includes('No products found.')
      )
      .should('have.length.greaterThan', 0);

    cy.location('pathname').should('include', '/admin/products');
  });
});


// ===============================================
// E2E-PROD-002: Product List Search (reuse session)
// ===============================================
describe('E2E-PROD-002: Product List Search (reuse session)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.loginAsAdmin(); // ✅ ใช้ session เดิม
    cy.visit('/admin/products', { seedAuth: false });  // ✅ อย่าทับเป็น USER
    cy.wait('@getProducts', { timeout: 20000 });

    cy.get('[data-page="AdminProductListPage"], .table-card', { timeout: 20000 }).should('exist');
    cy.contains('.table-card', 'Loading products…').should('not.exist');

    cy.get('.action-bar .search input').as('search').should('exist');
    cy.get('.action-bar .search select').as('scope').should('exist');

    cy.get('@search').clear().type('{esc}');
  });

  const firstDataRow = () =>
    cy.get('.table-card .table-row').filter((_, el) => el.querySelector('.act')).first();

  it('ค้นหาด้วยชื่อสินค้า', () => {
    firstDataRow().find('.prod').invoke('text').then((fullText) => {
      const name = (fullText || '').trim();
      const parts = name.split(/\s+/).filter(w => w.length >= 2);
      const query = (parts[0] || name.slice(0, 4) || name).trim();

      cy.get('@scope').select('name');
      cy.get('@search').clear().type(query);
      cy.wait(300);

      cy.get('.table-row:visible')
        .filter((_, el) => el.querySelector('.act'))
        .should('have.length.greaterThan', 0);
    });
  });

  it('ค้นหาด้วย Product ID', () => {
    firstDataRow().children().eq(1).invoke('text').then((idText) => {
      const pid = (idText || '').replace('#', '').trim();
      cy.get('@scope').select('productId');
      cy.get('@search').clear().type(pid);
      cy.wait(300);
      cy.get('.table-row:visible').filter((_, el) => el.querySelector('.act'))
        .should('have.length.greaterThan', 0);
    });
  });

  it('ค้นหาด้วย Category', () => {
    firstDataRow().children().eq(3).invoke('text').then((catText) => {
      const category = (catText || '').trim();
      cy.get('@scope').select('category');
      cy.get('@search').clear().type(category);
      cy.wait(300);
      cy.get('.table-row:visible').filter((_, el) => el.querySelector('.act'))
        .should('have.length.greaterThan', 0);
    });
  });

  it('ค้นหาด้วย Stock', () => {
    firstDataRow().children().eq(6).invoke('text').then((stockText) => {
      const stockRaw = (stockText || '').toLowerCase();
      const query = /out/.test(stockRaw) ? 'หมด' : 'มี';
      cy.get('@scope').select('stock');
      cy.get('@search').clear().type(query);
      cy.wait(300);
      cy.get('.table-row:visible').filter((_, el) => el.querySelector('.act'))
        .should('have.length.greaterThan', 0);
    });
  });
});

// ===============================================
// E2E-PROD-003: Add New → Create form (reuse session)
// ===============================================
describe('E2E-PROD-003: Add New → Create form (reuse session)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.loginAsAdmin();
    cy.visit('/admin/products', { seedAuth: false });   // ✅
    cy.wait('@getProducts', { timeout: 20000 });
    cy.get('[data-page="AdminProductListPage"], .table-card', { timeout: 20000 }).should('exist');
  });

  it('คลิก ADD NEW แล้วไปหน้า Create และกลับมาหน้า List', () => {
    cy.get('body').then($b => {
      const selectors = [
        '[data-testid="add-new-btn"]',
        '.action-bar a:contains("ADD NEW")',
        '.action-bar button:contains("ADD NEW")',
        'a:contains("ADD NEW")',
        'button:contains("ADD NEW")'
      ];
      const found = selectors.find(sel => $b.find(sel).length > 0);
      if (!found) throw new Error('ไม่พบปุ่ม ADD NEW บนหน้า Product List');
      cy.get(found).click({ force: true });
    });

    cy.location('pathname', { timeout: 10000 }).should(p =>
      expect(/\/admin\/products\/(new|create)$/i.test(p)).to.be.true
    );

    const expectField = (nameOrLabel) => {
      cy.get('body').then($b => {
        const found = $b.find(`input[name="${nameOrLabel}"], select[name="${nameOrLabel}"]`);
        if (found.length) cy.wrap(found).should('be.visible');
        else cy.contains('label, .form-label', new RegExp(nameOrLabel, 'i')).should('be.visible');
      });
    };

    expectField('name');
    expectField('price');
    expectField('category');
    expectField('quantity');

    cy.contains('button, a', /save|บันทึก/i).should('exist');
    cy.contains('button, a', /cancel|back|ยกเลิก/i).should('exist');

    cy.get('body').then($b => {
      const backBtn = $b.find('button:contains("Back"), a:contains("Back"), button:contains("ยกเลิก"), a:contains("ยกเลิก")');
      if (backBtn.length) cy.wrap(backBtn.first()).click({ force: true });
      else cy.go('back');
    });

    cy.location('pathname', { timeout: 10000 }).should('include', '/admin/products');
  });
});

// ===============================================
// E2E-PROD-004: Verify row actions: Edit (reuse session)
// ===============================================
describe('E2E-PROD-004: Verify row actions: Edit (reuse session)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/products*').as('getProducts');
    cy.loginAsAdmin();
    cy.visit('/admin/products', { seedAuth: false });   // ✅
    cy.wait('@getProducts', { timeout: 20000 });
    cy.get('[data-page="AdminProductListPage"], .table-card', { timeout: 20000 }).should('exist');
  });

  it('คลิก Edit แถวแรก → ไปหน้า Edit form และกลับ', () => {
    cy.get('.table-row').filter((_, el) => el.querySelector('.act')).first().as('row');

    cy.get('@row').within(() => {
      const candidates = [
        '.act a[aria-label="Edit product"]',
        '.act a:contains("Edit")',
        '.act [title="Edit"]',
        '.act a',
      ];
      cy.wrap(null).then(() =>
        cy.root().then($r => {
          const sel = candidates.find(s => $r.find(s).length > 0);
          if (!sel) throw new Error('ไม่พบปุ่ม Edit');
          return sel;
        })
      ).then(sel => cy.get(sel).first().click({ force: true }));
    });

    cy.location('pathname', { timeout: 10000 }).should((p) =>
      expect(/\/admin\/products\/[^/]+\/edit$/i.test(p)).to.be.true
    );

    cy.get('input[name="name"], label:contains("Name")', { timeout: 10000 }).should('exist');
    cy.get('input[name="price"], label:contains("Price")', { timeout: 10000 }).should('exist');

    cy.go('back');
    cy.location('pathname', { timeout: 10000 }).should('include', '/admin/products');
  });
});

// ===============================================
// E2E-PROD-005: Delete product (trash icon - frontend only)
// ===============================================
describe('E2E-PROD-005: Delete product (trash icon - frontend only)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();

    // ให้หน้า list โหลดของจริงของคุณ (หรือจะ fixture ก็ได้)
    cy.intercept('GET', '**/api/products*').as('getProducts');

    // ตอบ DELETE = 200 พอ (ฝั่งหน้าเว็บจะ setItems(filter) เอง)
    cy.intercept('DELETE', '**/api/products/**', { statusCode: 200, body: {} }).as('deleteProduct');

    cy.visit('/admin/products', { seedAuth: false });
    cy.wait('@getProducts');

    // รอให้มีแถวสินค้าจริง (ไม่นับ header/loading/error)
    cy.get('.table-card .table-row', { timeout: 15000 })
      .filter((_, el) => el.querySelector('button[aria-label="Delete product"]'))
      .should('have.length.greaterThan', 0);
  });

  // helper: คืนแถวสินค้าที่ “ลบได้” ตัวแรก
  const firstDeletableRow = () =>
    cy.get('.table-card .table-row')
      .filter((_, el) => el.querySelector('button[aria-label="Delete product"]'))
      .first();

  it('คลิกไอคอนถังขยะ → confirm(ตกลง) → แถวนั้นหายไป', () => {
    // นับจำนวนก่อน
    cy.get('.table-card .table-row')
      .filter((_, el) => el.querySelector('button[aria-label="Delete product"]'))
      .its('length')
      .then((beforeCount) => {
        expect(beforeCount).to.be.greaterThan(0);

        // ดึง "ตัวระบุตัวตนง่าย ๆ" = ข้อความคอลัมน์รหัส (คอลัมน์ที่ 2) หรือ fallback เป็นชื่อสินค้า (.prod)
        firstDeletableRow().then(($row) => {
          cy.wrap($row).children().eq(1).invoke('text').then((codeText) => {
            const code = (codeText || '').trim();
            if (!code || code === '#') {
              // fallback: ใช้ชื่อสินค้า
              return cy.wrap($row).find('.prod').invoke('text').then((name) => (name || '').trim());
            }
            return code;
          }).then((identifier) => {
            expect(identifier, 'ต้องมี identifier จากแถว (รหัสหรือชื่อ)').to.be.ok;

            // ตอบ confirm = ตกลง แล้วคลิกปุ่มลบในแถว
            cy.on('window:confirm', () => true);
            cy.wrap($row).find('button[aria-label="Delete product"]').click();

            cy.wait('@deleteProduct');

            // ✅ แถวเดิม (ค้นจาก identifier) ต้องไม่อยู่แล้ว
            cy.contains('.table-card .table-row', identifier).should('not.exist');

            // และจำนวนแถวที่ลบได้ ต้อง "ลดลงอย่างน้อย 1"
            cy.get('.table-card .table-row')
              .filter((_, el) => el.querySelector('button[aria-label="Delete product"]'))
              .its('length')
              .should('be.lt', beforeCount);
          });
        });
      });
  });

  it('คลิกไอคอนถังขยะ → cancel(ยกเลิก) → แถวนั้นยังอยู่', () => {
    // นับจำนวนก่อน
    cy.get('.table-card .table-row')
      .filter((_, el) => el.querySelector('button[aria-label="Delete product"]'))
      .its('length')
      .then((beforeCount) => {
        expect(beforeCount).to.be.greaterThan(0);

        firstDeletableRow().then(($row) => {
          // identifier แบบเดียวกับด้านบน
          cy.wrap($row).children().eq(1).invoke('text').then((codeText) => {
            const code = (codeText || '').trim();
            if (!code || code === '#') {
              return cy.wrap($row).find('.prod').invoke('text').then((name) => (name || '').trim());
            }
            return code;
          }).then((identifier) => {
            expect(identifier, 'ต้องมี identifier จากแถว (รหัสหรือชื่อ)').to.be.ok;

            // ยกเลิก confirm
            cy.on('window:confirm', () => false);
            cy.wrap($row).find('button[aria-label="Delete product"]').click();

            // ✅ แถวเดิมยังอยู่
            cy.contains('.table-card .table-row', identifier).should('exist');

            // และจำนวนแถวที่ลบได้ "เท่าเดิม"
            cy.get('.table-card .table-row')
              .filter((_, el) => el.querySelector('button[aria-label="Delete product"]'))
              .its('length')
              .should('eq', beforeCount);
          });
        });
      });
  });
});




// ===============================================
// E2E-PROD-006: Pagination navigation (fixed :visible)
// ===============================================
describe('E2E-PROD-006: Pagination navigation', () => {
  beforeEach(() => {
    cy.loginAsAdmin();

    const products = Array.from({ length: 20 }).map((_, i) => ({
      id: i + 1,
      productId: `P${i + 1}`,
      name: `Product ${i + 1}`,
      price: 100 + i,
      category: 'TestCat',
      brand: 'BrandX',
      quantity: 10,
    }));

    cy.intercept('GET', '**/api/products*', { statusCode: 200, body: products }).as('getProducts');

    cy.visit('/admin/products', { seedAuth: false });  // ✅
    cy.wait('@getProducts');

    cy.get('.table-card .table-row:visible', { timeout: 5000 }).should('have.length.greaterThan', 0);
  });

  it('สามารถกดหน้าถัดไปได้ (pagination next)', () => {
    cy.get('.pager [aria-current="page"]').should('contain.text', '1');

    cy.get('.pager .pill').contains('2').click();

    cy.get('.pager [aria-current="page"]').should('contain.text', '2');
    cy.get('.table-card .table-row:visible .prod').first().should('contain.text', 'Product 11');

    cy.get('.pager .pill').contains('1').click();
    cy.get('.pager [aria-current="page"]').should('contain.text', '1');
    cy.get('.table-card .table-row:visible .prod').first().should('contain.text', 'Product 1');
  });

  it('สามารถกดปุ่ม Next › เพื่อไปหน้าถัดไปได้', () => {
    cy.get('.pager .circle[aria-label="Next"]').click();
    cy.get('.pager [aria-current="page"]').should('contain.text', '2');
    cy.get('.table-card .table-row:visible .prod').first().should('contain.text', 'Product 11');
  });

  it('สามารถกดปุ่ม Prev ‹ เพื่อย้อนกลับได้', () => {
    cy.get('.pager .pill').contains('2').click();
    cy.get('.pager [aria-current="page"]').should('contain.text', '2');

    cy.get('.pager .circle[aria-label="Prev"]').click();
    cy.get('.pager [aria-current="page"]').should('contain.text', '1');
    cy.get('.table-card .table-row:visible .prod').first().should('contain.text', 'Product 1');
  });
});

// ===============================================
// E2E-AUTH-007: Logout แล้วถูกเด้งไปหน้า /login
// ===============================================
describe('E2E-AUTH-007: Logout → redirect to /login', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/admin/products', { seedAuth: false });  // ✅
    cy.get('[data-page="AdminProductListPage"], .table-card', { timeout: 15000 }).should('exist');
    cy.get('h1.title', { timeout: 10000 }).should('contain.text', 'PRODUCT LIST');
  });

  it('กด Logout แล้วไปหน้า /login + ฟอร์ม login แสดงผล', () => {
    cy.logoutUI();
    cy.location('pathname').should('match', /\/login$/);
    cy.get('#email').should('exist');
    cy.get('#password').should('exist');
  });
});
