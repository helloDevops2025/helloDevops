/// <reference types="cypress" />

const HOME_PATH = "/home";
const PRODUCTS_RE = /\/api\/products(?:\?.*)?$/;
const CATS_RE = /\/api\/categories(?:\?.*)?$/;

// ---------------- SAMPLE DATA -----------------
function sampleProductsBase() {
  const now = new Date().toISOString();
  return [
    { id: 11, name: "Apple Fuji", price: 25, quantity: 3, updatedAt: now },
    { id: 12, name: "Banana", price: 10, quantity: 6, updatedAt: now },
    { id: 13, name: "Coconut", price: 15, quantity: 1, updatedAt: now },
    { id: 14, name: "Dragon Fruit", price: 39, quantity: 9, updatedAt: now },
    { id: 15, name: "Eggplant", price: 18, quantity: 2, updatedAt: now },
    { id: 16, name: "Fish Sauce", price: 22, quantity: 8, updatedAt: now },
    { id: 17, name: "Garlic", price: 12, quantity: 7, updatedAt: now },
    { id: 18, name: "Honey", price: 99, quantity: 4, updatedAt: now },
    { id: 19, name: "Ice Cream", price: 49, quantity: 0, updatedAt: now },
    {
      id: 20,
      name: "Jam (broken img)",
      price: 59,
      quantity: 5,
      updatedAt: now,
      imageUrl: "http://127.0.0.1:9/nope.jpg",
    },
  ];
}

function sampleCategories() {
  return [
    { id: 1, name: "Canned Fish" },
    { id: 2, name: "Dried Foods" },
    { id: 3, name: "Fruits & Vegetables" },
    { id: 4, name: "Frozen Foods" },
  ];
}

// ---------------- TEST START -----------------
describe("HOME — e2e รวมทุกฟีเจอร์หน้าโฮม", () => {
  beforeEach(() => {
    // Home ถูก protect ด้วย sessionStorage (ตาม commands.js overwrite)
    cy.window().then((win) => {
      win.sessionStorage.setItem("token", "e2e-dummy-token");
      win.sessionStorage.setItem("role", "USER");
      win.sessionStorage.setItem(
        "user",
        JSON.stringify({ email: "e2e@test.local" })
      );
      win.sessionStorage.setItem("email", "e2e@test.local");
    });

    cy.intercept("GET", PRODUCTS_RE, {
      statusCode: 200,
      body: sampleProductsBase(),
    }).as("getProducts");

    cy.intercept("GET", CATS_RE, {
      statusCode: 200,
      body: sampleCategories(),
    }).as("getCats");
  });

  it("H1: โหลดโครงหน้า Home ครบ (Best Sellers / Categories / All Products)", () => {
  cy.visit(HOME_PATH);

  // Best Sellers เริ่มต้นอยู่บนจอ → visible ได้ทันที
  cy.contains("#best-sellers h2", "Best Sellers.").should("be.visible");

  // ---- CATEGORY: ต้อง scroll ให้เข้าจอเพื่อให้ IntersectionObserver ทำงาน ----
  cy.get("#categories").scrollIntoView();
  cy.contains("#categories h3", "Browse by Category").should("be.visible");

  // ---- ALL PRODUCTS: ก็ต้อง scroll เช่นกัน ----
  cy.get(".all-products").scrollIntoView();
  cy.contains(".all-products h3", "All Products").should("be.visible");

  cy.wait("@getProducts");
  cy.wait("@getCats");
});

  it("H2: Best Sellers ต้องไม่มีสินค้าที่ quantity=0 และมีปุ่ม add-to-cart", () => {
    cy.visit(HOME_PATH);
    cy.wait("@getProducts");

    // Best Sellers ต้องไม่รวม Ice Cream
    cy.get("#best-sellers .products").should(
      "not.contain.text",
      "Ice Cream"
    );

    // ปุ่ม add to cart ต้องมีในสินค้าอย่างน้อย 1 รายการ
    cy.get(
      "#best-sellers .products .product .product__body .add-to-cart"
    )
      .first()
      .should("be.visible");
  });

  it("H3: All Products แสดงครบ และลิงก์ /detail/:id ถูกต้อง", () => {
    const list = sampleProductsBase();

    cy.visit(HOME_PATH);
    cy.wait("@getProducts");

    cy.get(".all-products .products .product").should(
      "have.length.at.least",
      list.length
    );

    cy.get(".all-products .products .product")
      .first()
      .invoke("attr", "href")
      .should("match", /\/detail\/\d+/);
  });

  it("H4: Hero Button “Shop Best Sellers” → ไปหน้า /shop?best=1", () => {
    cy.visit(HOME_PATH);

    cy.contains("Shop Best Sellers")
      .should("have.attr", "href", "/shop?best=1")
      .click();

    cy.location("pathname").should("eq", "/shop");
    cy.location("search").should("eq", "?best=1");
  });

  it("H5: Hero Button “Browse Categories” → scroll ลงไปที่ #categories", () => {
    cy.visit(HOME_PATH);

    cy.contains("Browse Categories")
      .should("have.attr", "href", "#categories")
      .click();

    cy.location("hash").should("eq", "#categories");
    cy.get("#categories").should("exist");
  });

  it("H6: หลังเพิ่มสินค้าตัวใหม่ → ต้องเห็นใน Best Sellers และ All Products", () => {
    const base = sampleProductsBase();
    const now = new Date(Date.now() + 1000).toISOString();

    const newProduct = {
      id: 1001,
      name: "Tomato Premium",
      price: 25,
      quantity: 3,
      updatedAt: now, // ใหม่กว่า → Best Sellers
    };

    cy.intercept("GET", PRODUCTS_RE, {
      statusCode: 200,
      body: [...base, newProduct],
    }).as("getProductsAfterAdd");

    cy.visit(HOME_PATH);
    cy.wait("@getProductsAfterAdd");

    cy.get("#best-sellers .products").should(
      "contain.text",
      newProduct.name
    );
    cy.get(".all-products .products").should(
      "contain.text",
      newProduct.name
    );
  });
});
