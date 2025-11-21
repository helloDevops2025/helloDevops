// cypress/e2e/admin-order-list.cy.js
/// <reference types="cypress" />

// helper: เข้า /admin/orders แบบเหมือนเป็น admin แล้ว (ไม่แตะหน้า login)
function visitAsAdmin(path = "/admin/orders") {
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

describe("AdminOrderListPage", () => {
  const sampleOrders = [
    {
      id: 1,
      orderCode: "ORD-001",
      customerName: "Alice",
      customerPhone: "081-111-1111",
      shippingAddress: "Bangkok",
      orderStatus: "PENDING",
      subtotal: 150,
      shippingFee: 20,
      discountTotal: 10,
      grandTotal: 160,
      orderedAt: "2025-11-21T10:00:00Z",
    },
    {
      id: 2,
      orderCode: "ORD-002",
      customerName: "Bob",
      customerPhone: "082-222-2222",
      shippingAddress: "Chiang Mai",
      orderStatus: "DELIVERED",
      subtotal: 200,
      shippingFee: 30,
      discountTotal: 0,
      grandTotal: 230,
      orderedAt: "2025-11-21T11:00:00Z",
    },
    {
      id: 3,
      orderCode: "ORD-003",
      customerName: "Charlie",
      customerPhone: "083-333-3333",
      shippingAddress: "Phuket",
      orderStatus: "SHIPPING",
      subtotal: 100,
      shippingFee: 25,
      discountTotal: 5,
      grandTotal: 120,
      orderedAt: "2025-11-22T09:30:00Z",
    },
  ];

  beforeEach(() => {
    // กันเคส route guard ยิง /me /auth
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
  });

  it("L1: โหลดรายการสำเร็จ แสดง header และแถวข้อมูลถูกต้อง", () => {
    cy.intercept("GET", "**/api/orders*", {
      statusCode: 200,
      body: { items: sampleOrders },
    }).as("getOrders");

    visitAsAdmin("/admin/orders");
    cy.wait("@getOrders");

    // header
    cy.contains("h1.title", "ORDER LIST").should("be.visible");
    cy.get(".table-header").within(() => {
      cy.contains("Order Code");
      cy.contains("Ordered At");
      cy.contains("Customer Name");
      cy.contains("Phone");
      cy.contains("Shipping Address");
      cy.contains("Total");
      cy.contains("Status");
      cy.contains("Action");
    });

    
    cy.get(".table-card .table-row").should("have.length", sampleOrders.length);

   
    cy.get(".table-card .table-row")
      .first()
      .within(() => {
        cy.contains(`#${sampleOrders[0].orderCode}`).should("be.visible");
        cy.contains(sampleOrders[0].customerName).should("be.visible");
        cy.contains(sampleOrders[0].customerPhone).should("be.visible");
        cy.contains(sampleOrders[0].shippingAddress).should("be.visible");
        cy.contains(sampleOrders[0].orderStatus).should("be.visible"); 
      });

 
    cy.get(".table-card .table-row")
      .first()
      .find("div")
      .eq(1) 
      .should("have.attr", "title", sampleOrders[0].orderedAt);
  });

  it("L2: ถ้า API คืนลิสต์ว่าง → แสดงข้อความ No orders found.", () => {
    cy.intercept("GET", "**/api/orders*", {
      statusCode: 200,
      body: { items: [] },
    }).as("getOrders");

    visitAsAdmin("/admin/orders");
    cy.wait("@getOrders");

    cy.contains("No orders found.").should("be.visible");
   
    cy.get(".table-card .table-row").should("have.length", 1);
  });

  it("L3: ถ้าโหลดล้มเหลว 500 → แสดง Error: ...", () => {
    cy.intercept("GET", "**/api/orders*", {
      statusCode: 500,
      body: { message: "server error" },
    }).as("getOrders");

    visitAsAdmin("/admin/orders");
    cy.wait("@getOrders");

    cy.contains("Error:").should("be.visible");
    cy.contains("Error: ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้").should("be.visible");
  });

  it("L4: ปุ่ม Edit ในแต่ละแถวพาไปหน้า /admin/orders/:id ถูกต้อง", () => {
    cy.intercept("GET", "**/api/orders*", {
      statusCode: 200,
      body: { items: sampleOrders },
    }).as("getOrders");

    visitAsAdmin("/admin/orders");
    cy.wait("@getOrders");


    cy.contains(".table-row", "#ORD-002")
      .should("exist")
      .within(() => {
        cy.get('a[aria-label="Edit order"]').click();
      });

    cy.location("pathname").should("eq", "/admin/orders/2");
  });

  it("L5: กด Delete → ขึ้น popup confirm, call DELETE, reload แล้วมี popup สำเร็จ + รายการลดลง", () => {
    const firstList = [
      {
        id: 1,
        orderCode: "ORD-001",
        customerName: "Alice",
        customerPhone: "081-111-1111",
        shippingAddress: "Bangkok",
        orderStatus: "PENDING",
        grandTotal: 160,
        orderedAt: "2025-11-21T10:00:00Z",
      },
      {
        id: 2,
        orderCode: "ORD-002",
        customerName: "Bob",
        customerPhone: "082-222-2222",
        shippingAddress: "Chiang Mai",
        orderStatus: "DELIVERED",
        grandTotal: 230,
        orderedAt: "2025-11-21T11:00:00Z",
      },
    ];

    const afterDeleteList = [
      {
        id: 2,
        orderCode: "ORD-002",
        customerName: "Bob",
        customerPhone: "082-222-2222",
        shippingAddress: "Chiang Mai",
        orderStatus: "DELIVERED",
        grandTotal: 230,
        orderedAt: "2025-11-21T11:00:00Z",
      },
    ];

    let deleted = false;

    cy.intercept("GET", "**/api/orders*", (req) => {
      if (!deleted) {
        req.reply({ statusCode: 200, body: { items: firstList } });
      } else {
        req.reply({ statusCode: 200, body: { items: afterDeleteList } });
      }
    }).as("getOrders");

    cy.intercept("DELETE", "**/api/orders/1", (req) => {
      deleted = true;
      req.reply({ statusCode: 204, body: "" });
    }).as("deleteOrder");

    visitAsAdmin("/admin/orders");
    cy.wait("@getOrders");

    cy.contains(".table-row", "#ORD-001")
      .should("exist")
      .within(() => {
        cy.get('button[aria-label="Delete order"]').click();
      });

  
    cy.contains(
      "Are you sure you want to delete this order?"
    ).should("be.visible");
    cy.contains("Order: #ORD-001").should("be.visible");

  
    cy.contains("button", "Delete").click();

  
    cy.wait("@deleteOrder");

  
    cy.wait("@getOrders");

  
    cy.contains("ลบรายการสั่งซื้อนี้แล้ว").should("be.visible");
    cy.contains("button", "OK").click();
    cy.contains("ลบรายการสั่งซื้อนี้แล้ว").should("not.exist");

   
    cy.get(".table-card .table-row").should("have.length", 1);
    cy.contains(".table-row", "#ORD-002").should("exist");
    cy.contains(".table-row", "#ORD-001").should("not.exist");
  });
});
