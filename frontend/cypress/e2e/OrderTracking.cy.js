// cypress/e2e/admin-order-tracking.cy.js
/// <reference types="cypress" />


function visitTrackingAsAdmin(orderId = 123) {
  cy.visit(`/admin/orders/tracking/${orderId}`, {
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
      
      }
    },
  });
}

describe("AdminOrderTrackingPage", () => {
  const ORDER_ID = 123;

  const baseOrder = {
    id: ORDER_ID,
    orderCode: "ORD-123",
    orderStatus: "PREPARING",
    orderItems: [
      {
        productDbId: 101,
        productCode: "P-101",
        productName: "Apple Juice",
        quantity: 2,
        qty: 2,
        priceEach: 100,
        totalPrice: 200,
        brandName: "Fresh Farm",
      },
    ],
  };

  beforeEach(() => {
  
    cy.intercept("GET", "**/api/**/me*", {
      statusCode: 200,
      body: { username: "admin", role: "ADMIN" },
    }).as("me");
    cy.intercept("GET", "**/api/auth/**", {
      statusCode: 200,
      body: { username: "admin", role: "ADMIN" },
    }).as("auth");
    cy.intercept("GET", "**/api/users/me*", {
      statusCode: 200,
      body: { username: "admin", role: "ADMIN" },
    }).as("meUser");

    
    cy.intercept("GET", "**/api/products/*/cover", {
      statusCode: 200,
      body: "",
    }).as("cover");
  });

  it("T1: โหลด order PREPARING แล้ว timeline เริ่มต้นถูกต้อง + card แสดงข้อมูลสินค้าถูกต้อง", () => {
    const order = {
      ...baseOrder,
      orderStatus: "PREPARING",
      status: undefined,
    };

    cy.intercept("GET", `**/api/orders/${ORDER_ID}*`, {
      statusCode: 200,
      body: order,
    }).as("getOrder");

    visitTrackingAsAdmin(ORDER_ID);
    cy.wait("@getOrder");

    cy.contains("h1", "ORDER TRACKING").should("be.visible");

    cy.get(".product-card")
      .should("have.length", 1)
      .first()
      .within(() => {
        cy.contains("Apple Juice").should("be.visible");
        cy.contains("Order ID").siblings("span").should("contain", `#${ORDER_ID}`);
        cy.contains("Order Code").siblings("span").should("contain", "ORD-123");
        cy.contains("Status")
          .siblings("span")
          .should("contain", "Preparing"); 
        cy.contains("Quantity")
          .siblings("span")
          .should("contain", "2");
      });

   
    cy.get(".progress-line .line-fill")
      .should("have.attr", "style")
      .and("contain", "width: 0%");

    cy.get(".steps .step").should("have.length", 4);
    cy.get(".steps .step").eq(0).should("have.class", "done");
    cy.get(".steps .step").eq(1).should("not.have.class", "done");
    cy.get(".steps .step").eq(2).should("not.have.class", "done");
    cy.get(".steps .step").eq(3).should("not.have.class", "done");
  });

  it("T2: order อยู่สถานะ SHIPPING → มี 3 step done และ progress ประมาณ 67%", () => {
    const order = {
      ...baseOrder,
      orderStatus: "SHIPPING",
    };

    cy.intercept("GET", `**/api/orders/${ORDER_ID}*`, {
      statusCode: 200,
      body: order,
    }).as("getOrder");

    visitTrackingAsAdmin(ORDER_ID);
    cy.wait("@getOrder");

    
    cy.get(".progress-line .line-fill")
      .should("have.attr", "style")
      .and("contain", "width: 67%");

   
    cy.get(".steps .step.done").should("have.length", 3);
    cy.get(".steps .step").eq(0).should("have.class", "done");
    cy.get(".steps .step").eq(1).should("have.class", "done");
    cy.get(".steps .step").eq(2).should("have.class", "done");
    cy.get(".steps .step").eq(3).should("not.have.class", "done");

    
    cy.contains(".step-label strong", "Shipping").should("exist");
  });

  it("T3: order CANCELLED → timeline ขึ้น canceled, progress 0 และมีข้อความ Canceled", () => {
    const order = {
      ...baseOrder,
      orderStatus: "CANCELLED",
    };

    cy.intercept("GET", `**/api/orders/${ORDER_ID}*`, {
      statusCode: 200,
      body: order,
    }).as("getOrder");

    visitTrackingAsAdmin(ORDER_ID);
    cy.wait("@getOrder");

    
    cy.get(".progress-line .line-fill")
      .should("have.attr", "style")
      .and("contain", "width: 0%");

    
    cy.get(".steps .step").each(($step) => {
      cy.wrap($step).should("have.class", "cancel");
      cy.wrap($step).should("not.have.class", "done");
    });

    
    cy.get(".steps .step").first().within(() => {
      cy.contains("Canceled").should("be.visible");
    });
  });

  it("T4: ถ้า order ไม่มีสินค้า (orderItems ว่าง) → แสดงข้อความ 'ไม่มีสินค้าในคำสั่งซื้อนี้'", () => {
    const order = {
      ...baseOrder,
      orderItems: [],
      orderStatus: "DELIVERED",
    };

    cy.intercept("GET", `**/api/orders/${ORDER_ID}*`, {
      statusCode: 200,
      body: order,
    }).as("getOrder");

    visitTrackingAsAdmin(ORDER_ID);
    cy.wait("@getOrder");

    cy.contains("ไม่มีสินค้าในคำสั่งซื้อนี้").should("be.visible");
    cy.get(".product-card").should("have.length", 0);
  });

  it("T5: ปุ่ม View Order นำทางกลับไปหน้า /admin/orders/:id ได้", () => {
    const order = {
      ...baseOrder,
      orderStatus: "SHIPPING",
    };

    cy.intercept("GET", `**/api/orders/${ORDER_ID}*`, {
      statusCode: 200,
      body: order,
    }).as("getOrder");

    visitTrackingAsAdmin(ORDER_ID);
    cy.wait("@getOrder");

   
    cy.get(".product-card")
      .first()
      .within(() => {
        cy.contains("button", "View Order").click();
      });

    cy.location("pathname").should("eq", `/admin/orders/${ORDER_ID}`);
  });
});
