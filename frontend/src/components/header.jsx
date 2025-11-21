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

  // ===== ติด active ให้เมนู + ไอคอนตาม path (คงของเดิม) =====
  useEffect(() => {
    const path = (window.location.pathname || "/").toLowerCase();
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
    unmarkAll(".pm-nav a, .pm-right a.pm-icon, .pm-account");

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

    document.querySelectorAll(".pm-right a.pm-icon").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href && path.startsWith(href)) {
        markActive(a);
      }
    });

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

  // ===== ส่วนที่ "เพิ่ม" เข้ามา =====
  const authed = isAuthed();
  const displayName = authed && email ? email.split("@")[0] : "ACCOUNT";

  const handleLogout = () => {
    logout();
    setAccOpen(false);
    navigate("/login");
  };

  // ===== Autocomplete / fuzzy helpers (lightweight copy from ShopPage) =====
  const levenshtein = (a = "", b = "") => {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const v0 = new Array(n + 1).fill(0).map((_, i) => i);
    const v1 = new Array(n + 1).fill(0);
    for (let i = 0; i < m; i++) {
      v1[0] = i + 1;
      for (let j = 0; j < n; j++) {
        const cost = a[i] === b[j] ? 0 : 1;
        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      }
      for (let k = 0; k <= n; k++) v0[k] = v1[k];
    }
    return v1[n];
  };

  const fuzzyMatch = (q = "", text = "") => {
    if (!q) return false;
    const A = String(q).toLowerCase();
    const B = String(text).toLowerCase();
    if (B.includes(A)) return true;
    const tokens = B.split(/\s+/).filter(Boolean);
    const qLen = A.length;
    const maxDist = qLen <= 4 ? 1 : Math.max(1, Math.floor(qLen * 0.3));
    for (const t of tokens) {
      const dist = levenshtein(A, t.slice(0, Math.max(A.length + 2, t.length)));
      if (dist <= maxDist) return true;
    }
    const distFull = levenshtein(A, B.slice(0, Math.max(A.length + 2, B.length)));
    return distFull <= maxDist;
  };

  // fetch products once for autocomplete suggestions
  const ensureProducts = async () => {
    if (productsCache) return productsCache;
    try {
      const r = await fetch(`${API_URL}/api/products`, { headers: { Accept: "application/json" } });
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
    const normQ = String(q).toLowerCase().trim();
    const hits = [];
    for (const row of list) {
      const name = String(row.name || row.title || "").trim();
      const brand = String(row.brand || row.brandName || "").trim();
      const cat = String(row.category || row.cat || "").trim();
      if (!name && !brand && !cat) continue;
      if (name.toLowerCase().includes(normQ) || brand.toLowerCase().includes(normQ) || cat.toLowerCase().includes(normQ)) {
        hits.push({ type: "product", label: name, row });
      } else if (fuzzyMatch(normQ, name) || fuzzyMatch(normQ, brand) || fuzzyMatch(normQ, cat)) {
        hits.push({ type: "product", label: name, row });
      }
      if (hits.length >= 8) break;
    }
    setSuggestions(hits.slice(0, 8));
  };

  return (
    <>
      {/* Top stripe (ของเดิม) */}
      <div className="pm-topbar" />

      <header className="pm-header" ref={wrapRef}>
        <div className="pm-header__inner">
          {/* Logo (ของเดิม) */}
          <a href="/home" className="pm-logo" aria-label="Pure Mart">
            <img src="/assets/logo.png" alt="PURE MART" />
          </a>

          {/* Nav (ของเดิม) */}
          <nav className={`pm-nav ${navOpen ? "is-open" : ""}`} aria-label="Primary">
            <a href="/home">Home</a>
            <a href="/shop">Shop</a>
            <a href="/home#best-sellers">Best Sellers</a>
            <a href="/home#categories">Categories</a>
          </nav>

          {/* Search (scoped) */}
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
                // debounce suggestions
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
                  // navigate to shop without search param to reset results
                  navigate(`/shop`);
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
                    onMouseDown={(ev) => { ev.preventDefault(); }}
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

          {/* Right icons (ของเดิม + แค่เพิ่ม logic account) */}
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

                {/* ▼ แสดงชื่อผู้ใช้แทนคำว่า ACCOUNT เมื่อมีอีเมล */}
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

            {/* Wishlist (ของเดิม) */}
            <a href="/wishlist" className="pm-icon" aria-label="Wishlist">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.8 7.1a5 5 0 0 0-7.1 0L12 8.8l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.1 8.8-8.1a5 5 0 0 0 0-7.1Z" />
              </svg>
            </a>

            {/* Cart (ของเดิม) */}
            <a href="/cart" className="pm-icon" aria-label="Cart">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="21" r="1.6" />
                <circle cx="18" cy="21" r="1.6" />
                <path d="M3 3h2l2.2 11.2A2 2 0 0 0 9.2 16h8.7a2 2 0 0 0 2-1.6L22 7H6" />
              </svg>
            </a>

            {/* Hamburger (ของเดิม) */}
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
