import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Footer from "./../components/Footer.jsx";
import "./DetailPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
const LS = { WISHLIST: "pm_wishlist", CART: "pm_cart" };

const FALLBACK_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='640'>
     <rect fill='#f2f4f8' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9aa3b2' font-family='Poppins, Arial' font-size='24'>No Image</text>
   </svg>`
)}`;

/* ---------- utils ---------- */
const normId = (v) => String(v ?? "");
const toSlug = (s = "") =>
  s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
const fmtPrice = (n) => Number(n || 0).toFixed(2);
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const jsonLS = {
  get(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      return v ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const cart = {
  read: () => jsonLS.get(LS.CART, []),
  write: (arr) => jsonLS.set(LS.CART, arr),
  upsert(item) {
    const items = cart.read();
    const id = String(item.id);
    const i = items.findIndex((x) => String(x.id) === id);
    if (i >= 0) items[i] = { ...items[i], qty: Math.max(1, (items[i].qty || 1) + (item.qty || 1)) };
    else items.push(item);
    cart.write(items);
  },
};

const wishlist = {
  read: () => jsonLS.get(LS.WISHLIST, []),
  write: (arr) => jsonLS.set(LS.WISHLIST, arr),
  has(id) {
    return wishlist.read().some((x) => normId(x.id ?? x) === normId(id));
  },
  add(p) {
    const w = wishlist.read();
    if (wishlist.has(p.id)) return;
    w.push({ id: normId(p.id), title: p.title, price: p.price, cover: p.imgMain });
    wishlist.write(w);
  },
  remove(id) {
    wishlist.write(wishlist.read().filter((x) => normId(x.id ?? x) !== normId(id)));
  },
};

/* ---------- data hooks ---------- */
async function safeJson(url) {
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

function useProductAndRelated(id) {
  const [data, setData] = useState({ product: null, related: [], loading: true, error: "" });

  useEffect(() => {
    let off = false;
    (async () => {
      setData((d) => ({ ...d, loading: true, error: "" }));
      try {
        const [p, imgs, cats, brands] = await Promise.all([
          safeJson(`${API_URL}/api/products/${encodeURIComponent(id)}`),
          safeJson(`${API_URL}/api/products/${encodeURIComponent(id)}/images`),
          safeJson(`${API_URL}/api/categories`),
          safeJson(`${API_URL}/api/brands`),
        ]);
        if (off) return;
        if (!p) throw new Error("ไม่พบสินค้า หรือเรียก API ไม่สำเร็จ");

        const catName = Array.isArray(cats) ? cats.find((c) => c.id === p.categoryId)?.name || "" : "";
        const brandName = Array.isArray(brands) ? brands.find((b) => b.id === p.brandId)?.name || "" : "";

        let imgUrl = `${API_URL}/api/products/${encodeURIComponent(p.id ?? id)}/cover`;
        if (Array.isArray(imgs) && imgs.length) {
          const cover = imgs.find((x) => x.isCover) || imgs[0];
          if (cover?.imageUrl) imgUrl = cover.imageUrl;
        }

        const product = {
          id: p.id ?? id,
          title: p.name || "",
          brand: brandName || "",
          brandId: p.brandId ?? null,
          sku: p.productId || "",
          price: Number(p.price) || 0,
          stock: Math.max(0, Number(p.quantity) || 0),
          imgMain: imgUrl || FALLBACK_IMG,
          imgDesc: imgUrl || FALLBACK_IMG,
          categoryId: p.categoryId ?? null,
          categoryName: catName || "",
          categorySlug: toSlug(catName) || "all",
          excerpt: p.description || "",
        };

        // related: เน้นหมวดเดียวกัน > แบรนด์เดียวกัน > อื่นๆ
        const all = (await safeJson(`${API_URL}/api/products`)) || [];
        const notSelf = (x) => normId(x.id) !== normId(product.id);
        const sameCat = all.filter(notSelf).filter((x) => String(x.categoryId) === String(product.categoryId));
        const sameBrand = all.filter(notSelf).filter((x) => String(x.brandId) === String(product.brandId));
        const others = all.filter(notSelf);

        const pick = [];
        for (const group of [sameCat, sameBrand, others]) {
          for (const it of group) {
            if (pick.find((p) => normId(p.id) === normId(it.id))) continue;
            pick.push(it);
            if (pick.length >= 4) break;
          }
          if (pick.length >= 4) break;
        }
        const related = pick.map((x) => ({
          id: x.id,
          title: x.name,
          price: Number(x.price) || 0,
          cover: `${API_URL}/api/products/${encodeURIComponent(x.id)}/cover`,
        }));

        setData({ product, related, loading: false, error: "" });
        document.title = product.title ? `${product.title} – Pure Mart` : "Details Page";
      } catch (e) {
        if (!off) setData({ product: null, related: [], loading: false, error: e.message || "โหลดข้อมูลไม่สำเร็จ" });
      }
    })();
    return () => { off = true; };
  }, [id]);

  return data;
}

/* ---------- UI ---------- */
function Breadcrumb({ categoryName, currentTitle }) {
  return (
    <nav className="pm-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><Link to="/home">HOME</Link></li>
        <li>
          <Link to={`/shop?cat=${encodeURIComponent(categoryName || "")}`}>
            {String(categoryName || "").toUpperCase()}
          </Link>
        </li>
        <li className="current" aria-current="page"><span title={currentTitle}>{currentTitle}</span></li>
      </ol>
    </nav>
  );
}

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, related, loading, error } = useProductAndRelated(id);

  const [qty, setQty] = useState("1");
  const [added, setAdded] = useState(false);
  const [wish, setWish] = useState(false);

  useEffect(() => {
    if (product) setWish(wishlist.has(product.id));
  }, [product]);

  const stock = product?.stock ?? 0;
  const disabledQty = stock <= 0;

  const handleImgError = (e) => {
    if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
  };

  const onQtyInput = (v) => {
    if (v === "") return setQty("");
    const n = Math.floor(Number(v));
    if (!Number.isFinite(n)) return;
    setQty(String(clamp(n, 1, Math.max(1, stock))));
  };

  const buildCartItem = () => ({
    id: String(product?.id ?? product?.productId ?? product?.sku ?? ""),
    name: product?.title || "Unnamed product",
    price: Number(product?.price) || 0,
    qty: clamp(Number(qty || 1), 1, Math.max(1, stock)),
    img: product?.imgMain || FALLBACK_IMG,
  });

  const ensureStock = (need) => {
    if (stock <= 0) { window.alert("This item is currently out of stock."); return false; }
    if (need > stock) { window.alert(`Only ${stock} left in stock. Please reduce the quantity.`); return false; }
    return true;
  };

  const addToCart = () => {
    const need = Number(qty || 1);
    if (!ensureStock(need)) return;
    cart.upsert(buildCartItem());
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  };

  const buyNow = () => {
    const need = Number(qty || 1);
    if (!ensureStock(need)) return;
    navigate("/place-order", { state: { from: "buy-now", item: buildCartItem() } });
  };

  const toggleWish = (checked) => {
    setWish(checked);
    if (!product) return;
    checked ? wishlist.add(product) : wishlist.remove(product.id);
  };

  if (loading) {
    return (
      <>
        <main className="page container detail-page">
          <section className="product card" style={{ padding: 24 }}>Loading product...</section>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <main className="page container detail-page">
          <section className="product card" style={{ padding: 24, color: "#b91c1c" }}>
            เกิดข้อผิดพลาด: {error || "โหลดข้อมูลไม่สำเร็จ"}
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="page container detail-page">
        <Breadcrumb categoryName={product.categoryName} currentTitle={product.title} />

        {/* Product hero */}
        <section className="product card">
          <div className="product__media">
            <div className="product__img">
              <img src={product.imgMain} alt={product.title} loading="lazy" onError={handleImgError} />
            </div>
          </div>

          <div className="product__info">
            <div className="product__header">
              <h1 className="product__title">{product.title}</h1>
              <div className="meta">
                <span>Brand: <span className="link">{product.brand || "-"}</span></span>
                <span>SKU: {product.sku || "-"}</span>
              </div>
            </div>

            <div className="price">
              <span className="currency">฿</span>
              <span className="amount">{fmtPrice(product.price)}</span>
            </div>

            <div className="stock">
              <span
                className="dot" aria-hidden="true"
                style={{
                  display: "inline-block", width: 10, height: 10, borderRadius: 9999, marginRight: 8,
                  backgroundColor: stock > 0 ? "#22c55e" : "#ef4444",
                  boxShadow: `0 0 0 3px ${stock > 0 ? "#dcfce7" : "#fee2e2"}`
                }}
              />
              {stock > 0 ? <>Availability: <b>{stock} in stock</b></> : <b style={{ color: "#b91c1c" }}>Out of stock</b>}
            </div>

            <p className="excerpt">{product.excerpt || "—"}</p>

            <div className="buy-row">
              <div className="qty" data-qty="">
                <button className="qty__btn" type="button" aria-label="decrease"
                  onClick={() => onQtyInput(String(Math.max(1, (Number(qty || 1) | 0) - 1)))}
                  disabled={disabledQty || Number(qty || 1) <= 1}>−</button>

                <input
                  className="qty__input" type="number" min={1} max={Math.max(1, stock)} inputMode="numeric"
                  value={qty} onChange={(e) => onQtyInput(e.target.value)}
                  onBlur={() => onQtyInput(String(qty || 1))} onWheel={(e) => e.currentTarget.blur()}
                  disabled={disabledQty} aria-label="Quantity"
                />

                <button className="qty__btn" type="button" aria-label="increase"
                  onClick={() => onQtyInput(String((Number(qty || 1) | 0) + 1))}
                  disabled={disabledQty || Number(qty || 1) >= stock}>+</button>
              </div>

              <button className="btn btn--primary" type="button" onClick={addToCart}>
                {added ? "ADDED ✓" : "ADD TO CART"}
              </button>

              <button className="btn btn--gradient" type="button" onClick={buyNow}>
                BUY NOW
              </button>
            </div>

            <label className="wish">
              <input type="checkbox" className="heart-toggle" checked={wish} onChange={(e) => toggleWish(e.target.checked)} />
              <span className="heart-label">{wish ? "In wishlist" : "Add to wishlist"}</span>
            </label>

            <div className="cat">
              Category:{" "}
              <Link to={`/shop?cat=${encodeURIComponent(product.categoryName || "")}`} className="link">
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
              <p><b>Product Detail</b><br />{product.excerpt || "No description."}</p>
            </div>
            <div className="desc__img">
              <img src={product.imgDesc} alt={product.title} loading="lazy" onError={handleImgError} />
            </div>
          </div>
        </section>

        {/* Related */}
        <section className="section card">
          <h2 className="section__title">RELATED PRODUCTS</h2>
          {related.length === 0 ? (
            <div style={{ padding: 12, color: "#6b7280" }}>ไม่พบสินค้าที่เกี่ยวข้อง</div>
          ) : (
            <div className="grid">
              {related.map((r) => (
                <article key={r.id} className="product-card">
                  <Link className="thumb" to={`/detail/${r.id}`} aria-label={r.title} title={r.title}>
                    <img src={r.cover} alt={r.title} loading="lazy" onError={handleImgError} />
                  </Link>
                  <h3 className="product-card__title">{r.title}</h3>
                  <div className="product-card__price">฿ {fmtPrice(r.price)}</div>
                  <button
                    className="btn btn--primary btn--block" type="button"
                    onClick={() => cart.upsert({ id: normId(r.id), name: r.title, price: Number(r.price) || 0, qty: 1, img: r.cover || FALLBACK_IMG })}
                  >
                    ADD TO CART
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
