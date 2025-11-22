const BASE_URL = Cypress.config("baseUrl") || "http://localhost:5173";
const API_URL = "http://127.0.0.1:8080";

const LS_WISH = "pm_wishlist";
const LS_CART = "pm_cart";

describe("Shop Page - Real API (Pure Mart)", () => {
  beforeEach(() => {
    cy.intercept("GET", `${API_URL}/api/products`).as("getProducts");
    cy.intercept("GET", `${API_URL}/api/categories`).as("getCategories");
    cy.intercept("GET", `${API_URL}/api/brands`).as("getBrands");
    cy.intercept("GET", `${API_URL}/api/promotions*`).as("getPromos");
    cy.intercept("GET", `${API_URL}/api/promotions/*/products`).as(
      "getPromoProducts"
    );

    cy.visit(`${BASE_URL}/shop`, {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });
    cy.wait("@getProducts");
    cy.wait("@getCategories");
    cy.wait("@getBrands");
    // เรื่องโปรโมชันบางทีจะตามมาทีหลัง เผื่อเวลานิดหนึ่งให้มันยิง /promotions และ /promotions/:id/products ให้เสร็จ
    cy.wait(500);
  });

  it("ผู้ใช้เปิดหน้า Shop แล้วเห็นสินค้า + ส่วนกรอง/เรียงลำดับครบ", () => {
    // เช็ค heading หน้ากับ breadcrumb ว่าตรงกับหน้า SHOP
    cy.get(".wl-title").should("contain.text", "SHOP");
    cy.get(".custom-breadcrumb").within(() => {
      cy.contains("HOME");
      cy.contains("SHOP");
    });

    // กล่องสรุปผลด้านบนต้องขึ้นข้อความบางอย่าง (อย่างน้อยไม่ควรเป็น string ว่าง ๆ)
    cy.get(".result-count").should(($p) => {
      const txt = $p.text();
      expect(txt.length).to.be.greaterThan(0);
    });

    // โซนสินค้า ถ้าไม่มี card ก็อย่างน้อยต้องขึ้นข้อความ no-result ให้ผู้ใช้เห็น
    cy.get(".grid").within(() => {
      cy.get(".card, .no-result", { timeout: 10000 }).should(
        "have.length.greaterThan",
        0
      );
    });

    // ฝั่งซ้ายต้องมีหัวข้อ filter ครบตามที่ออกแบบไว้
    cy.contains(".filter-block h3", "Product Categories").should("exist");
    cy.contains(".filter-block h3", "Price (฿)").should("exist");
    cy.contains(".filter-block h3", "Brands").should("exist");
    cy.contains(".filter-block h3", "Promotions").should("exist");

    // dropdown sort ต้องมี option ตรงกับที่หน้า Shop ใช้
    cy.get("#sort").within(() => {
      cy.get("option[value='featured']").should("exist");
      cy.get("option[value='price-asc']").should("exist");
      cy.get("option[value='price-desc']").should("exist");
    });

    // แถบ pagination ต้องมี Prev / Next และบอกเลขหน้าชัดเจน
    cy.get(".pagination").within(() => {
      cy.contains("button", "Prev").should("exist");
      cy.contains("button", "Next").should("exist");
      cy.get(".page-info").should("contain.text", "Page");
    });
  });

  it("ผู้ใช้เลือก Category / Brand / Promotion แล้วมี chip แสดง filter และ Clear All ล้างได้", () => {
    // เลือก Category ตัวแรกในลิสต์ถ้ามี 
    cy.contains(".filter-block h3", "Product Categories")
      .parents(".filter-block")
      .within(() => {
        cy.get(".checklist input[type='checkbox']").then(($inputs) => {
          if ($inputs.length === 0) {
            cy.log("ไม่มี Category ให้เลือกในระบบตอนนี้ ข้ามส่วน Category ไปก่อน");
            return;
          }
          cy.wrap($inputs.first()).check({ force: true });
        });
      });

    // เลือก Brand ตัวแรกในลิสต์ถ้ามี
    cy.contains(".filter-block h3", "Brands")
      .parents(".filter-block")
      .within(() => {
        cy.get(".checklist input[type='checkbox']").then(($inputs) => {
          if ($inputs.length === 0) {
            cy.log("ไม่มี Brand ให้เลือกในระบบตอนนี้ ข้ามส่วน Brands ไปก่อน");
            return;
          }
          cy.wrap($inputs.first()).check({ force: true });
        });
      });

    // เลือก Promotion ตัวแรกในลิสต์ถ้ามี
    cy.contains(".filter-block h3", "Promotions")
      .parents(".filter-block")
      .within(() => {
        cy.get(".checklist input[type='checkbox']").then(($inputs) => {
          if ($inputs.length === 0) {
            cy.log("ไม่มี Promotion ให้เลือกในระบบตอนนี้ ข้ามส่วน Promotions ไปก่อน");
            return;
          }
          // ชื่อตัวโปรอาจมี space / % เลยไม่ใช้ selector ด้วย id โดยตรง ใช้ wrap checkbox คลิกตรง ๆ แทน
          cy.wrap($inputs.first()).check({ force: true });
        });
      });

    // หลังจากติ๊ก filter อย่างน้อย 1 อย่างแล้ว ต้องมี chip ขึ้นในแถบ ACTIVE FILTER
    cy.get(".af-bar .chips .chip", { timeout: 5000 }).should(
      "have.length.greaterThan",
      0
    );

    // กด Clear All แล้วต้องล้าง chip ออกเกลี้ยง
    cy.get(".af-bar .link").should("be.visible").click();
    cy.get(".af-bar .chips .chip").should("have.length", 0);
  });

  it("ผู้ใช้กรองราคาด้วย Min/Max แล้วระบบแจ้ง error เมื่อช่วงผิด และทำงานปกติเมื่อช่วงถูก", () => {
    // เลื่อนให้กล่องกรองราคามาอยู่ใน viewport กันปัญหาถูก element fixed ทับ
    cy.contains(".filter-block h3", "Price (฿)")
      .scrollIntoView()
      .should("be.visible");

    // กรณีกรอก min > max ระบบต้องแจ้ง error
    cy.get("[data-cy='min-input']")
      .scrollIntoView()
      .should("be.visible")
      .clear({ force: true })
      .type("500", { force: true });

    cy.get("[data-cy='max-input']")
      .scrollIntoView()
      .should("be.visible")
      .clear({ force: true })
      .type("100", { force: true });

    cy.get("[data-cy='apply-btn']").scrollIntoView().click({ force: true });

    cy.get(".price-error")
      .should("be.visible")
      .and("contain.text", "Invalid price range");

    // ใส่ช่วงราคาที่โอเค แล้วให้ระบบเอา error ออก
    cy.get("[data-cy='min-input']")
      .scrollIntoView()
      .clear({ force: true })
      .type("0", { force: true });

    cy.get("[data-cy='max-input']")
      .scrollIntoView()
      .clear({ force: true })
      .type("999999", { force: true });

    cy.get("[data-cy='apply-btn']").scrollIntoView().click({ force: true });

    // ข้อความ error ต้องหาย
    cy.get(".price-error").should("not.exist");

    // หน้าสินค้าต้องยังเห็น card หรือข้อความ no-result บางอย่าง ไม่ใช่หายไปเฉย ๆ
    cy.get(".grid").within(() => {
      cy.get(".card, .no-result").should("have.length.greaterThan", 0);
    });

    // ในแถบ ACTIVE FILTER ต้องมี chip ที่โชว์ช่วงราคาที่เลือก (ดูง่าย ๆ แค่มีสัญลักษณ์ ฿)
    cy.get(".af-bar .chips .chip").should(($chips) => {
      const txt = $chips.text();
      expect(txt).to.include("฿");
    });
  });

  it("ผู้ใช้กด Wishlist บนสินค้า แล้วสถานะหัวใจเปลี่ยน และ localStorage ถูกอัปเดต", () => {
    // จิ้มสินค้าชิ้นแรกในหน้า แล้วทดสอบปุ่ม Wishlist แค่ตัวเดียวก็พอ
    cy.get(".card").first().within(() => {
      cy.get(".p-wishline")
        .as("wishBtn")
        .should("have.attr", "aria-pressed");

      // กดครั้งแรก ต้องกลายเป็นสถานะ “อยู่ใน wishlist”
      cy.get("@wishBtn").click();

      cy.get("@wishBtn")
        .should("have.class", "on")
        .and("have.attr", "aria-pressed", "true")
        .within(() => {
          cy.contains("ADDED TO WISHLIST");
        });

      // localStorage ฝั่ง pm_wishlist ต้องมีอะไรถูกเขียนลงไปอย่างน้อย 1 ชิ้น
      cy.window().then((win) => {
        const raw = win.localStorage.getItem(LS_WISH) || "[]";
        const arr = JSON.parse(raw);
        expect(arr.length).to.be.greaterThan(0);
      });

      // กดซ้ำอีกที ต้องกลับสู่สถานะปกติ (เอาออกจาก wishlist)
      cy.get("@wishBtn").click();

      cy.get("@wishBtn")
        .should("not.have.class", "on")
        .and("have.attr", "aria-pressed", "false")
        .within(() => {
          cy.contains("ADD TO WISHLIST");
        });
    });
  });

  it("ผู้ใช้กดปุ่ม ADD TO CART แล้วตะกร้าใน localStorage ถูกเพิ่มสินค้าจริง และปุ่มเปลี่ยนสถานะชั่วคราว", () => {
    // หา product card ที่ปุ่ม Add to cart ยังใช้งานได้ (ไม่ disabled)
    cy.get(".card .btn.btn--cta")
      .not("[disabled]")
      .first()
      .as("addBtn");

    // ล้างตะกร้าให้เริ่มจาก 0 เสมอ
    cy.window().then((win) => {
      win.localStorage.removeItem(LS_CART);
    });

    cy.get("@addBtn")
      .invoke("text")
      .then((beforeText) => {
        const beforeLabel = beforeText.trim();

        // กดปุ่มเพิ่มลงตะกร้า
        cy.get("@addBtn").click();

        // ใน localStorage ต้องมี pm_cart และจำนวนสินค้ารวมต้องมากกว่า 0
        cy.window().then((win) => {
          const raw = win.localStorage.getItem(LS_CART) || "[]";
          const arr = JSON.parse(raw);
          expect(arr.length).to.be.greaterThan(0);

          const totalQty = arr.reduce(
            (sum, it) => sum + Number(it.qty || 0),
            0
          );
          expect(totalQty).to.be.greaterThan(0);
        });

        // ทันทีหลังจากกด ปุ่มควรเปลี่ยน label เป็น ADDED ✓ ให้ผู้ใช้รู้ว่ากดสำเร็จแล้ว
        cy.get("@addBtn").should("contain.text", "ADDED");

        // รอสักพักให้ state ใน component เปลี่ยนกลับ แล้วปุ่มต้องกลับมาเป็น ADD TO CART อีกครั้ง
        cy.wait(1000);
        cy.get("@addBtn").invoke("text").should("not.eq", "");
        if (beforeLabel) {
          cy.get("@addBtn").should("contain.text", "ADD TO CART");
        }
      });
  });

  it("ถ้ามีสินค้า OUT OF STOCK ปุ่มต้องกดไม่ได้ และไม่เพิ่มของในตะกร้า", () => {
    // เคลียร์ตะกร้าก่อน จะได้รู้ว่าไม่มีของค้างอยู่
    cy.window().then((win) => {
      win.localStorage.removeItem(LS_CART);
    });

    cy.get(".card .btn.btn--cta").then(($buttons) => {
      const outButtons = [...$buttons].filter((btn) =>
        btn.textContent.includes("OUT OF STOCK")
      );

      if (outButtons.length === 0) {
        cy.log("ตอนนี้ไม่มีสินค้า out-of-stock เลย เลยยังเทสเคสนี้ไม่ได้");
        return;
      }

      const outBtn = outButtons[0];
      const $out = Cypress.$(outBtn);

      // ปุ่มของสินค้าที่หมดสต็อกต้องถูก disable จริง ๆ
      expect($out.prop("disabled")).to.eq(true);

      // ถึงจะบังคับคลิกก็ไม่ควรมีผลกับตะกร้า
      cy.wrap(outBtn).click({ force: true });

      cy.window().then((win) => {
        const raw = win.localStorage.getItem(LS_CART) || "[]";
        const arr = JSON.parse(raw);
        const totalQty = arr.reduce(
          (sum, it) => sum + Number(it.qty || 0),
          0
        );
        expect(totalQty).to.eq(0);
      });
    });
  });

  it("ผู้ใช้เปลี่ยนการเรียงลำดับราคา Low → High / High → Low แล้วลำดับราคาบนหน้าเปลี่ยนตาม", () => {
    const readPrices = () =>
      cy.get(".card .p-price").then(($nodes) => {
        const arr = [...$nodes].map((el) => {
          const txt = el.textContent || "";
          const num = Number(txt.replace(/[^\d.]/g, ""));
          return num;
        });
        return arr;
      });

    // อ่านลิสต์ราคาปัจจุบันในโหมด featured เอาไว้เป็น baseline
    readPrices().then((initialPrices) => {
      if (initialPrices.length < 3) {
        cy.log("จำนวนสินค้าในหน้า < 3 ตัว ลองเช็คลำดับราคาอาจจะไม่ชัด ข้ามเคสนี้ไปก่อน");
        return;
      }

      // เปลี่ยนเป็น sort: ราคาน้อยไปมาก แล้วเช็คว่าลำดับใน DOM ตรงกับการ sort จริง ๆ
      cy.get("#sort").select("price-asc");
      cy.wait(500);
      readPrices().then((ascPrices) => {
        const sortedAsc = [...ascPrices].sort((a, b) => a - b);
        expect(ascPrices).to.deep.equal(sortedAsc);
      });

      // เปลี่ยนเป็น sort: ราคามากไปน้อย แล้วเช็คอีกครั้ง
      cy.get("#sort").select("price-desc");
      cy.wait(500);
      readPrices().then((descPrices) => {
        const sortedDesc = [...descPrices].sort((a, b) => b - a);
        expect(descPrices).to.deep.equal(sortedDesc);
      });
    });
  });

  it("ผู้ใช้เข้าหน้า /shop พร้อม query ?search=... แล้วข้อความผลลัพธ์แสดงคำค้นหา", () => {
    const query = "น้ำ";

    // เปิดหน้า /shop แบบพ่วง search param ไปด้วย
    cy.visit(`${BASE_URL}/shop?search=${encodeURIComponent(query)}`, {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });

    // ฟัง request /api/products ของรอบนี้แยกจาก beforeEach
    cy.intercept("GET", `${API_URL}/api/products`).as("getProductsSearch");
    cy.wait("@getProductsSearch", { timeout: 10000 });

    // ข้อความสรุปผลด้านบนต้องระบุคำค้นหาให้ผู้ใช้เห็น
    cy.get(".result-count").should("contain.text", `for "${query}"`);

    // grid ต้องยังแสดงผลอะไรบางอย่าง (card หรือข้อความ no-result)
    cy.get(".grid").within(() => {
      cy.get(".card, .no-result").should("have.length.greaterThan", 0);
    });
  });

  it("pagination ทำงาน: ถ้ามากกว่า 1 หน้า ปุ่ม Next/Prev ต้องเปลี่ยนเลขหน้าได้", () => {
    cy.get(".pagination .page-info")
      .invoke("text")
      .then((txt) => {
        const match = txt.match(/Page\s+(\d+)\s*\/\s*(\d+)/i);
        if (!match) {
          cy.log("อ่านรูปแบบข้อความ Page x / y ไม่ได้ ข้ามเคส pagination ไปก่อน");
          return;
        }

        const current = Number(match[1]);
        const total = Number(match[2]);

        if (total <= 1) {
          cy.log("มีแค่ 1 หน้าให้ดู ยังเทสการเปลี่ยนหน้าไม่ได้");
          return;
        }

        // กด Next แล้วเลขหน้าต้องขยับขึ้น 1
        cy.contains(".pagination .page-btn", "Next")
          .should("not.be.disabled")
          .click();

        cy.get(".pagination .page-info")
          .invoke("text")
          .should("match", new RegExp(`Page\\s+${current + 1}\\s*/\\s*${total}`));

        // กด Prev กลับมาเลขหน้าเดิม
        cy.contains(".pagination .page-btn", "Prev")
          .should("not.be.disabled")
          .click();

        cy.get(".pagination .page-info")
          .invoke("text")
          .should("match", new RegExp(`Page\\s+${current}\\s*/\\s*${total}`));
      });
  });
});
