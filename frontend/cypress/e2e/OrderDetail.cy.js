// // cypress/e2e/admin-order-detail.cy.js
// /// <reference types="cypress" />
//
// describe("AdminOrderDetailPage", () => {
//     const ORDER_ID = 123;
//
//     const sampleOrder = {
//         id: ORDER_ID,
//         orderCode: "ORD-123",
//         customerName: "Alice",
//         customerPhone: "081-234-5678",
//         shippingAddress: "Bangkok, Thailand",
//         paymentMethod: "Credit Card",
//         shippingMethod: "Kerry Express",
//         orderStatus: "PENDING",
//         discountTotal: 20,
//         shippingCost: 30,
//         grandTotal: 210,
//         orderedAt: "2025-11-21T10:00:00Z",
//         updatedAt: "2025-11-21T11:00:00Z",
//         orderItems: [
//             {
//                 productName: "Apple Juice",
//                 quantity: 2,
//                 priceEach: 100,
//                 totalPrice: 200,
//                 brandName: "Fresh Farm",
//             },
//         ],
//     };
//
//     beforeEach(() => {
//
//         cy.intercept("GET", "**/api/**/me*", {
//             statusCode: 200,
//             body: { username: "admin", role: "ADMIN" },
//         }).as("me");
//         cy.intercept("GET", "**/api/auth/**", {
//             statusCode: 200,
//             body: { username: "admin", role: "ADMIN" },
//         }).as("auth");
//         cy.intercept("GET", "**/api/users/me*", {
//             statusCode: 200,
//             body: { username: "admin", role: "ADMIN" },
//         }).as("meUser");
//
//         // 2) mock API โหลด order รายตัว
//         cy.intercept("GET", `**/api/orders/${ORDER_ID}*`, {
//             statusCode: 200,
//             body: sampleOrder,
//         }).as("getOrder");
//
//
//         cy.visit(`/admin/orders/${ORDER_ID}`, {
//             seedAuth: false,
//             onBeforeLoad(win) {
//                 try {
//
//                     win.sessionStorage.setItem("token", "e2e-admin-token");
//                     win.sessionStorage.setItem("role", "ADMIN");
//                     win.sessionStorage.setItem(
//                         "user",
//                         JSON.stringify({ email: "admin@puremart.com", role: "ADMIN" })
//                     );
//                     win.sessionStorage.setItem("email", "admin@puremart.com");
//
//
//                     const authPayload = JSON.stringify({
//                         user: { name: "admin", role: "ADMIN" },
//                         token: "test-token",
//                     });
//                     win.localStorage.setItem("auth", authPayload);
//                     win.localStorage.setItem("pm_auth", authPayload);
//                     win.localStorage.setItem("puremart_auth", authPayload);
//                     win.localStorage.setItem("isAuthed", "true");
//                 } catch (e) {
//
//                 }
//             },
//         });
//
//
//         cy.wait("@getOrder");
//
//
//         cy.location("pathname").should("eq", `/admin/orders/${ORDER_ID}`);
//     });
//
//     it("D1: แสดง Summary หลักของ Order ได้ถูกต้อง", () => {
//         cy.contains("h1", "ORDER DETAIL").should("be.visible");
//
//         cy.contains(".summary .info p", "Order ID")
//             .parent()
//             .within(() => {
//                 cy.contains(`#${ORDER_ID}`).should("be.visible");
//             });
//
//
//         cy.contains(".summary .info p", "Customer")
//             .parent()
//             .within(() => {
//                 cy.contains(sampleOrder.customerName).should("be.visible");
//             });
//
//         cy.contains(".summary .info p", "Phone")
//             .parent()
//             .within(() => {
//                 cy.contains(sampleOrder.customerPhone).should("be.visible");
//             });
//
//
//         cy.contains(".summary .info p", "Shipping Address")
//             .parent()
//             .within(() => {
//                 cy.contains(sampleOrder.shippingAddress).should("be.visible");
//             });
//
//         cy.contains(".summary .info p", "Payment Method")
//             .parent()
//             .within(() => {
//                 cy.contains(sampleOrder.paymentMethod).should("be.visible");
//             });
//
//         cy.contains(".summary .info p", "Shipping Method")
//             .parent()
//             .within(() => {
//                 cy.contains(sampleOrder.shippingMethod).should("be.visible");
//             });
//
//
//         cy.contains("button.tracking-btn", "Tracking").click();
//         cy.location("pathname").should(
//             "eq",
//             `/admin/orders/tracking/${ORDER_ID}`
//         );
//     });
//
//     it("D2: แสดงรายการสินค้าในตาราง + Cart Total ถูกต้อง", () => {
//
//   cy.get(".order-items table tbody tr").should("have.length", 1);
//
//   cy.get(".order-items table tbody tr")
//     .first()
//     .within(() => {
//       cy.contains("Apple Juice").should("be.visible");
//       cy.contains("Fresh Farm").should("be.visible");
//       cy.contains("2").should("be.visible");
//       cy.contains("200").should("exist");
//     });
//
//   // ===== เช็ค Cart Total เฉพาะการ์ดใบที่ 2 =====
//   cy.get(".summary .card-top").eq(1).within(() => {
//     // Subtotal
//     cy.contains("p", "Subtotal")
//       .siblings("span")
//       .should("contain", "200");
//
//     // Discount
//     cy.contains("p", "Discount")
//       .siblings("span")
//       .should("contain", "20");
//
//     // Shipping (ค่าขนส่ง)
//     cy.contains("p", "Shipping")
//       .siblings("span")
//       .should("contain", "30");
//
//     // Total price
//     cy.contains("p", "Total price")
//       .siblings("span")
//       .should("contain", "210");
//   });
// });
//
//
//     it("D3: Dropdown สถานะเริ่มต้นเป็น PENDING และมีตัวเลือกครบ", () => {
//         cy.get("#statusSelect")
//             .should("be.visible")
//             .and("have.value", "PENDING");
//
//
//         cy.get("#statusSelect")
//             .find("option")
//             .should("have.length", 6)
//             .then(($opts) => {
//                 const values = [...$opts].map((o) => o.value);
//                 expect(values).to.include.members([
//                     "PENDING",
//                     "PREPARING",
//                     "READY_TO_SHIP",
//                     "SHIPPING",
//                     "DELIVERED",
//                     "CANCELLED",
//                 ]);
//             });
//     });
//
//     it("D4: เปลี่ยนสถานะเป็น PREPARING แล้วยิง API และขึ้น popup สำเร็จ", () => {
//
//         cy.intercept("PUT", `**/api/orders/${ORDER_ID}/status`, (req) => {
//
//             expect(req.body).to.deep.equal({ status: "PREPARING" });
//             req.reply({
//                 statusCode: 200,
//                 body: { ...sampleOrder, orderStatus: "PREPARING" },
//             });
//         }).as("updateStatus");
//
//         cy.get("#statusSelect").select("PREPARING");
//         cy.contains("button.change", "Change").click();
//
//         cy.wait("@updateStatus");
//
//         cy.get(".status-card .status-text")
//             .contains("Preparing")
//             .should("be.visible");
//
//
//         cy.contains("โปรดตรวจสอบ").should("be.visible");
//         cy.contains("li", "Status Complaete").should("be.visible");
//
//
//         cy.contains("button", "confirm").click();
//         cy.contains("โปรดตรวจสอบ").should("not.exist");
//     });
//
//     it("D5: ถ้า backend อัปเดตสถานะพัง ต้องขึ้น popup แจ้งเตือน error", () => {
//
//         cy.intercept(
//             { method: /PUT|PATCH|POST/, url: `**/api/orders/${ORDER_ID}*` },
//             {
//                 statusCode: 500,
//                 body: { message: "internal error" },
//             }
//         ).as("updateStatusFail");
//
//         cy.get("#statusSelect").select("DELIVERED");
//         cy.contains("button.change", "Change").click();
//
//         cy.wait("@updateStatusFail");
//
//
//         cy.contains("โปรดตรวจสอบ").should("be.visible");
//         cy.contains("อัปเดตสถานะไม่สำเร็จ").should("be.visible");
//
//         cy.contains("button", "confirm").click();
//         cy.contains("โปรดตรวจสอบ").should("not.exist");
//     });
// });
