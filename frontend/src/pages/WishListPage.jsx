import "./WishListPage.css";
import Header from "../components/header";
import Footer from "./../components/Footer.jsx";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const LS_KEY = "pm_wishlist";
const LS_CART = "pm_cart"; // ใช้ key เดียวกับหน้า Detail
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

// helpers
const clean = (s) => String(s ?? "").trim();
const isAbs = (u) => /^https?:\/\//i.test(String(u || ""));
const join = (base, path) =>
  base.replace(/\/+$/, "") + "/" + String(path || "").replace(/^\/+/, "");

// pick cover image URL
const resolveImageUrl = (row) => {
  const id = row.id ?? row.productId ?? row.product_id;
  let u =
    row.coverImageUrl ||
    row.imageUrl ||
    row.image_url ||
    (Array.isArray(row.images)
      ? (row.images.find((i) => i.is_cover)?.image_url ||
        row.images[0]?.image_url)
      : null);

  if (u) {
    if (isAbs(u)) return u;
    if (u.startsWith("/")) return join(API_URL, u);
    return `/${u}`;
  }
  return `${API_URL}/api/products/${encodeURIComponent(id)}/cover`;
};

function formatPrice(n) {
  return `฿ ${Number(n || 0).toFixed(2)}`;
}

// Cart helpers (ให้เหมือนหน้า Detail/Shop)
const readCart = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_CART) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const saveCart = (arr) =>
  localStorage.setItem(LS_CART, JSON.stringify(arr));

const cartKey = (p) =>
  String(p?.id ?? p?.productId ?? p?.product_id ?? "");

// Confirm Modal – ใช้คลาส wl-modal แยกจากที่อื่นเลย
function ConfirmModal({
  open,
  onOk,
  onCancel,
  title,
  message,
  okText = "Clear all",
  cancelText = "Cancel",
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div id="confirm-modal" className="wl-modal">
      <div className="wl-modal__overlay" onClick={onCancel}></div>
      <div
        className="wl-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-title"
      >
        <h3 id="cm-title">{title}</h3>
        <p className="wl-modal__text">{message}</p>
        <div className="wl-modal__actions">
          <button className="btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn btn-danger" onClick={onOk}>
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}

// localStorage helpers
function readWishIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    if (raw.length && typeof raw[0] === "object") {
      return raw.map((x) => Number(x?.id)).filter((n) => Number.isFinite(n));
    }
    return raw.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
}

function writeWishIds(ids) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...new Set(ids)]));
  } catch { }
}

export default function WishListPage() {
  const [wishIds, setWishIds] = useState(() => readWishIds());
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addedId, setAddedId] = useState(null); // ใช้แสดง ADDED ชั่วคราว

  // Auto-sync with other tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LS_KEY) setWishIds(readWishIds());
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") setWishIds(readWishIds());
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // โหลดสินค้าตาม wishIds
  useEffect(() => {
    let alive = true;

    if (!wishIds.length) {
      if (alive) {
        setItems([]);
        setLoading(false);
      }
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/products`, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const rows = (await res.json()) || [];
        const wishSet = new Set(wishIds);

        const mapped = rows
          .filter((x) =>
            wishSet.has(Number(x.id ?? x.productId ?? x.product_id))
          )
          .map((x) => ({
            id: Number(x.id ?? x.productId ?? x.product_id),
            name: clean(x.name),
            price: Number(x.price) || 0,
            img: resolveImageUrl(x),
            liked: true,
          }));

        if (alive) setItems(mapped);
      } catch (err) {
        if (alive) setItems([]);
        console.warn("Load wishlist products failed:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [wishIds]);

  useEffect(() => {
    writeWishIds(wishIds);
  }, [wishIds]);

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sortBy === "priceAsc") arr.sort((a, b) => a.price - b.price);
    if (sortBy === "priceDesc") arr.sort((a, b) => b.price - a.price);
    if (sortBy === "recent")
      arr.sort((a, b) => wishIds.indexOf(a.id) - wishIds.indexOf(b.id));
    return arr;
  }, [items, sortBy, wishIds]);

  const removeItem = (id) => {
    setWishIds((prev) => prev.filter((x) => x !== id));
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  //ADD TO CART ให้ทำงานเหมือนหน้า Detail/RELATED 
  const handleAddToCart = (id) => {
    const p = items.find((x) => x.id === id);
    if (!p) return;

    const cart = readCart();
    const key = cartKey(p);

    const item = {
      id: key,
      name: p.name,
      price: Number(p.price) || 0,
      qty: 1,
      img: p.img,
    };

    const idx = cart.findIndex((x) => String(x.id) === String(key));
    if (idx >= 0) {
      cart[idx] = {
        ...cart[idx],
        qty: (cart[idx].qty || 1) + 1,
      };
    } else {
      cart.push(item);
    }
    saveCart(cart);

    setAddedId(id);
    setTimeout(() => setAddedId(null), 800);
  };

  const clearAll = () => setConfirmOpen(true);

  const handleClearOk = () => {
    setWishIds([]);
    setItems([]);
    setConfirmOpen(false);
    setLoading(false);
  };

  return (
    <>
      <Header />

      <div className="wl-page">
        {/* HERO */}
        <section className="wl-hero">
          <div className="wl-hero__inner">
            <h1 className="wl-title">WISHLIST</h1>

            {/* breadcrumb */}
            <nav className="custom-breadcrumb" aria-label="Breadcrumb">
              <ol>
                <li className="custom-breadcrumb__item">
                  <a href="/">HOME</a>
                  <span className="divider">›</span>
                </li>
                <li className="custom-breadcrumb__item">
                  <a href="/shop">SHOP</a>
                  <span className="divider">›</span>
                </li>
                <li
                  className="custom-breadcrumb__item current"
                  aria-current="page"
                >
                  WISHLIST
                </li>
              </ol>
            </nav>
          </div>
        </section>

        {/* CONTENT */}
        <main className="wl-wrap">
          {/* Toolbar */}
          <div className="wl-toolbar">
            <div className="wl-total">
              <span id="wl-count">{loading ? "…" : items.length}</span> items
            </div>

            <div className="wl-controls">
              <select
                id="wl-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Latest</option>
                <option value="priceAsc">Low → High</option>
                <option value="priceDesc">High → Low</option>
              </select>

              <button id="wl-clear" className="btn" onClick={clearAll}>
                Clear All
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="wl-grid">
            {sorted.map((item) => (
              <article key={item.id} className="wl-card">
                <div className="wl-thumb">
                  <button
                    className="wl-like"
                    aria-label="remove from wishlist"
                    title="Remove"
                    onClick={() => removeItem(item.id)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <line
                        x1="6"
                        y1="6"
                        x2="18"
                        y2="18"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                      ></line>
                      <line
                        x1="18"
                        y1="6"
                        x2="6"
                        y2="18"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                      ></line>
                    </svg>
                  </button>

                  <Link to={`/detail/${item.id}`} aria-label={item.name}>
                    <img src={item.img} alt={item.name} />
                  </Link>
                </div>

                <div className="wl-body">
                  <h3 className="wl-name">
                    <Link to={`/detail/${item.id}`}>{item.name}</Link>
                  </h3>
                  <div className="wl-price">{formatPrice(item.price)}</div>
                  <div className="wl-meta">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.8 7.1a5 5 0 0 0-7.1 0L12 8.8l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.1 8.8-8.1a5 5 0 0 0 0-7.1Z"></path>
                    </svg>
                    <span>{item.liked ? "In wishlist" : "—"}</span>
                  </div>
                </div>

                <div className="wl-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddToCart(item.id)}
                  >
                    {addedId === item.id ? "ADDED ✓" : "ADD TO CART"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Empty message */}
          <p className="wl-empty" hidden={loading || items.length !== 0}>
            No items in your wishlist
          </p>
        </main>
      </div>

      <Footer />

      <ConfirmModal
        open={confirmOpen}
        onOk={handleClearOk}
        onCancel={() => setConfirmOpen(false)}
        title="Clear all items?"
        message="This will remove all items from your wishlist."
        okText="Clear all"
        cancelText="Cancel"
      />
    </>
  );
}
