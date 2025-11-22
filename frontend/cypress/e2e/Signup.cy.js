/// <reference types="cypress" />

// base URL ของ backend จริง (ปรับได้จาก cypress.env.json ถ้าต้องการ)
const API_BASE = Cypress.env("API_BASE") || "http://localhost:8080";

describe("E2E-Signup-101: Sign Up Page (real backend + stubs)", () => {
  // ปิด seedAuth เพื่อให้หน้า signup สะอาดทุกครั้ง
  beforeEach(() => {
    cy.visit("/signup", { seedAuth: false });
  });

  // --------------------------------------------------------------------
  // S1 ใช้ backend จริง: สมัครด้วยอีเมลใหม่ทุกครั้ง → Toast + redirect /login
  // --------------------------------------------------------------------
  it("S1: สมัครสำเร็จ (backend จริง) → Toast → redirect ไป /login", () => {
    const uniqueEmail = `e2e_${Date.now()}@puremart.com`;

    cy.get("#email").type(uniqueEmail);
    cy.get("#phone").type("0891234567");
    cy.get("#password").type("123456");
    cy.get("#confirm-password").type("123456");

    cy.get("#submitBtn").click();

    // backend จริงอาจตอบ 200 หรือ 201 แต่ component เช็กแล้วแสดง toast
    cy.get(".pm-toast", { timeout: 7000 })
      .should("be.visible")
      .and("contain", "Sign up successful! Please log in.");

    cy.location("pathname", { timeout: 7000 }).should("eq", "/login");
  });

  // --------------------------------------------------------------------
  // ฝั่ง frontend ล้วน: password mismatch → ไม่ยิง backend
  // --------------------------------------------------------------------
  it("S2: รหัสผ่านไม่ตรงกัน → แสดง error และไม่ redirect", () => {
    cy.get("#email").type("mismatch@puremart.com");
    cy.get("#phone").type("0811111111");
    cy.get("#password").type("abcdef");
    cy.get("#confirm-password").type("abcdeg");

    cy.get("#submitBtn").click();

    cy.contains("Passwords do not match").should("be.visible");
    cy.location("pathname").should("eq", "/signup");
  });

  // --------------------------------------------------------------------
  // frontend ล้วน: password สั้นเกินไป → ไม่ยิง backend
  // --------------------------------------------------------------------
  it("S3: รหัสผ่านสั้นเกินไป (<6) → แสดง error", () => {
    // รีโหลดอีกรอบให้แน่ใจว่า state สะอาด
    cy.visit("/signup", { seedAuth: false });

    cy.get("#email").type("short@puremart.com");
    cy.get("#phone").should("not.be.disabled").type("0892222222");

    cy.get("#password").type("12345");  // สั้นเกินไป
    cy.get("#confirm-password").type("12345");

    cy.get("#submitBtn").click();

    cy.contains("Password must be at least 6 characters.")
      .should("be.visible");
  });

  // --------------------------------------------------------------------
  // frontend ล้วน: validation เบอร์มือถือ → ไม่ยิง backend
  // --------------------------------------------------------------------
  it("S4: เบอร์โทรไม่ถูกต้อง → แสดง error", () => {
    cy.get("#email").type("phonebad@puremart.com");
    cy.get("#phone").type("08123");  // 5 หลัก
    cy.get("#password").type("123456");
    cy.get("#confirm-password").type("123456");

    cy.get("#submitBtn").click();

    cy.contains("Please enter a valid Thai mobile number")
      .should("be.visible");
  });

  // --------------------------------------------------------------------
  // S5 ใช้ backend จริง: อีเมลซ้ำ → สร้าง user ก่อนด้วย cy.request แล้วให้ UI เจอ 409
  // --------------------------------------------------------------------
  it("S5: อีเมลซ้ำ (backend จริง) → แสดงข้อความ error และยังอยู่หน้า signup", () => {
  const dupEmail = "duplicate-e2e@puremart.com";

  // 1) ยิงไปสร้าง user ก่อนผ่าน backend จริง (ถ้ามีอยู่แล้วก็ไม่เป็นไร)
  cy.request({
    method: "POST",
    url: `${API_BASE}/api/auth/signup`,
    failOnStatusCode: false,   // กันกรณี backend ตอบ 409 / 500 อยู่แล้ว
    body: {
      email: dupEmail,
      phone: "0893333333",
      password: "123456",
    },
  }).then(() => {
    // 2) กลับมาทดสอบผ่าน UI ด้วย email เดิม
    cy.visit("/signup", { seedAuth: false });

    cy.get("#email").type(dupEmail);
    cy.get("#phone").type("0893333333");
    cy.get("#password").type("123456");
    cy.get("#confirm-password").type("123456");

    cy.get("#submitBtn").click();

    // 3) ต้องมี error โผล่จาก <p role="alert"> ของหน้า SignUpPage
    cy.get('p[role="alert"]', { timeout: 7000 })
      .should("be.visible")
      .and(($p) => {
        const txt = $p.text().trim();
        expect(txt.length).to.be.greaterThan(0);  // แค่ไม่ว่างก็พอ
      });

    // 4) ยังอยู่ที่ /signup ไม่ได้ redirect ไปหน้าอื่น
    cy.location("pathname").should("eq", "/signup");
  });
});

  // --------------------------------------------------------------------
  // S6 ยังใช้ stub: จำลอง backend 500 จะง่ายและเสถียรกว่าไปทำให้ server ล่มจริง
  // --------------------------------------------------------------------
  it("S6: backend 500 (stub) → แสดง message จาก backend", () => {
    cy.intercept("POST", "**/api/auth/signup", {
      statusCode: 500,
      body: { message: "DB down" },
    }).as("signup500");

    cy.get("#email").type("crash@puremart.com");
    cy.get("#phone").type("0894444444");
    cy.get("#password").type("123456");
    cy.get("#confirm-password").type("123456");

    cy.get("#submitBtn").click();
    cy.wait("@signup500");

    cy.contains("DB down").should("be.visible");
  });

  // --------------------------------------------------------------------
  // S7 frontend ล้วน: ปุ่มตา toggle type
  // --------------------------------------------------------------------
  it("S7: ปุ่มตา toggle password/confirm-password ทำงาน", () => {
    // password
    cy.get("#password").should("have.attr", "type", "password");
    cy.get("#password").parent().find(".toggle-eye").click();
    cy.get("#password").should("have.attr", "type", "text");
    cy.get("#password").parent().find(".toggle-eye").click();
    cy.get("#password").should("have.attr", "type", "password");

    // confirm
    cy.get("#confirm-password").should("have.attr", "type", "password");
    cy.get("#confirm-password").parent().find(".toggle-eye").click();
    cy.get("#confirm-password").should("have.attr", "type", "text");
    cy.get("#confirm-password").parent().find(".toggle-eye").click();
    cy.get("#confirm-password").should("have.attr", "type", "password");
  });

  // --------------------------------------------------------------------
  // S8 ยังใช้ stub: ตรวจว่า validation บล็อกไม่ให้ยิง API จริง
  // --------------------------------------------------------------------
  it("S8: ไม่กรอกอะไรเลย → Browser validation block → ไม่มี API call", () => {
    cy.intercept("POST", "**/api/auth/signup").as("blocked");

    cy.get("#submitBtn").click();

    cy.wait(400);

    cy.get("@blocked.all").should("have.length", 0);
  });
});
