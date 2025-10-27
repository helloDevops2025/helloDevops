import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./DetailPage.css";
import Footer from "../components/footer";

/* === Config & helpers === */
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

/* ===== Wishlist config ===== */
const LS_KEY = "pm_wishlist";
const normId = (v) => String(v ?? "");

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
    const raw = localStorage.getItem(LS_KEY);
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const saveWL = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));
const entryId = (x) => (typeof x === "object" && x !== null ? normId(x.id) : normId(x));
const inWL = (arr, id) => arr.some((x) => entryId(x) === normId(id));
const toEntry = (p) => ({
  id: normId(p.id),
  title: p.title,
  price: p.price,
  cover: p.imgMain || `${API_URL}/api/products/${encodeURIComponent(p.id)}/cover`,
});
const addToWL = (arr, p) => {
  if (inWL(arr, p.id)) return arr;
  const hasObject = arr.some((x) => typeof x === "object" && x !== null);
  if (hasObject || arr.length === 0) return [...arr, toEntry(p)];
  return [...arr, normId(p.id)]; // กรณีเดิมเก็บเป็น id ล้วน
};
const removeFromWL = (arr, id) => arr.filter((x) => entryId(x) !== normId(id));

/* Breadcrumb */
function Breadcrumb({ categorySlug, categoryName, currentTitle }) {
  return (
    <nav className="pm-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/home">HOME</Link>
        </li>
            <li>
              {/* Link to shop with category filter - /category route isn't defined in router */}
              <Link to={`/shop?cat=${encodeURIComponent(categoryName)}`}>
                {categoryName.toUpperCase()}
              </Link>
            </li>
        <li className="current" aria-current="page">
          <span title={currentTitle}>{currentTitle}</span>
        </li>
      </ol>
    </nav>
  );
}

export default function DetailPage() {
  const { id } = useParams();

  /* ============== Main product ============== */
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

  // เก็บ qty เป็น string เพื่อผูกกับ input แต่จะ clamp เป็นตัวเลขทุกครั้งก่อนใช้
  const [qty, setQty] = useState("1");
  const [wish, setWish] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  /* ============== Related products ============== */
  const [related, setRelated] = useState([]);
  const [relLoading, setRelLoading] = useState(false);

  useEffect(() => {
    document.title = "Details Page";
  }, []);

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
          if (cover?.imageUrl) imgUrl = cover.imageUrl;
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

        // ปรับ qty ให้ไม่เกิน stock เมื่อโหลดสินค้าเสร็จ
        setQty((prev) => {
          const n = clampQty(Number(prev || 1), mapped.stock);
          return String(n < 1 && mapped.stock > 0 ? 1 : n || (mapped.stock > 0 ? 1 : 1));
        });

        // ตั้งค่า wish เริ่มต้นจาก localStorage (เทียบ id เป็น string)
        const list = loadWL();
        if (!cancelled) setWish(inWL(list, normId(mapped.id)));

        /* ---------- โหลด Related หลังได้ categoryId ---------- */
        if (mapped.categoryId) {
          setRelLoading(true);
          const withFilter =
            (await safeJson(
              `${API_URL}/api/products?categoryId=${encodeURIComponent(
                mapped.categoryId
              )}`
            )) ?? (await safeJson(`${API_URL}/api/products`));

          if (!cancelled && Array.isArray(withFilter)) {
            const rel = withFilter
              .filter((x) => x.id !== mapped.id)
              .filter(
                (x) =>
                  !mapped.brandId ||
                  x.brandId === mapped.brandId ||
                  x.categoryId === mapped.categoryId
              )
              .slice(0, 8)
              .map((x) => ({
                id: x.id,
                title: x.name,
                price: Number(x.price) || 0,
                cover: `${API_URL}/api/products/${encodeURIComponent(
                  x.id
                )}/cover`,
              }));
            setRelated(rel);
          }
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

  /* ===== Qty helpers (ล็อกไม่ให้เกิน stock) ===== */
  const clampQty = (v, stock) => {
    const s = Math.max(0, Number(stock || 0));
    const n = Math.floor(Number.isFinite(v) ? v : 1);
    // ถ้า stock = 0 ให้คืน 1 สำหรับการแสดงผล แต่จะ disable ปุ่มซื้ออยู่แล้ว
    if (s <= 0) return 1;
    return Math.min(Math.max(n, 1), s);
  };

  const stock = Math.max(0, Number(product.stock || 0));
  const disabled = stock <= 0;

  const dec = () => {
    setQty((prev) => String(Math.max(1, Math.floor(Number(prev || 1) - 1))));
  };
  const inc = () => {
    setQty((prev) => {
      const next = Math.floor(Number(prev || 1) + 1);
      return String(clampQty(next, stock));
    });
  };
  const onQtyChange = (e) => {
    const raw = e.target.value;
    // อนุญาตให้พิมพ์ว่างระหว่างพิมพ์ แต่จะ clamp ตอน blur/enter
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

  const handleImgError = (e) => {
    if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
  };

  /* ===== Wishlist: sync checkbox ↔ localStorage ===== */
  const toggleWish = (checked) => {
    setWish(checked);
    const list = loadWL();
    const next = checked ? addToWL(list, product) : removeFromWL(list, product.id);
    saveWL(next);
  };

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

            {/* ===== Product hero ===== */}
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

                <div className="stock">
                  <span className="dot" aria-hidden="true" />
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
                      disabled={disabled || Number(qty || 1) <= 1}
                      title={disabled ? "Out of stock" : "Decrease quantity"}
                    >
                      −
                    </button>

                    <input
                      className="qty__input"
                      type="number"
                      min={1}
                      max={Math.max(1, stock)}
                      inputMode="numeric"
                      value={qty}
                      onChange={onQtyChange}
                      onBlur={onQtyBlur}
                      onWheel={(e) => e.currentTarget.blur()}
                      disabled={disabled}
                      aria-label="Quantity"
                      title={
                        disabled
                          ? "Out of stock"
                          : `Max ${stock} piece${stock > 1 ? "s" : ""}`
                      }
                    />

                    <button
                      className="qty__btn"
                      type="button"
                      aria-label="increase"
                      onClick={inc}
                      disabled={disabled || Number(qty || 1) >= stock}
                      title={
                        disabled
                          ? "Out of stock"
                          : Number(qty || 1) >= stock
                          ? "Reached available stock"
                          : "Increase quantity"
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="btn btn--primary"
                    type="button"
                    disabled={disabled || Number(qty || 1) > stock}
                    title={
                      disabled
                        ? "Out of stock"
                        : Number(qty || 1) > stock
                        ? "Quantity exceeds stock"
                        : "Add to cart"
                    }
                  >
                    ADD TO CART
                  </button>
                  <button
                    className="btn btn--gradient"
                    type="button"
                    disabled={disabled || Number(qty || 1) > stock}
                    title={
                      disabled
                        ? "Out of stock"
                        : Number(qty || 1) > stock
                        ? "Quantity exceeds stock"
                        : "Buy now"
                    }
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
                    disabled={false} /* wishlist ไม่ต้องผูกกับ stock */
                  />
                  <span className="heart-label">
                    {wish ? "In wishlist" : "Add to wishlist"}
                  </span>
                </label>

                <div className="cat">
                  Category:{" "}
                    <Link
                      to={`/shop?cat=${encodeURIComponent(product.categoryName || "")}`}
                      className="link"
                    >
                      {product.categoryName || "-"}
                    </Link>
                </div>
              </div>
            </section>

            {/* ===== Description ===== */}
            <section className="section card">
              <h2 className="section__title">DESCRIPTION</h2>
              <div className="desc">
                <div className="desc__text">
                  <p>
                    <b>รายละเอียดสินค้า</b>
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

            {/* ===== Related products ===== */}
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
                        <input type="checkbox" className="heart-toggle" />
                        <span className="heart-label">Add to wishlist</span>
                      </label>

                      <button
                        className="btn btn--primary btn--block"
                        type="button"
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
    </>
  );
}
