/// <reference types="cypress" />

/**
 * E2E-PROD-2xx — Admin Edit Product Page
 * ครอบคลุม: โหลดข้อมูล, validation, duplicate check, save success, cancel, ฯลฯ
 */

const LIST_PATH = "/admin/products";
const EDIT_PATH = (id) => `/admin/products/${id}/edit`; 
const PRODUCT_ID = "101"; 

// ====== Selectors ======
const el = {
    title: "h1.title", 
    productId: 'input[name="productId"]',
    name: 'input[name="name"]',
    description: 'textarea[name="description"]',
    category: 'select[name="categoryId"]',
    brand: 'select[name="brandId"]',
    price: 'input[name="price"]',
    quantity: 'input[name="quantity"]',
    saveBtn: "button.btn.primary",
    cancelBtn: "button.btn.ghost, .btn.ghost",
    modalTitle: 'h3:contains("โปรดตรวจสอบ")',
    modalOk: 'button:contains("ตกลง")',
    fieldSmall: (fieldLabelContains) =>
        `.field:has(label:contains("${fieldLabelContains}")) small`,
};

// ====== Mock Data ======
const categories = [
    { id: 1, name: "Jasmine Rice" },
    { id: 2, name: "Canned Fish" },
];
const brands = [
    { id: 1, name: "Chatra" },
    { id: 2, name: "Sealext" },
];

const product = {
    id: Number(PRODUCT_ID),
    productId: "01234",
    name: "Apple Fuji",
    description: "Sweet and crunchy",
    price: 49.5,
    quantity: 5,
    categoryId: 1,
    brandId: 2,
    inStock: true,
};

// ====== Helpers: Intercepts ======
function stubMasterData() {
    cy.intercept("GET", "**/api/categories**", {
        statusCode: 200,
        body: categories,
    }).as("getCategories");
    cy.intercept("GET", "**/api/brands**", {
        statusCode: 200,
        body: brands,
    }).as("getBrands");
}

function stubLoadProduct(id = PRODUCT_ID, withImage = true) {
    cy.intercept("GET", `**/api/products/${id}`, {
        statusCode: 200,
        body: product,
    }).as("getProduct");

    cy.intercept("GET", `**/api/products/${id}/images`, {
        statusCode: 200,
        body: withImage
            ? [
                {
                    id: 999,
                    isCover: true,
                    imageUrl: `${Cypress.config(
                        "baseUrl"
                    )}/api/products/${id}/images/999/raw`,
                },
            ]
            : [],
    }).as("getImages");
}

describe("E2E-PROD-200 Admin Edit Product Page (robust)", () => {
    beforeEach(() => {
        
        stubMasterData();
        stubLoadProduct(PRODUCT_ID, true);

       
        cy.visit(EDIT_PATH(PRODUCT_ID), {
            seedAuth: false,
            onBeforeLoad(win) {
                const authPayload = JSON.stringify({
                    user: { name: "admin", role: "ADMIN", email: "admin@puremart.com" },
                    token: "test-token",
                });
                try {
                    win.localStorage.setItem("auth", authPayload);
                    win.localStorage.setItem("pm_auth", authPayload);
                    win.localStorage.setItem("puremart_auth", authPayload);
                    win.localStorage.setItem("isAuthed", "true");

                    win.sessionStorage.setItem("token", "test-token");
                    win.sessionStorage.setItem("role", "ADMIN");
                    win.sessionStorage.setItem(
                        "user",
                        JSON.stringify({ email: "admin@puremart.com", role: "ADMIN" })
                    );
                    win.sessionStorage.setItem("email", "admin@puremart.com");
                } catch (e) {
                    
                }
            },
        });

        cy.wait(["@getCategories", "@getBrands", "@getProduct", "@getImages"]);

        cy.get(el.title, { timeout: 10000 })
            .should("be.visible")
            .and("contain", "Edit PRODUCT");
        cy.get(el.productId)
            .should("be.visible")
            .and("have.value", product.productId);
        cy.get(el.name).should("have.value", product.name);
    });

    // 201 — โหลดข้อมูลสำเร็จ + ฟิลด์ถูกเติมค่าเดิมครบ
    it("201 loads product details into form", () => {
        cy.get(el.description).should("have.value", product.description);
        cy.get(el.category).should("have.value", String(product.categoryId));
        cy.get(el.brand).should("have.value", String(product.brandId));
        cy.get(el.price).should("have.value", String(product.price));
        cy.get(el.quantity).should("have.value", String(product.quantity));
        cy.contains("small", "Status: In stock").should("be.visible");
    });

    // 202 — Product Code: รับเฉพาะตัวเลข สูงสุด 5 หลัก
    it("202 Product Code accepts digits only (max 5)", () => {
        cy.get(el.productId).clear().type("A B 12-345-678"); 
        cy.get(el.productId).should("have.value", "12345");
    });

    // 203 — Quantity sync → In stock / Out of stock
    it("203 Quantity 0 => Out of stock, ≥1 => In stock", () => {
        cy.get(el.quantity).clear().type("0");
        cy.contains("small", "Status: Out of stock").should("be.visible");
        cy.get(el.quantity).clear().type("2");
        cy.contains("small", "Status: In stock").should("be.visible");
    });

    // 204 — Required validations: name/price/quantity/category/brand
    it('204 Required validations block submit', () => {
        cy.get(el.name).clear();
        cy.get(el.price).clear();
        cy.get(el.quantity).clear();

        cy.get(el.category).invoke('val', '').trigger('change');
        cy.get(el.brand).invoke('val', '').trigger('change');

        cy.intercept('PUT', `**/api/products/${PRODUCT_ID}`).as('putEdit');

        cy.get(el.saveBtn).click();

        cy.location('pathname').should('eq', EDIT_PATH(PRODUCT_ID));

        cy.get('@putEdit.all').then((calls) => {
            const len = (calls || []).length;
            expect(len).to.eq(0);
        });
    });

    // 205 — ราคา <= 0 → ต้องไม่ save
    it('205 Price must be > 0 (no submit when price <= 0)', () => {
        cy.get(el.name).clear().type('Updated Name');
        cy.get(el.quantity).clear().type('10');
        cy.get(el.category).select('1');
        cy.get(el.brand).select('1');

        cy.intercept('PUT', `**/api/products/${PRODUCT_ID}`).as('putEdit');

        cy.get(el.price).clear().type('0');
        cy.get(el.saveBtn).click();

        cy.location('pathname').should('eq', EDIT_PATH(PRODUCT_ID));

        cy.get('@putEdit.all').then((calls) => {
            const len = (calls || []).length;
            expect(len).to.eq(0);
        });
    });


    // 206 — ไม่เปลี่ยน Product Code → ไม่เรียก duplicate check
    it("206 Unchanged Product Code should NOT trigger duplicate check", () => {
        cy.intercept("GET", "**/api/products?productId=*").as("dupCheck");

        cy.get(el.productId).focus().blur();

        cy.wait(300);
        cy.get("@dupCheck.all").then((calls) => {
            expect(calls || []).to.have.length(0);
        });
    });

    it('207 Changing Product Code to duplicate shows error and blocks save', () => {
        const dup = { id: 9999, productId: '00099' };

        cy.intercept('GET', '**/api/products?productId=*', (req) => {
            req.reply({ statusCode: 200, body: [dup] });
        }).as('dupCheck');

        cy.intercept('PUT', `**/api/products/${PRODUCT_ID}`).as('putEdit');

        cy.get(el.productId).clear().type('00099').blur();
        cy.wait('@dupCheck');

        cy.get(el.saveBtn).should('be.disabled');

        cy.location('pathname').should('eq', EDIT_PATH(PRODUCT_ID));

        cy.get('@putEdit.all').then((calls) => {
            const len = (calls || []).length || 0;
            expect(len).to.eq(0);
        });
    });


    // 208 — Save สำเร็จ: PUT 200 → redirect ไป /admin/products
    it("208 Save success -> PUT 200 -> redirect list", () => {
        cy.get(el.name).clear().type("Fuji Updated");
        cy.get(el.price).clear().type("59.9");
        cy.get(el.quantity).clear().type("8");
        cy.get(el.category).select("1");
        cy.get(el.brand).select("2");

        cy.intercept("PUT", `**/api/products/${PRODUCT_ID}`, (req) => {
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
            expect(body.productId).to.match(/^\d{1,5}$/);
            req.reply({
                statusCode: 200,
                body: { id: Number(PRODUCT_ID), ...body },
            });
        }).as("putEdit");

        cy.get(el.saveBtn).click();
        cy.wait("@putEdit");
        cy.location("pathname", { timeout: 10000 }).should("eq", LIST_PATH);
    });

    // 209 — Cancel ปุ่มยกเลิก → กลับหน้า list
    it("209 Cancel goes back to list", () => {
        cy.get(el.cancelBtn).click();
        cy.location("pathname", { timeout: 10000 }).should("eq", LIST_PATH);
    });
});
