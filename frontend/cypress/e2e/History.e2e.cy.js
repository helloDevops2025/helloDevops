const BASE_URL = Cypress.config("baseUrl") || "http://localhost:3001";
const API_URL = "http://127.0.0.1:8080";

// localStorage keys
const REORDER_KEY = "pm_reorder";
const CART_KEY = "pm_cart";

// path ของหน้า Order History ในระบบจริง
const HISTORY_PATH = "/history";

describe("Order History Page", () => {

  beforeEach(() => {
    // เคลียร์ข้อมูลเก่าก่อนเริ่มทุกเทส เพื่อให้สภาพเหมือนผู้ใช้เปิดเว็บรอบใหม่
    cy.clearLocalStorage();
  });

  it("ผู้ใช้เปิดหน้า History แล้วควรเห็นรายการที่โหลดมาจาก backend จริง", () => {
    // ดักไว้เฉย ๆ เพื่อรอให้ request จริงเสร็จ ไม่ได้ mock อะไรทั้งนั้น
    cy.intercept("GET", `${API_URL}/api/orders`).as("getOrders");

    cy.visit(`${BASE_URL}${HISTORY_PATH}`);
    cy.wait("@getOrders");

    // รอจนหน้าเริ่ม render อะไรบางอย่าง ไม่ว่าจะเป็นการ์ดจริงหรือข้อความบอกว่าไม่มีข้อมูล
    cy.get(".hx-card, .hx-empty", { timeout: 10000 }).should("exist");

    cy.get(".hx-card").then(($cards) => {
      if ($cards.length > 0) {
        // มีรายการสั่งซื้อจริงในระบบ
        cy.log(`พบรายการสั่งซื้อจำนวน ${$cards.length} รายการ`);

        // เปิดการ์ดแรก ๆ เพื่อดูว่าโครง UI ถูกต้อง
        cy.get(".hx-card")
          .first()
          .within(() => {
            cy.contains("Order ID:").should("exist");
            cy.get(".hx-id").should("exist");
            cy.get(".hx-total").should("contain.text", "Total");
            cy.get(".hx-qty").should("contain.text", "Total Items");
          });

        // ต้องมีส่วน tab และช่อง search ให้ใช้งานได้
        cy.get(".hx-tabs").should("exist");
        cy.get(".hx-search input[aria-label='Search order']").should("exist");

      } else {
        // ถ้ายังไม่มี order ในระบบเลย ก็ต้องขึ้นข้อความว่างแบบสุภาพ
        cy.get(".hx-empty").should("be.visible");
      }
    });
  });

  it("ผู้ใช้สลับ tab ดูเฉพาะสถานะต่าง ๆ (All / Completed / Cancelled) แล้วหน้าต้องไม่พัง", () => {
    cy.intercept("GET", `${API_URL}/api/orders`).as("getOrders");

    cy.visit(`${BASE_URL}${HISTORY_PATH}`);
    cy.wait("@getOrders");

    // รอให้หน้าโหลดการ์ดหรือขึ้น empty ก่อน
    cy.get(".hx-card, .hx-empty", { timeout: 10000 }).should("exist");

    const tabs = ["All", "Completed", "Cancelled"];

    tabs.forEach((tabName) => {
      // คลิก tab ทีละอันเหมือนผู้ใช้ลองกดเล่นดูสามสถานะ
      cy.contains("button.hx-tab", tabName).click();

      // พอกดแล้ว หน้าไม่ควรพัง และต้องแสดงของหรือขึ้น empty อย่างใดอย่างหนึ่ง
      cy.get(".hx-card, .hx-empty", { timeout: 10000 }).should("exist");

      cy.get("body").then(($body) => {
        const hasCards = $body.find(".hx-card").length > 0;
        if (hasCards) {
          cy.get(".hx-card").its("length").should("be.gte", 1);
        } else {
          cy.get(".hx-empty").should("be.visible");
        }
      });
    });
  });

  it("ผู้ใช้ค้นหา order ด้วยเลข order id แล้วควรเจอเฉพาะรายการที่เกี่ยวข้องจริง ๆ", () => {
    cy.intercept("GET", `${API_URL}/api/orders`).as("getOrders");

    cy.visit(`${BASE_URL}${HISTORY_PATH}`);
    cy.wait("@getOrders");

    // เทสนี้จำเป็นต้องมี order อย่างน้อย 1 รายการจริง
    cy.get(".hx-card", { timeout: 10000 }).should("have.length.at.least", 1);

    // ดึงเลข order id จากการ์ดแรกมาเป็น keyword ในการ search
    cy.get(".hx-card")
      .first()
      .find(".hx-id")
      .invoke("text")
      .then((idText) => {
        const orderId = idText.replace("#", "").trim();
        expect(orderId, "ต้องมี order id ใน UI จริง").to.not.equal("");

        cy.get(".hx-search input[aria-label='Search order']")
          .clear()
          .type(orderId);

        // หลังพิมพ์ค้นหา ต้องเหลือรายการที่ตรงกับ id เท่านั้น
        cy.get(".hx-card").should("have.length.at.least", 1);
        cy.get(".hx-card").each(($card) => {
          cy.wrap($card).should("contain.text", orderId);
        });
      });
  });

  it("ผู้ใช้กด Buy Again แล้วระบบต้องสร้างรายการสั่งซื้อใหม่ และพาไปหน้า Cart", () => {
    cy.intercept("GET", `${API_URL}/api/orders`).as("getOrders");

    cy.visit(`${BASE_URL}${HISTORY_PATH}`);
    cy.wait("@getOrders");

    // ต้องมี order อย่างน้อย 1 อันให้กด Buy Again
    cy.get(".hx-card", { timeout: 10000 }).should("have.length.at.least", 1);

    // เปิดการ์ดแรกแล้วกด Buy Again
    cy.get(".hx-card")
      .first()
      .within(() => {
        cy.contains("button", "Buy Again").click();
      });

    // ต้องถูกพาไปหน้า cart เสมอ
    cy.url().should("include", "/cart");

    cy.window().then((win) => {
      const raw = win.localStorage.getItem(REORDER_KEY);
      expect(raw, "หลังกด Buy Again ต้องสร้าง pm_reorder").to.be.a("string");

      const arr = JSON.parse(raw || "[]");
      expect(arr).to.be.an("array");
      expect(arr.length).to.be.greaterThan(0);

      // ดูรายการแรกแบบคร่าว ๆ ว่า structure ถูกต้องพร้อมใช้งานต่อ
      const first = arr[0];
      expect(first).to.include.keys(
        "productId",
        "variantId",
        "title",
        "price",
        "qty",
        "img"
      );

      // pm_cart ไม่ควรถูกแก้ไขใน flow นี้
      const cartRaw = win.localStorage.getItem(CART_KEY);
      if (cartRaw) {
        const cartArr = JSON.parse(cartRaw || "[]");
        expect(cartArr).to.be.an("array");
      }
    });
  });

  it("ผู้ใช้กด View Details แล้วต้องถูกพาไปหน้า tracking-user ของคำสั่งซื้อนั้น", () => {
    cy.intercept("GET", `${API_URL}/api/orders`).as("getOrders");

    cy.visit(`${BASE_URL}${HISTORY_PATH}`);
    cy.wait("@getOrders");

    // ต้องมีการ์ดจริงให้กด
    cy.get(".hx-card", { timeout: 10000 }).should("have.length.at.least", 1);

    // เปิดการ์ดแรกแล้วกดปุ่ม view details
    cy.get(".hx-card")
      .first()
      .within(() => {
        cy.contains("button", "View Details").click();
      });

    // path ต้องนำไปที่หน้า tracking-user เสมอ ไม่ว่ารหัส order เป็นอะไร
    cy.url().should("include", "/tracking-user/");
  });

  it("ถ้าระบบมีหลายหน้า ผู้ใช้กด Next แล้วหน้าใหม่ต้องแสดงรายการหรือข้อความว่างได้ตามปกติ", () => {
    cy.intercept("GET", `${API_URL}/api/orders`).as("getOrders");

    cy.visit(`${BASE_URL}${HISTORY_PATH}`);
    cy.wait("@getOrders");

    cy.get("body").then(($body) => {
      const hasPager = $body.find(".hx-pager").length > 0;

      if (!hasPager) {
        // ถ้า order ยังน้อย ไม่ถึงขั้นต้องมี pagination ก็หยุดเทสแค่นี้
        cy.log("ยังไม่มี pagination เพราะจำนวน order ในระบบไม่ถึง");
        return;
      }

      // ถ้ามี pagination ก็ต้องมีการ์ดให้แสดง
      cy.get(".hx-card", { timeout: 10000 }).should("have.length.at.least", 1);

      // ทดสอบปุ่ม Next ›
      cy.contains("button.hx-page", "Next ›").then(($btn) => {
        if ($btn.is(":disabled")) {
          // ถ้า disable แสดงว่าอยู่หน้าสุดท้ายแล้ว
          cy.log("อยู่หน้าสุดท้ายแล้ว ปุ่ม Next ใช้งานไม่ได้");
          return;
        }

        // ถ้ากดได้ ก็ลองกดเพื่อดูว่าหน้าใหม่ไม่มี error
        cy.wrap($btn).click();

        cy.get(".hx-card, .hx-empty", { timeout: 10000 }).should("exist");
      });
    });
  });

});
