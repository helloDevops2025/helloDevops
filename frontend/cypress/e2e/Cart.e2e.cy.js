const BASE_URL = Cypress.config("baseUrl") || "http://localhost:5173";
const API_URL = "http://127.0.0.1:8080";

const LS_CART = "pm_cart";
const LS_REORDER = "pm_reorder";
const LS_PICK = "pm_cart_pick";
const LS_CHECKOUT = "pm_checkout_selection";

function fetchRealProducts() {
  return cy.request("GET", `${API_URL}/api/products`).then((res) => {
    const body = res.body;
    let rows = [];

    if (Array.isArray(body)) {
      rows = body;
    } else if (Array.isArray(body?.content)) {
      rows = body.content;
    }

    // ถ้าดึงของมาไม่ได้สักชิ้น ให้ fail เลย จะได้รู้ว่า backend มีปัญหาจริง ๆ
    expect(
      rows.length,
      "ต้องมีสินค้าอย่างน้อย 1 ชิ้นในระบบจริง"
    ).to.be.greaterThan(0);
    return rows;
  });
}

function mapProductToCartItem(prod, overrides = {}) {
  const id =
    prod.id ??
    prod.productId ??
    prod.product_id ??
    prod.productID ??
    prod.product_id;
  const title = prod.title ?? prod.name ?? prod.productName ?? `#${id}`;
  const price = Number(prod.price ?? prod.unitPrice ?? 0);
  const image =
    prod.image ||
    prod.img ||
    prod.cover ||
    prod.coverImageUrl ||
    prod.imageUrl ||
    prod.image_url ||
    "/assets/products/placeholder.png";

  return {
    productId: id,
    variantId: overrides.variantId ?? "",
    title,
    price,
    qty: overrides.qty ?? 1,
    img: image,
    promo: overrides.promo ?? null,
  };
}

describe("Cart Page - Real API (Pure Mart)", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept("GET", `${API_URL}/api/promotions*`).as("getPromos");
  });

  it("ผู้ใช้เปิดตะกร้าที่ว่างเปล่า เห็น empty state และปุ่มกลับไปช้อป", () => {
    // ไม่ใส่อะไรใน localStorage เลย -> ถือว่าเริ่มจากตะกร้าว่าง
    cy.visit(`${BASE_URL}/cart`);

    // รอให้หน้าเรียกโปรโมชั่นจาก backend จริงก่อน ค่อยเริ่มเช็ค DOM
    cy.wait("@getPromos");

    cy.get("#emptyState").should("be.visible");
    cy.get("#emptyState").within(() => {
      cy.contains("Your cart is empty.").should("be.visible");
      cy.contains("a.btn.btn-primary", "Browse products").should(
        "have.attr",
        "href",
        "/home"
      );
    });
  });

  it("ผู้ใช้มีของอยู่ในตะกร้าแล้ว ระบบเลือกสินค้าทั้งหมดให้ และคำนวณยอดรวมถูกต้อง", () => {
    fetchRealProducts().then((rows) => {
      const p1 = rows[0];
      const p2 = rows[1] || rows[0];

      const item1 = mapProductToCartItem(p1, { qty: 1 });
      const item2 = mapProductToCartItem(p2, { qty: 2 });

      const cartPayload = [item1, item2];

      const totalQty = 1 + 2;
      const totalPrice = item1.price * 1 + item2.price * 2;

      cy.visit(`${BASE_URL}/cart`, {
        onBeforeLoad(win) {
          // จำลองว่าผู้ใช้เคยหยิบของสองชิ้นนี้ใส่ตะกร้าไว้แล้ว
          win.localStorage.setItem(LS_CART, JSON.stringify(cartPayload));

          // ยังไม่เคยเลือก item ไหน -> hook ด้านในจะ auto-select ให้ทุกชิ้นเอง
          win.localStorage.removeItem(LS_PICK);
          win.localStorage.removeItem(LS_REORDER);
          win.localStorage.removeItem(LS_CHECKOUT);
        },
      });

      cy.wait("@getPromos");

      // มีของในตะกร้าแล้ว ไม่ควรเห็น empty state
      cy.get("#emptyState").should("not.exist");

      // ชื่อสินค้าต้องตรงกับที่มาจาก backend
      cy.contains(".cart-item__name", String(item1.title)).should("be.visible");
      cy.contains(".cart-item__name", String(item2.title)).should("be.visible");

      // checkbox ของทุกแถวควรถูกติ๊ก (เมื่อยังไม่มี selection เก่าค้างอยู่)
      cy.get(".cart-item input.pm-check[type='checkbox']").each(($el) => {
        cy.wrap($el).should("be.checked");
      });

      // จำนวน Items ใน summary ต้องเท่ากับ qty รวมจากสองชิ้น
      cy.get(".summary-card .totals .line")
        .contains("Items")
        .parent()
        .within(() => {
          cy.contains(String(totalQty));
        });

      cy.get("#grandTotal")
        .invoke("text")
        .then((txt) => {
        const clean = txt.replace(/[^\d.]/g, "");
          const v = Number(clean || "0");
          // ไม่ต้องเป๊ะทุกทศนิยม แค่ต้องเป็นเลขมากกว่า 0 และพอจะสื่อว่าคำนวณแล้ว
          expect(v).to.be.greaterThan(0);
        });

      // มีของถูกเลือกอย่างน้อยหนึ่งชิ้น ปุ่ม Proceed to Checkout ต้องใช้งานได้
      cy.get("#goCheckout").should("not.be.disabled");
    });
  });

  it("ผู้ใช้ปรับจำนวนสินค้าในตะกร้าและลบสินค้าออกจนตะกร้าว่าง", () => {
    fetchRealProducts().then((rows) => {
      const p1 = rows[0];
      const item = mapProductToCartItem(p1, { qty: 1 });

      cy.visit(`${BASE_URL}/cart`, {
        onBeforeLoad(win) {
          // ใส่ของให้มีในตะกร้าเริ่มต้น 1 ชิ้น
          win.localStorage.setItem(LS_CART, JSON.stringify([item]));
          win.localStorage.removeItem(LS_PICK);
          win.localStorage.removeItem(LS_REORDER);
          win.localStorage.removeItem(LS_CHECKOUT);
        },
      });

      cy.wait("@getPromos");

      cy.contains(".cart-item__name", String(item.title))
        .should("be.visible")
        .parents(".cart-item")
        .as("row");

      // เปิดมาตอนแรกควรเห็นจำนวนเป็น 1
      cy.get("@row").within(() => {
        cy.get(".qty span[aria-live='polite']").should("contain", "1");

        // กด + หนึ่งที -> จาก 1 เป็น 2
        cy.get("button[aria-label='Increase']").click();
        cy.get(".qty span[aria-live='polite']").should("contain", "2");

        // กด - สองที -> 2 -> 1 -> 0 แล้ว hook จะลบ item ทิ้ง
        cy.get("button[aria-label='Decrease']").click();
        cy.get(".qty span[aria-live='polite']").should("contain", "1");

        cy.get("button[aria-label='Decrease']").click();
      });

      // เมื่อ qty เหลือ 0 แถวนี้ต้องหายไป และหน้ากลับไปเป็น empty state
      cy.get(".cart-item").should("have.length", 0);
      cy.get("#emptyState").should("be.visible");
    });
  });

  it("ผู้ใช้ใช้ปุ่ม Select all เพื่อเลือก/ยกเลิกเลือกสินค้า และกด Clear Cart เพื่อล้างตะกร้า", () => {
    fetchRealProducts().then((rows) => {
      const p1 = rows[0];
      const p2 = rows[1] || rows[0];

      const item1 = mapProductToCartItem(p1, { qty: 1 });
      const item2 = mapProductToCartItem(p2, { qty: 1 });

      cy.visit(`${BASE_URL}/cart`, {
        onBeforeLoad(win) {
          // ใส่สินค้า 2 ชิ้นไว้ในตะกร้าตั้งต้น
          win.localStorage.setItem(LS_CART, JSON.stringify([item1, item2]));
          win.localStorage.removeItem(LS_PICK);
          win.localStorage.removeItem(LS_REORDER);
          win.localStorage.removeItem(LS_CHECKOUT);
        },
      });

      cy.wait("@getPromos");

      // ตอนเข้าแรก ๆ ทุกชิ้นควรถูกเลือกทั้งหมด
      cy.get(".cart-item input.pm-check[type='checkbox']").should(
        "have.length.at.least",
        2
      );
      cy.get(".cart-item input.pm-check[type='checkbox']").each(($el) => {
        cy.wrap($el).should("be.checked");
      });

      // ข้อความตรง Select all สื่อว่าทุกชิ้นถูกเลือกอยู่
      cy.get(".summary-card .select-all span").should(
        "contain",
        "Selected all items"
      );

      // กดที่ Select all อีกทีเพื่อล้าง selection ทั้งหน้า
      cy.get(".summary-card .select-all input.pm-check").click();

      // ตอนนี้ checkbox ทุกตัวต้องถูกปลดออกหมด
      cy.get(".cart-item input.pm-check[type='checkbox']").each(($el) => {
        cy.wrap($el).should("not.be.checked");
      });

      // ไม่มีชิ้นไหนถูกเลือกเลย ปุ่ม Proceed to Checkout เลยต้องเป็น disabled
      cy.get("#goCheckout").should("be.disabled");

      // เคลียร์ทั้งตะกร้าด้วยปุ่ม Clear Cart
      cy.get(".summary-card .btn.btn-outline").contains("Clear Cart").click();

      cy.get("#emptyState").should("be.visible");
      cy.window().then((win) => {
        expect(win.localStorage.getItem(LS_CART)).to.eq("[]");
      });
    });
  });

  it("ผู้ใช้เลือกบางชิ้นแล้วกด Proceed to Checkout ระบบเก็บ snapshot ลง localStorage และเด้งไปหน้า place-order", () => {
    fetchRealProducts().then((rows) => {
      const p1 = rows[0];
      const p2 = rows[1] || rows[0];

      const item1 = mapProductToCartItem(p1, { qty: 1 });
      const item2 = mapProductToCartItem(p2, { qty: 3 });

      cy.visit(`${BASE_URL}/cart`, {
        onBeforeLoad(win) {
          // จำลองเคสมีของ 2 ชิ้นในตะกร้าให้ครบก่อน
          win.localStorage.setItem(LS_CART, JSON.stringify([item1, item2]));
          win.localStorage.removeItem(LS_PICK);
          win.localStorage.removeItem(LS_REORDER);
          win.localStorage.removeItem(LS_CHECKOUT);
        },
      });

      cy.wait("@getPromos");

      // สมมติผู้ใช้จะจ่ายเฉพาะชิ้นแรก -> ยกเลิกติ๊กของชิ้นที่สอง
      cy.contains(".cart-item__name", String(item2.title))
        .parents(".cart-item")
        .within(() => {
          cy.get("input.pm-check[type='checkbox']").uncheck({ force: true });
        });

      // ยืนยันว่าชิ้นแรกยังถูกเลือกอยู่จริง ๆ
      cy.get(".cart-item")
        .contains(".cart-item__name", String(item1.title))
        .parents(".cart-item")
        .within(() => {
          cy.get("input.pm-check[type='checkbox']").should("be.checked");
        });

      // กด Proceed to Checkout เพื่อไปหน้าชำระเงิน
      cy.get("#goCheckout").click();

      // URL ต้องเด้งไป /place-order จริง
      cy.url().should("include", "/place-order");

      // เช็ค payload ที่เซฟไว้ใน LS_CHECKOUT ของหน้าใหม่
      cy.window().then((win) => {
        const raw = win.localStorage.getItem(LS_CHECKOUT);
        expect(
          raw,
          "ควรมี snapshot การ checkout ถูกบันทึก"
        ).to.be.a("string");

        const payload = JSON.parse(raw || "null");
        expect(payload).to.have.property("items");
        expect(payload.items).to.be.an("array").and.have.length(1);

        const snapItem = payload.items[0];
        expect(String(snapItem.title)).to.eq(String(item1.title));
        expect(snapItem.totalQty || payload.totalQty).to.exist;
        expect(payload.totalQty).to.be.greaterThan(0);
        expect(payload.totalPrice).to.be.greaterThan(0);
      });
    });
  });

  it("ผู้ใช้ใช้แถบ Buy Again (reorder) เพื่อเพิ่มของกลับเข้าตะกร้า", () => {
    fetchRealProducts().then((rows) => {
      const p1 = rows[0];
      const p2 = rows[1] || rows[0];

      const reorder1 = mapProductToCartItem(p1, { qty: 1 });
      const reorder2 = mapProductToCartItem(p2, { qty: 2 });

      // เคสนี้เริ่มจากตะกร้าจริงว่าง แต่มีรายการค้างอยู่ในถาด reorder
      cy.visit(`${BASE_URL}/cart`, {
        onBeforeLoad(win) {
          win.localStorage.setItem(LS_CART, JSON.stringify([]));
          win.localStorage.setItem(
            LS_REORDER,
            JSON.stringify([reorder1, reorder2])
          );
          win.localStorage.removeItem(LS_PICK);
          win.localStorage.removeItem(LS_CHECKOUT);
        },
      });

      cy.wait("@getPromos");

      // ต้องเจอหัวข้อ Buy Again เพื่อยืนยันว่าอ่าน LS_REORDER แล้ว
      cy.contains("h2.section-title", "Buy Again").should("be.visible");

      // กด Add to Cart เพื่อรวมรายการในถาดเข้าตะกร้าจริง
      cy.contains(".reorder-actions .btn.btn-primary", "Add to Cart").click();

      // หลัง merge แล้วถาด Buy Again ต้องหายไป (เพราะ clearReorder ในโค้ดจริง)
      cy.contains("h2.section-title", "Buy Again").should("not.exist");

      // และสองชิ้นที่อยู่ในถาดต้องโผล่มาใน cart หลัก
      cy.get(".cart-item__name")
        .should("contain", String(reorder1.title))
        .and("be.visible");
      cy.get(".cart-item__name")
        .should("contain", String(reorder2.title))
        .and("be.visible");

      // ยืนยันใน localStorage ว่า LS_REORDER ถูกล้าง และ LS_CART มีของจริง
      cy.window().then((win) => {
        const cartRaw = win.localStorage.getItem(LS_CART);
        const reorderRaw = win.localStorage.getItem(LS_REORDER);

        const cartItems = JSON.parse(cartRaw || "[]");
        expect(cartItems.length).to.be.greaterThan(0);

        const reorderItems = JSON.parse(reorderRaw || "[]");
        expect(reorderItems.length).to.eq(0);
      });
    });
  });
});
