// src/components/AdminSidebar.jsx
import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";        // ✅ ใช้ NavLink สำหรับ route
import "./AdminSidebar.css";

export default function AdminSidebar() {
  const sidebarRef = useRef(null);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    // Restore collapsed state
    if (localStorage.getItem("sb-collapsed") === "1") {
      sidebar.classList.add("collapsed");
    }

    // Dropdown toggle (click + keyboard)
    const toggles = Array.from(sidebar.querySelectorAll(".nav-toggle"));
    const toggleHandlers = new Map();

    toggles.forEach((toggle) => {
      const handler = () => {
        const targetSel = toggle.getAttribute("data-target");
        const panel = targetSel ? sidebar.querySelector(targetSel) : null;
        if (!panel) return;

        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        panel.style.display = expanded ? "none" : "block";

        const chev = toggle.querySelector(".right i");
        if (chev) chev.style.transform = expanded ? "rotate(0deg)" : "rotate(180deg)";
      };

      const onKey = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handler();
        }
      };

      toggle.addEventListener("click", handler);
      toggle.addEventListener("keydown", onKey);
      toggleHandlers.set(toggle, { handler, onKey });
    });

    // Sidebar collapse via hamburger (remember state)
    const menuBtn = sidebar.querySelector(".menu-btn");
    const toggleSidebar = () => {
      sidebar.classList.toggle("collapsed");
      localStorage.setItem(
        "sb-collapsed",
        sidebar.classList.contains("collapsed") ? "1" : "0"
      );
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

    return () => {
      toggles.forEach((toggle) => {
        const h = toggleHandlers.get(toggle);
        if (!h) return;
        toggle.removeEventListener("click", h.handler);
        toggle.removeEventListener("keydown", h.onKey);
      });
      if (menuBtn) {
        menuBtn.removeEventListener("click", toggleSidebar);
      }
    };
  }, []);

  // ให้ active class กับเมนูย่อย/หลัก
  const subItemClass = ({ isActive }) => "sub-item" + (isActive ? " active" : "");
  const mainItemClass = ({ isActive }) => "nav-item" + (isActive ? " active" : "");

  return (
    <aside className="sidebar" ref={sidebarRef}>
      <div className="brand">
        <div className="brand-logo">
          <img src="/assets/logo.png" alt="Admin Logo" style={{ width: 120, height: "auto" }} />
        </div>
        <i
          className="fa-solid fa-bars menu-btn"
          aria-label="Toggle sidebar"
          role="button"
          tabIndex={0}
        />
      </div>

      <div className="section-title">MAIN</div>
      <nav className="nav">
        <NavLink to="/admin/dashboard" className={mainItemClass}>
          <span className="icon">
            <i className="fa-solid fa-house" />
          </span>
          Dashboard
        </NavLink>
      </nav>

      <div className="section-title">ALL PAGE</div>

      {/* E-commerce */}
      <div className="nav">
        <div
          className="nav-item nav-toggle"
          data-target="#menu-ecom"
          aria-expanded="true"
          role="button"
          tabIndex={0}
        >
          <span className="icon">
            <i className="fa-solid fa-cart-shopping" />
          </span>
          E-commerce
          <span className="right">
            <i className="fa-solid fa-chevron-down" style={{ transform: "rotate(180deg)" }} />
          </span>
        </div>

        <div className="submenu" id="menu-ecom" style={{ display: "block" }}>
          {/* ไปหน้า AdminAddProductPage.jsx */}
          <NavLink to="/admin/products/new" className={subItemClass}>
            Add Product
          </NavLink>

          {/* ไปหน้า AdminProductListPage.jsx */}
          <NavLink to="/admin/products" className={subItemClass}>
            Product List
          </NavLink>

          {/* ✅ เพิ่มแท็บจัดการโปรโมชัน (ไปสร้างหน้า /admin/promotions/new ภายหลัง) */}
          <NavLink to="/admin/promotions" className={subItemClass}>
            Add Promotion
          </NavLink>
        </div>
      </div>

      {/* Order */}
      <div className="nav">
        <div
          className="nav-item nav-toggle"
          data-target="#menu-order"
          aria-expanded="true"
          role="button"
          tabIndex={0}
        >
          <span className="icon">
            <i className="fa-solid fa-layer-group" />
          </span>
          Order
          <span className="right">
            <i className="fa-solid fa-chevron-down" style={{ transform: "rotate(180deg)" }} />
          </span>
        </div>

        <div className="submenu" id="menu-order" style={{ display: "block" }}>
          <NavLink to="/admin/orders" className={subItemClass}>
            Order List
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
