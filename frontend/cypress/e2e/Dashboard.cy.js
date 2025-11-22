// cypress/e2e/admin-dashboard.cy.js

const mockProducts = [
    {
        id: 1,
        name: "Apple Juice",
        category: "Beverage",
        brand: "Brand A",
        price: 50,
        quantity: 5,
        updated_at: "2025-11-20T00:00:00Z",
    },
    {
        id: 2,
        name: "Orange Juice",
        category: "Beverage",
        brand: "Brand B",
        price: 60,
        quantity: 0,
        updated_at: "2025-11-19T00:00:00Z",
    },
];

const mockOrders = [
    {
        id: 100,
        status: "DELIVERED",
        created_at: "2025-11-21T10:00:00Z",
        items: [
            {
                product_id: 1,
                quantity: 3,
            },
        ],
    },
];

describe("Admin Dashboard (Weekly Stock Report)", () => {
    beforeEach(() => {
  
        cy.intercept("GET", "/api/products", {
            statusCode: 200,
            body: mockProducts,
        }).as("getProducts");

        cy.intercept("GET", /\/api\/orders.*/, {
            statusCode: 200,
            body: mockOrders,
        }).as("getOrders");

        cy.intercept("GET", "/api/orders/100", {
            statusCode: 200,
            body: mockOrders[0],
        }).as("getOrderDetail");

        cy.visit("/admin/dashboard", {
            seedAuth: false, 
            onBeforeLoad(win) {
                const authPayload = JSON.stringify({
                    user: { name: "admin", role: "ADMIN" },
                    token: "test-token",
                });
              
                win.localStorage.setItem("auth", authPayload);
                win.localStorage.setItem("pm_auth", authPayload);
                win.localStorage.setItem("puremart_auth", authPayload);
                win.localStorage.setItem("isAuthed", "true");

                win.sessionStorage.setItem("token", "e2e-admin-token");
                win.sessionStorage.setItem("role", "ADMIN");
            },
        });

        cy.wait("@getProducts");
        cy.wait("@getOrders");
    });

    // -------------------------------------------------------------------
    // DASH-001: โหลด Dashboard แล้ว header, KPI และ table แสดงผล
    // -------------------------------------------------------------------
    it("DASH-001: โหลด Dashboard แล้ว header, KPI และ table แสดงผล", () => {
    
        cy.contains("h1", "Weekly Stock Report").should("be.visible");
        cy.contains(".sub", "Week:").should("be.visible");

       
        cy.get(".kpi-grid .card.kpi").should("have.length", 4);

      
        cy.get(".table .trow").should("have.length", mockProducts.length);
        cy.contains(".trow", "Apple Juice").should("be.visible");
        cy.contains(".trow", "Orange Juice").should("be.visible");
    });


    // -------------------------------------------------------------------
    // DASH-002: เปลี่ยนจาก/ถึง + โหมด Date range selected → orders มี query from/to
    // -------------------------------------------------------------------
    it("DASH-002: เปลี่ยน from/to แล้วกด Apply ในโหมด Date range selected → orders ถูกเรียกด้วย query ช่วงวันที่", () => {
       
        cy.get('input[type="radio"][name="mode"][value="byDate"]').click();

        const from = "2025-11-01";
        const to = "2025-11-05";

      
        cy.get('.daterange input[type="date"]').first().clear().type(from, { delay: 0 });
        cy.get('.daterange input[type="date"]').eq(1).clear().type(to, { delay: 0 });

        
        cy.intercept("GET", `/api/orders?from=${from}&to=${to}*`).as("getOrdersApply");

      
        cy.get(".daterange .btn").contains("Apply").click();

     
        cy.wait("@getOrdersApply").then((interception) => {
            const url = interception.request.url;
            expect(url).to.contain(`from=${from}`);
            expect(url).to.contain(`to=${to}`);
        });
    });



    // -------------------------------------------------------------------
    // DASH-003: Search filter ทำงาน → ซ่อนแถวที่ไม่ match
    // -------------------------------------------------------------------
    it("DASH-003: ใช้ช่อง Search แล้ว filter ซ่อนแถวที่ไม่ตรงคำค้นหา", () => {
        cy.contains(".trow", "Apple Juice").should("be.visible");
        cy.contains(".trow", "Orange Juice").should("be.visible");

        cy.get('input.search[placeholder="Search here…"]').type("apple");

       
        cy.contains(".trow", "Apple Juice").should("be.visible");

       
        cy.contains(".trow", "Orange Juice").should("have.class", "hide");
    });

    // -------------------------------------------------------------------
    // DASH-004: ปุ่ม View นำไปหน้า /admin/products/:id/edit ถูกต้อง
    // -------------------------------------------------------------------
    it("DASH-004: กดปุ่ม View ในแถว → ไปหน้าแก้ไขสินค้าตาม ID ถูกต้อง", () => {
        cy.contains(".trow", "Apple Juice").within(() => {
            cy.get("button.btn-edit-inline").click();
        });

        cy.url().should("include", "/admin/products/1/edit");
    });

    // -------------------------------------------------------------------
    // DASH-006: กด Export CSV แล้วได้ไฟล์ weekly-stock-report.csv ที่มีข้อมูลสินค้าตรงกับตาราง
    // -------------------------------------------------------------------
    it("DASH-006: กด Export CSV แล้วได้ไฟล์ weekly-stock-report.csv ที่มีข้อมูลสินค้าตรงกับตาราง", () => {
        
        cy.contains("button", "Export CSV").click();

        const downloadPath = "cypress/downloads/weekly-stock-report.csv";

        cy.readFile(downloadPath, { timeout: 5000 }).then((text) => {
           
            expect(text).to.include(
                '"Product ID","Product Name","Category","Brand","Price","In Stock","Sold (Range)","Status","Last Restocked"'
            );

          
            expect(text).to.include('"1","Apple Juice","Beverage","Brand A"');


            expect(text).to.include('"2","Orange Juice","Beverage","Brand B"');
        });
    });


});
