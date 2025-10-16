// ===============================================
// Helper: login หนึ่งครั้ง แล้วจำ session ไว้
// ===============================================
/*Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin-session', () => {
    cy.visit('/login')
    cy.get('#email').type('admin')
    cy.get('#password').type('admin123')
    cy.get('#submitBtn').click()
    cy.location('pathname', { timeout: 10000 }).should('include', '/admin/products')
  })
})*/


// ===============================================
// E2E-PROD-001: แสดงรายการสินค้า (login flow)
// ===============================================
describe('E2E-PROD-001 แสดงรายการสินค้า (flow: login -> admin/products)', () => {
  it('เข้าสู่ระบบ (mock ฝั่ง frontend) แล้วตรวจ Product List', () => {
    cy.intercept('GET', '**/api/products*').as('getProducts')

    cy.visit('/login')
    cy.get('#email').type('admin')
    cy.get('#password').type('admin123')
    cy.get('#submitBtn').click()

    cy.location('pathname', { timeout: 10000 }).should('include', '/admin/products')
    cy.wait('@getProducts', { timeout: 20000 })

    cy.contains('h1.title', /product list/i).should('exist')
    cy.get('.table-card').should('exist')

    cy.get('.table-header').within(() => {
      ;['Product','Product ID','Price','Category','Brand','Quantity','Stock','Action']
        .forEach((t) => cy.contains(t).should('exist'))
    })

    cy.get('.table-row')
      .filter((_, el) =>
        !el.textContent.includes('Loading products…') &&
        !el.textContent.includes('Error:') &&
        !el.textContent.includes('No products found.')
      )
      .should('have.length.greaterThan', 0)

    cy.location('pathname').should('include', '/admin/products')
  })
})

// ===============================================
// E2E-PROD-002: Product List Search (reuse session)
// ===============================================
describe('E2E-PROD-002: Product List Search (reuse session)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/products*').as('getProducts')
    cy.loginAsAdmin() // ✅ ใช้ session เดิม
    cy.visit('/admin/products')
    cy.wait('@getProducts', { timeout: 20000 })

    cy.get('.table-card', { timeout: 20000 }).should('exist')
    cy.contains('.table-card', 'Loading products…').should('not.exist')

    cy.get('.action-bar .search input').as('search').should('exist')
    cy.get('.action-bar .search select').as('scope').should('exist')

    cy.get('@search').clear().type('{esc}')
  })

  const firstDataRow = () =>
    cy.get('.table-card .table-row').filter((_, el) => el.querySelector('.act')).first()

  it('ค้นหาด้วยชื่อสินค้า', () => {
    firstDataRow().find('.prod').invoke('text').then((fullText) => {
      const name = (fullText || '').trim()
      const parts = name.split(/\s+/).filter(w => w.length >= 2)
      const query = (parts[0] || name.slice(0, 4) || name).trim()

      cy.get('@scope').select('name')
      cy.get('@search').clear().type(query)
      cy.wait(300)

      cy.get('.table-row:visible')
        .filter((_, el) => el.querySelector('.act'))
        .should('have.length.greaterThan', 0)
    })
  })

  it('ค้นหาด้วย Product ID', () => {
    firstDataRow().children().eq(1).invoke('text').then((idText) => {
      const pid = (idText || '').replace('#', '').trim()
      cy.get('@scope').select('productId')
      cy.get('@search').clear().type(pid)
      cy.wait(300)
      cy.get('.table-row:visible').filter((_, el) => el.querySelector('.act'))
        .should('have.length.greaterThan', 0)
    })
  })

  it('ค้นหาด้วย Category', () => {
    firstDataRow().children().eq(3).invoke('text').then((catText) => {
      const category = (catText || '').trim()
      cy.get('@scope').select('category')
      cy.get('@search').clear().type(category)
      cy.wait(300)
      cy.get('.table-row:visible').filter((_, el) => el.querySelector('.act'))
        .should('have.length.greaterThan', 0)
    })
  })

  it('ค้นหาด้วย Stock', () => {
    firstDataRow().children().eq(6).invoke('text').then((stockText) => {
      const stockRaw = (stockText || '').toLowerCase()
      const query = /out/.test(stockRaw) ? 'หมด' : 'มี'
      cy.get('@scope').select('stock')
      cy.get('@search').clear().type(query)
      cy.wait(300)
      cy.get('.table-row:visible').filter((_, el) => el.querySelector('.act'))
        .should('have.length.greaterThan', 0)
    })
  })
})

// ===============================================
// E2E-PROD-003: Add New → Create form (reuse session)
// ===============================================
describe('E2E-PROD-003: Add New → Create form (reuse session)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/products*').as('getProducts')
    cy.loginAsAdmin()
    cy.visit('/admin/products')
    cy.wait('@getProducts', { timeout: 20000 })
    cy.get('.table-card', { timeout: 20000 }).should('exist')
  })

  it('คลิก ADD NEW แล้วไปหน้า Create และกลับมาหน้า List', () => {
    cy.get('body').then($b => {
      const selectors = [
        '[data-testid="add-new-btn"]',
        '.action-bar a:contains("ADD NEW")',
        '.action-bar button:contains("ADD NEW")',
        'a:contains("ADD NEW")',
        'button:contains("ADD NEW")'
      ]
      const found = selectors.find(sel => $b.find(sel).length > 0)
      if (!found) throw new Error('ไม่พบปุ่ม ADD NEW บนหน้า Product List')
      cy.get(found).click({ force: true })
    })

    cy.location('pathname', { timeout: 10000 }).should(p =>
      expect(/\/admin\/products\/(new|create)$/i.test(p)).to.be.true
    )

    const expectField = (nameOrLabel) => {
      cy.get('body').then($b => {
        const found = $b.find(`input[name="${nameOrLabel}"], select[name="${nameOrLabel}"]`)
        if (found.length) cy.wrap(found).should('be.visible')
        else cy.contains('label, .form-label', new RegExp(nameOrLabel, 'i'))
          .should('be.visible')
      })
    }

    expectField('name')
    expectField('price')
    expectField('category')
    expectField('quantity')

    cy.contains('button, a', /save|บันทึก/i).should('exist')
    cy.contains('button, a', /cancel|back|ยกเลิก/i).should('exist')

    cy.get('body').then($b => {
      const backBtn = $b.find('button:contains("Back"), a:contains("Back"), button:contains("ยกเลิก"), a:contains("ยกเลิก")')
      if (backBtn.length) cy.wrap(backBtn.first()).click({ force: true })
      else cy.go('back')
    })

    cy.location('pathname', { timeout: 10000 }).should('include', '/admin/products')
  })
})

// ===============================================
// E2E-PROD-004: Verify row actions: Edit (reuse session)
// ===============================================
describe('E2E-PROD-004: Verify row actions: Edit (reuse session)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/products*').as('getProducts')
    cy.loginAsAdmin()
    cy.visit('/admin/products')
    cy.wait('@getProducts', { timeout: 20000 })
    cy.get('.table-card', { timeout: 20000 }).should('exist')
  })

  it('คลิก Edit แถวแรก → ไปหน้า Edit form และกลับ', () => {
    cy.get('.table-row').filter((_, el) => el.querySelector('.act')).first().as('row')

    cy.get('@row').within(() => {
      const candidates = [
        '.act a[aria-label="Edit product"]',
        '.act a:contains("Edit")',
        '.act [title="Edit"]',
        '.act a',
      ]
      cy.wrap(null).then(() =>
        cy.root().then($r => {
          const sel = candidates.find(s => $r.find(s).length > 0)
          if (!sel) throw new Error('ไม่พบปุ่ม Edit')
          return sel
        })
      ).then(sel => cy.get(sel).first().click({ force: true }))
    })

    cy.location('pathname', { timeout: 10000 }).should((p) =>
      expect(/\/admin\/products\/[^/]+\/edit$/i.test(p)).to.be.true
    )

    cy.get('input[name="name"], label:contains("Name")', { timeout: 10000 }).should('exist')
    cy.get('input[name="price"], label:contains("Price")', { timeout: 10000 }).should('exist')

    cy.go('back')
    cy.location('pathname', { timeout: 10000 }).should('include', '/admin/products')
  })
})


// ===============================================
// E2E-PROD-005: Delete product (trash icon - frontend only)
// ===============================================
describe('E2E-PROD-005: Delete product (trash icon - frontend only)', () => {
  let products
  let skipReload = false

  beforeEach(() => {
    skipReload = false
    cy.loginAsAdmin()

    cy.fixture('products.json').then((data) => {
      products = data
    })

    // Mock GET
    cy.intercept('GET', '**/api/products*', (req) => {
      // ถ้า skipReload = true ให้ตอบด้วยชุดข้อมูลล่าสุดใน DOM (ไม่ reset เป็น fixture)
      req.reply({
        statusCode: 200,
        body: products,
      })
    }).as('getProducts')

    // Mock DELETE
    cy.intercept('DELETE', '**/api/products/*', (req) => {
      const id = parseInt(req.url.split('/').pop())
      if (!skipReload) {
        products = products.filter((p) => p.id !== id)
      }
      req.reply({ statusCode: 200, body: {} })
    }).as('deleteProduct')

    cy.visit('/admin/products')
    cy.wait('@getProducts')
    cy.get('.table-card .table-row').should('have.length.greaterThan', 0)
  })

  it('ลบแถวเมื่อกด confirm ใช่', () => {
    cy.get('.table-card .table-row').then(($rows) => {
      const beforeCount = $rows.length

      cy.on('window:confirm', () => true)

      cy.get('.table-card .table-row')
        .first()
        .find('button[aria-label="Delete product"]')
        .click()

      cy.wait('@deleteProduct')

      cy.get('.table-card .table-row', { timeout: 5000 })
        .should('have.length', beforeCount - 1)
    })
  })

  it('ไม่ลบแถวเมื่อกด confirm ยกเลิก', () => {
    cy.get('.table-card .table-row').then(($rows) => {
      const beforeCount = $rows.length

      cy.on('window:confirm', () => false)

      // บอก intercept ว่าไม่ต้องเปลี่ยน state ถ้า cancel
      skipReload = true

      cy.get('.table-card .table-row')
        .first()
        .find('button[aria-label="Delete product"]')
        .click()

      cy.wait(300)

      // ✅ จำนวนต้องเท่าเดิม
      cy.get('.table-card .table-row', { timeout: 4000 })
        .should('have.length', beforeCount)
    })
  })
})




// ===============================================
// E2E-PROD-006: Pagination navigation (fixed :visible)
// ===============================================
describe('E2E-PROD-006: Pagination navigation', () => {
  beforeEach(() => {
    cy.loginAsAdmin()

    // สร้าง 20 รายการ เพื่อให้มี 2 หน้า (แสดงหน้าละ 10)
    const products = Array.from({ length: 20 }).map((_, i) => ({
      id: i + 1,
      productId: `P${i + 1}`,
      name: `Product ${i + 1}`,
      price: 100 + i,
      category: 'TestCat',
      brand: 'BrandX',
      quantity: 10,
    }))

    cy.intercept('GET', '**/api/products*', { statusCode: 200, body: products }).as('getProducts')

    cy.visit('/admin/products')
    cy.wait('@getProducts')

    // รอให้มีแถวที่ "มองเห็น" จริง ๆ
    cy.get('.table-card .table-row:visible').should('have.length.greaterThan', 0)
  })

  it('สามารถกดหน้าถัดไปได้ (pagination next)', () => {
    // เริ่มที่หน้า 1
    cy.get('.pager [aria-current="page"]').should('contain.text', '1')

    // คลิกเลขหน้า 2
    cy.get('.pager .pill').contains('2').click()

    // active เปลี่ยนเป็นหน้า 2
    cy.get('.pager [aria-current="page"]').should('contain.text', '2')

    // แถวที่ "มองเห็น" แรก ควรเป็นของหน้า 2 (Product 11)
    cy.get('.table-card .table-row:visible .prod').first().should('contain.text', 'Product 11')

    // กลับไปหน้า 1 แล้วตรวจว่าแถวแรกเปลี่ยนกลับเป็น Product 1
    cy.get('.pager .pill').contains('1').click()
    cy.get('.pager [aria-current="page"]').should('contain.text', '1')
    cy.get('.table-card .table-row:visible .prod').first().should('contain.text', 'Product 1')
  })

  it('สามารถกดปุ่ม Next › เพื่อไปหน้าถัดไปได้', () => {
    cy.get('.pager .circle[aria-label="Next"]').click()
    cy.get('.pager [aria-current="page"]').should('contain.text', '2')
    cy.get('.table-card .table-row:visible .prod').first().should('contain.text', 'Product 11')
  })

  it('สามารถกดปุ่ม Prev ‹ เพื่อย้อนกลับได้', () => {
    // ไปหน้า 2 ก่อน
    cy.get('.pager .pill').contains('2').click()
    cy.get('.pager [aria-current="page"]').should('contain.text', '2')

    // ย้อนกลับ
    cy.get('.pager .circle[aria-label="Prev"]').click()
    cy.get('.pager [aria-current="page"]').should('contain.text', '1')
    cy.get('.table-card .table-row:visible .prod').first().should('contain.text', 'Product 1')
  })
})

describe('E2E-PROD-005: Delete product (trash icon - frontend only)', () => {
  const ROW = '.table-card .table-row'; // ถ้ามีได้ ใส่ data-cy="prod-row" จะยิ่งนิ่ง
  let mockProducts = [];

  beforeEach(() => {
    cy.loginAsAdmin();

    // deep copy กัน state ปนข้าม it()
    cy.fixture('products.json').then(d => {
      mockProducts = JSON.parse(JSON.stringify(d));
    });

    cy.intercept('GET', '**/api/products**', req => {
      req.reply({ statusCode: 200, body: mockProducts });
    }).as('getProducts');

    cy.intercept('DELETE', '**/api/products/*', req => {
      const id = Number(req.url.split('/').pop());
      mockProducts = mockProducts.filter(p => p.id !== id);
      req.reply({ statusCode: 200, body: {} });
    }).as('deleteProduct');

    cy.visit('/admin/products');
    cy.wait('@getProducts');
    cy.get(ROW, { timeout: 5000 }).should('have.length.greaterThan', 0);
  });

  afterEach(() => {
    // กัน confirm stub ค้างข้ามเคส
    cy.window().then(win => { if (win.confirm?.restore) win.confirm.restore(); });
  });

  it('ลบแถวเมื่อกด confirm ใช่', () => {
    // เก็บจำนวนก่อนด้วย alias (ไม่ใช้ then)
    cy.get(ROW).its('length').as('before');

    // stub confirm = true ให้กับ window จริง
    cy.window().then(win => cy.stub(win, 'confirm').returns(true));

    // คลิกปุ่มลบของแถวแรก
    cy.get(ROW).first().find('button[aria-label="Delete product"]').click();

    // ต้องมี DELETE เกิด
    cy.wait('@deleteProduct');

    // ใช้ "ความจริง" จาก mockProducts หลัง DELETE → expected = mockProducts.length
    cy.then(() => {
      const expected = mockProducts.length; // ถูกอัปเดตแล้วโดย intercept DELETE
      cy.get(ROW, { timeout: 5000 }).should('have.length', expected);
    });
  });

  it('ไม่ลบแถวเมื่อกด confirm ยกเลิก', () => {
    cy.get(ROW).its('length').as('before');

    cy.window().then(win => cy.stub(win, 'confirm').returns(false));

    cy.get(ROW).first().find('button[aria-label="Delete product"]').click();

    // ไม่มี DELETE เกิด
    cy.get('@deleteProduct.all').should('have.length', 0);

    // แถวต้องเท่าเดิม
    cy.get('@before').then(before => {
      cy.get(ROW, { timeout: 5000 }).should('have.length', before);
    });
  });
});
