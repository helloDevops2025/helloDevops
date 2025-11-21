// cypress/e2e/ProductList.cy.js

// helper: เข้า /admin/products แบบเป็น ADMIN แล้วรอ data พร้อมใช้
const goToProductList = (options = {}) => {
  const { stubProducts, useExistingIntercept = false } = options;


  cy.intercept("GET", "**/api/**/me*", {
    statusCode: 200,
    body: { username: "admin", role: "ADMIN" },
  }).as("me1");

  cy.intercept("GET", "**/api/auth/**", {
    statusCode: 200,
    body: { username: "admin", role: "ADMIN" },
  }).as("me2");

  cy.intercept("GET", "**/api/users/me*", {
    statusCode: 200,
    body: { username: "admin", role: "ADMIN" },
  }).as("me3");

 
  if (stubProducts) {
    cy.intercept("GET", "**/api/products*", {
      statusCode: 200,
      body: stubProducts,
    }).as("getProducts");
  } else if (!useExistingIntercept) {
    cy.intercept("GET", "**/api/products*").as("getProducts");
  }

  
  cy.visit("/admin/products", {
    seedAuth: false,
    onBeforeLoad(win) {
    
      try {
        const authPayload = JSON.stringify({
          user: { name: "admin", role: "ADMIN" },
          token: "test-token",
        });

        
        win.localStorage.setItem("auth", authPayload);
        win.localStorage.setItem("pm_auth", authPayload);
        win.localStorage.setItem("puremart_auth", authPayload);
        win.localStorage.setItem("isAuthed", "true");

      
        win.sessionStorage.setItem("token", "e2e-dummy-token");
        win.sessionStorage.setItem("role", "ADMIN");
        win.sessionStorage.setItem(
          "user",
          JSON.stringify({ email: "admin@puremart.com" })
        );
        win.sessionStorage.setItem("email", "admin@puremart.com");
      } catch (e) {
     
      }
    },
  });

 
  cy.wait("@getProducts", { timeout: 20000 });

  cy.get('[data-page="AdminProductListPage"], .table-card', {
    timeout: 20000,
  }).should("exist");
};


const stubProducts = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  productId: `P${String(i + 1).padStart(3, "0")}`,
  name: `Product ${i + 1}`,
  price: 100 + i,
  category: i % 2 === 0 ? "Food" : "Drink",
  brand: i % 2 === 0 ? "BrandA" : "BrandB",
  quantity: i < 2 ? 0 : 10, // 2 ตัวแรก out of stock
}));

// ===============================================
// E2E-PROD-001: แสดงรายการสินค้า
// ===============================================
describe("E2E-PROD-001: แสดงรายการสินค้า", () => {
  beforeEach(() => {
    goToProductList(); 
  });

  it("โหลดหน้า Product List แล้วมีหัวตาราง + มี data row อย่างน้อย 1 แถว", () => {
    // Header ยืดหยุ่น
    cy.get("body").then(($b) => {
      const hasHeader =
        $b.find(
          ".table-header, thead, .table-card .table-row.header, .table-head"
        ).length > 0;

      if (hasHeader) {
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
          headerCandidates.forEach((re) => cy.contains(re).should("exist"));
        });
      } else {
        cy.log(
          "No explicit table header found; skipping header assertions (theme minimal)."
        );
      }
    });

  
    cy.get(".table-row", { timeout: 10000 })
      .filter(
        (_, el) =>
          !el.textContent.includes("Loading products…") &&
          !el.textContent.includes("Error:") &&
          !el.textContent.includes("No products found.")
      )
      .should("have.length.greaterThan", 0);

    cy.location("pathname").should("include", "/admin/products");
  });
});

// ===============================================
// E2E-PROD-002: Product List Search
// ===============================================
describe("E2E-PROD-002: Product List Search", () => {
  beforeEach(() => {
    goToProductList({ stubProducts });

    cy.get(".action-bar .search input").as("search").should("exist");
    cy.get(".action-bar .search select").as("scope").should("exist");

    cy.get("@search").clear().type("{esc}");
  });

  const firstDataRow = () =>
    cy
      .get(".table-card .table-row")
      .filter((_, el) => el.querySelector(".act"))
      .first();

  it("ค้นหาด้วยชื่อสินค้า", () => {
    firstDataRow()
      .find(".prod")
      .invoke("text")
      .then((fullText) => {
        const name = (fullText || "").trim();
        const parts = name.split(/\s+/).filter((w) => w.length >= 2);
        const query = (parts[0] || name.slice(0, 4) || name).trim();

        cy.get("@scope").select("name");
        cy.get("@search").clear().type(query);
        cy.wait(300);

        cy.get(".table-row:visible")
          .filter((_, el) => el.querySelector(".act"))
          .should("have.length.greaterThan", 0);
      });
  });

  it("ค้นหาด้วย Product ID", () => {

  firstDataRow()
    .invoke("attr", "data-product-id")
    .then((pidRaw) => {
      const pid = (pidRaw || "").trim(); 

      cy.get("@scope").select("productId");
      cy.get("@search").clear().type(pid); 
      cy.wait(300);

      cy.get(".table-row:visible")
        .filter((_, el) => el.querySelector(".act"))
        .should("have.length.greaterThan", 0);
    });
});


  it("ค้นหาด้วย Category", () => {
    firstDataRow()
      .children()
      .eq(3)
      .invoke("text")
      .then((catText) => {
        const category = (catText || "").trim();
        cy.get("@scope").select("category");
        cy.get("@search").clear().type(category);
        cy.wait(300);
        cy.get(".table-row:visible")
          .filter((_, el) => el.querySelector(".act"))
          .should("have.length.greaterThan", 0);
      });
  });

  it("ค้นหาด้วย Stock (มี / หมด)", () => {
    firstDataRow()
      .children()
      .eq(6)
      .invoke("text")
      .then((stockText) => {
        const stockRaw = (stockText || "").toLowerCase();
        const query = /out/.test(stockRaw) ? "หมด" : "มี";
        cy.get("@scope").select("stock");
        cy.get("@search").clear().type(query);
        cy.wait(300);
        cy.get(".table-row:visible")
          .filter((_, el) => el.querySelector(".act"))
          .should("have.length.greaterThan", 0);
      });
  });
});

// ===============================================
// E2E-PROD-003: Add New → Create form
// ===============================================
describe("E2E-PROD-003: Add New → Create form", () => {
  beforeEach(() => {
    goToProductList({ stubProducts: stubProducts.slice(0, 5) });
  });

  it("คลิก ADD NEW แล้วไปหน้า Create และกลับมาหน้า List", () => {
    cy.get("body").then(($b) => {
      const selectors = [
        '[data-testid="add-new-btn"]',
        '.action-bar a:contains("ADD NEW")',
        '.action-bar button:contains("ADD NEW")',
        'a:contains("ADD NEW")',
        'button:contains("ADD NEW")',
      ];
      const found = selectors.find((sel) => $b.find(sel).length > 0);
      if (!found)
        throw new Error("ไม่พบปุ่ม ADD NEW บนหน้า Product List");
      cy.get(found).click({ force: true });
    });

    cy.location("pathname", { timeout: 10000 }).should((p) =>
      expect(/\/admin\/products\/(new|create)$/i.test(p)).to.be.true
    );

    const expectField = (nameOrLabel) => {
      cy.get("body").then(($b) => {
        const found = $b.find(
          `input[name="${nameOrLabel}"], select[name="${nameOrLabel}"]`
        );
        if (found.length) cy.wrap(found).should("be.visible");
        else
          cy
            .contains("label, .form-label", new RegExp(nameOrLabel, "i"))
            .should("be.visible");
      });
    };

    expectField("name");
    expectField("price");
    expectField("category");
    expectField("quantity");

    cy.contains("button, a", /save|บันทึก/i).should("exist");
    cy.contains("button, a", /cancel|back|ยกเลิก/i).should("exist");

    cy.get("body").then(($b) => {
      const backBtn = $b.find(
        'button:contains("Back"), a:contains("Back"), button:contains("ยกเลิก"), a:contains("ยกเลิก")'
      );
      if (backBtn.length) cy.wrap(backBtn.first()).click({ force: true });
      else cy.go("back");
    });

    cy.location("pathname").should("include", "/admin/products");
  });
});

// ===============================================
// E2E-PROD-004: Verify row actions: Edit
// ===============================================
describe("E2E-PROD-004: Verify row actions: Edit", () => {
  beforeEach(() => {
    goToProductList({ stubProducts: stubProducts.slice(0, 5) });
  });

  it("คลิก Edit แถวแรก → ไปหน้า Edit form และกลับ", () => {
    cy.get(".table-row")
      .filter((_, el) => el.querySelector(".act"))
      .first()
      .as("row");

    cy.get("@row").within(() => {
      const candidates = [
        '.act a[aria-label="Edit product"]',
        '.act a:contains("Edit")',
        '.act [title="Edit"]',
        ".act a",
      ];
      cy.wrap(null)
        .then(() =>
          cy.root().then(($r) => {
            const sel = candidates.find((s) => $r.find(s).length > 0);
            if (!sel) throw new Error("ไม่พบปุ่ม Edit");
            return sel;
          })
        )
        .then((sel) => cy.get(sel).first().click({ force: true }));
    });

    cy.location("pathname", { timeout: 10000 }).should((p) =>
      expect(/\/admin\/products\/[^/]+\/edit$/i.test(p)).to.be.true
    );

    cy.get('input[name="name"], label:contains("Name")', {
      timeout: 10000,
    }).should("exist");
    cy.get('input[name="price"], label:contains("Price")', {
      timeout: 10000,
    }).should("exist");

    cy.go("back");
    cy.location("pathname").should("include", "/admin/products");
  });
});

// ===============================================
// E2E-PROD-005: Delete product (trash icon - frontend only)
// ===============================================
describe("E2E-PROD-005: Delete product (trash icon - frontend only)", () => {
  beforeEach(() => {
  
    cy.intercept("GET", "**/api/products*", {
      statusCode: 200,
      body: stubProducts.slice(0, 8),
    }).as("getProducts");

    cy.intercept("DELETE", "**/api/products/**", {
      statusCode: 200,
      body: {},
    }).as("deleteProduct");

    goToProductList({ useExistingIntercept: true }); 
  });

  const firstDeletableRow = () =>
    cy
      .get(".table-card .table-row")
      .filter((_, el) => el.querySelector('button[aria-label="Delete product"]'))
      .first();

  it("คลิกไอคอนถังขยะ → confirm(ตกลง) → แถวนั้นหายไป", () => {
    cy.get(".table-card .table-row")
      .filter((_, el) => el.querySelector('button[aria-label="Delete product"]'))
      .its("length")
      .then((beforeCount) => {
        expect(beforeCount).to.be.greaterThan(0);

        firstDeletableRow().then(($row) => {
     
          cy.wrap($row)
            .children()
            .eq(1)
            .invoke("text")
            .then((codeText) => {
              const code = (codeText || "").trim();
              if (!code || code === "#") {
                return cy
                  .wrap($row)
                  .find(".prod")
                  .invoke("text")
                  .then((name) => (name || "").trim());
              }
              return code;
            })
            .then((identifier) => {
              expect(
                identifier,
                "ต้องมี identifier จากแถว (รหัสหรือชื่อ)"
              ).to.be.ok;

        
              cy.wrap($row)
                .find('button[aria-label="Delete product"]')
                .click();

   
              cy.get(".modal, .modal-overlay", { timeout: 5000 }).should(
                "be.visible"
              );

           
              cy.get(".modal .btn-confirm, .modal button")
                .contains(/delete/i)
                .click();

             
              cy.wait("@deleteProduct");

       
              cy.contains(".table-card .table-row", identifier).should(
                "not.exist"
              );

             
              cy.get(".table-card .table-row")
                .filter(
                  (_, el) =>
                    el.querySelector('button[aria-label="Delete product"]')
                )
                .its("length")
                .should("be.lt", beforeCount);
            });
        });
      });
  });

  it("คลิกไอคอนถังขยะ → cancel(ยกเลิก) → แถวนั้นยังอยู่", () => {
    cy.get(".table-card .table-row")
      .filter((_, el) => el.querySelector('button[aria-label="Delete product"]'))
      .its("length")
      .then((beforeCount) => {
        expect(beforeCount).to.be.greaterThan(0);

        firstDeletableRow().then(($row) => {
          cy.wrap($row)
            .children()
            .eq(1)
            .invoke("text")
            .then((codeText) => {
              const code = (codeText || "").trim();
              if (!code || code === "#") {
                return cy
                  .wrap($row)
                  .find(".prod")
                  .invoke("text")
                  .then((name) => (name || "").trim());
              }
              return code;
            })
            .then((identifier) => {
              expect(
                identifier,
                "ต้องมี identifier จากแถว (รหัสหรือชื่อ)"
              ).to.be.ok;

            
              cy.wrap($row)
                .find('button[aria-label="Delete product"]')
                .click();

             
              cy.get(".modal, .modal-overlay", { timeout: 5000 }).should(
                "be.visible"
              );

             
              cy.get(".modal .btn-cancel, .modal button")
                .contains(/cancel|ยกเลิก/i)
                .click();

          
              cy.contains(".table-card .table-row", identifier).should(
                "exist"
              );

              
              cy.get(".table-card .table-row")
                .filter(
                  (_, el) =>
                    el.querySelector('button[aria-label="Delete product"]')
                )
                .its("length")
                .should("eq", beforeCount);
            });
        });
      });
  });

});

// ===============================================
// E2E-PROD-006: Pagination navigation
// ===============================================
describe("E2E-PROD-006: Pagination navigation", () => {
  beforeEach(() => {
    goToProductList({ stubProducts });
  });

  it("สามารถกดหน้าถัดไปได้ (pagination next)", () => {
    cy.get('.pager [aria-current="page"]').should("contain.text", "1");

    cy.get(".pager .pill").contains("2").click();

    cy.get('.pager [aria-current="page"]').should("contain.text", "2");
    cy.get(".table-card .table-row:visible .prod")
      .first()
      .should("contain.text", "Product 11");

    cy.get(".pager .pill").contains("1").click();
    cy.get('.pager [aria-current="page"]').should("contain.text", "1");
    cy.get(".table-card .table-row:visible .prod")
      .first()
      .should("contain.text", "Product 1");
  });

  it("สามารถกดปุ่ม Next › เพื่อไปหน้าถัดไปได้", () => {
    cy.get('.pager .circle[aria-label="Next"]').click();
    cy.get('.pager [aria-current="page"]').should("contain.text", "2");
    cy.get(".table-card .table-row:visible .prod")
      .first()
      .should("contain.text", "Product 11");
  });

  it("สามารถกดปุ่ม Prev ‹ เพื่อย้อนกลับได้", () => {
    cy.get(".pager .pill").contains("2").click();
    cy.get('.pager [aria-current="page"]').should("contain.text", "2");

    cy.get('.pager .circle[aria-label="Prev"]').click();
    cy.get('.pager [aria-current="page"]').should("contain.text", "1");
    cy.get(".table-card .table-row:visible .prod")
      .first()
      .should("contain.text", "Product 1");
  });
});
