// src/components/header.jsx
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./header.css";

export default function Header() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const btn = root.querySelector(".pm-account");
    const menu = root.querySelector("#account-menu");
    const firstItem = menu?.querySelector('[role="menuitem"]');
    if (!btn || !menu) return;

    const openMenu = () => { menu.classList.add("is-open"); btn.setAttribute("aria-expanded","true"); firstItem?.focus(); };
    const closeMenu = () => { menu.classList.remove("is-open"); btn.setAttribute("aria-expanded","false"); };
    const toggleMenu = () => (menu.classList.contains("is-open") ? closeMenu() : openMenu());

    const onBtnClick = e => { e.preventDefault(); toggleMenu(); };
    const onDocClick = e => { if (!e.target.closest(".pm-dropdown-wrapper")) closeMenu(); };
    const onMenuKeydown = e => { if (e.key === "Escape") { closeMenu(); btn.focus(); } };
    const onResize = () => closeMenu();

    btn.addEventListener("click", onBtnClick);
    document.addEventListener("click", onDocClick);
    menu.addEventListener("keydown", onMenuKeydown);
    window.addEventListener("resize", onResize);
    return () => {
      btn.removeEventListener("click", onBtnClick);
      document.removeEventListener("click", onDocClick);
      menu.removeEventListener("keydown", onMenuKeydown);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <header className="pm-header" ref={rootRef}>
      <div className="pm-header__inner">
        {/* Logo */}
        <Link to="/" className="pm-logo" aria-label="Pure Mart">
          <img src="/assets/logo.png" alt="PURE MART" />
        </Link>

        {/* Nav */}
        <nav className="pm-nav" aria-label="Primary">
          <Link to="/">Home</Link>              {/* เดิม /home → ไม่มีใน App.jsx */}
          <Link to="/shop">Shop</Link>
          <Link to="/products">Best Sellers</Link> {/* หรือเพิ่ม route /best-sellers เองก็ได้ */}
          <Link to="/products">Categories</Link>   {/* ชั่วคราวชี้ไปหน้า products */}
        </nav>

        {/* Search */}
        <form className="pm-search" role="search" aria-label="Site search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="search" placeholder="Search....." />
        </form>

        {/* Right icons */}
        <div className="pm-right">
          <div className="pm-dropdown-wrapper">
            <button className="pm-icon pm-account" aria-haspopup="true" aria-expanded="false" aria-controls="account-menu">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>
              <span className="pm-icon__label">ACCOUNT</span>
              <svg className="pm-caret" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6,8 18,8 12,16" fill="currentColor" /></svg>
            </button>
            <div id="account-menu" className="pm-dropdown" role="menu">
              <Link to="/history" role="menuitem" tabIndex={-1}>Order History</Link> {/* เดิม orders.html → ใช้ /history ที่มีจริง */}
            </div>
          </div>

          <a href="#" className="pm-icon" aria-label="Wishlist">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 7.1a5 5 0 0 0-7.1 0L12 8.8l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.1 8.8-8.1a5 5 0 0 0 0-7.1Z" /></svg>
          </a>

          <a href="#" className="pm-icon" aria-label="Cart">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1.6" /><circle cx="18" cy="21" r="1.6" /><path d="M3 3h2l2.2 11.2A2 2 0 0 0 9.2 16h8.7a2 2 0 0 0 2-1.6L22 7H6" /></svg>
          </a>

          <button className="pm-burger" aria-label="Open menu" type="button"><span></span><span></span><span></span></button>
        </div>
      </div>
    </header>
  );
}
