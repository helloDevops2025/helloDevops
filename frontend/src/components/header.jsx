import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./header.css";

const Header = () => {
  const [accOpen, setAccOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const wrapRef = useRef(null);

  // ให้ body มี padding-top รองรับ header ติดบน
  useEffect(() => {
    document.body.classList.add("has-header");
    return () => {
      document.body.classList.remove("has-header");
    };
  }, []);

  // ปิดเมนูเมื่อคลิกนอก/resize
  useEffect(() => {
    const onClickOutside = (e) => {
      if (!wrapRef.current?.contains(e.target)) {
        setAccOpen(false);
        setNavOpen(false);
      }
    };
    const onResize = () => {
      setAccOpen(false);
      setNavOpen(false);
    };
    document.addEventListener("click", onClickOutside);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("click", onClickOutside);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ===== NEW: ติด active ให้เมนู + ไอคอนตาม path ปัจจุบัน (รวมหน้า Home และไอคอนขวา)
  useEffect(() => {
    const path = (window.location.pathname || "/").toLowerCase();

    // helper
    const markActive = (el) => {
      if (!el) return;
      el.classList.add("active");
      el.setAttribute("aria-current", "page");
    };
    const unmarkAll = (sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.classList.remove("active");
        el.removeAttribute("aria-current");
      });
    };

    // เคลียร์ก่อน
    unmarkAll(".pm-nav a, .pm-right a.pm-icon, .pm-account");

    // เมนูหลักซ้าย
    document.querySelectorAll(".pm-nav a").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      const isHomeLink = href === "/" || href === "/home" || href.endsWith("/index.html");
      const isHomePage = path === "/" || path.endsWith("/index.html") || path.startsWith("/home");

      if (isHomeLink && isHomePage) {
        markActive(a);
        return;
      }
      if (href && href !== "/" && path.startsWith(href)) {
        markActive(a);
      }
    });

    // ไอคอนขวา: wishlist / cart
    document.querySelectorAll(".pm-right a.pm-icon").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href && path.startsWith(href)) {
        markActive(a);
      }
    });

    // ปุ่ม ACCOUNT (เป็น button ไม่มี href) → ให้ active เมื่ออยู่หน้าเกี่ยวกับบัญชี
    const accountBtn = document.querySelector(".pm-account");
    if (accountBtn) {
      const isAccountRelated =
        path.startsWith("/login") ||
        path.startsWith("/register") ||
        path.startsWith("/profile") ||
        path.startsWith("/account") ||
        path.startsWith("/history");
      if (isAccountRelated) markActive(accountBtn);
    }
  }, []);

  return (
    <>
      {/* Top stripe */}
      <div className="pm-topbar" />

      <header className="pm-header" ref={wrapRef}>
        <div className="pm-header__inner">
          {/* Logo */}
          <a href="/home" className="pm-logo" aria-label="Pure Mart">
            <img src="/assets/logo.png" alt="PURE MART" />
          </a>

          {/* Nav */}
          <nav className={`pm-nav ${navOpen ? "is-open" : ""}`} aria-label="Primary">
            <a href="/home">Home</a>
            <a href="/shop">Shop</a>
            <a href="/home#best-sellers">Best Sellers</a>
            <a href="/home#categories">Categories</a>
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
            {/* Account Dropdown */}
            <div className="pm-dropdown-wrapper">
              <button
                className="pm-icon pm-account"
                aria-haspopup="true"
                aria-expanded={accOpen ? "true" : "false"}
                aria-controls="account-menu"
                type="button"
                onClick={() => setAccOpen((v) => !v)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
                <span className="pm-icon__label">ACCOUNT</span>
                <svg className="pm-caret" viewBox="0 0 24 24" aria-hidden="true">
                  <polygon points="6,8 18,8 12,16" fill="currentColor" />
                </svg>
              </button>

              <div
                id="account-menu"
                className={`pm-dropdown ${accOpen ? "is-open" : ""}`}
                role="menu"
              >
                <a
                  href="/history"
                  role="menuitem"
                  tabIndex={accOpen ? 0 : -1}
                  onClick={() => setAccOpen(false)}
                >
                  Order History
                </a>
                <a
                  href="/login"
                  role="menuitem"
                  tabIndex={accOpen ? 0 : -1}
                  onClick={() => setAccOpen(false)}
                >
                  Log Out
                </a>
              </div>
            </div>

            {/* Wishlist */}
            <a href="/wishlist" className="pm-icon" aria-label="Wishlist">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.8 7.1a5 5 0 0 0-7.1 0L12 8.8l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.1 8.8-8.1a5 5 0 0 0 0-7.1Z" />
              </svg>
            </a>

            {/* Cart */}
            <a href="/cart" className="pm-icon" aria-label="Cart">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="21" r="1.6" />
                <circle cx="18" cy="21" r="1.6" />
                <path d="M3 3h2l2.2 11.2A2 2 0 0 0 9.2 16h8.7a2 2 0 0 0 2-1.6L22 7H6" />
              </svg>
            </a>

            {/* Hamburger */}
            <button
              className="pm-burger"
              aria-label="Open menu"
              aria-expanded={navOpen ? "true" : "false"}
              type="button"
              onClick={() => setNavOpen((v) => !v)}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;