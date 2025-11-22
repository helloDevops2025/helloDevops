// cypress/e2e/Promotion.basic.cy.js
/// <reference types="cypress" />

// ---------- mock ข้อมูลแบบง่าย ----------
const promotions = [
    {
        id: 1,
        name: "Summer Sale 10%",
        code: "SUMMER10",
        description: "10% off all orders",
        promo_type: "PERCENT_OFF",
        scope: "ORDER",
        percent_off: 10,
        status: "ACTIVE",
    },
    {
        id: 2,
        name: "Beverage B1G1",
        code: "DRINKB1G1",
        description: "Buy 1 get 1 on drinks",
        promo_type: "BUY_X_GET_Y",
        scope: "PRODUCT",
        buy_qty: 1,
        get_qty: 1,
        status: "DRAFT",
    },
];

const products = [
    {
        id: 101,
        product_id: "P-001",
        name: "Coke 325ml",
        price: 25,
        category: { id: 10, name: "Beverage" },
        brand: { id: 100, name: "Coca Cola" },
    },
    {
        id: 102,
        product_id: "P-002",
        name: "Pepsi 325ml",
        price: 24,
        category: { id: 10, name: "Beverage" },
        brand: { id: 101, name: "Pepsi" },
    },
];

const categories = [{ id: 10, name: "Beverage" }];
const brands = [
    { id: 100, name: "Coca Cola" },
    { id: 101, name: "Pepsi" },
];

// ---------- stub API แบบง่าย ----------
function stubBaseAPIs() {

    // ====== /api/promotions (ใช้ทีเดียวครอบทั้ง initial + filter) ======
    cy.intercept("GET", "**/api/promotions*", (req) => {
        const status = req.query.status;

        let body;
        if (status === "ACTIVE") {
            body = [promotions[0]];        
        } else if (status === "DRAFT") {
            body = [promotions[1]];         
        } else if (status === "PAUSED" || status === "EXPIRED") {
            body = [];                      
        } else {
        
            body = promotions;
        }

        req.reply({ statusCode: 200, body });
    }).as("getPromotions");

    // ====== PUT update ======
    cy.intercept("PUT", "**/api/promotions/1", (req) => {
        req.reply({
            statusCode: 200,
            body: {
                ...promotions[0],
                name: "Summer Sale 15%",
                percent_off: 15,
            },
        });
    }).as("updatePromotion");

    // ====== GET โปรรายตัว ======
    cy.intercept("GET", "**/api/promotions/1", {
        statusCode: 200,
        body: promotions[0],
    }).as("getPromotion1");

    cy.intercept("GET", "**/api/promotions/2", {
        statusCode: 200,
        body: promotions[1],
    }).as("getPromotion2");

    // ====== products ======
    cy.intercept("GET", "**/api/products*", {
        statusCode: 200,
        body: products,
    }).as("getProducts");

    cy.intercept("GET", "**/api/promotions/1/products", {
        statusCode: 200,
        body: [products[0]],
    }).as("getPromo1Products");

    cy.intercept("GET", "**/api/promotions/2/products", {
        statusCode: 200,
        body: [],
    }).as("getPromo2Products");

    // ====== categories / brands ======
    cy.intercept("GET", "**/api/categories*", {
        statusCode: 200,
        body: categories,
    }).as("getCategories");

    cy.intercept("GET", "**/api/brands*", {
        statusCode: 200,
        body: brands,
    }).as("getBrands");

    // ====== create (POST) ======
    cy.intercept("POST", "**/api/promotions", {
        statusCode: 201,
        body: { id: 999, ...promotions[0], name: "New Year 10%" },
    }).as("createPromotion");

    // ====== attach / detach ======
    cy.intercept("POST", "**/api/promotions/2/products", {
        statusCode: 200,
        body: { ok: true },
    }).as("attachProducts");

    cy.intercept("DELETE", "**/api/promotions/1/products/101", {
        statusCode: 200,
        body: {},
    }).as("detachProduct");
}



describe("Admin Promotion (แบบง่าย)", () => {
    beforeEach(() => {
        stubBaseAPIs();

        cy.visit("/admin/promotions", {
            seedAuth: false,
            onBeforeLoad(win) {
                try {
                    win.sessionStorage.setItem("token", "e2e-dummy-token");
                    win.sessionStorage.setItem("role", "ADMIN");
                    win.sessionStorage.setItem(
                        "user",
                        JSON.stringify({ email: "admin@test.local" })
                    );
                    win.sessionStorage.setItem("email", "admin@test.local");
                } catch (e) {

                }
            },
        });


        cy.wait("@getPromotions");
        cy.wait("@getProducts");
        cy.wait("@getCategories");
        cy.wait("@getBrands");

    });

    // 1) หน้าโหลด + เห็น list + editor คร่าว ๆ
    it("PROMO-001: หน้า Promotion โหลดได้ และเห็นโปรตัวแรก + สินค้าในโปร", () => {
        cy.contains("Promotion Manager").should("be.visible");

        cy.get(".promo-list .promo-item").should("have.length", 2);
        cy.get(".promo-list .promo-item")
            .first()
            .should("contain", "Summer Sale 10%");

        cy.get(".editor").within(() => {
            cy.contains("Edit Promotion").should("be.visible");
            cy.contains("Name")
                .parent()
                .find("input.inp")
                .should("have.value", "Summer Sale 10%");
        });


        cy.wait("@getPromo1Products");
        cy.contains("Currently assigned to this promotion")
            .parents(".card")
            .within(() => {
                cy.get(".assigned-item").should("have.length", 1);
                cy.contains("Coke 325ml").should("be.visible");
            });
    });

    // 2) Create โปรใหม่
    it("PROMO-002: กด + New promotion → กรอกชื่อ → Create แล้วมี popup Success", () => {

        cy.contains("button", "+ New promotion").click();


        cy.contains(".editor h3", "Create Promotion", { timeout: 5000 }).should("be.visible");


        cy.get(".editor label")
            .contains("Name")
            .parent()
            .find("input.inp")
            .first()
            .clear()
            .type("New Year 10%");


        cy.get(".editor label")
            .contains("Percent Off (%)")
            .parent()
            .find("input[type='number']")
            .first()
            .clear()
            .type("10");


        cy.get(".editor")
            .contains("button", "Create")
            .click();

        cy.wait("@createPromotion");


        cy.contains(".promo-confirm-dialog h3", "Success").should("be.visible");
        cy.contains("Promotion has been created successfully.").should("be.visible");
        cy.contains(".promo-confirm-dialog button", "OK").click();
    });


   // 3) เปิดกล่องยืนยัน Remove (ไม่ยุ่งกับ Attach แล้ว)
it("PROMO-003: กด Remove สินค้าแล้วแสดงกล่องยืนยันลบสินค้า", () => {
 
  cy.contains(".promo-item", "Summer Sale 10%").click();
  cy.wait("@getPromotion1");
  cy.wait("@getPromo1Products");

 
  cy.contains("Currently assigned to this promotion")
    .parents(".card")
    .within(() => {
      cy.contains(".assigned-item", "Coke 325ml")
        .find("button")
        .contains("Remove")
        .click();
    });


  cy.get(".promo-confirm-dialog")
    .should("be.visible")
    .within(() => {
      cy.contains("Please Confirm").should("be.visible");
      cy.contains("This product will be removed").should("be.visible");
      cy.contains("Cancel").should("be.visible");
      cy.contains("Confirm").should("be.visible");
    });

 
  cy.get(".promo-confirm-dialog").within(() => {
    cy.contains("Cancel").click();
  });

  cy.get(".promo-confirm-dialog").should("not.exist");
});



    // 4) เลือกโปรอื่นใน list แล้ว editor + assigned list ต้องเปลี่ยนตาม
    it("PROMO-004: เลือกโปร Beverage B1G1 แล้ว editor และ assigned list แสดงตามโปรนั้น", () => {
        cy.contains(".promo-item", "Beverage B1G1").click();

        cy.wait("@getPromotion2");
        cy.wait("@getPromo2Products");

        cy.get(".promo-list .promo-item.active")
            .should("have.length", 1)
            .and("contain", "Beverage B1G1");

        cy.get(".editor").within(() => {
            cy.contains("Edit Promotion").should("be.visible");

            cy.get("input.inp").first().should("have.value", "Beverage B1G1");
        });

        cy.contains("Currently assigned to this promotion")
            .parents(".card")
            .within(() => {
                cy.contains("No products assigned.").should("be.visible");
            });
    });

    // 5) Update โปรเดิมแล้วบันทึกสำเร็จ
    it("PROMO-005: แก้ไขโปร Summer Sale แล้วกด Save แล้วขึ้น popup Success", () => {

        cy.get(".editor").within(() => {
            cy.contains("Edit Promotion").should("be.visible");

            cy.get("label")
                .contains("Name")
                .parent()
                .find("input.inp")
                .first()
                .clear()
                .type("Summer Sale 15%");

            cy.get("label")
                .contains("Percent Off (%)")
                .parent()
                .find("input[type='number']")
                .first()
                .clear()
                .type("15");


            cy.contains("button", "Save").click();
        });

        cy.wait("@updatePromotion");

        cy.contains(".promo-confirm-dialog h3", "Success").should("be.visible");
        cy.contains("Promotion has been saved successfully.").should("be.visible");
        cy.contains(".promo-confirm-dialog button", "OK").click();
    });


});
