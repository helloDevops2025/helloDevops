const LS_WISH = "pm_wishlist";
const LS_CART = "pm_cart";

const MOCK_PRODUCTS = [
  { id: 1, name: "Alpha Coffee", price: 120, image_url: "/images/alpha.jpg" },
  { id: 2, name: "Bravo Tea", price: 80, image_url: "/images/bravo.jpg" },
  { id: 3, name: "Charlie Cookie", price: 200, image_url: "/images/charlie.jpg" },
];

// ใส่ wishlist ลง localStorage ก่อนโหลดหน้า
function seedWishlist(win, ids = [1, 2]) {
  win.localStorage.setItem(LS_WISH, JSON.stringify(ids));
  win.localStorage.removeItem(LS_CART);
}

describe("Wishlist Page", () => {
  beforeEach(() => {
    // Mock API ให้โหลดสินค้าเร็ว ไม่ต้องรอ backend จริง
    cy.intercept("GET", "**/api/products", {
      statusCode: 200,
      body: MOCK_PRODUCTS,
    }).as("getProducts");
  });

  it("ควรโหลดหน้า Wishlist และแสดงข้อมูลพื้นฐานถูกต้อง", () => {
    cy.visit("/wishlist", {
      onBeforeLoad(win) {
        seedWishlist(win, [1, 2]); // จำลองว่ามี 2 ชิ้นใน wishlist
      },
    });

    cy.wait("@getProducts");

    // ตรวจว่าหัวข้อหน้าแสดงถูกต้อง
    cy.contains("h1.wl-title", "WISHLIST").should("exist");

    // ตรวจ breadcrumb ว่าทางเดินหน้าเว็บแสดงครบ
    cy.get(".custom-breadcrumb").within(() => {
      cy.contains("a", "HOME").should("have.attr", "href", "/");
      cy.contains("a", "SHOP").should("have.attr", "href", "/shop");
      cy.contains(".current", "WISHLIST").should("exist");
    });

    // แสดงจำนวนสินค้าและจำนวนการ์ดต้องตรงกัน
    cy.get("#wl-count").should("have.text", "2");
    cy.get(".wl-card").should("have.length", 2);

    // ข้อความ empty ต้องไม่โชว์เมื่อมี item
    cy.get(".wl-empty").should("have.attr", "hidden");
  });

  it("ควรจัดเรียงสินค้าได้ทั้ง Low→High, High→Low และ Recent", () => {
    cy.visit("/wishlist", {
      onBeforeLoad(win) {
        seedWishlist(win, [1, 2, 3]); // มี 3 ชิ้น
      },
    });

    cy.wait("@getProducts");

    cy.get(".wl-card").should("have.length", 3);

    // เรียงจากราคาต่ำไปสูง
    cy.get("#wl-sort").select("priceAsc");
    cy.get(".wl-card").first().within(() => {
      cy.get(".wl-name").should("contain.text", "Bravo Tea"); // ราคาถูกสุด
    });

    // เรียงจากราคาสูงไปต่ำ
    cy.get("#wl-sort").select("priceDesc");
    cy.get(".wl-card").first().within(() => {
      cy.get(".wl-name").should("contain.text", "Charlie Cookie"); // แพงสุด
    });

    // Latest ตามลำดับที่ถูกเพิ่มเข้า wishlist
    cy.get("#wl-sort").select("recent");
    cy.get(".wl-card").first().within(() => {
      cy.get(".wl-name").should("contain.text", "Alpha Coffee"); // id แรก
    });
  });

  it("ควรลบสินค้าเฉพาะชิ้นได้ และ localStorage ต้องอัปเดตตาม", () => {
    cy.visit("/wishlist", {
      onBeforeLoad(win) {
        seedWishlist(win, [1, 2]);
      },
    });

    cy.wait("@getProducts");

    cy.get(".wl-card").should("have.length", 2);

    // ลบการ์ดตัวแรก
    cy.get(".wl-card").first().within(() => {
      cy.get(".wl-like").click();
    });

    // ตรวจว่าลบสำเร็จ
    cy.get(".wl-card").should("have.length", 1);
    cy.get("#wl-count").should("have.text", "1");

    // ตรวจค่าใน localStorage
    cy.window().then((win) => {
      const ids = JSON.parse(win.localStorage.getItem(LS_WISH) || "[]");
      expect(ids).to.deep.equal([2]);
    });
  });

  it("ควรแสดงข้อความ empty เมื่อ wishlist ว่าง", () => {
    cy.visit("/wishlist", {
      onBeforeLoad(win) {
        seedWishlist(win, []); // ไม่มีสินค้าเลย
      },
    });

    cy.get(".wl-card").should("have.length", 0);

    // ต้องเห็นข้อความ empty
    cy.get(".wl-empty").should("not.have.attr", "hidden");
    cy.get(".wl-empty").should("contain.text", "No items in your wishlist");

    // count ต้องเป็น 0
    cy.get("#wl-count").should("have.text", "0");
  });

  it("ปุ่ม Clear All ควรเปิด modal และกด Clear แล้วต้องล้างรายการทั้งหมด", () => {
    cy.visit("/wishlist", {
      onBeforeLoad(win) {
        seedWishlist(win, [1, 2]);
      },
    });

    cy.wait("@getProducts");

    // ตรวจว่ามี 2 รายการก่อน
    cy.get(".wl-card").should("have.length", 2);

    // กดปุ่ม Clear All
    cy.get("#wl-clear").click();

    // Modal ต้องเด้งขึ้นมา
    cy.get("#confirm-modal").should("exist");

    // กดยืนยันล้างทั้งหมด
    cy.get("#confirm-modal").within(() => {
      cy.contains("button", "Clear all").click();
    });

    // ต้องไม่มี item เหลือแล้ว
    cy.get(".wl-card").should("have.length", 0);
    cy.get("#wl-count").should("have.text", "0");

    // localStorage ต้องกลายเป็น []
    cy.window().then((win) => {
      const ids = JSON.parse(win.localStorage.getItem(LS_WISH) || "[]");
      expect(ids).to.deep.equal([]);
    });

    // ต้องเห็นข้อความ empty
    cy.get(".wl-empty").should("not.have.attr", "hidden");
  });

  it("ADD TO CART ควรเพิ่มลงตะกร้า และกดซ้ำต้องเพิ่มจำนวน", () => {
    cy.visit("/wishlist", {
      onBeforeLoad(win) {
        seedWishlist(win, [1]); // มีสินค้า id 1
      },
    });

    cy.wait("@getProducts");

    // ตอนแรกไม่มี cart
    cy.window().then((win) => {
      expect(win.localStorage.getItem(LS_CART)).to.be.null;
    });

    // เพิ่มเข้าตะกร้า 1 ครั้ง
    cy.get(".wl-card").first().within(() => {
      cy.contains("button", "ADD TO CART").click();
      cy.contains("button", "ADDED ✓").should("exist"); // ป้ายชั่วคราว
    });

    // item ต้องถูกเพิ่มใน localStorage
    cy.window().then((win) => {
      const cart = JSON.parse(win.localStorage.getItem(LS_CART) || "[]");
      expect(cart[0]).to.include({
        id: "1",
        name: "Alpha Coffee",
      });
      expect(cart[0].qty).to.equal(1);
    });

    // กดอีกครั้ง → qty ต้องเพิ่มเป็น 2
    cy.get(".wl-card").first().within(() => {
      cy.contains("button", "ADD TO CART").click();
    });

    cy.window().then((win) => {
      const cart = JSON.parse(win.localStorage.getItem(LS_CART) || "[]");
      expect(cart[0].qty).to.equal(2);
    });
  });

  it("คลิกรูปหรือชื่อสินค้าแล้วควรพาไปหน้า detail/<id>", () => {
    cy.visit("/wishlist", {
      onBeforeLoad(win) {
        seedWishlist(win, [1]);
      },
    });

    cy.wait("@getProducts");

    // คลิกเข้า detail page
    cy.get(".wl-card").first().within(() => {
      cy.get(".wl-thumb a").click();
    });

    cy.url().should("include", "/detail/1");
  });
});
