const REORDER_KEY = "pm_reorder";

/**
 * ชุดข้อมูลออเดอร์จำลอง เอาไว้ให้เทสใช้แทน backend จริง
 * เวลาเทสจะได้ไม่พังเพราะ API ล่มหรือข้อมูลเปลี่ยน
 */
const FULL_ORDERS = [
  {
    id: 1001,
    orderStatus: "DELIVERED",
    totalAmount: 450,
    shippingAddress: "Bangkok, Thailand",
    orderedAt: "2025-11-01T10:00:00Z",
    orderItems: [
      {
        quantity: 2,
        priceEach: 100,
        product: {
          id: 1,
          name: "Alpha Coffee",
          price: 100,
        },
      },
      {
        quantity: 1,
        priceEach: 250,
        product: {
          id: 2,
          name: "Bravo Tea",
          price: 250,
        },
      },
    ],
  },
  {
    id: 1002,
    orderStatus: "CANCELLED",
    totalAmount: 200,
    shippingAddress: "Chiang Mai, Thailand",
    orderedAt: "2025-11-02T12:30:00Z",
    orderItems: [
      {
        quantity: 1,
        priceEach: 200,
        product: {
          id: 3,
          name: "Charlie Cookie",
          price: 200,
        },
      },
    ],
  },
  {
    id: 1003,
    orderStatus: "PENDING",
    totalAmount: 300,
    shippingAddress: "Khon Kaen, Thailand",
    orderedAt: "2025-11-03T15:00:00Z",
    orderItems: [
      {
        quantity: 3,
        priceEach: 100,
        product: {
          id: 4,
          name: "Delta Drink",
          price: 100,
        },
      },
    ],
  },
  // เพิ่มออเดอร์เข้าไปอีกเผื่อเทสเคสที่มีหลายหน้า (มากกว่า PAGE_SIZE = 6)
  ...[4, 5, 6, 7].map((i) => ({
    id: 1000 + i,
    orderStatus: "DELIVERED",
    totalAmount: 100,
    shippingAddress: `Test City ${i}`,
    orderedAt: `2025-11-0${i}T10:00:00Z`,
    orderItems: [
      {
        quantity: 1,
        priceEach: 100,
        product: {
          id: i + 1,
          name: `Echo Item ${i}`,
          price: 100,
        },
      },
    ],
  })),
];

/**
 * ข้อมูลหัวออเดอร์เอาไว้ตอบ /api/orders (หน้า list รวมแบบสั้น ๆ)
 * สมมติว่า endpoint นี้ไม่ได้ให้รายละเอียดสินค้า แค่สถานะคร่าว ๆ
 */
const ORDER_LIST = FULL_ORDERS.map((o) => ({
  id: o.id,
  orderStatus: o.orderStatus,
}));

/* ===========================================
   กลุ่มเทสหลัก – จำลองการใช้งานหน้า History ตามมุมมองผู้ใช้
   =========================================== */
describe("Order History Page", () => {
  /**
   * ก่อนเริ่มแต่ละเทส:
   * - ดัก API /api/orders และ /api/orders/:id ให้ตอบด้วย mock data ด้านบน
   * - เคลียร์ localStorage ให้เหมือนผู้ใช้เปิดเว็บรอบใหม่
   * - เปิดหน้า Order History จริง ๆ ผ่าน router
   */
  beforeEach(() => {
    cy.intercept("GET", "**/api/orders", (req) => {
      // ถ้าเป็น /api/orders/:id ให้ส่งต่อไปให้อีก intercept ด้านล่างจัดการ
      if (/\/api\/orders\/\d+$/i.test(req.url)) {
        req.continue();
        return;
      }
      req.reply({ statusCode: 200, body: ORDER_LIST });
    }).as("getOrdersList");

    cy.intercept("GET", "**/api/orders/*", (req) => {
      const id = Number(req.url.split("/").pop());
      const found = FULL_ORDERS.find((o) => o.id === id);
      req.reply({ statusCode: 200, body: found || {} });
    }).as("getOrderDetail");

    cy.clearLocalStorage();
    cy.visit("/history");

    cy.wait("@getOrdersList");
    cy.wait("@getOrderDetail");
  });

  it("ผู้ใช้เปิดหน้าประวัติคำสั่งซื้อแล้ว ต้องเห็น breadcrumb, แท็บ และออเดอร์ทันที", () => {
    // ผู้ใช้ควรรู้จาก breadcrumb ว่าตอนนี้ตัวเองอยู่หน้าไหนของเว็บ
    cy.contains(".custom-breadcrumb", "HOME").should("be.visible");
    cy.contains(".custom-breadcrumb", "SHOP").should("be.visible");
    cy.contains(".custom-breadcrumb", "ORDER HISTORY").should("be.visible");

    // แท็บ All ต้องถูกเลือกเป็นค่าเริ่มต้น เหมือนเปิดมาดูทุกสถานะก่อน
    cy.contains(".hx-tab", "All")
      .should("have.class", "is-active")
      .and("have.attr", "aria-selected", "true");

    // หน้าแรกต้องมีการ์ดออเดอร์ขึ้นจริง ไม่ใช่หน้าโล่ง ๆ
    cy.get(".hx-card").should("have.length.at.least", 1);

    // ลองเช็กออเดอร์ตัวอย่าง (#1001) ว่าข้อมูลหลักขึ้นครบ ๆ
    cy.contains(".hx-card", "#1001").within(() => {
      cy.contains("Order ID:").should("be.visible");
      cy.contains("Total Items 3").should("be.visible"); // 2+1 = 3 ชิ้น
      cy.contains("450").should("be.visible"); // ผู้ใช้อย่างน้อยต้องเห็นยอดรวมคร่าว ๆ
      cy.contains(".hx-status-right", "Order Completed").should("be.visible");
    });
  });

  it("ผู้ใช้สลับแท็บระหว่าง Completed / Cancelled ได้ และรายการต้องเปลี่ยนตาม", () => {
    // ถ้าผู้ใช้เลือกดูเฉพาะออเดอร์ที่ทำเสร็จแล้ว (Completed)
    cy.contains(".hx-tab", "Completed").click();
    cy.get(".hx-card").each(($c) => {
      cy.wrap($c).find(".hx-status-right").should("contain.text", "Order Completed");
    });

    // ถ้าอยากดูเฉพาะออเดอร์ที่โดนยกเลิก (Cancelled)
    cy.contains(".hx-tab", "Cancelled").click();
    cy.get(".hx-card").each(($c) => {
      cy.wrap($c).find(".hx-status-right").should("contain.text", "Cancelled");
    });

    // กลับมาที่ All อีกที → ต้องกลับมาเห็นทุกสถานะปนกันเหมือนตอนแรก
    cy.contains(".hx-tab", "All").click();
    cy.get(".hx-card").should("have.length.at.least", 3);
  });

  it("ช่องค้นหาควรทำให้ผู้ใช้หาออเดอร์จากสินค้า / ที่อยู่ / เลขออเดอร์ได้แบบตรงใจ", () => {
    // เคส 1: ผู้ใช้จำชื่อสินค้าได้ → พิมพ์คำว่า "Alpha" ลงไป
    cy.get(".hx-search input[aria-label='Search order']").clear().type("Alpha");
    cy.wait(600); // รอ debounce ให้ filter ทำงาน

    // ตอนนี้ควรเหลือแค่ออเดอร์ที่มีสินค้านี้ (#1001)
    cy.contains(".hx-card", "#1001").should("be.visible");
    cy.contains(".hx-card", "#1002").should("not.exist");
    cy.contains(".hx-card", "#1003").should("not.exist");

    // เคส 2: ผู้ใช้จำที่อยู่จัดส่งได้ → พิมพ์เมืองปลายทาง เช่น "Chiang"
    cy.get(".hx-search input[aria-label='Search order']").clear().type("Chiang");
    cy.wait(600);

    cy.contains(".hx-card", "#1002").should("be.visible");
    cy.contains(".hx-card", "#1001").should("not.exist");
    cy.contains(".hx-card", "#1003").should("not.exist");

    // เคส 3: ผู้ใช้จำเลขออเดอร์อย่างเดียว → พิมพ์ "1003"
    cy.get(".hx-search input[aria-label='Search order']").clear().type("1003");
    cy.wait(600);

    cy.contains(".hx-card", "#1003").should("be.visible");
    cy.contains(".hx-card", "#1001").should("not.exist");
    cy.contains(".hx-card", "#1002").should("not.exist");
  });

  it("ผู้ใช้กด Buy Again แล้ว ระบบต้องจำของชุดเดิมให้ และพาไปหน้า Cart ต่อ", () => {
    // ผู้ใช้กดซื้อซ้ำจากออเดอร์ #1001
    cy.contains(".hx-card", "#1001").within(() => {
      cy.contains("button", "Buy Again").click();
    });

    // หลังจากกดแล้วควรถูกพาไปหน้า /cart เพื่อเช็กของก่อนกดยืนยัน
    cy.location("pathname").should("include", "/cart");

    // ข้างใน localStorage ต้องมี pm_reorder เก็บรายการของที่ถูกเตรียมไว้สั่งซ้ำ
    cy.window().then((win) => {
      const reorder = JSON.parse(win.localStorage.getItem(REORDER_KEY) || "[]");

      expect(reorder).to.have.length(2);
      expect(reorder[0]).to.include({ productId: "1", qty: 2 });
      expect(reorder[1]).to.include({ productId: "2", qty: 1 });
    });
  });

  it("ผู้ใช้กด View Details แล้วควรถูกพาไปหน้าเช็กสถานะของออเดอร์นั้น", () => {
    // เลือกออเดอร์ #1002 แล้วกดดูรายละเอียด
    cy.contains(".hx-card", "#1002").within(() => {
      cy.contains("button", "View Details").click();
    });

    // URL ต้องชี้ไปที่หน้า tracking ของออเดอร์นี้จริง ๆ
    cy.location("pathname").should("match", /\/tracking-user\/1002$/);
  });

  it("ถ้ามีออเดอร์หลายหน้า ผู้ใช้ต้องเปลี่ยนหน้าไปมาได้แบบไม่หลง", () => {
    // สมมติว่าหน้าแรกโชว์ได้ 6 ออเดอร์ตาม PAGE_SIZE
    cy.get(".hx-card").should("have.length", 6);

    // กด Next เพื่อไปหน้า 2
    cy.contains(".hx-pager .hx-page", "Next ›")
      .should("not.be.disabled")
      .click();

    // หน้า 2 ต้องมีออเดอร์ให้ดู และตัวเลขหน้าปัจจุบันต้องเปลี่ยนตาม
    cy.get(".hx-card").should("have.length.at.least", 1);
    cy.contains(".hx-pager .hx-page.is-current", "2").should("exist");

    // กด Prev เพื่อกลับมาหน้าแรกอีกครั้ง
    cy.contains(".hx-pager .hx-page", "‹ Prev")
      .should("not.be.disabled")
      .click();

    cy.contains(".hx-pager .hx-page.is-current", "1").should("exist");
    cy.get(".hx-card").should("have.length", 6);
  });

  it("ถ้าค้นหาแล้วไม่เจออะไรเลย ต้องมีข้อความบอกผู้ใช้แบบตรง ๆ ว่าไม่มีผลลัพธ์", () => {
    cy.get(".hx-search input[aria-label='Search order']")
      .clear()
      .type("THIS_SHOULD_NOT_MATCH_ANYTHING");

    cy.wait(600);

    // แทนที่จะปล่อยหน้าโล่ง ควรมีข้อความบอกว่าไม่พบรายการ
    cy.get(".hx-empty").should("contain.text", "No items found");
  });

  it("ถ้าใช้ search ร่วมกับแท็บ (เช่น Completed) ระบบต้องกรองตามทั้งสองเงื่อนไขพร้อมกัน", () => {
    // ไปที่แท็บ Completed ก่อน
    cy.contains(".hx-tab", "Completed").click();

    // ลองพิมพ์คำว่า Test (ซึ่งอยู่ในที่อยู่จำลอง Test City 4-7)
    cy.get(".hx-search input[aria-label='Search order']").clear().type("Test City");
    cy.wait(600);

    // ทุกการ์ดที่ยังเหลือต้องเป็น Completed และมีคำว่า Test City ในเนื้อหา
    cy.get(".hx-card").each(($c) => {
      cy.wrap($c)
        .find(".hx-status-right")
        .should("contain.text", "Order Completed");
      cy.wrap($c).should("contain.text", "Test City");
    });

    // เมื่อกดกลับไป All แล้วล้าง search รายการต้องกลับมาปกติ
    cy.contains(".hx-tab", "All").click();
    cy.get(".hx-search input[aria-label='Search order']").clear();
    cy.wait(600);

    cy.get(".hx-card").should("have.length", 6);
  });
});

/* ===========================================
   กลุ่มเทสเสริม – พฤติกรรมตอนโหลดข้อมูล (loading state)
   =========================================== */
describe("Order History Page - loading & error states", () => {
  it("ตอนที่ข้อมูลกำลังโหลด ผู้ใช้ควรเห็นตัวหมุน (spinner) ขึ้นมาแจ้งสถานะ", () => {
    cy.intercept("GET", "**/api/orders", (req) => {
      // ทำให้ API ตอบช้าหน่อย เพื่อจำลองเคสเน็ตช้า / server หน่วง
      req.reply({
        delay: 800,
        statusCode: 200,
        body: ORDER_LIST,
      });
    }).as("getOrdersListSlow");

    cy.intercept("GET", "**/api/orders/*", (req) => {
      const id = Number(req.url.split("/").pop());
      const found = FULL_ORDERS.find((o) => o.id === id);
      req.reply({ statusCode: 200, body: found || {} });
    }).as("getOrderDetail");

    cy.visit("/history");

    // ระหว่างที่ข้อมูลยังมาไม่ครบ ต้องเห็นตัวหมุนแจ้งว่าระบบกำลังอัปเดตอยู่
    cy.get(".hx-spinner").should("be.visible");

    cy.wait("@getOrdersListSlow");
    cy.wait("@getOrderDetail");

    // พอโหลดทุกอย่างเสร็จแล้ว ตัวหมุนไม่ควรโชว์ค้างอยู่
    cy.get(".hx-spinner").should("not.exist");
  });
});
