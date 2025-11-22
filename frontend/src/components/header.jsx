import React, { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
import { Link, useNavigate } from "react-router-dom";
import { getEmail, isAuthed, logout } from "../auth"; // ✅ ใช้ helper เดียวกับฝั่งแอดมิน
import "./header.css";

const Header = () => {
  const [accOpen, setAccOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchScope, setSearchScope] = useState("name");
  // autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [productsCache, setProductsCache] = useState(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const suggestTimer = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ให้ body มี padding-top รองรับ header ติดบน
  useEffect(() => {
    document.body.classList.add("has-header");
    return () => document.body.classList.remove("has-header");
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

  // ดึงอีเมลจาก session/localStorage ผ่าน helper
  useEffect(() => {
    setEmail(getEmail() || "");
  }, []);

  // ===== auth =====
  const authed = isAuthed();
  const displayName = authed && email ? email.split("@")[0] : "ACCOUNT";

  const handleLogout = () => {
    logout();
    setAccOpen(false);
    navigate("/login");
  };

  // ===== path / active helper =====
  const path = (location.pathname || "").toLowerCase();
  const isHome = path === "/" || path.startsWith("/home");
  const isShop = path.startsWith("/shop");
  const isWishlist = path.startsWith("/wishlist");
  const isCart = path.startsWith("/cart");
  const isAccountRelated =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/profile") ||
    path.startsWith("/account") ||
    path.startsWith("/history");

  // ===================== SEARCH HELPERS =====================

  const normalizeText = (s = "") =>
    String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();

  const levenshtein = (a = "", b = "") => {
    const A = normalizeText(a);
    const B = normalizeText(b);
    const m = A.length;
    const n = B.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const v0 = new Array(n + 1).fill(0).map((_, i) => i);
    const v1 = new Array(n + 1).fill(0);
    for (let i = 0; i < m; i++) {
      v1[0] = i + 1;
      for (let j = 0; j < n; j++) {
        const cost = A[i] === B[j] ? 0 : 1;
        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      }
      for (let k = 0; k <= n; k++) v0[k] = v1[k];
    }
    return v1[n];
  };

  const fuzzyMatch = (q = "", text = "") => {
    if (!q) return false;
    const A = normalizeText(q);
    const B = normalizeText(text);
    if (B.includes(A)) return true;

    const tokens = B.split(/\s+/).filter(Boolean);
    const qLen = A.length;
    const maxDist = qLen <= 4 ? 1 : Math.max(1, Math.floor(qLen * 0.3));

    for (const t of tokens) {
      const dist = levenshtein(A, t);
      if (dist <= maxDist) return true;
    }
    const distFull = levenshtein(A, B);
    return distFull <= maxDist;
  };

  const expandQuery = (q = "") => {
    const normQ = normalizeText(q);
    const extra = [];
    // compare using normalized forms so different unicode compositions
    // like "นํ้า" (combining marks) still match correctly
    const namNorm = normalizeText("น้ำ");
    if (namNorm && normQ.includes(namNorm)) {
      // product-level synonyms
      extra.push("น้ำดื่ม", "water", "drinking water");
      // category-level keywords so any product in beverage category matches
      extra.push("beverage", "เครื่องดื่ม", "เครื่อง ดื่ม");
    }
    if (normQ.includes("water")) {
      extra.push("น้ำ", "น้ํา", "น้ำดื่ม", "drinking water");
      extra.push("beverage", "เครื่องดื่ม");
    }
    
    // map 'เนื้อ' to meats category + related synonyms
    const neuNorm = normalizeText("เนื้อ");
    if (neuNorm && normQ.includes(neuNorm)) {
      extra.push("เนื้อสัตว์", "meat", "meats", "beef", "pork", "chicken");
      extra.push("meats", "meat-products", "เนื้อ");
    }
    return [q, ...extra];
  };

  const matchProductWithQuery = (row, q) => {
    if (!q) return true;
    const name = String(row.name || row.title || "").trim();
    const brand = String(row.brand || row.brandName || "").trim();
    const cat = String(row.category || row.cat || "").trim();
    if (!name && !brand && !cat) return false;

    const variants = expandQuery(q);
    const fields = [name, brand, cat].filter(Boolean);

    for (const v of variants) {
      for (const f of fields) {
        if (fuzzyMatch(v, f)) return true;
      }
    }
    return false;
  };

  // fetch products once for autocomplete suggestions
  const ensureProducts = async () => {
    if (productsCache) return productsCache;
    try {
      const r = await fetch(`${API_URL}/api/products`, {
        headers: { Accept: "application/json" },
      });
      if (!r.ok) return [];
      const js = await r.json();
      setProductsCache(js || []);
      return js || [];
    } catch (e) {
      setProductsCache([]);
      return [];
    }
  };

  const doSuggest = async (q) => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const list = await ensureProducts();
    const hits = [];

    for (const row of list) {
      if (matchProductWithQuery(row, q)) {
        const name = String(row.name || row.title || "").trim();
        hits.push({ type: "product", label: name || q, row });
      }
      if (hits.length >= 8) break;
    }
    setSuggestions(hits.slice(0, 8));
  };

  // ===================== RENDER =====================
  return (
    <>
      {/* Top stripe */}
      <div className="pm-topbar" />

      <header className="pm-header" ref={wrapRef}>
        <div className="pm-header__inner">
          {/* Logo */}
          <Link to="/home" className="pm-logo" aria-label="Pure Mart">
            <img src="/assets/logo.png" alt="PURE MART" />
          </Link>

          {/* Nav */}
          <nav className={`pm-nav ${navOpen ? "is-open" : ""}`} aria-label="Primary">
            <Link to="/home" className={isHome ? "active" : ""}>
              Home
            </Link>
            <Link to="/shop" className={isShop ? "active" : ""}>
              Shop
            </Link>
            <a href="/home#best-sellers">Best Sellers</a>
            <a href="/home#categories">Categories</a>
          </nav>

          {/* Search */}
          <form
            className="pm-search"
            role="search"
            aria-label="Site search"
            onSubmit={(e) => {
              e.preventDefault();
              const params = new URLSearchParams();
              if (searchQ) params.set("search", searchQ);
              navigate(`/shop?${params.toString()}`);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Search (Brand · Product · Category)"
              value={searchQ}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQ(v);
                clearTimeout(suggestTimer.current);
                suggestTimer.current = setTimeout(() => doSuggest(v), 250);
                setSuggestOpen(true);
              }}
              onFocus={() => {
                if (suggestions.length) setSuggestOpen(true);
              }}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 180)}
            />

            {/* clear button (x) */}
            {searchQ && (
              <button
                type="button"
                className="clear-btn"
                aria-label="Clear search"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSearchQ("");
                  setSuggestions([]);
                  setSuggestOpen(false);

                  // ถ้าอยู่หน้า /shop ให้ลบ ?search=... ออกจาก URL ด้วย
                  if (isShop) {
                    navigate("/shop");
                  }
                }}
              >
                ×
              </button>
            )}

            {/* suggestions dropdown */}
            {suggestOpen && suggestions.length > 0 && (
              <div className="search-suggestions" role="listbox">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="search-suggestion-item"
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                    }}
                    onClick={() => {
                      const q = s.label || (s.row && s.row.name) || searchQ;
                      setSearchQ(q);
                      setSuggestOpen(false);
                      navigate(`/shop?search=${encodeURIComponent(q)}`);
                    }}
                  >
                    <div className="ss-main">{s.label}</div>
                    {s.row?.brand ? <div className="ss-sub">{s.row.brand}</div> : null}
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Right icons */}
          <div className="pm-right">
            {/* Account Dropdown */}
            <div className="pm-dropdown-wrapper">
              <button
                className={`pm-icon pm-account ${isAccountRelated ? "active" : ""}`}
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

                <span className="pm-icon__label">
                  <span className="pm-name">{displayName}</span>
                </span>

                <svg className="pm-caret" viewBox="0 0 24 24" aria-hidden="true">
                  <polygon points="6,8 18,8 12,16" fill="currentColor" />
                </svg>
              </button>

              <div
                id="account-menu"
                className={`pm-dropdown ${accOpen ? "is-open" : ""}`}
                role="menu"
              >
                {authed ? (
                  <>
                    <Link
                      to="/history"
                      role="menuitem"
                      tabIndex={accOpen ? 0 : -1}
                      onClick={() => setAccOpen(false)}
                    >
                      Order History
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={accOpen ? 0 : -1}
                      className="pm-dropdown__btn"
                      onClick={handleLogout}
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      role="menuitem"
                      tabIndex={accOpen ? 0 : -1}
                      onClick={() => setAccOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      role="menuitem"
                      tabIndex={accOpen ? 0 : -1}
                      onClick={() => setAccOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className={`pm-icon ${isWishlist ? "active" : ""}`}
              aria-label="Wishlist"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.8 7.1a5 5 0 0 0-7.1 0L12 8.8l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.1 8.8-8.1a5 5 0 0 0 0-7.1Z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className={`pm-icon ${isCart ? "active" : ""}`}
              aria-label="Cart"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="21" r="1.6" />
                <circle cx="18" cy="21" r="1.6" />
                <path d="M3 3h2l2.2 11.2A2 2 0 0 0 9.2 16h8.7a2 2 0 0 0 2-1.6L22 7H6" />
              </svg>
            </Link>

            {/* Hamburger */}
            <button
              className="pm-burger"
              aria-label="Open menu"
              aria-expanded={navOpen ? "true" : "false"}
              type="button"
              onClick={() => setNavOpen((v) => !v)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
