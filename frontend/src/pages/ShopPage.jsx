// ShopPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./ShopPage.css";
import Footer from "../components/Footer";

/* ===== Config & helpers (NEW) ===== */
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
const norm  = (s) => String(s ?? "").trim().toLowerCase(); // สำหรับเทียบค่า
const clean = (s) => String(s ?? "").trim();                // สำหรับแสดงผล

/* ===== Placeholder (เดิม) ===== */
const PLACEHOLDER_DATA =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
      <rect width="100%" height="100%" fill="#f6f7fb"/>
      <g fill="#9aa3af" font-family="Arial, sans-serif" text-anchor="middle">
        <text x="160" y="120" font-size="14">image not found</text>
      </g>
    </svg>`);

const PAGE_SIZE = 9;
const LS_WISH = "pm_wishlist";

/* ไอคอนหัวใจ (เดิม) */
const HeartIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="heart" {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

/* สร้าง URL รูปจากข้อมูลสินค้า (NEW) */
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
    if (/^https?:\/\//i.test(u)) return u;     // URL เต็ม
    if (u.startsWith("/")) return `${API_URL}${u}`;
    return `/${u}`;                             // พาธ public ฝั่ง FE
  }
  return `${API_URL}/api/products/${encodeURIComponent(id)}/cover`;
};

export default function ShopPage() {
  const [searchParams] = useSearchParams();

  /* ===== โหลดของจริงจาก DB (NEW) ===== */
  const [PRODUCTS, setPRODUCTS] = useState([]);      // [{id,name,price,cat,brand,promo,img}]
  const [CATEGORIES, setCATEGORIES] = useState([]);  // [{id,name}]
  const [BRANDS_MASTER, setBRANDS_MASTER] = useState([]); // [{id,name}]
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    let alive = true;

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
      setLoadErr("");
      try {
        // ดึงทีเดียว 3 endpoint
        const [rows, cats, brands] = await Promise.all([
          safeJson(`${API_URL}/api/products`),
          safeJson(`${API_URL}/api/categories`),
          safeJson(`${API_URL}/api/brands`),
        ]);
        if (!alive) return;

        // เตรียม map id -> name
        const catById   = new Map((cats || []).map((c) => [c.id, clean(c.name)]));
        const brandById = new Map((brands || []).map((b) => [b.id, clean(b.name)]));

        // helper: คืน key ตัวแรกที่พบใน object
        const pick = (obj, ...keys) => {
          for (const k of keys) if (obj && obj[k] != null) return obj[k];
          return undefined;
        };

        // map แถวสินค้า → structure ที่หน้า Shop ใช้
        const mapped = (rows || []).map((x) => {
          const catIdRaw   = pick(x, "categoryId", "category_id", "catId", "categoryIdFk");
          const brandIdRaw = pick(x, "brandId",    "brand_id",    "brandIdFk");

          const catId   = catIdRaw   != null ? Number(catIdRaw)   : undefined;
          const brandId = brandIdRaw != null ? Number(brandIdRaw) : undefined;

          const catName   = clean(pick(x, "categoryName", "category_name")) || (catById.get(catId) || "");
          const brandName = clean(pick(x, "brandName", "brand_name"))       || (brandById.get(brandId) || "");

          return {
            id: x.id ?? x.productId ?? x.product_id,
            name: clean(x.name),
            price: Number(x.price) || 0,
            cat: catName,
            brand: brandName,
            promo: "-",                // phase โปรโมชันในอนาคต
            img: resolveImageUrl(x),
          };
        });

        setPRODUCTS(mapped);
        setCATEGORIES((cats || []).map((c) => ({ ...c, name: clean(c.name) })));
        setBRANDS_MASTER((brands || []).map((b) => ({ ...b, name: clean(b.name) })));
      } catch (e) {
        setLoadErr(e.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  /* ===== สถานะ UI เดิม ===== */
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("featured");
  const [filters, setFilters] = useState({
    cat: new Set(),
    brand: new Set(),
    promo: new Set(),
    priceMin: null,
    priceMax: null,
  });

  /* ===== รายการตัวเลือกจาก DB (แทนที่ของเดิมแบบฮาร์ดโค้ด) ===== */
  const CAT_LIST = useMemo(
    () => (CATEGORIES.length ? CATEGORIES.map((c) => c.name) : []),
    [CATEGORIES]
  );

  // รองรับ ?cat= จาก URL
  useEffect(() => {
    const catParam = searchParams.get("cat");
    if (catParam && CAT_LIST.includes(catParam)) {
      setFilters((prev) => ({ ...prev, cat: new Set([clean(catParam)]) }));
      setPage(1);
    }
  }, [searchParams, CAT_LIST]);

  const BRANDS = useMemo(
    () => BRANDS_MASTER.map((b) => b.name).filter(Boolean).sort(),
    [BRANDS_MASTER]
  );

  // Promotions: ยังไม่มีใน DB — เตรียมโครงไว้ก่อน
  const PROMOS = useMemo(() => [], []);

  const toggleSet = (key, v, on) => {
    const label = clean(v);
    setFilters((prev) => {
      const next = { ...prev, [key]: new Set(prev[key]) };
      on ? next[key].add(label) : next[key].delete(label);
      return next;
    });
    setPage(1);
  };
  const applyPrice = (min, max) => {
    setFilters((p) => ({ ...p, priceMin: min, priceMax: max }));
    setPage(1);
  };
  const clearAll = () => {
    setFilters({
      cat: new Set(),
      brand: new Set(),
      promo: new Set(),
      priceMin: null,
      priceMax: null,
    });
    setPage(1);
  };

  /* ===== กรองข้อมูลจริงแบบ normalize (NEW) ===== */
  const filtered = useMemo(() => {
    const f = filters;
    const catSet   = new Set([...f.cat].map(norm));
    const brandSet = new Set([...f.brand].map(norm));
    const promoSet = new Set([...f.promo].map(norm));

    return PRODUCTS.filter((p) => {
      const pCat   = norm(p.cat);
      const pBrand = norm(p.brand);
      const pPromo = norm(p.promo);

      if (catSet.size   && !catSet.has(pCat))     return false;
      if (brandSet.size && !brandSet.has(pBrand)) return false;
      if (promoSet.size && !promoSet.has(pPromo)) return false;

      if (f.priceMin != null && Number(p.price) < Number(f.priceMin)) return false;
      if (f.priceMax != null && Number(p.price) > Number(f.priceMax)) return false;
      return true;
    });
  }, [filters, PRODUCTS]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === "price-asc") arr.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") arr.sort((a, b) => b.price - a.price);
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const chips = useMemo(() => {
    const out = [];
    filters.cat.forEach((v) => out.push({ key: "cat", label: v }));
    filters.brand.forEach((v) => out.push({ key: "brand", label: v }));
    filters.promo.forEach((v) => out.push({ key: "promo", label: v }));
    if (filters.priceMin != null || filters.priceMax != null)
      out.push({ key: "price", label: `฿${filters.priceMin ?? 0}–${filters.priceMax ?? "∞"}` });
    return out;
  }, [filters]);
  const removeChip = (c) => {
    if (c.key === "price")
      setFilters((p) => ({ ...p, priceMin: null, priceMax: null }));
    else
      setFilters((p) => {
        const s = new Set(p[c.key]);
        s.delete(c.label);
        return { ...p, [c.key]: s };
      });
    setPage(1);
  };

  const [minVal, setMinVal] = useState("");
  const [maxVal, setMaxVal] = useState("");
  useEffect(() => {
    setMinVal(filters.priceMin ?? "");
    setMaxVal(filters.priceMax ?? "");
  }, [filters.priceMin, filters.priceMax]);

  /* ===== Card สินค้า (เดิม) ===== */
  const ProductCard = ({ p }) => {
    const [wish, setWish] = useState(() => {
      try { return new Set(JSON.parse(localStorage.getItem(LS_WISH) || "[]")); }
      catch { return new Set(); }
    });
    useEffect(() => {
      localStorage.setItem(LS_WISH, JSON.stringify([...wish]));
    }, [wish]);

    const liked = wish.has(p.id);
    const [src, setSrc] = useState(p.img);
    const [loaded, setLoaded] = useState(false);

    return (
      <article className="card" tabIndex={0}>
        <div className="p-thumb">
          {p.promo && p.promo !== "-" ? <span className="p-badge">{p.promo}</span> : null}
          <img
            src={src}
            alt={p.name}
            loading="lazy"
            style={{ opacity: loaded ? 1 : 0.2 }}
            onLoad={() => setLoaded(true)}
            onError={() => setSrc(PLACEHOLDER_DATA)}
          />
        </div>

        <div className="p-body">
          <h3 className="p-title" title={p.name}>{p.name}</h3>
          <div className="p-price-row">
            <div className="p-price">฿ {p.price.toFixed(2)}</div>
          </div>

          <button
            className={`p-wishline ${liked ? "on" : ""}`}
            type="button"
            aria-pressed={liked}
            onClick={() =>
              setWish((prev) => {
                const n = new Set(prev);
                n.has(p.id) ? n.delete(p.id) : n.add(p.id);
                return n;
              })
            }
          >
            <HeartIcon />
            <span>{liked ? "ADDED TO WISHLIST" : "ADD TO WISHLIST"}</span>
          </button>

          <button className="btn btn--cta" type="button">
            ADD TO CART
          </button>
        </div>
      </article>
    );
  };

  /* ===== Checklist (เดิม) ===== */
  const CheckList = ({ list, setKey, selected }) => (
    <div className={`checklist ${setKey === "brand" ? "scroll" : ""}`}>
      {list.map((val) => {
        const id = `${setKey}-${val}`;
        return (
          <label key={id} htmlFor={id}>
            <input
              id={id}
              type="checkbox"
              checked={selected.has(clean(val))}
              onChange={(e) => toggleSet(setKey, val, e.target.checked)}
            />
            <span>{val}</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <div className="page-wrap">
      <main className="shop-page">
        <section className="wl-hero">
          <div className="wl-hero__inner">
            <h1 className="wl-title">SHOP</h1>
            <nav className="custom-breadcrumb" aria-label="Breadcrumb">
              <ol>
                <li className="custom-breadcrumb__item">
                  <a href="/home">HOME</a>
                </li>
                <li className="custom-breadcrumb__item">
                  <span className="divider">›</span>
                  <span className="current">SHOP</span>
                </li>
              </ol>
            </nav>
          </div>
        </section>

        <div className="container">
          <div className="shop-toolbar v2" role="region" aria-label="Filters and sort">
            <div className="af-bar">
              <span className="af-label">ACTIVE FILTER</span>
              <div className="chips" aria-live="polite">
                {chips.map((c, i) => (
                  <span key={i} className="chip">
                    {c.label}
                    <button aria-label={`Remove ${c.label}`} onClick={() => removeChip(c)} type="button">×</button>
                  </span>
                ))}
              </div>
              <button className="link" hidden={chips.length === 0} onClick={clearAll} type="button">
                Clear All
              </button>
            </div>

            <div className="toolbar-row">
              <p className="result-count">
                {loading ? "Loading…" : loadErr ? "0 items" : `${filtered.length} items found`}
              </p>
              <div className="sort-area">
                <label className="sr-only" htmlFor="sort">Sort by</label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                >
                  <option value="featured">แนะนำ</option>
                  <option value="price-asc">ราคาน้อย → มาก</option>
                  <option value="price-desc">ราคามาก → น้อย</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="container shop-layout">
          <aside className="filters" aria-label="Filter Options">
            <h2 className="filters__title">Filter Options</h2>

            <div className="filters__scroll">
              <section className="filter-block" aria-expanded="true">
                <div
                  className="filter-head"
                  onClick={(e) => {
                    const blk = e.currentTarget.parentElement;
                    const now = blk.getAttribute("aria-expanded") !== "true";
                    blk.setAttribute("aria-expanded", String(now));
                  }}
                >
                  <h3>Product Categories</h3>
                  <button className="acc-btn" type="button" aria-label="Toggle"></button>
                </div>
                <div className="filter-body">
                  <CheckList list={CAT_LIST} setKey="cat" selected={filters.cat} />
                </div>
              </section>

              <section className="filter-block" aria-expanded="true">
                <div
                  className="filter-head"
                  onClick={(e) => {
                    const blk = e.currentTarget.parentElement;
                    const now = blk.getAttribute("aria-expanded") !== "true";
                    blk.setAttribute("aria-expanded", String(now));
                  }}
                >
                  <h3>Price (฿)</h3>
                  <button className="acc-btn" type="button" aria-label="Toggle"></button>
                </div>
                <div className="filter-body">
                  <div className="price-row">
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="min"
                      value={minVal}
                      onChange={(e) => setMinVal(e.target.value)}
                      onKeyUp={(e) =>
                        e.key === "Enter" &&
                        applyPrice(minVal ? Number(minVal) : null, maxVal ? Number(maxVal) : null)
                      }
                    />
                    <span>–</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="max"
                      value={maxVal}
                      onChange={(e) => setMaxVal(e.target.value)}
                      onKeyUp={(e) =>
                        e.key === "Enter" &&
                        applyPrice(minVal ? Number(minVal) : null, maxVal ? Number(maxVal) : null)
                      }
                    />
                  </div>
                  <button
                    className="btn btn--apply"
                    type="button"
                    onClick={() => applyPrice(minVal ? Number(minVal) : null, maxVal ? Number(maxVal) : null)}
                  >
                    Apply
                  </button>
                </div>
              </section>

              <section className="filter-block" aria-expanded="true">
                <div
                  className="filter-head"
                  onClick={(e) => {
                    const blk = e.currentTarget.parentElement;
                    const now = blk.getAttribute("aria-expanded") !== "true";
                    blk.setAttribute("aria-expanded", String(now));
                  }}
                >
                  <h3>Brands</h3>
                  <button className="acc-btn" type="button" aria-label="Toggle"></button>
                </div>
                <div className="filter-body">
                  <CheckList list={BRANDS} setKey="brand" selected={filters.brand} />
                </div>
              </section>

              <section className="filter-block" aria-expanded="true">
                <div
                  className="filter-head"
                  onClick={(e) => {
                    const blk = e.currentTarget.parentElement;
                    const now = blk.getAttribute("aria-expanded") !== "true";
                    blk.setAttribute("aria-expanded", String(now));
                  }}
                >
                  <h3>Promotions</h3>
                  <button className="acc-btn" type="button" aria-label="Toggle"></button>
                </div>
                <div className="filter-body">
                  {/* ยังไม่มีใน DB — เฟสถัดไป */}
                </div>
              </section>
            </div>
          </aside>

          <section className="products" aria-label="Products">
            <div className="grid" aria-live="polite">
              {loading || loadErr
                ? (loading ? <p className="no-result">Loading…</p> : <p className="no-result">No products found.</p>)
                : pageItems.map((p) => (<ProductCard key={p.id} p={p} />))
              }
              {!loading && !loadErr && pageItems.length === 0 && (<p className="no-result">No products found.</p>)}
            </div>

            <nav className="pagination" aria-label="Pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))} type="button">Prev</button>
              <span className="page-info">Page {page} / {totalPages}</span>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)} type="button">Next</button>
            </nav>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
