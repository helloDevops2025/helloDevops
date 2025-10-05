import { useEffect } from "react";
import "./AdminOrderDetailPage.css";
import "../components/AdminSidebar"; // ถ้ายังอยากใช้ CSS นอกไฟล์
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function AdminOrderDetailPage() {
  useEffect(() => {
    // dropdown toggle (click + keyboard)
    document.querySelectorAll(".nav-toggle").forEach((toggle) => {
      const handler = () => {
        const panel = document.querySelector(toggle.dataset.target);
        if (!panel) return;
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        panel.style.display = expanded ? "none" : "block";
        const chev = toggle.querySelector(".right i");
        if (chev) chev.style.transform = expanded ? "rotate(0deg)" : "rotate(180deg)";
      };
      toggle.addEventListener("click", handler);
      toggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handler();
        }
      });
    });

    // sidebar collapse via hamburger (remember state)
    const sidebar = document.querySelector(".sidebar");
    const menuBtn = document.querySelector(".menu-btn");

    if (localStorage.getItem("sb-collapsed") === "1") {
      sidebar?.classList.add("collapsed");
    }

    const toggleSidebar = () => {
      sidebar?.classList.toggle("collapsed");
      localStorage.setItem("sb-collapsed", sidebar?.classList.contains("collapsed") ? "1" : "0");
    };

    if (menuBtn) {
      menuBtn.addEventListener("click", toggleSidebar);
      menuBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleSidebar();
        }
      });
    }
  }, []);

  return (
    <div className="admin-order-detail-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <img src="/asset/logo with BG.png" alt="Admin Logo" style={{ width: "120px", height: "auto" }} />
          </div>
          <i className="fa-solid fa-bars menu-btn" aria-label="Toggle sidebar" role="button" tabIndex="0"></i>
        </div>

        <div className="section-title">MAIN</div>
        <nav className="nav">
          <a className="nav-item" href="#">
            <span className="icon">
              <i className="fa-solid fa-house"></i>
            </span>
            Home
          </a>
        </nav>

        <div className="section-title">ALL PAGE</div>

        {/* E-commerce */}
        <div className="nav">
          <div className="nav-item nav-toggle" data-target="#menu-ecom" aria-expanded="true" role="button" tabIndex="0">
            <span className="icon">
              <i className="fa-solid fa-cart-shopping"></i>
            </span>
            E-commerce
            <span className="right">
              <i className="fa-solid fa-chevron-down" style={{ transform: "rotate(180deg)" }}></i>
            </span>
          </div>
          <div className="submenu" id="menu-ecom" style={{ display: "block" }}>
            <a className="sub-item" href="#">
              Add Product
            </a>
            <a className="sub-item" href="#">
              Product List
            </a>
          </div>
        </div>

        {/* Order */}
        <div className="nav">
          <div className="nav-item nav-toggle" data-target="#menu-order" aria-expanded="true" role="button" tabIndex="0">
            <span className="icon">
              <i className="fa-solid fa-layer-group"></i>
            </span>
            Order
            <span className="right">
              <i className="fa-solid fa-chevron-down" style={{ transform: "rotate(180deg)" }}></i>
            </span>
          </div>
          <div className="submenu" id="menu-order" style={{ display: "block" }}>
            <a className="sub-item" href="#">
              Order List
            </a>
            <a className="sub-item active" href="#">
              Order Detail
            </a>
            <a className="sub-item" href="#">
              Order Tracking
            </a>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="content">
        <header className="header">
          <div className="account">
            <i className="fa-regular fa-circle-user"></i>
            <span>ACCOUNT</span>
          </div>
          <h1>ORDER DETAIL</h1>
        </header>

        <section className="summary">
          <div className="card-top">
            <div className="summary-text">
              <h2>Summary</h2>
            </div>
            <div className="info">
              <p>Order ID : </p>
              <span>#10023</span>
            </div>
            <div className="info">
              <p>Date : </p>
              <span>20 May 2025</span>
            </div>
            <div className="info">
              <p>
                <b>Total : </b>
              </p>
              <span>
                <b>฿391.00</b>
              </span>
            </div>
          </div>
          <div className="card-top">
            <div className="total-head">
              <h3>Cart Total</h3>
              <h3>Price</h3>
            </div>
            <div className="info">
              <p>Subtotal : </p>
              <span>331.00</span>
            </div>
            <div className="info">
              <p>Shipping : </p>
              <span>60.00</span>
            </div>
            <div className="info">
              <p>
                <b>Total price : </b>
              </p>
              <span>
                <b>391.00</b>
              </span>
            </div>
          </div>
        </section>

        <section className="order-items">
          <div className="order">
            <h3 className="order-head">All Item in order</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Product_Name1</td>
                    <td>100.00</td>
                    <td>1</td>
                    <td>100.00</td>
                  </tr>
                  <tr>
                    <td>Product_Name2</td>
                    <td>45.00</td>
                    <td>2</td>
                    <td>90.00</td>
                  </tr>
                  <tr>
                    <td>Product_Name3</td>
                    <td>70.50</td>
                    <td>2</td>
                    <td>141.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="right-panel">
          <div className="card">
            <div className="info-card">
              <h3>Shipping Address</h3>
              <p id="Address">999 Road , Distric, Country, PostCode Phone Number</p>
            </div>
          </div>
          <div className="card">
            <div className="status-card">
              <div className="status-text">
                <h3>Edit Status</h3>
                <p>Pending</p>
              </div>
              <div className="status">
                <div className="selection-wrapper">
                  <select className="selection" id="statusSelect" defaultValue="">
                    <option value="" disabled>
                      status
                    </option>
                    <option>Preparing</option>
                    <option>Ready to Ship</option>
                    <option>Shipping</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </div>
                <button className="change">Change</button>
              </div>
            </div>
          </div>
          <div className="tracking">
            <div className="tracking-text">
              <h2>Status Timeline</h2>
              <button className="tracking-btn">
                <i className="fa-solid fa-truck" id="icon-track"></i>
                <h2>Tracking </h2>
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
