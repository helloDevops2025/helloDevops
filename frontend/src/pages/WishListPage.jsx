import "./WishListPage.css";
import Header from "../components/header";
import Footer from "../components/Footer";
import { useEffect, useMemo, useState } from "react";

const LS_KEY = "pm_wishlist";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

/* helpers */
const clean = (s) => String(s ?? "").trim();
const isAbs = (u) => /^https?:\/\//i.test(String(u || ""));
const join = (base, path) =>
  base.replace(/\/+$/, "") + "/" + String(path || "").replace(/^\/+/, "");

/* เลือก URL รูป cover จากข้อมูลแถวสินค้า (กติกาเดียวกับหน้า Shop/Home) */
const resolveImageUrl = (row) => {
  const id = row.id ?? row.productId ?? row.product_id;
  let u =
    row.coverImageUrl ||
    row.imageUrl ||
    row.image_url ||
    (Array.isArray(row.images)
      ? (row.images.find((i) => i.is_cover)?.image_url || row.images[0]?.image_url)
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

/* Modal เดิม */
function ConfirmModal({
  open,
  onOk,
  onCancel,
  title,
  message,
  okText = "ล้างทั้งหมด",
  cancelText = "ยกเลิก",
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div id="confirm-modal" className="pm-modal">
      <div className="pm-modal__overlay" onClick={onCancel}></div>
      <div
        className="pm-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-title"
      >
        <h3 id="cm-title">{title}</h3>
        <p className="pm-modal__text">{message}</p>
        <div className="pm-modal__actions">
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

/* อ่านชุด id ที่กดหัวใจจาก localStorage (รองรับรูปแบบเก่า/ใหม่) */
function readWishIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    // ถ้าเป็น array ของ object เก่า -> map เป็น id
    if (raw.length && typeof raw[0] === "object") {
      return raw
        .map((x) => Number(x?.id))
        .filter((n) => Number.isFinite(n));
    }
    // กรณีเป็น array ของ id (string/number)
    return raw
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
}

function writeWishIds(ids) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...new Set(ids)]));
  } catch {}
}

export default function WishListPage() {
  /* state หลัก */
  const [wishIds, setWishIds] = useState(() => readWishIds()); // [id, id, ...]
  const [items, setItems] = useState([]); // [{id,name,price,img,liked:true}]
  const [sortBy, setSortBy] = useState("recent");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /* โหลดสินค้าจริงตาม id ที่กดหัวใจ */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (!wishIds.length) {
          if (alive) setItems([]);
          return;
        }
        // ดึงสินค้าทั้งหมดครั้งเดียว แล้วกรองตาม id ที่อยู่ใน wishIds
        const res = await fetch(`${API_URL}/api/products`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = (await res.json()) || [];

        const wishSet = new Set(wishIds);
        const mapped = rows
          .filter((x) => wishSet.has(Number(x.id ?? x.productId ?? x.product_id)))
          .map((x) => ({
            id: Number(x.id ?? x.productId ?? x.product_id),
            name: clean(x.name),
            price: Number(x.price) || 0,
            img: resolveImageUrl(x),
            liked: true,
          }));

        if (alive) setItems(mapped);
      } catch (e) {
        if (alive) setItems([]);
        console.warn("Load wishlist products failed:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [wishIds]);

  /* sync localStorage เมื่อ wishIds เปลี่ยน */
  useEffect(() => {
    writeWishIds(wishIds);
  }, [wishIds]);

  /* เรียงลำดับ (ดีไซน์เดิม) */
  const sorted = useMemo(() => {
    const arr = [...items];
    if (sortBy === "priceAsc") arr.sort((a, b) => a.price - b.price);
    if (sortBy === "priceDesc") arr.sort((a, b) => b.price - a.price);
    if (sortBy === "recent")
      // แสดงตามลำดับ wishIds ปัจจุบัน (เหมือน "ล่าสุด")
      arr.sort(
        (a, b) => wishIds.indexOf(a.id) - wishIds.indexOf(b.id)
      );
    return arr;
  }, [items, sortBy, wishIds]);

  /* actions */
  const removeItem = (id) => {
    setWishIds((prev) => prev.filter((x) => x !== id));
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const handleAddToCart = (id) => {
    const p = items.find((x) => x.id === id);
    if (p) alert(`เพิ่ม "${p.name}" ลงตะกร้าแล้ว`);
  };

  const clearAll = () => setConfirmOpen(true);
  const handleClearOk = () => {
    setWishIds([]);
    setItems([]);
    setConfirmOpen(false);
  };

  return (
    <>
      <Header />

      <div className="wl-page">
        {/* HERO */}
        <section className="wl-hero">
          <div className="wl-hero__inner">
            <h1 className="wl-title">WISHLIST</h1>

            <nav className="custom-breadcrumb" aria-label="Breadcrumb">
              <ol>
                <li className="custom-breadcrumb__item">
                  <a href="/">HOME</a>
                </li>
                <li className="custom-breadcrumb__item">
                  <span className="divider">›</span>
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
                <option value="recent">ล่าสุด</option>
                <option value="priceAsc">ราคาต่ำ→สูง</option>
                <option value="priceDesc">ราคาสูง→ต่ำ</option>
              </select>
              <button id="wl-clear" className="btn" onClick={clearAll}>
                ล้างทั้งหมด
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
                  <img src={item.img} alt={item.name} />
                </div>

                <div className="wl-body">
                  <h3 className="wl-name">{item.name}</h3>
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
                    ADD TO CART
                  </button>
                </div>
              </article>
            ))}
          </div>

          <p className="wl-empty" hidden={loading || items.length !== 0}>
            ยังไม่มีรายการใน Wishlist
          </p>
        </main>
      </div>

      <Footer />

      <ConfirmModal
        open={confirmOpen}
        onOk={handleClearOk}
        onCancel={() => setConfirmOpen(false)}
        title="ล้าง Wishlist ทั้งหมด?"
        message="รายการทั้งหมดจะถูกลบออกจาก Wishlist ของคุณ"
      />
    </>
  );
}
