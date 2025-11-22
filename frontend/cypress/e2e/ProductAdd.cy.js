// cypress/e2e/ProductAdd.cy.js
/// <reference types="cypress" />

/** ======== PATHS (ปรับตามโปรเจกต์) ======== */
const ADD_PATH = "/admin/products/new"; 
const LIST_PATH = "/admin/products";

/** ======== SELECTORS (ใช้ร่วมทุก suite) ======== */
const el = {
  // form fields
  productId: 'input[name="productId"]',
  name: 'input[name="name"]',
  description: 'textarea[name="description"]',
  price: 'input[name="price"]',
  quantity: 'input[name="quantity"]',
  category: 'select[name="categoryId"]',
  brand: 'select[name="brandId"]',
  // buttons
  saveBtn: '.btn.primary, button[type="submit"].primary',
  cancelBtn: '.btn.ghost, [data-testid="btn-cancel"]',
  // misc
  msg: 'p[style*="white-space"]', 
};

/** ======== INTERCEPT HELPERS (ครอบกรณี path/query/singular) ======== */
function stubMasterDataOk() {
  const cats = [
    { id: 1, name: "Jasmine Rice" },
    { id: 2, name: "Canned Fish" },
  ];
  const brands = [
    { id: 1, name: "Chatra" },
    { id: 2, name: "Sealext" },
  ];


  cy.intercept("GET", "**/api/categories**", {
    statusCode: 200,
    body: cats,
  }).as("getCategories");
  cy.intercept("GET", "**/api/category**", {
    statusCode: 200,
    body: cats,
  }).as("getCategory");

 
  cy.intercept("GET", "**/api/brands**", {
    statusCode: 200,
    body: brands,
  }).as("getBrands");
  cy.intercept("GET", "**/api/brand**", {
    statusCode: 200,
    body: brands,
  }).as("getBrand");
}

/** ======== helper: visit แบบเป็น ADMIN (ไม่ยุ่งกับ loginAsAdmin) ======== */
function visitAsAdmin(path) {
 
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

  cy.visit(path, {
    seedAuth: false,
    onBeforeLoad(win) {
      try {
       
        win.sessionStorage.setItem("token", "e2e-admin-token");
        win.sessionStorage.setItem("role", "ADMIN");
        win.sessionStorage.setItem(
          "user",
          JSON.stringify({ email: "admin@puremart.com", role: "ADMIN" })
        );
        win.sessionStorage.setItem("email", "admin@puremart.com");

        
        const authPayload = JSON.stringify({
          user: { name: "admin", role: "ADMIN" },
          token: "test-token",
        });
        win.localStorage.setItem("auth", authPayload);
        win.localStorage.setItem("pm_auth", authPayload);
        win.localStorage.setItem("puremart_auth", authPayload);
        win.localStorage.setItem("isAuthed", "true");
      } catch (e) {
        // ignore
      }
    },
  });
}

/** ======== SMOKE: เข้าได้จริง ======== */
describe("E2E-PROD-ADD-101 เข้าหน้า Add Product ได้", () => {
  beforeEach(() => {
 
  });

  it("เปิดหน้า Add แล้วเห็นหัวข้อ Add PRODUCT", () => {
    visitAsAdmin(ADD_PATH);
    cy.location("pathname", { timeout: 10000 }).should("eq", ADD_PATH);
    cy.contains("h1", /add\s+product/i, { timeout: 10000 }).should(
      "be.visible"
    );
  });
});

/** ======== NAV: Cancel ======== */
describe("E2E-PROD-ADD-102 ปุ่ม Cancel กลับไป /admin/products", () => {
  it("กด Cancel แล้วกลับหน้า Product List", () => {

    visitAsAdmin(ADD_PATH);
    cy.location("pathname", { timeout: 10000 }).should("eq", ADD_PATH);

   
    cy.get("body", { timeout: 15000 }).should("contain.text", "Add Product");

   
    cy.get("button, a", { timeout: 10000 })
      .filter((i, elDom) => {
        const txt = elDom.textContent.trim().toLowerCase();
        return (
          txt === "cancel" ||
          txt === "ยกเลิก" ||
          elDom.dataset.testid === "cancel-btn" ||
          elDom.dataset.testid === "btn-cancel"
        );
      })
      .first()
      .should("exist")
      .click({ force: true });

    
    cy.location("pathname", { timeout: 10000 }).should("eq", LIST_PATH);

 
    cy.get('[data-page="AdminProductListPage"]', { timeout: 10000 }).should(
      "exist"
    );
  });
});

/** ======== MASTER DATA: dropdown ต้องมี option ======== */
describe(
  "E2E-PROD-103 โหลด Categories/Brands สำเร็จ → dropdown มี option",
  () => {
    beforeEach(() => {
      stubMasterDataOk();
      visitAsAdmin(ADD_PATH);

      cy.get(el.category, { timeout: 15000 }).should("exist");
      cy.get(el.brand, { timeout: 15000 }).should("exist");
    });

    it("dropdown Category/Brand มี option อย่างน้อย 1 รายการ", () => {
      cy.get(el.category)
        .find("option", { timeout: 15000 })
        .its("length")
        .should("be.gte", 1);
      cy.get(el.brand)
        .find("option", { timeout: 15000 })
        .its("length")
        .should("be.gte", 1);
    });

    it("มี Jasmine Rice / Canned Fish และ Chatra / Sealext", () => {
      cy.get(el.category)
        .find("option", { timeout: 15000 })
        .then(($ops) => {
          const texts = [...$ops].map((o) => o.textContent.trim());
          expect(texts).to.include("Jasmine Rice").and.include("Canned Fish");
        });
      cy.get(el.brand)
        .find("option", { timeout: 15000 })
        .then(($ops) => {
          const texts = [...$ops].map((o) => o.textContent.trim());
          expect(texts).to.include("Chatra").and.include("Sealext");
        });
    });
  }
);

/** ======== VALIDATION BUNDLE (301–305) ======== */
describe("E2E-PROD-104 Validation bundle (301–305)", () => {
  beforeEach(() => {
    stubMasterDataOk();
    visitAsAdmin(ADD_PATH);


    cy.contains("h1.title", "Add PRODUCT", { timeout: 15000 }).should(
      "be.visible"
    );
    cy.get(el.productId, { timeout: 10000 }).should("be.visible");
  });

  // 104-1 — Product ID รับเฉพาะตัวเลข (ช่องว่าง/ตัวอักษรหายไป) และยาวสุด 5 หลัก
  it('104-1 Product ID trims to digits only → "A B 001" => "001"', () => {
    cy.get(el.productId).type("  A B  001  ");
    cy.get(el.productId).should(($i) => {

      expect($i.val()).to.eq("001");
    });
  });

  // 104-2 — Quantity ต้องมีค่า และ clamp ที่ 1,000,000
  it("104-2 Quantity requires value and clamps to 1,000,000", () => {
   
    cy.get(el.name).type("Test Product");
    cy.get(el.price).type("10");
    cy.get(el.category).select(1);
    cy.get(el.brand).select(1);

    cy.get(el.quantity).clear().should("have.value", "");
    cy.get(el.saveBtn).click();


    cy.location("pathname").should("eq", ADD_PATH);


    cy.get(el.quantity)
      .closest(".field")
      .find("small")
      .first()
      .should("be.visible");

    
    cy.get(el.quantity).clear().type("9999999").blur();
    cy.get(el.quantity).should("have.value", "1000000");

    cy.contains("small", "Status: In stock").should("be.visible");
  });

  // 104-3 — Quantity 0 → Out of stock, ≥1 → In stock
  it("104-3 Quantity 0 => Out of stock, ≥1 => In stock", () => {
    cy.get(el.quantity).clear().type("0");
    cy.contains("small", "Status: Out of stock").should("be.visible");

    cy.get(el.quantity).clear().type("3");
    cy.contains("small", "Status: In stock").should("be.visible");
  });

  // 104-4 — ราคา: ต้องกรอก และต้องมากกว่า 0
  it("104-4 Price inline validation for empty and zero", () => {
    // เตรียมช่องอื่นให้ผ่านก่อน
    cy.get(el.name).type("Test Product");
    cy.get(el.quantity).type("5");
    cy.get(el.category).select(1);
    cy.get(el.brand).select(1);

   
    cy.get(el.price).clear().should("have.value", "");
    cy.get(el.saveBtn).click();

    cy.contains("small", "Please enter a price").should("be.visible");

    
    cy.get(el.price).clear().type("0");
    cy.get(el.saveBtn).click();

    cy.contains("small", "Price must be greater than 0").should("be.visible");
  });

  // 104-5 — Required fields ว่าง → ไม่บันทึก และมี inline error ครบ 3 ช่องหลัก

  it("104-5 Required empties block submission with inline errors", () => {

    cy.get(el.name).clear();
    cy.get(el.price).clear();
    cy.get(el.quantity).clear();

  
    cy.get(el.saveBtn).click();

    cy.location("pathname").should("eq", ADD_PATH);

    cy.contains("small", "Please enter the product name").should(
      "be.visible"
    );
    cy.contains("small", "Please enter a price").should("be.visible");
    cy.contains("small", "Please enter the stock quantity").should(
      "be.visible"
    );
  });

});



/** ======== E2E-PROD-105: Save -> redirect + list แสดงสินค้าใหม่ ======== */
describe("E2E-PROD-105 Create success -> redirect + list shows new item", () => {
  const newProduct = {
    id: 1001,
    productId: "SKU-TST-001", 
    name: "Tomato Premium",
    description: "Fresh & sweet",
    price: 25,
    quantity: 3,
    inStock: true,
    categoryId: 1,
    brandId: 1,
  };

  beforeEach(() => {
   
    cy.intercept("GET", "**/api/categories", [
      { id: 1, name: "Jasmine Rice" },
      { id: 2, name: "Canned Fish" },
    ]).as("getCategories");

    cy.intercept("GET", "**/api/brands", [
      { id: 1, name: "Chatra" },
      { id: 2, name: "Sealext" },
    ]).as("getBrands");
  });

  it("กด Save แล้วไป /admin/products และเห็นแถวสินค้าที่เพิ่งสร้าง", () => {
    let created = false;
    let normalizedPid = null;


    cy.intercept("GET", "**/api/products*", (req) => {
      const url = new URL(req.url);
      const q = Object.fromEntries(url.searchParams.entries());
      const path = url.pathname;

    
      const isDupQuery =
        "productId" in q ||
        path.endsWith("/api/products/all") ||
        path.endsWith("/api/products/list") ||
        "size" in q;

      if (isDupQuery) {
        return req.reply({ statusCode: 200, body: [] });
      }

    
      if (!created) {
        return req.reply({ statusCode: 200, body: [] });
      } else {
        return req.reply({
          statusCode: 200,
          body: [
            {
              id: 55,
              productId: "SKU-OLD",
              name: "Old Item",
              price: 10,
              quantity: 2,
              categoryId: 2,
              brandId: 2,
              inStock: true,
            },
            {
              ...newProduct,
              productId: normalizedPid || "001", 
            },
          ],
        });
      }
    }).as("productsAny");

    cy.intercept("POST", "**/api/products", (req) => {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  
      expect(body).to.include.keys([
        "productId",
        "name",
        "description",
        "price",
        "quantity",
        "inStock",
        "categoryId",
        "brandId",
      ]);

      
      const expectedPid =
        newProduct.productId.replace(/\D/g, "").slice(0, 5) || "0";
      expect(body.productId).to.equal(expectedPid);

    
      normalizedPid = body.productId;
      created = true;

      req.reply({ statusCode: 201, body: { id: newProduct.id, ...body } });
    }).as("create");

    // ---- ไปหน้า Add แบบ admin ----
    visitAsAdmin(ADD_PATH);
    cy.wait("@getCategories");
    cy.wait("@getBrands");

    // ---- กรอกฟอร์ม ----
    cy.get(el.productId).type(newProduct.productId);
    cy.get(el.name).type(newProduct.name);
    cy.get(el.description).type(newProduct.description);
    cy.get(el.category).select(String(newProduct.categoryId));
    cy.get(el.brand).select(String(newProduct.brandId));
    cy.get(el.price).type(String(newProduct.price));
    cy.get(el.quantity).type(String(newProduct.quantity));

    // ---- กด Save ----
    cy.get(el.saveBtn).click();

    // ---- ตรวจ Assertions ----
    cy.wait("@create");
    cy.location("pathname", { timeout: 10000 }).should("eq", LIST_PATH);
    cy.contains(newProduct.name, { matchCase: false }).should("be.visible");
  });
});
