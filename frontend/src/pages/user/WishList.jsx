// src/pages/user/WishList.jsx
// yes
import React, { useEffect } from "react";

export default function WishList() {
  useEffect(() => {
    // ---- load Google Fonts ----
    const pre1 = document.createElement("link");
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";

    const pre2 = document.createElement("link");
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "anonymous";

    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";

    // ---- load page CSS from /public/css/... ----
    const cssHeader = document.createElement("link");
    cssHeader.rel = "stylesheet";
    cssHeader.href = "/css/header.css";

    const cssWishlist = document.createElement("link");
    cssWishlist.rel = "stylesheet";
    cssWishlist.href = "/css/Wishlist.css";

    const cssFooter = document.createElement("link");
    cssFooter.rel = "stylesheet";
    cssFooter.href = "/css/Footer.css";

    document.head.append(pre1, pre2, font, cssHeader, cssWishlist, cssFooter);

    // ---- load legacy scripts from /public/js/... (ถ้ามี) ----
    const jsHeader = document.createElement("script");
    jsHeader.src = "/js/header.js";
    jsHeader.defer = true;

    const jsWishlist = document.createElement("script");
    jsWishlist.src = "/js/Wishlist.js";
    jsWishlist.defer = true;

    const jsFooter = document.createElement("script");
    jsFooter.src = "/js/Footer.js";
    jsFooter.defer = true;

    document.body.append(jsHeader, jsWishlist, jsFooter);

    // cleanup เมื่อ unmount
    return () => {
      [pre1, pre2, font, cssHeader, cssWishlist, cssFooter].forEach((el) =>
        el.parentNode && el.parentNode.removeChild(el)
      );
      [jsHeader, jsWishlist, jsFooter].forEach((el) =>
        el.parentNode && el.parentNode.removeChild(el)
      );
    };
  }, []);

  return (
    <>
      <div className="pm-topbar"></div>

      <header className="pm-header">
        <div className="pm-header__inner">
          <a href="/" className="pm-logo" aria-label="Pure Mart">
            {/* NOTE: ปรับ path รูปตามโปรเจกต์ของคุณ */}
            <img src="/src/logo no BG.png" alt="PURE MART" />
          </a>

          <nav className="pm-nav" aria-label="Primary">
            <a href="#">Home</a>
            <a href="#">Shop</a>
            <a href="#">Best Sellers</a>
            <a href="#">Categories</a>
          </nav>

          <form
            className="pm-search"
            role="search"
            aria-label="Site search"
            action="#"
            method="get"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="search" name="q" placeholder="Search....." />
          </form>

          <div className="pm-right">
            <div className="pm-dropdown-wrapper">
              <button
                className="pm-icon pm-account"
                type="button"
                aria-haspopup="true"
                aria-expanded="false"
                aria-controls="account-menu"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="4"></circle>
                  <path d="M4 20a8 8 0 0 1 16 0"></path>
                </svg>
                <span className="pm-icon__label">ACCOUNT</span>
                <svg className="pm-caret" viewBox="0 0 24 24" aria-hidden="true">
                  <polygon points="6,8 18,8 12,16"></polygon>
                </svg>
              </button>
              <div id="account-menu" className="pm-dropdown" role="menu">
                <a href="orders.html" role="menuitem" tabIndex={-1}>
                  Order History
                </a>
              </div>
            </div>

            <a href="#" className="pm-icon" aria-label="Wishlist">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.8 7.1a5 5 0 0 0-7.1 0L12 8.8l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.1 8.8-8.1a5 5 0 0 0 0-7.1Z"></path>
              </svg>
            </a>

            <a href="#" className="pm-icon" aria-label="Cart">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="21" r="1.6"></circle>
                <circle cx="18" cy="21" r="1.6"></circle>
                <path d="M3 3h2l2.2 11.2A2 2 0 0 0 9.2 16h8.7a2 2 0 0 0 2-1.6L22 7H6"></path>
              </svg>
            </a>

            <button className="pm-burger" aria-label="Open menu" type="button">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero / Title */}
      <section className="wl-hero">
        <div className="wl-hero__inner">
          <h1 className="wl-title">WISHLIST</h1>

          {/* Breadcrumb */}
          <nav className="pm-breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li>
                <a href="/">HOME</a>
              </li>
              <li>
                <a href="/shop">SHOP</a>
              </li>
              <li aria-current="page">WISHLIST</li>
            </ol>
          </nav>
        </div>
      </section>

      {/* Wishlist content */}
      <main className="wl-wrap">
        {/* toolbar */}
        <div className="wl-toolbar">
          <div className="wl-total">
            <span id="wl-count">0</span> items
          </div>
          <div className="wl-controls">
            <select id="wl-sort">
              <option value="recent">ล่าสุด</option>
              <option value="priceAsc">ราคาต่ำ→สูง</option>
              <option value="priceDesc">ราคาสูง→ต่ำ</option>
            </select>
            <button id="wl-clear" className="btn btn-light">
              ล้างทั้งหมด
            </button>
          </div>
        </div>

        {/* Confirm Modal */}
        <div id="confirm-modal" className="pm-modal" hidden>
          <div className="pm-modal__overlay" data-cancel></div>
          <div
            className="pm-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cm-title"
          >
            <h3 id="cm-title" data-title>
              Clear wishlist?
            </h3>
            <p className="pm-modal__text" data-msg>
              รายการทั้งหมดจะถูกลบออกจาก Wishlist ของคุณ
            </p>
            <div className="pm-modal__actions">
              <button className="btn" data-cancel>
                Cancel
              </button>
              <button className="btn btn-danger" data-ok>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* grid */}
        <div className="wl-grid" id="wl-grid"></div>

        {/* empty text */}
        <p className="wl-empty" id="wl-empty" hidden>
          ยังไม่มีรายการใน Wishlist
        </p>
      </main>

      {/* Footer */}
      <footer className="pm-footer">
        <div className="pm-footer__inner">
          <div className="pm-footer__cols">
            <nav className="pm-foot-col">
              <h4>Shopping</h4>
              <ul>
                <li>
                  <a href="#">Fresh Vegetables</a>
                </li>
                <li>
                  <a href="#">Fruits</a>
                </li>
                <li>
                  <a href="#">Meat & Seafood</a>
                </li>
                <li>
                  <a href="#">Frozen Food</a>
                </li>
                <li>
                  <a href="#">Snacks & Beverages</a>
                </li>
                <li>
                  <a href="#">Household Essentials</a>
                </li>
              </ul>
            </nav>

            <nav className="pm-foot-col">
              <h4>About Pure Mart</h4>
              <ul>
                <li>
                  <a href="#">About us</a>
                </li>
                <li>
                  <a href="#">Our Suppliers</a>
                </li>
                <li>
                  <a href="#">Contact us</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
              </ul>
            </nav>

            <nav className="pm-foot-col">
              <h4>Customer Care</h4>
              <ul>
                <li>
                  <a href="#">Blog / Recipes</a>
                </li>
                <li>
                  <a href="#">FAQ</a>
                </li>
                <li>
                  <a href="#">Shipping & Delivery</a>
                </li>
                <li>
                  <a href="#">Returns & Refunds</a>
                </li>
                <li>
                  <a href="#">Promotions</a>
                </li>
              </ul>
            </nav>

            <section className="pm-foot-sub">
              <h4>Subscribe</h4>
              <form id="footer-subscribe" noValidate>
                <label className="sr-only" htmlFor="sub-email">
                  Email address
                </label>
                <div className="pm-sub-input">
                  <input
                    id="sub-email"
                    name="email"
                    type="email"
                    placeholder="Email address"
                    required
                  />
                  <button type="submit" aria-label="Subscribe">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 12h14M13 5l7 7-7 7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <p className="pm-sub-note">
                  Pure Mart carefully selects fresh ingredients from trusted farms
                  and suppliers, delivering them straight to your home quickly and
                  safely.
                </p>
                <p className="pm-sub-msg" id="sub-msg" role="status" aria-live="polite"></p>
              </form>
            </section>
          </div>

          <hr className="pm-foot-sep" />

          <div className="pm-foot-bottom">
            <a className="pm-foot-logo" href="/" aria-label="Pure Mart">
              <img src="/src/whitelogo.png" alt="PURE MART" />
            </a>

            <ul className="pm-foot-legal">
              <li>
                <a href="#">Terms</a>
              </li>
              <li>
                <a href="#">Privacy</a>
              </li>
              <li>
                <a href="#">Cookies</a>
              </li>
            </ul>

            <div className="pm-foot-social">
              <a href="#" aria-label="Facebook">
                <img src="/src/facebook.svg" alt="Facebook" />
              </a>
              <a href="#" aria-label="Twitter">
                <img src="/src/Twit.svg" alt="Twitter" />
              </a>
              <a href="#" aria-label="Instagram">
                <img src="/src/ig.svg" alt="Instagram" />
              </a>
              <a href="#" aria-label="LinkedIn">
                <img src="/src/in.svg" alt="LinkedIn" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
