import { useRef, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./HomePage.css";
import Footer from "./../components/Footer.jsx";

/* ===== Config & helpers ===== */
const API_URL = import.meta.env.VITE_API_URL ;
const isAbs = (u) => /^https?:\/\//i.test(String(u || ""));
const join = (base, path) =>
  base.replace(/\/+$/, "") + "/" + String(path || "").replace(/^\/+/, "");

//  Currency
const formatTHB = (n) => {
  const v = Number(n ?? 0);
  try {
    return v.toLocaleString("th-TH", { style: "currency", currency: "THB" });
  } catch {
    return `฿ ${v.toFixed(2)}`;
  }
};

//  Cart (localStorage) helpers
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
  } catch { }
};

// Image resolvers
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
  "Frozen Foods": "/assets/user/cat-frozen-food.jpg",
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

// Stock helper 
// ถือว่า out of stock ถ้า inStock/in_stock เป็น false หรือ quantity <= 0 
const isOutOfStock = (p) => {
  if (!p) return false;
  const flag = p.inStock ?? p.in_stock;
  const qVal = p.quantity ?? p.qty ?? p.stock;
  const q = Number(qVal);
  if (flag === false) return true;
  if (Number.isFinite(q) && q <= 0) return true;
  return false;
};


// เช็คว่าโปร active ตาม status + วันที่หรือยัง
const isPromoActive = (promo) => {
  if (!promo) return false;
  const status = promo.status ?? promo.promo_status ?? "";
  if (status !== "ACTIVE") return false;

  const now = Date.now();
  const start = promo.start_at || promo.startAt || null;
  const end = promo.end_at || promo.endAt || null;

  if (start && new Date(start).getTime() > now) return false;
  if (end && new Date(end).getTime() < now) return false;
  return true;
};

// สร้างข้อความสั้น ๆ สำหรับ badge โปร
const getPromoLabel = (promo) => {
  const type = promo.promo_type || promo.promoType;
  if (type === "PERCENT_OFF" && promo.percent_off != null) {
    return `${Number(promo.percent_off).toFixed(0)}% OFF`;
  }
  if (type === "AMOUNT_OFF" && promo.amount_off != null) {
    return `฿${Number(promo.amount_off).toFixed(0)} OFF`;
  }
  if (type === "BUY_X_GET_Y" && promo.buy_qty && promo.get_qty) {
    return `BUY ${promo.buy_qty} GET ${promo.get_qty}`;
  }
  if (type === "FIXED_PRICE" && promo.fixed_price != null) {
    return `฿${Number(promo.fixed_price).toFixed(0)}`;
  }
  return promo.name || "PROMO";
};

// ดึง map: productId -> promoLabel (เฉพาะโปร scope PRODUCT ที่ active)
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
        if (scope !== "PRODUCT") return; // โชว์เฉพาะโปรที่ผูกกับสินค้า

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
          // ถ้าดึงไม่ได้ก็ข้าม
        }
      })
    );

    return map;
  } catch {
    return new Map();
  }
}

// Floating add-to-cart button (no useCart)
function ProductMiniCard({ id, name, price, img, disabled = false }) {
  const [added, setAdded] = useState(false);

  const onAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return; // ห้ามกดถ้า out of stock

    addItemToCart({ id: String(id), name, price: Number(price) || 0, qty: 1, img });
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  };

  const baseColor = disabled ? "#9ca3af" : "#3E40AE";
  const bg = added && !disabled ? "#16a34a" : baseColor;

  const label = disabled
    ? "Out of stock"
    : added
      ? "Added ✓"
      : "Add to cart";

  return (
    <button
      className={`add-to-cart${added ? " added" : ""}${disabled ? " add-to-cart--disabled" : ""}`}
      type="button"
      aria-label={label}
      title={label}
      onClick={onAdd}
      disabled={disabled}
      aria-disabled={disabled ? "true" : "false"}
      style={{
        background: bg,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "background-color .25s ease, opacity .25s ease",
      }}
    >
      <i className={disabled ? "fas fa-ban" : added ? "fas fa-check" : "fas fa-shopping-cart"} />
    </button>
  );
}

// Best Sellers
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

        // เลือกเฉพาะที่ไม่ out of stock
        const best = list
          .filter((x) => !isOutOfStock(x))
          .sort(
            (a, b) =>
              new Date(b.updated_at || b.updatedAt || 0) -
              new Date(a.updated_at || a.updatedAt || 0)
          )
          .slice(0, 8);

        // เติมข้อมูล promotion ลงไป
        const promoMap = await fetchPromotionMap();
        const withPromo = best.map((p) => {
          const id = p.id ?? p.productId ?? p.product_id;
          const label = promoMap.get(id);
          return label ? { ...p, _promoLabel: label } : p;
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
        <div className="error">Failed to load best sellers: {err}</div>
      )}

      {!loading && !err && (
        <div className="products">
          {items.map((p) => {
            const id = p.id ?? p.productId ?? p.product_id;
            const name = p.name ?? "";
            const price = p.price ?? 0;
            const img = resolveCoverUrl(p);
            const out = isOutOfStock(p);
            const promoLabel = p._promoLabel;

            return (
              <Link
                key={id}
                className="product reveal"
                to={`/detail/${encodeURIComponent(id)}`}
                aria-label={name}
              >
                <div className="product__thumb">
                  {/* badge โปรโมชั่น */}
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
                  <ProductMiniCard
                    id={id}
                    name={name}
                    price={price}
                    img={img}
                    disabled={out}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

// Categories
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
    <section id="categories" className="category section-fade-in">
      <div className="category__inner">
        <div className="category__head">
          <h3 className="reveal">Browse by Category</h3>
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
          <div className="error">Failed to load categories: {err}</div>
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
                  className="category-card reveal"
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

// Adjust title clamp in a list
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
          if (titleRect.right > fabRect.left - 8)
            title.classList.add("title--shorten");
        }
      });
    };
    setTimeout(adjust, 0);
    window.addEventListener("resize", adjust);
    return () => window.removeEventListener("resize", adjust);
  }, deps);
}

// All products
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

        // เติม promo map ให้ All Products
        const promoMap = await fetchPromotionMap();
        const withPromo = list.map((p) => {
          const id = p.id ?? p.productId ?? p.product_id;
          const label = promoMap.get(id);
          return label ? { ...p, _promoLabel: label } : p;
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
    <section className="all-products section-fade-in" aria-labelledby="all-title">
      <div className="ap-head">
        <h3 id="all-title" className="reveal">All Products</h3>
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
        <div className="error">Failed to load products: {err}</div>
      )}

      {!loading && !err && (
        <div className="products" ref={listRef}>
          {items.map((p) => {
            const id = p.id ?? p.productId ?? p.product_id;
            const name = p.name ?? "";
            const price = p.price ?? 0;
            const img = resolveCoverUrl(p);
            const out = isOutOfStock(p);
            const promoLabel = p._promoLabel;

            return (
              <Link
                key={id}
                className="product reveal"
                to={`/detail/${encodeURIComponent(id)}`}
                aria-label={name}
              >
                <div className="product__thumb">
                  {/*  */}
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
                        e.currentTarget.src =
                          "/assets/products/placeholder.png";
                      }
                    }}
                  />
                </div>
                <div className="product__body">
                  <h3 className="product__title">{name}</h3>
                  <div className="product__price">{formatTHB(price)}</div>
                  <ProductMiniCard
                    id={id}
                    name={name}
                    price={price}
                    img={img}
                    disabled={out}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

// PAGE
export default function HomePage() {
  const allProductsRef = useRef(null);
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  useEffect(() => {
    // initialize IntersectionObserver to toggle .is-visible on sections
    const sections = Array.from(document.querySelectorAll('.section-fade-in'));
    if (!sections.length) return;

    if (!('IntersectionObserver' in window)) {
      sections.forEach((s) => s.classList.add('is-visible'));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div className="pm-topbar"></div>

      <main className="home">
        <div className="container">
          {/* Hero banner */}
          <section className="hero-banner hero-banner--main section-fade-in" aria-label="Main banner">
            <img
              className="hero-img hero-img--focus-right"
              src="/assets/user/image48.png"
              alt="Pure & Fresh for Every Meal — Shop Best Sellers"
              loading="lazy"
            />
            <div className="hero-content">
              <h1 className="reveal">Pure & Fresh for Every Meal</h1>
              <p className="hero-sub reveal">Find your favorites — fast.</p>
              <div className="hero-ctas">
                <Link to="/shop?best=1" className="hero-btn reveal">
                  Shop Best Sellers
                </Link>
                <a href="#categories" className="hero-btn hero-btn--ghost reveal">
                  Browse Categories
                </a>
              </div>
            </div>
          </section>

          <BestSellersSection />

          <section
            className="hero-banner hero-banner--promo section-fade-in"
            aria-label="Promotional banner"
          >
            <img
              className="hero-img hero-img--focus-right"
              src="/assets/user/banner2.png"
              alt="Seasonal produce — promo"
              loading="lazy"
            />
            <div className="hero-content">
              <h1 className="reveal">Fresh picks — 25% off</h1>
              <p className="hero-sub reveal">
                Seasonal produce & pantry essentials. Limited time only.
              </p>
              <div className="hero-ctas">
                <Link to="/shop" className="hero-btn reveal">
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
