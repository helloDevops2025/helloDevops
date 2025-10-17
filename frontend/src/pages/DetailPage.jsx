import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./DetailPage.css";
import Footer from "../components/footer.jsx";

/* === Config & helpers (ไม่กระทบดิไซน์) === */
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
const FALLBACK_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='640'>
     <rect fill='#f2f4f8' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9aa3b2' font-family='Poppins, Arial' font-size='24'>No Image</text>
   </svg>`
)}`;

const toSlug = (s) => String(s || "")
  .toLowerCase()
  .trim()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9-]/g, "");

/* Breadcrumb (เดิม) */
function Breadcrumb({ categorySlug, categoryName, currentTitle }) {
  return (
    <nav className="pm-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li>
          <a href="/">HOME</a>
        </li>
        <li>
          <a href={`/category/${categorySlug}`}>{(categoryName || "").toUpperCase()}</a>
        </li>
        <li className="current" aria-current="page">
          <span title={currentTitle}>{currentTitle}</span>
        </li>
      </ol>
    </nav>
  );
}

export default function DetailPage() {
  const { id } = useParams(); // /detail/:id

  useEffect(() => { document.title = "Details Page"; }, []);

  // เก็บรูปแบบเดิมของ product เพื่อไม่กระทบดิไซน์
  const [product, setProduct] = useState({
    title: "",
    brand: "",
    sku: "",
    price: 0,
    stock: 0,
    imgMain: FALLBACK_IMG,
    imgDesc: FALLBACK_IMG,
    categoryName: "",
    categorySlug: "all",
    excerpt: "",
  });
  const [qty, setQty] = useState("1");
  const [wish, setWish] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ดึงจาก API แล้ว "แม็ป" ให้เข้ากับตัวแปร product เดิม
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
          ? (cats.find((c) => c.id === p.categoryId)?.name || "")
          : "";
        const brandName = Array.isArray(brands)
          ? (brands.find((b) => b.id === p.brandId)?.name || "")
          : "";

        // เลือกรูป cover ถ้ามี ไม่งั้น fallback ไป /cover
        let imgUrl = `${API_URL}/api/products/${encodeURIComponent(p.id ?? id)}/cover`;
        if (Array.isArray(imgs) && imgs.length) {
          const cover = imgs.find((x) => x.isCover) || imgs[0];
          if (cover?.imageUrl) imgUrl = cover.imageUrl; // backend สร้าง absolute แล้ว
        }

        const mapped = {
          title: p.name || "",
          brand: brandName || "",
          sku: p.productId || "",
          price: Number(p.price) || 0,
          stock: Number(p.quantity) || 0,
          imgMain: imgUrl || FALLBACK_IMG,
          imgDesc: imgUrl || FALLBACK_IMG,
          categoryName: catName || "",
          categorySlug: toSlug(catName) || "all",
          excerpt: p.description || "",
        };

        setProduct(mapped);
        document.title = mapped.title ? `${mapped.title} – Pure Mart` : "Details Page";
      } catch (e) {
        setErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [API_URL, id]);

  const clamp = (v) => Math.max(1, parseInt(v || "1", 10));
  const disabled = product.stock <= 0;
  const handleImgError = (e) => {
    if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
  };

  /* ====== ด้านล่างคือ JSX เดิมทั้งหมด (ไม่เปลี่ยนดีไซน์) ====== */
  return (
    <>
      <main className="page container detail-page">
        {loading ? (
          <section className="product card" style={{ padding: 24 }}>Loading product...</section>
        ) : err ? (
          <section className="product card" style={{ padding: 24, color: "#b91c1c" }}>
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
                {/* Title + Brand/SKU */}
                <div className="product__header">
                  <h1 className="product__title">{product.title}</h1>
                  <div className="meta">
                    <span>
                      Brand:{" "}
                      <a href="#" className="link" aria-label={`Brand ${product.brand}`}>
                        {product.brand || "-"}
                      </a>
                    </span>
                    <span>SKU: {product.sku || "-"}</span>
                  </div>
                </div>

                <div className="price">฿ {Number(product.price).toFixed(2)}</div>
                <div className="stock">
                  <span className="dot" aria-hidden="true" />
                  Availability: <b>{product.stock} in stock</b>
                </div>

                <p className="excerpt">
                  {product.excerpt || "—"}
                </p>

                <div className="buy-row">
                  <div className="qty" data-qty="">
                    <button
                      className="qty__btn"
                      type="button"
                      aria-label="decrease"
                      onClick={() => setQty(String(clamp(Number(qty) - 1)))}
                    >
                      −
                    </button>

                    <input
                      className="qty__input"
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      onBlur={() => setQty(String(clamp(qty)))}
                      onWheel={(e) => e.currentTarget.blur()}
                    />

                    <button
                      className="qty__btn"
                      type="button"
                      aria-label="increase"
                      onClick={() => setQty(String(clamp(Number(qty) + 1)))}
                    >
                      +
                    </button>
                  </div>

                  <button className="btn btn--primary" type="button" disabled={disabled}>
                    ADD TO CART
                  </button>
                  <button className="btn btn--gradient" type="button" disabled={disabled}>
                    BUY NOW
                  </button>
                </div>

                <label className="wish">
                  <input
                    type="checkbox"
                    className="heart-toggle"
                    checked={wish}
                    onChange={(e) => setWish(e.target.checked)}
                  />
                  <span className="heart-label">Add to wishlist</span>
                </label>

                <div className="cat">
                  Category:{" "}
                  <a href={`/category/${product.categorySlug}`} className="link">
                    {product.categoryName || "-"}
                  </a>
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="section card">
              <h2 className="section__title">DESCRIPTION</h2>
              <div className="desc">
                <div className="desc__text">
                  <p>
                    <b>รายละเอียดสินค้า</b><br />
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
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
