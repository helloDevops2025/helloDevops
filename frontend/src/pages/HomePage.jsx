import { useRef, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./HomePage.css";
import Footer from "./../components/Footer.jsx";

/* ===== Config & helpers ===== */
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
const isAbs = (u) => /^https?:\/\//i.test(String(u || ""));
const join = (base, path) => base.replace(/\/+$/, "") + "/" + String(path || "").replace(/^\/+/, "");

/* ===== Currency ===== */
const formatTHB = (n) => {
  const v = Number(n ?? 0);
  try {
    return v.toLocaleString("th-TH", { style: "currency", currency: "THB" });
  } catch {
    return `฿ ${v.toFixed(2)}`;
  }
};

/*  Cart (localStorage) helpers  */
const LS_CART = "pm_cart";
const readCart = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_CART) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const saveCart = (arr) => localStorage.setItem(LS_CART, JSON.stringify(arr));
const addItemToCart = ({ id, name, price, qty = 1, img }) => {
  const cart = readCart();
  const key = String(id ?? "");
  const i = cart.findIndex((x) => String(x.id) === key);
  if (i >= 0) {
    cart[i] = { ...cart[i], qty: Math.max(1, (cart[i].qty || 1) + qty) };
  } else {
    cart.push({
      id: key,
      name: name || "Unnamed product",
      price: Number(price) || 0,
      qty: Math.max(1, Number(qty) || 1),
      img: img || "/assets/products/placeholder.png",
    });
  }
  saveCart(cart);
  const count = cart.reduce((s, it) => s + (Number(it.qty) || 0), 0);
  try {
    window.dispatchEvent(new CustomEvent("pm_cart_updated", { detail: { count } }));
  } catch {}
};

/* ===== Image resolvers ===== */
const resolveCoverUrl = (p) => {
  const raw =
    p?.coverImageUrl ||
    p?.imageUrl ||
    p?.image_url ||
    (Array.isArray(p?.images)
      ? (p.images.find((i) => i.is_cover || i.isCover)?.image_url || p.images[0]?.image_url)
      : undefined);

  if (raw) {
    if (isAbs(raw)) return raw;
    if (raw.startsWith("/api")) return join(API_URL, raw);
    if (raw.startsWith("/")) return join(API_URL, raw);
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
  const pid = p?.id ?? p?.productId ?? p?.product_id;
  if (pid != null) return join(API_URL, `/api/products/${encodeURIComponent(pid)}/cover`);
  return "/assets/products/placeholder.png";
};

const CAT_IMAGE_FALLBACKS = {
  "Dried Foods": "/assets/user/cat-dried-food.jpg",
  Meats: "/assets/user/cat-meat.jpg",
  "Frozen Foods": "/assets/user/cat-frozen.jpg",
  "Fruits & Vegetables": "/assets/user/cat-fruits-veg.jpg",
  Beverage: "/assets/user/cat-beverage.jpg",
};
const resolveCategoryImage = (cat) => {
  const raw = cat?.imageUrl || cat?.image_url || CAT_IMAGE_FALLBACKS[cat?.name] || "";
  if (!raw) return "/assets/products/placeholder.png";
  if (isAbs(raw)) return encodeURI(raw);
  if (raw.startsWith("/api")) return encodeURI(join(API_URL, raw));
  const fePath = raw.startsWith("/") ? raw : `/${raw}`;
  return encodeURI(fePath);
};

/* ===== 🔥 Promotion helpers (ใช้ทั้ง BestSellers + AllProducts) ===== */

// เช็คว่าโปรนี้ Active ตาม status + วันที่หรือยัง
const isPromoActive = (p) => {
  const status = p.status ?? p.promo_status ?? "";
  if (status !== "ACTIVE") return false;

  const now = Date.now();
  const start = p.start_at || p.startAt || null;
  const end = p.end_at || p.endAt || null;

  if (start && new Date(start).getTime() > now) return false;
  if (end && new Date(end).getTime() < now) return false;
  return true;
};

// สร้างข้อความสั้น ๆ สำหรับ badge ของโปร
const getPromoLabel = (p) => {
  const type = p.promo_type || p.promoType;
  if (type === "PERCENT_OFF" && p.percent_off != null) {
    return `${Number(p.percent_off).toFixed(0)}% OFF`;
  }
  if (type === "AMOUNT_OFF" && p.amount_off != null) {
    return `฿${Number(p.amount_off).toFixed(0)} OFF`;
  }
  if (type === "BUY_X_GET_Y" && p.buy_qty && p.get_qty) {
    return `BUY ${p.buy_qty} GET ${p.get_qty}`;
  }
  if (type === "FIXED_PRICE" && p.fixed_price != null) {
    return `฿${Number(p.fixed_price).toFixed(0)}`;
  }
  return p.name || "PROMO";
};

// ดึง map: productId -> promoLabel (เฉพาะโปรแบบ scope PRODUCT ที่ active)
async function fetchPromotionMap() {
  try {
    const res = await fetch(`${API_URL}/api/promotions`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return new Map();

    const data = await res.json();
    const promos = Array.isArray(data) ? data : [];
    const activePromos = promos.filter(isPromoActive);

    const map = new Map();

    await Promise.all(
      activePromos.map(async (promo) => {
        const scope = promo.scope || promo.promo_scope;
        if (scope !== "PRODUCT") return; // หน้า home โชว์เฉพาะโปรที่ผูกกับสินค้าโดยตรง

        try {
          const r = await fetch(
            `${API_URL}/api/promotions/${encodeURIComponent(promo.id)}/products`,
            { headers: { Accept: "application/json" } }
          );
          if (!r.ok) return;
          const arr = await r.json();
          const products = Array.isArray(arr) ? arr : [];
          const label = getPromoLabel(promo);

          products.forEach((prod) => {
            const pid = prod.id ?? prod.productId ?? prod.product_id;
            if (pid == null) return;

            if (!map.has(pid)) {
              map.set(pid, label);
            } else {
              const prev = map.get(pid);
              if (!String(prev).includes(label)) {
                map.set(pid, `${prev} • ${label}`);
              }
            }
          });
        } catch {
          // เงียบไป ไม่ต้องทำอะไร ถ้าดึงสินค้าของโปรล้มเหลว
        }
      })
    );

    return map;
  } catch {
    return new Map();
  }
}

/* ===== Floating add-to-cart button (no useCart) ===== */
function ProductMiniCard({ id, name, price, img }) {
  const [added, setAdded] = useState(false);
  const onAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItemToCart({ id: String(id), name, price: Number(price) || 0, qty: 1, img });
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  };
  return (
    <button
      className={`add-to-cart${added ? " added" : ""}`}
      type="button"
      aria-label={added ? "Added" : "Add to cart"}
      title={added ? "Added ✓" : "Add to cart"}
      onClick={onAdd}
      style={{ background: added ? "#16a34a" : "#3E40AE", transition: "background-color .25s ease" }}
    >
      <i className={added ? "fas fa-check" : "fas fa-shopping-cart"} />
    </button>
  );
}

/* ===== Best Sellers ===== */
function BestSellersSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ปรับความยาว title ไม่ให้ชนปุ่มลอย
  useEffect(() => {
    if (loading) return;
    const el = document.getElementById("best-sellers");
    if (!el) return;
    const adjust = () => {
      const products = el.querySelectorAll(".product");
      products.forEach((p) => {
        const title = p.querySelector(".product__title");
        const fab = p.querySelector(".add-to-cart");
        if (!title) return;
        title.classList.remove("title--shorten");
        if (fab) {
          const titleRect = title.getBoundingClientRect();
          const fabRect = fab.getBoundingClientRect();
          if (titleRect.right > fabRect.left - 8) title.classList.add("title--shorten");
        }
      });
    };
    setTimeout(adjust, 0);
    window.addEventListener("resize", adjust);
    return () => window.removeEventListener("resize", adjust);
  }, [loading, items]);

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

        // เลือก 8 ตัว "best sellers" แบบเดิม
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

        // 🔥 ดึง promotion map แล้วแปะ label ลงสินค้า
        const promoMap = await fetchPromotionMap();
        const withPromo = best.map((p) => {
          const id = p.id ?? p.productId ?? p.product_id;
          const promoLabel = promoMap.get(id);
          return promoLabel ? { ...p, _promoLabel: promoLabel } : p;
        });

        if (alive) setItems(withPromo);
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
        <Link to="/shop?best=1" className="shop-all">
          Shop all
        </Link>
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

      {!loading && err && (
        <div className="error">Therefore, the goods can be loaded: {err}</div>
      )}

      {!loading && !err && (
        <div className="products">
          {items.map((p) => {
            const id = p.id ?? p.productId ?? p.product_id;
            const name = p.name ?? "";
            const price = p.price ?? 0;
            const img = resolveCoverUrl(p);
            const promoLabel = p._promoLabel;

            return (
              <Link
                key={id}
                className="product"
                to={`/detail/${encodeURIComponent(id)}`}
                aria-label={name}
              >
                <div className="product__thumb">
                  {/* 🔥 แสดง badge โปร ถ้ามี */}
                  {promoLabel && (
                    <span className="product__promo-badge">{promoLabel}</span>
                  )}
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
                  <ProductMiniCard id={id} name={name} price={price} img={img} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ===== Categories ===== */
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

        {!loading && err && (
          <div className="error">โหลดหมวดหมู่ไม่สำเร็จ: {err}</div>
        )}

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

/* ===== Adjust title clamp in a list ===== */
function useClampTitlesInList(listRef, deps = []) {
  useEffect(() => {
    const el = listRef?.current;
    if (!el) return;
    const adjust = () => {
      const products = el.querySelectorAll(".product");
      products.forEach((p) => {
        const title = p.querySelector(".product__title");
        const fab = p.querySelector(".add-to-cart");
        if (!title) return;
        title.classList.remove("title--shorten");
        if (fab) {
          const titleRect = title.getBoundingClientRect();
          const fabRect = fab.getBoundingClientRect();
          if (titleRect.right > fabRect.left - 8) title.classList.add("title--shorten");
        }
      });
    };
    setTimeout(adjust, 0);
    window.addEventListener("resize", adjust);
    return () => window.removeEventListener("resize", adjust);
  }, deps);
}

/* ===== All products ===== */
function AllProductsSection({ listRef }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useClampTitlesInList(listRef, [loading, items]);

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

        // 🔥 ใช้ promotion map เหมือนกัน
        const promoMap = await fetchPromotionMap();
        const withPromo = list.map((p) => {
          const id = p.id ?? p.productId ?? p.product_id;
          const promoLabel = promoMap.get(id);
          return promoLabel ? { ...p, _promoLabel: promoLabel } : p;
        });

        if (alive) setItems(withPromo);
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

      {!loading && err && (
        <div className="error">โหลด All Products ไม่สำเร็จ: {err}</div>
      )}

      {!loading && !err && (
        <div className="products" ref={listRef}>
          {items.map((p) => {
            const id = p.id ?? p.productId ?? p.product_id;
            const name = p.name ?? "";
            const price = p.price ?? 0;
            const img = resolveCoverUrl(p);
            const promoLabel = p._promoLabel;

            return (
              <Link
                key={id}
                className="product"
                to={`/detail/${encodeURIComponent(id)}`}
                aria-label={name}
              >
                <div className="product__thumb">
                  {/* 🔥 badge โปรใน All Products */}
                  {promoLabel && (
                    <span className="product__promo-badge">{promoLabel}</span>
                  )}
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
                  <ProductMiniCard id={id} name={name} price={price} img={img} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ===== PAGE ===== */
export default function HomePage() {
  const allProductsRef = useRef(null);
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <>
      <div className="pm-topbar"></div>

      <main className="home">
        <div className="container">
          {/* Hero banner */}
          <section className="hero-banner hero-banner--main" aria-label="Main banner">
            <img
              className="hero-img hero-img--focus-right"
              src="/assets/user/image48.png"
              alt="Pure & Fresh for Every Meal — Shop Best Sellers"
              loading="lazy"
            />
            <div className="hero-content">
              <h1>Pure & Fresh for Every Meal</h1>
              <p className="hero-sub">Find your favorites — fast.</p>
              <div className="hero-ctas">
                <Link to="/shop?best=1" className="hero-btn">
                  Shop Best Sellers
                </Link>
                <a href="#categories" className="hero-btn hero-btn--ghost">
                  Browse Categories
                </a>
              </div>
            </div>
          </section>

          <BestSellersSection />

          {/* Promo banner */}
          <section
            className="hero-banner hero-banner--promo"
            aria-label="Promotional banner"
          >
            <img
              className="hero-img hero-img--focus-right"
              src="/assets/user/banner2.png"
              alt="Seasonal produce — promo"
              loading="lazy"
            />
            <div className="hero-content">
              <h1>Fresh picks — 25% off</h1>
              <p className="hero-sub">
                Seasonal produce & pantry essentials. Limited time only.
              </p>
              <div className="hero-ctas">
                <Link to="/shop" className="hero-btn">
                  Shop the Sale
                </Link>
              </div>
            </div>
          </section>

          <CategoriesSection />
          <AllProductsSection listRef={allProductsRef} />
        </div>
      </main>

      <Footer />
    </>
  );
}
