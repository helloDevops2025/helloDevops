import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { isAuthed } from "../auth";
import "./DetailPage.css";
import Footer from "./../components/Footer.jsx";

/* Config & helpers */
const API_URL = import.meta.env.VITE_API_URL ;

/* ===== Storage keys */
const LS_WISHLIST = "pm_wishlist";
const LS_CART = "pm_cart";

const normId = (v) => String(v ?? "");
const lower = (s) => String(s ?? "").toLowerCase().trim();

const FALLBACK_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='640'>
     <rect fill='#f2f4f8' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9aa3b2' font-family='Poppins, Arial' font-size='24'>No Image</text>
   </svg>`
)}`;

const toSlug = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

/* ฟังก์ชันปรับแต่งชื่อให้ดูดี */
const prettifyTitle = (s = "") =>
  s
    .replace(/(\d+)\s*(กก\.?)/g, "$1 $2")
    .replace(/\s*(\d+\s*กก\.?)\s*$/i, " ($1)");

const fmtPrice = (n) => Number(n || 0).toFixed(2);

/* ===== Wishlist (LocalStorage) helpers ===== */
const loadWL = () => {
  try {
    const raw = localStorage.getItem(LS_WISHLIST);
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const saveWL = (arr) => localStorage.setItem(LS_WISHLIST, JSON.stringify(arr));
const entryId = (x) =>
  typeof x === "object" && x !== null ? normId(x.id) : normId(x);
const inWL = (arr, id) => arr.some((x) => entryId(x) === normId(id));
const toEntry = (p) => ({
  id: normId(p.id),
  title: p.title,
  price: p.price,
  cover:
    p.imgMain || `${API_URL}/api/products/${encodeURIComponent(p.id)}/cover`,
});
const addToWL = (arr, p) => {
  if (inWL(arr, p.id)) return arr;
  const hasObject = arr.some((x) => typeof x === "object" && x !== null);
  if (hasObject || arr.length === 0) return [...arr, toEntry(p)];
  return [...arr, normId(p.id)];
};
const removeFromWL = (arr, id) =>
  arr.filter((x) => entryId(x) !== normId(id));

/* Cart helpers */
const readCart = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_CART) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const saveCart = (arr) => localStorage.setItem(LS_CART, JSON.stringify(arr));

/* Breadcrumb */
function Breadcrumb({ categorySlug, categoryName, currentTitle }) {
  return (
    <nav className="pm-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/home">HOME</Link>
        </li>
        <li>
          <Link to={`/shop?cat=${encodeURIComponent(categoryName)}`}>
            {String(categoryName || "").toUpperCase()}
          </Link>
        </li>
        <li className="current" aria-current="page">
          <span title={currentTitle}>{currentTitle}</span>
        </li>
      </ol>
    </nav>
  );
}

/* ===== shuffle แบบเร็ว ๆ เพื่อสุ่มเลือกสินค้าเติมให้ครบ 4 ===== */
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------- Simple Popup (inline styles) ---------- */
function Popup({ open, title = "Warning", message, onClose }) {
  if (!open) return null;

  const [hover, setHover] = useState(false);

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.35)",
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  };
  const box = {
    width: "100%",
    maxWidth: 440,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,.2)",
    padding: "20px 20px 16px",
  };
  const head = { fontWeight: 700, fontSize: 18, marginBottom: 8, color: "#111827" };
  const msg = { color: "#374151", marginBottom: 16, lineHeight: 1.5 };
  const btn = {
    display: "inline-block",
    background: hover ? "#34369A" : "#3E40AE",
    color: "#fff",
    border: 0,
    borderRadius: 10,
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "Poppins, system-ui, sans-serif",
    transition: "background .15s ease, transform .08s ease",
  };

  return (
    <div style={overlay} role="dialog" aria-modal="true">
      <div style={box}>
        <div style={head}>{title}</div>
        <div style={msg}>{message}</div>
        <button
          onClick={onClose}
          style={btn}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onMouseDown={(e) =>
            (e.currentTarget.style.transform = "translateY(1px)")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.transform = "translateY(0)")
          }
          autoFocus
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* Main product */
  const [product, setProduct] = useState({
    id: "",
    title: "",
    brand: "",
    sku: "",
    price: 0,
    stock: 0,
    imgMain: FALLBACK_IMG,
    imgDesc: FALLBACK_IMG,
    categoryId: null,
    brandId: null,
    categoryName: "",
    categorySlug: "all",
    excerpt: "",
  });

  // qty (เริ่มต้นให้เป็น 0 ไปก่อน)
  const [qty, setQty] = useState("0");
  const [wish, setWish] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [added, setAdded] = useState(false);

  /* Related products */
  const [related, setRelated] = useState([]);
  const [relLoading, setRelLoading] = useState(false);

  /* Popup state */
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");

  const openWarn = (msg) => {
    setPopupMsg(msg);
    setPopupOpen(true);
  };

  useEffect(() => {
    document.title = "Details Page";
  }, []);

  /*  Qty helpers (ล็อกไม่ให้เกิน stock และถ้า stock = 0 ให้ qty = 0) */
  const clampQty = (v, stock) => {
    const s = Math.max(0, Number(stock || 0));
    const n = Math.floor(Number.isFinite(v) ? v : 1);
    if (s <= 0) return 0; // ❗ ของหมด → 0
    return Math.min(Math.max(n, 1), s);
  };

  useEffect(() => {
    let cancelled = false;

    const safeJson = async (url) => {
      try {
        const r = await fetch(url, { headers: { Accept: "application/json" } });
        if (!r.ok) return null;
        return await r.json();
      } catch {
        return null;
      }
    };

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [p, imgs, cats, brands] = await Promise.all([
          safeJson(`${API_URL}/api/products/${encodeURIComponent(id)}`),
          safeJson(`${API_URL}/api/products/${encodeURIComponent(id)}/images`),
          safeJson(`${API_URL}/api/categories`),
          safeJson(`${API_URL}/api/brands`),
        ]);

        if (cancelled) return;
        if (!p) throw new Error("ไม่พบสินค้า หรือเรียก API ไม่สำเร็จ");

        const catName = Array.isArray(cats)
          ? cats.find((c) => c.id === p.categoryId)?.name || ""
          : "";
        const brandName = Array.isArray(brands)
          ? brands.find((b) => b.id === p.brandId)?.name || ""
          : "";

          let imgUrl = `${API_URL}/api/products/${encodeURIComponent(
              p.id ?? id
          )}/cover`;

          if (Array.isArray(imgs) && imgs.length) {
              const cover = imgs.find((x) => x.isCover) || imgs[0];

              // ❗อย่าใช้ cover.imageUrl เพราะ backend ส่ง path ผิด
              // imgUrl = cover.imageUrl;   <-- ลบ/คอมเมนต์ทิ้ง
          }

          const mapped = {
          id: p.id ?? id,
          title: p.name || "",
          brand: brandName || "",
          brandId: p.brandId ?? null,
          sku: p.productId || "",
          price: Number(p.price) || 0,
          stock: Number(p.quantity) || 0,
          imgMain: imgUrl || FALLBACK_IMG,
          imgDesc: imgUrl || FALLBACK_IMG,
          categoryId: p.categoryId ?? null,
          categoryName: catName || "",
          categorySlug: toSlug(catName) || "all",
          excerpt: p.description || "",
        };

        setProduct(mapped);
        document.title = mapped.title
          ? `${mapped.title} – Pure Mart`
          : "Details Page";

        // ถ้าของหมด → qty = 0, ถ้ามีของ → อย่างน้อย 1
        setQty(() => {
          const s = Number(mapped.stock || 0);
          if (s <= 0) return "0";
          return String(clampQty(1, s));
        });

        // wishlist init
        const list = loadWL();
        if (!cancelled) setWish(inWL(list, normId(mapped.id)));

        /* ===== RELATED ===== */
        setRelLoading(true);
        const allProducts = (await safeJson(`${API_URL}/api/products`)) || [];

        if (!cancelled && Array.isArray(allProducts)) {
          const curId = normId(mapped.id);
          const targetCatId = normId(mapped.categoryId);
          const targetCatName = lower(mapped.categoryName);

          const isSameCategory = (x) => {
            const xCatId = normId(x.categoryId);
            const xCatName = lower(x.categoryName ?? x.category);
            return (
              (targetCatId && xCatId && xCatId === targetCatId) ||
              (targetCatName && xCatName && xCatName === targetCatName)
            );
          };

          const notSelf = (x) => normId(x.id) !== curId;

          const sameCat = allProducts.filter(notSelf).filter(isSameCategory);

          const sameBrand = allProducts
            .filter(notSelf)
            .filter((x) => mapped.brandId != null && x.brandId === mapped.brandId);

          const others = allProducts.filter(notSelf);

          const pick = [];
          for (const group of [sameCat, sameBrand, shuffle(others)]) {
            for (const item of group) {
              if (pick.find((p) => normId(p.id) === normId(item.id))) continue;
              pick.push(item);
              if (pick.length >= 4) break;
            }
            if (pick.length >= 4) break;
          }

          const rel = pick.map((x) => ({
            id: x.id,
            title: x.name,
            price: Number(x.price) || 0,
            cover: `${API_URL}/api/products/${encodeURIComponent(
              x.id
            )}/cover`,
          }));

          setRelated(rel);
        }
      } catch (e) {
        setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRelLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, id]);

  const stock = Math.max(0, Number(product.stock || 0));
  const disabledQty = stock <= 0;

  const dec = () => {
    setQty((prev) => {
      const next = Number(prev || 1) - 1;
      return String(clampQty(next, stock));
    });
  };

  const inc = () => {
    setQty((prev) => {
      const next = Number(prev || 1) + 1;
      return String(clampQty(next, stock));
    });
  };

  const onQtyChange = (e) => {
    const raw = e.target.value;
    if (raw === "") return setQty("");
    const num = Math.floor(Number(raw));
    if (!Number.isFinite(num)) return;
    setQty(String(clampQty(num, stock)));
  };

  const onQtyBlur = () => {
    setQty((prev) => {
      const num = Math.floor(Number(prev || 1));
      return String(clampQty(num, stock));
    });
  };

  const cartKey = (p) => {
    // ยึด id เป็นหลัก ถ้าไม่มีค่อยใช้ productId/sku
    return String(
      p?.id ?? p?.productId ?? p?.product_id ?? p?.sku ?? ""
    );
  };

  const handleImgError = (e) => {
    if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
  };

  /* Wishlist: sync checkbox ↔ localStorage */
  const toggleWish = (checked) => {
    setWish(checked);
    const list = loadWL();
    const next = checked ? addToWL(list, product) : removeFromWL(list, product.id);
    saveWL(next);
  };

  /* Cart: Add & Buy */
  const buildCartItem = () => {
    const pid = cartKey(product) || "#UNKNOWN";
    return {
      id: pid,
      name: product.title || "Unnamed product",
      price: Number(product.price) || 0,
      qty: clampQty(Number(qty || 1), stock),
      img: product.imgMain || FALLBACK_IMG,
    };
  };

  const addToCart = () => {
    if (stock <= 0) {
      openWarn("This item is currently out of stock.");
      return;
    }
    const item = buildCartItem();
    const reqQty = Number(qty || 1);
    if (reqQty > stock) {
      openWarn(`Only ${stock} left in stock. Please reduce the quantity.`);
      return;
    }
    const cart = readCart();
    const idx = cart.findIndex((x) => String(x.id) === String(item.id));
    if (idx >= 0) {
      cart[idx] = {
        ...cart[idx],
        qty: Math.max(1, (cart[idx].qty || 1) + (item.qty || 1)),
      };
    } else {
      cart.push(item);
    }
    saveCart(cart);
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  };

  // BUY NOW
  const buyNow = () => {
    if (stock <= 0) {
      openWarn("This item is currently out of stock.");
      return;
    }
    const reqQty = Number(qty || 1);
    if (reqQty > stock) {
      openWarn(`Only ${stock} left in stock. Please reduce the quantity.`);
      return;
    }
    const item = buildCartItem();
    navigate("/place-order", { state: { from: "buy-now", item } });
  };

  // ถ้าของหมด บังคับให้ช่องแสดง "0" เสมอ (กันเคส state ค้างเป็น 1)
  const displayQty = stock <= 0 ? "0" : qty;

  return (
    <>
      <main className="page container detail-page">
        {loading ? (
          <section className="product card" style={{ padding: 24 }}>
            Loading product...
          </section>
        ) : err ? (
          <section
            className="product card"
            style={{ padding: 24, color: "#b91c1c" }}
          >
            เกิดข้อผิดพลาด: {err}
          </section>
        ) : (
          <>
            <Breadcrumb
              categorySlug={product.categorySlug}
              categoryName={product.categoryName}
              currentTitle={product.title}
            />

            {/* Product hero */}
            <section className="product card">
              <div className="product__media">
                <div className="product__img">
                  <img
                    src={product.imgMain}
                    alt={product.title}
                    loading="lazy"
                    onError={handleImgError}
                  />
                </div>
              </div>

              <div className="product__info">
                {/* Header */}
                <div className="product__header">
                  <h1 className="product__title">
                    {prettifyTitle(product.title)}
                  </h1>
                  <div className="meta">
                    <span>
                      Brand:{" "}
                      <a
                        href="#"
                        className="link"
                        aria-label={`Brand ${product.brand}`}
                      >
                        {product.brand || "-"}
                      </a>
                    </span>
                    <span>SKU: {product.sku || "-"}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="price">
                  <span className="currency">฿</span>
                  <span className="amount">{fmtPrice(product.price)}</span>
                </div>

                {/* Stock line */}
                <div className="stock">
                  <span
                    className="dot"
                    aria-hidden="true"
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "999px",
                      marginRight: 8,
                      backgroundColor:
                        stock > 0 ? "#22c55e" : "#ef4444", // green / red
                      boxShadow: `0 0 0 3px ${
                        stock > 0 ? "#dcfce7" : "#fee2e2"
                      }`, // soft ring
                    }}
                  />
                  {stock > 0 ? (
                    <>
                      Availability: <b>{stock} in stock</b>
                    </>
                  ) : (
                    <b style={{ color: "#b91c1c" }}>Out of stock</b>
                  )}
                </div>

                <p className="excerpt">{product.excerpt || "—"}</p>

                <div className="buy-row">
                  <div className="qty" data-qty="">
                    <button
                      className="qty__btn"
                      type="button"
                      aria-label="decrease"
                      onClick={dec}
                      disabled={disabledQty || Number(displayQty || 1) <= 1}
                    >
                      −
                    </button>
                    <input
                      className="qty__input"
                      type="number"
                      min={stock > 0 ? 1 : 0}
                      max={stock > 0 ? stock : 0}
                      inputMode="numeric"
                      value={displayQty}
                      onChange={onQtyChange}
                      onBlur={onQtyBlur}
                      onWheel={(e) => e.currentTarget.blur()}
                      disabled={disabledQty}
                      aria-label="Quantity"
                    />
                    <button
                      className="qty__btn"
                      type="button"
                      aria-label="increase"
                      onClick={inc}
                      disabled={disabledQty || Number(displayQty || 1) >= stock}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="btn btn--primary"
                    type="button"
                    onClick={addToCart}
                  >
                    {added ? "ADDED ✓" : "ADD TO CART"}
                  </button>

                  <button
                    className="btn btn--gradient"
                    type="button"
                    onClick={buyNow}
                  >
                    BUY NOW
                  </button>
                </div>

                <label className="wish">
                  <input
                    type="checkbox"
                    className="heart-toggle"
                    checked={wish}
                    onChange={(e) => toggleWish(e.target.checked)}
                    disabled={false}
                  />
                  <span className="heart-label">
                    {wish ? "In wishlist" : "Add to wishlist"}
                  </span>
                </label>

                <div className="cat">
                  Category:{" "}
                  <Link
                    to={`/shop?cat=${encodeURIComponent(
                      product.categoryName || ""
                    )}`}
                    className="link"
                  >
                    {product.categoryName || "-"}
                  </Link>
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="section card">
              <h2 className="section__title">DESCRIPTION</h2>
              <div className="desc">
                <div className="desc__text">
                  <p>
                    <b>Product Detail</b>
                    <br />
                    {product.excerpt || "No description."}
                  </p>
                </div>
                <div className="desc__img">
                  <img
                    src={product.imgDesc}
                    alt={product.title}
                    loading="lazy"
                    onError={handleImgError}
                  />
                </div>
              </div>
            </section>

            {/* Related products */}
            <section className="section card">
              <h2 className="section__title">RELATED PRODUCTS</h2>

              {relLoading ? (
                <div style={{ padding: 12, color: "#6b7280" }}>
                  กำลังโหลดสินค้าแนะนำ...
                </div>
              ) : related.length === 0 ? (
                <div style={{ padding: 12, color: "#6b7280" }}>
                  ไม่พบสินค้าที่เกี่ยวข้อง
                </div>
              ) : (
                <div className="grid">
                  {related.map((r) => (
                    <article key={r.id} className="product-card">
                      <Link
                        className="thumb"
                        to={`/detail/${r.id}`}
                        aria-label={r.title}
                        title={r.title}
                      >
                        <img
                          src={r.cover}
                          alt={r.title}
                          loading="lazy"
                          onError={handleImgError}
                        />
                      </Link>

                      <h3 className="product-card__title">{r.title}</h3>

                      <div className="product-card__price">
                        ฿ {fmtPrice(r.price)}
                      </div>

                      <label className="wish" style={{ marginTop: 4 }}>
                        <input
                          type="checkbox"
                          className="heart-toggle"
                        />
                        <span className="heart-label">Add to wishlist</span>
                      </label>

                      <button
                        className="btn btn--primary btn--block"
                        type="button"
                        onClick={() => {
                          const cart = readCart();
                          const item = {
                            id: normId(r.id),
                            name: r.title,
                            price: Number(r.price) || 0,
                            qty: 1,
                            img: r.cover || FALLBACK_IMG,
                          };
                          const idx = cart.findIndex(
                            (x) => String(x.id) === String(item.id)
                          );
                          if (idx >= 0)
                            cart[idx] = {
                              ...cart[idx],
                              qty: (cart[idx].qty || 1) + 1,
                            };
                          else cart.push(item);
                          saveCart(cart);
                          setAdded(true);
                          setTimeout(() => setAdded(false), 800);
                        }}
                      >
                        ADD TO CART
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />

      {/* Popup */}
      <Popup
        open={popupOpen}
        title="Warning"
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
}
