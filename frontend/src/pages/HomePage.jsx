import React, { useRef, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./HomePage.css";
import Header from "../components/header";
import Footer from "../components/footer";

/* =========================================
   1) CONSTANTS & HELPERS (ด้านบน)
   ========================================= */
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

const formatTHB = (n) => {
  const v = Number(n ?? 0);
  try {
    return v.toLocaleString("th-TH", { style: "currency", currency: "THB" });
  } catch {
    return `฿ ${v.toFixed(2)}`;
  }
};

// helpers สำหรับรวม URL
const isAbs = (u) => /^https?:\/\//i.test(String(u || ""));
const join = (base, path) =>
  base.replace(/\/+$/, "") + "/" + String(path || "").replace(/^\/+/, "");

// URL รูปสินค้า (cover) — รองรับทั้ง URL เต็ม, พาธสัมพัทธ์ และ fallback ไป /api/products/:id/cover
const resolveCoverUrl = (p) => {
  const raw =
    p?.coverImageUrl ||
    p?.imageUrl ||
    p?.image_url ||
    (Array.isArray(p?.images)
      ? (p.images.find((i) => i.is_cover)?.image_url || p.images[0]?.image_url)
      : undefined);

  if (raw) {
    if (/^https?:\/\//i.test(raw)) return raw;        // URL เต็ม
    if (raw.startsWith("/")) return `${API_URL}${raw}`; // พาธ backend
    return `/${raw}`;                                  // พาธ public ฝั่ง FE
  }

  // ⬇⬇ NEW: ไม่มีรูปใน field → ใช้ GET /api/products/:id/cover
  const pid = p?.id ?? p?.productId ?? p?.product_id;
  if (pid != null) return `${API_URL}/api/products/${encodeURIComponent(pid)}/cover`;

  return "/assets/products/placeholder.png";
};

// fallback รูปหมวดหมู่หาก API ยังไม่มีรูป
const CAT_IMAGE_FALLBACKS = {
  "Dried Foods": "/assets/user/cat-dried-food.jpg",
  Meats: "/assets/user/cat-meat.jpg",
  "Frozen Foods": "/assets/user/cat-frozen.jpg",
  "Fruits & Vegetables": "/assets/user/cat-fruits-veg.jpg",
};

// URL รูปหมวดหมู่ — เหมือนหลักการสินค้า
const resolveCategoryImage = (cat) => {
  const raw = cat?.imageUrl || cat?.image_url || CAT_IMAGE_FALLBACKS[cat?.name] || "";
  if (!raw) return "/assets/products/placeholder.png";
  if (isAbs(raw)) return encodeURI(raw);
  return encodeURI(join(API_URL, raw));
};

/* =========================================
   2) DATA-FETCH SECTIONS (คอมโพเนนต์ดึงข้อมูล)
   ========================================= */

// ---------- Best Sellers (จาก DB) ----------
function BestSellersSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_URL}/api/products`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        const best = list
          .filter((x) =>
            Number.isFinite(Number(x.quantity)) ? Number(x.quantity) > 0 : true
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at || b.updatedAt || 0) -
              new Date(a.updated_at || a.updatedAt || 0)
          )
          .slice(0, 8);

        if (alive) setItems(best);
      } catch (e) {
        if (alive) setErr(e.message || "Fetch failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="best-sellers" className="best-sellers" aria-labelledby="best-title">
      <div className="best-sellers__head">
        <h2 id="best-title">Best Sellers.</h2>
        <a href="/home#best-sellers" className="shop-all">
          Shop all
        </a>
      </div>

      {loading && (
        <div className="products">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="product skeleton" aria-hidden="true">
              <div className="product__thumb" />
              <div className="product__body">
                <div className="product__title sk-line" />
                <div className="product__price sk-line" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && err && <div className="error">เกิดข้อผิดพลาดในการโหลดสินค้า: {err}</div>}

      {!loading && !err && (
        <div className="products">
          {items.map((p) => {
            const id = p.id ?? p.productId ?? p.product_id;
            const name = p.name ?? "";
            const price = p.price ?? 0;
            const img = resolveCoverUrl(p);

            return (
              <Link
                key={id}
                className="product"
                to={`/detail/${encodeURIComponent(id)}`}
                aria-label={name}
              >
                <div className="product__thumb">
                  <img
                    src={img}
                    alt={name}
                    loading="lazy"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fallback) {
                        e.currentTarget.dataset.fallback = 1;
                        e.currentTarget.src = "/assets/products/placeholder.png";
                      }
                    }}
                  />
                </div>
                <div className="product__body">
                  <h3 className="product__title">{name}</h3>
                  <div className="product__price">{formatTHB(price)}</div>
                  <button className="add-to-cart" type="button" aria-label="Add to cart">
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---------- Categories (จาก DB) ----------
function CategoriesSection() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_URL}/api/categories`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => String(a.name).localeCompare(String(b.name), "th"));
        if (alive) setCats(list);
      } catch (e) {
        if (alive) setErr(e.message || "Fetch failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="categories" className="category">
      <div className="category__inner">
        <div className="category__head">
          <h3>Browse by Category</h3>
          <span className="category__underline" aria-hidden="true"></span>
        </div>

        {loading && (
          <div className="category__grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="category-card skeleton" aria-hidden="true">
                <div className="category-thumb sk-block" />
              </div>
            ))}
          </div>
        )}

        {!loading && err && <div className="error">โหลดหมวดหมู่ไม่สำเร็จ: {err}</div>}

        {!loading && !err && (
          <div className="category__grid">
            {cats.map((cat) => {
              const name = cat.name ?? "";
              const img = resolveCategoryImage(cat);
              return (
                <a
                  key={cat.id ?? name}
                  href={`/shop?cat=${encodeURIComponent(name)}`}
                  className="category-card"
                  aria-label={name}
                >
                  <img
                    src={img}
                    alt={name}
                    loading="lazy"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fallback) {
                        e.currentTarget.dataset.fallback = 1;
                        e.currentTarget.src =
                          CAT_IMAGE_FALLBACKS[name] ||
                          "/assets/products/placeholder.png";
                      }
                    }}
                  />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- All Products (จาก DB, แนวนอน) ----------
function AllProductsSection({ listRef, onNext }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_URL}/api/products`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        if (alive) setItems(list);
      } catch (e) {
        if (alive) setErr(e.message || "Fetch failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="all-products" aria-labelledby="all-title">
      <div className="ap-head">
        <h3 id="all-title">All Products</h3>
      </div>

      <span className="ap-underline" aria-hidden="true"></span>

      {loading && (
        <div className="products" ref={listRef}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product skeleton" aria-hidden="true">
              <div className="product__thumb" />
              <div className="product__body">
                <div className="product__title sk-line" />
                <div className="product__price sk-line" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && err && <div className="error">โหลด All Products ไม่สำเร็จ: {err}</div>}

      {!loading && !err && (
        <div className="products" ref={listRef}>
          {items.map((p) => {
            const id = p.id ?? p.productId ?? p.product_id;
            const name = p.name ?? "";
            const price = p.price ?? 0;
            const img = resolveCoverUrl(p);
            return (
              <Link
                key={id}
                className="product"
                to={`/detail/${encodeURIComponent(id)}`}
                aria-label={name}
              >
                <div className="product__thumb">
                  <img
                    src={img}
                    alt={name}
                    loading="lazy"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fallback) {
                        e.currentTarget.dataset.fallback = 1;
                        e.currentTarget.src = "/assets/products/placeholder.png";
                      }
                    }}
                  />
                </div>
                <div className="product__body">
                  <h3 className="product__title">{name}</h3>
                  <div className="product__price">{formatTHB(price)}</div>
                  <button className="add-to-cart" type="button" aria-label="Add to cart">
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* =========================================
   3) PAGE (JSX ทั้งหมดอยู่ล่าง)
   ========================================= */
const HomePage = () => {
  const allProductsRef = useRef(null);

  // เลื่อนไปยัง anchor (#best-sellers / #categories) แบบ smooth
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const handleScrollNext = () => {
    if (allProductsRef.current) {
      allProductsRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Top stripe */}
      <div className="pm-topbar"></div>

      <main className="home">
        <div className="container">
          {/* ===== Banner 1 ===== */}
          <a href="/home#best-sellers" className="hero-card" aria-label="Shop Best Sellers">
            <img
              src="/assets/user/image48.png"
              alt="Pure & Fresh for Every Meal — Shop Best Sellers"
              loading="lazy"
            />
          </a>

          {/* ===== Best Sellers (DB) ===== */}
          <BestSellersSection />

          {/* ===== Banner 2 ===== */}
          <a href="#categories" className="hero-card" aria-label="Browse by Category">
            <img src="/assets/user/banner2.jpg" alt="Browse by Category" loading="lazy" />
          </a>

          {/* ===== Categories (DB) ===== */}
          <CategoriesSection />

          {/* ===== All Products (DB) ===== */}
          <AllProductsSection listRef={allProductsRef} onNext={handleScrollNext} />
        </div>
      </main>

      <Footer />
    </>
  );
};

export default HomePage;
