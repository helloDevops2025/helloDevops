import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./ShopPage.css";
import Footer from "./../components/Footer.jsx";


// Config & helpers
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
const norm = (s) => String(s ?? "").trim().toLowerCase();
const clean = (s) => String(s ?? "").trim();

const MIN_ALLOWED = 0;
const MAX_ALLOWED = 1_000_000;
const STEP = 0.01;
const PAGE_SIZE = 9;

// LocalStorage keys & cart helpers
const LS_WISH = "pm_wishlist";
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
  if (i >= 0)
    cart[i] = { ...cart[i], qty: Math.max(1, (cart[i].qty || 1) + qty) };
  else
    cart.push({
      id: key,
      name: name || "Unnamed product",
      price: Number(price) || 0,
      qty: Math.max(1, Number(qty) || 1),
      img: img || "/assets/products/placeholder.png",
    });
  saveCart(cart);
  const count = cart.reduce((s, it) => s + (Number(it.qty) || 0), 0);
  try {
    window.dispatchEvent(
      new CustomEvent("pm_cart_updated", { detail: { count } })
    );
  } catch {}
};

// Wishlist helpers (global, ไม่ผูกกับ card เดียว)
const readWishIdsStr = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_WISH) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x) =>
        typeof x === "object" && x !== null
          ? String(x.id ?? "")
          : String(x ?? "")
      )
      .filter(Boolean);
  } catch {
    return [];
  }
};

const writeWishIdsStr = (ids) => {
  const uniq = [...new Set(ids.map((v) => String(v)).filter(Boolean))];
  localStorage.setItem(LS_WISH, JSON.stringify(uniq));
};

// Placeholder image
const PLACEHOLDER_DATA =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
      <rect width="100%" height="100%" fill="#f6f7fb"/>
      <g fill="#9aa3af" font-family="Arial, sans-serif" text-anchor="middle">
        <text x="160" y="120" font-size="14">image not found</text>
      </g>
    </svg>`);

// Price helpers
const toCents = (val) => {
  if (val === "" || val === null || val === undefined) return null;
  const num = Number(val);
  if (Number.isNaN(num)) return NaN;
  return Math.round((num + Number.EPSILON) * 100);
};
const fromCents = (cents) => (cents / 100).toFixed(2);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const priceToCents = (priceBaht) =>
  Math.round((Number(priceBaht) + Number.EPSILON) * 100);

// Image resolve
const resolveImageUrl = (row) => {
  const id = row.id ?? row.productId ?? row.product_id;
  let u =
    row.coverImageUrl ||
    row.imageUrl ||
    row.image_url ||
    (Array.isArray(row.images)
      ? (row.images.find((i) => i.is_cover || i.isCover)?.image_url ||
          row.images[0]?.image_url)
      : null);

  if (u) {
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/")) return `${API_URL}${u}`;
    return `/${u}`;
  }
  return `${API_URL}/api/products/${encodeURIComponent(id)}/cover`;
};

// Stock helper (เหมือนหน้า Home)
const isOutOfStock = (p) => {
  if (!p) return false;
  const flag = p.inStock ?? p.in_stock;
  const qVal = p.quantity ?? p.qty ?? p.stock;
  const q = Number(qVal);
  if (flag === false) return true;
  if (Number.isFinite(q) && q <= 0) return true;
  return false;
};

// ===================== SEARCH HELPERS (tolerant + น้ำ → water) =====================

// normalize เอาไว้เทียบภาษา/ตัวสะกดแบบทน accent + วรรณยุกต์
const normalizeText = (s = "") =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // ตัดวรรณยุกต์/accents
    .trim();

// Levenshtein สำหรับ typo เล็ก ๆ เช่น "watar" → "water"
const levenshtein = (a = "", b = "") => {
  const A = normalizeText(a);
  const B = normalizeText(b);
  const m = A.length;
  const n = B.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const v0 = new Array(n + 1).fill(0).map((_, i) => i);
  const v1 = new Array(n + 1).fill(0);
  for (let i = 0; i < m; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < n; j++) {
      const cost = A[i] === B[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let k = 0; k <= n; k++) v0[k] = v1[k];
  }
  return v1[n];
};

// fuzzy match: ใช้กับแต่ละ field (name/brand/cat/code)
const fuzzyMatch = (q = "", text = "") => {
  if (!q) return false;
  const A = normalizeText(q);
  const B = normalizeText(text);
  if (B.includes(A)) return true;

  const tokens = B.split(/\s+/).filter(Boolean);
  const qLen = A.length;
  const maxDist = qLen <= 4 ? 1 : Math.max(1, Math.floor(qLen * 0.3));

  for (const t of tokens) {
    const dist = levenshtein(A, t);
    if (dist <= maxDist) return true;
  }
  const distFull = levenshtein(A, B);
  return distFull <= maxDist;
};

// ขยาย query: เช่น "น้ำ" → ["น้ำ","น้ำดื่ม","water","drinking water"]
const expandQuery = (q = "") => {
  const normQ = normalizeText(q);
  const extra = [];

  if (normQ.includes("น้ำ") || normQ.includes("น้ํา")) {
    extra.push("น้ำดื่ม", "water", "drinking water");
  }
  if (normQ.includes("water")) {
    extra.push("น้ำ", "น้ํา", "น้ำดื่ม", "drinking water");
  }

  // สามารถเพิ่ม mapping อื่น ๆ ได้ เช่น โค้ก/coke, นม/milk ฯลฯ
  // if (normQ.includes("โค้ก")) extra.push("coke", "coca cola");
  // if (normQ.includes("coke")) extra.push("โค้ก", "โคคาโคล่า");

  return [q, ...extra];
};

// เช็คว่า product ตัวหนึ่ง match กับ search query หรือไม่
const matchProductWithQuery = (p, searchQ) => {
  if (!searchQ) return true;

  const name = String(p.name || "").trim();
  const brand = String(p.brand || "").trim();
  const cat = String(p.cat || "").trim();
  const code = String(p.productCode || p.id || "").trim();

  if (!name && !brand && !cat && !code) return false;

  const fields = [name, brand, cat, code].filter(Boolean);
  const variants = expandQuery(searchQ);

  for (const v of variants) {
    for (const f of fields) {
      if (fuzzyMatch(v, f)) return true;
    }
  }
  return false;
};

export default function ShopPage() {
  const [searchParams] = useSearchParams();

  const [PRODUCTS, setPRODUCTS] = useState([]);
  const [CATEGORIES, setCATEGORIES] = useState([]);
  const [BRANDS_MASTER, setBRANDS_MASTER] = useState([]);
  const [PROMO_LIST, setPROMO_LIST] = useState([]);
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
        const [rows, cats, brands] = await Promise.all([
          safeJson(`${API_URL}/api/products`),
          safeJson(`${API_URL}/api/categories`),
          safeJson(`${API_URL}/api/brands`),
        ]);
        if (!alive) return;

        const catById = new Map(
          (cats || []).map((c) => [Number(c.id), clean(c.name)])
        );
        const brandById = new Map(
          (brands || []).map((b) => [Number(b.id), clean(b.name)])
        );

        const pick = (obj, ...keys) => {
          for (const k of keys) if (obj && obj[k] != null) return obj[k];
        };

        // ดึงโปรโมชั่น ACTIVE ทั้งหมด
        const promos = await safeJson(
          `${API_URL}/api/promotions?status=ACTIVE`
        );

        // map: productId -> ชื่อโปรโมชั่น...
        const promoMap = new Map();
        const promoLabelSet = new Set();

        if (Array.isArray(promos)) {
          for (const promo of promos) {
            const plist = await safeJson(
              `${API_URL}/api/promotions/${promo.id}/products`
            );
            (plist || []).forEach((prod) => {
              const pid = prod.id ?? prod.productId ?? prod.product_id;
              if (pid == null) return;
              if (!promoMap.has(pid)) promoMap.set(pid, []);
              const label = promo.name || promo.code || "PROMO";
              promoMap.get(pid).push(label);
            });
          }
        }

        const mapped = (rows || []).map((x) => {
          const catIdRaw = pick(
            x,
            "categoryId",
            "category_id",
            "catId",
            "categoryIdFk",
            "category_id_fk"
          );
          const brandIdRaw = pick(
            x,
            "brandId",
            "brand_id",
            "brandIdFk",
            "brand_id_fk"
          );
          const catId =
            catIdRaw != null && !Number.isNaN(Number(catIdRaw))
              ? Number(catIdRaw)
              : undefined;
          const brandId =
            brandIdRaw != null && !Number.isNaN(Number(brandIdRaw))
              ? Number(brandIdRaw)
              : undefined;

          const catName =
            clean(pick(x, "category", "categoryName", "category_name")) ||
            clean(x.category?.name) ||
            (typeof x.category === "string" ? clean(x.category) : "") ||
            (catId != null ? catById.get(catId) || "" : "");

          const brandName =
            clean(pick(x, "brand", "brandName", "brand_name")) ||
            clean(x.brand?.name) ||
            (typeof x.brand === "string" ? clean(x.brand) : "") ||
            (brandId != null ? brandById.get(brandId) || "" : "");

          const pid = x.id ?? x.productId ?? x.product_id;
          const promoNames = promoMap.get(pid) || [];
          const promoLabel = promoNames.length ? promoNames[0] : "-"; // ใช้ชื่อโปรตัวแรกเป็น badge

          if (promoLabel !== "-") promoLabelSet.add(promoLabel);

          const outOfStock = isOutOfStock(x);

          return {
            id: pid,
            name: clean(x.name),
            price: Number(x.price) || 0,
            catId,
            brandId,
            cat: catName,
            brand: brandName,
            promo: promoLabel,
            img: resolveImageUrl(x),
            outOfStock,
          };
        });

        setPRODUCTS(mapped);
        setCATEGORIES(
          (cats || []).map((c) => ({ id: Number(c.id), name: clean(c.name) }))
        );
        setBRANDS_MASTER(
          (brands || []).map((b) => ({ id: Number(b.id), name: clean(b.name) }))
        );
        setPROMO_LIST([...promoLabelSet].sort((a, b) => a.localeCompare(b)));
      } catch (e) {
        setLoadErr(e.message || "Failed to load data");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("featured");
  const [filters, setFilters] = useState({
    cat: new Set(),
    brand: new Set(),
    promo: new Set(),
    priceMinC: null,
    priceMaxC: null,
  });

  const CAT_LIST = useMemo(() => {
    const fromProducts = Array.from(
      new Set(PRODUCTS.map((p) => clean(p.cat)).filter(Boolean))
    );
    if (fromProducts.length)
      return fromProducts.sort((a, b) => a.localeCompare(b));
    const fromMaster = Array.from(
      new Set(CATEGORIES.map((c) => clean(c.name)).filter(Boolean))
    );
    return fromMaster.sort((a, b) => a.localeCompare(b));
  }, [PRODUCTS, CATEGORIES]);

  const BRANDS = useMemo(() => {
    const fromProducts = Array.from(
      new Set(PRODUCTS.map((p) => clean(p.brand)).filter(Boolean))
    );
    if (fromProducts.length)
      return fromProducts.sort((a, b) => a.localeCompare(b));
    const fromMaster = Array.from(
      new Set(BRANDS_MASTER.map((b) => clean(b.name)).filter(Boolean))
    );
    return fromMaster.sort((a, b) => a.localeCompare(b));
  }, [PRODUCTS, BRANDS_MASTER]);

  // อ่าน search term จาก query string เช่น /shop?search=น้ำ
  const searchQ = (searchParams.get("search") || "").trim();
  const hasSearch = searchQ.length > 0;

  useEffect(() => {
    const catParam = searchParams.get("cat");
    if (catParam) {
      const target = CAT_LIST.find((c) => norm(c) === norm(catParam));
      if (target) {
        setFilters((prev) => ({
          ...prev,
          cat: new Set([clean(target)]),
        }));
        setPage(1);
      }
    }
  }, [searchParams, CAT_LIST]);

  const toggleSet = (key, v, on) => {
    const label = clean(v);
    setFilters((prev) => {
      const next = { ...prev, [key]: new Set(prev[key]) };
      on ? next[key].add(label) : next[key].delete(label);
      return next;
    });
    setPage(1);
  };

  // Price input state
  const [minValStr, setMinValStr] = useState("");
  const [maxValStr, setMaxValStr] = useState("");
  const [priceErr, setPriceErr] = useState("");

  useEffect(() => {
    if (filters.priceMinC != null) setMinValStr(fromCents(filters.priceMinC));
    else setMinValStr("");
    if (filters.priceMaxC != null) setMaxValStr(fromCents(filters.priceMaxC));
    else setMaxValStr("");
  }, [filters.priceMinC, filters.priceMaxC]);

  const INVALID_RANGE_MSG = "Invalid price range. Please enter a new range.";

  const applyPrice = () => {
    setPriceErr("");
    const rawMinC = minValStr === "" ? null : toCents(minValStr);
    const rawMaxC = maxValStr === "" ? null : toCents(maxValStr);

    if (rawMinC === null && rawMaxC === null) {
      setFilters((p) => ({ ...p, priceMinC: null, priceMaxC: null }));
      setPage(1);
      return;
    }
    if (
      rawMinC === null ||
      rawMaxC === null ||
      Number.isNaN(rawMinC) ||
      Number.isNaN(rawMaxC)
    ) {
      setPriceErr(INVALID_RANGE_MSG);
      return;
    }

    const minC = clamp(rawMinC, MIN_ALLOWED * 100, MAX_ALLOWED * 100);
    const maxC = clamp(rawMaxC, MIN_ALLOWED * 100, MAX_ALLOWED * 100);
    if (minC > maxC) {
      setPriceErr(INVALID_RANGE_MSG);
      return;
    }

    setMinValStr(fromCents(minC));
    setMaxValStr(fromCents(maxC));
    setFilters((p) => ({ ...p, priceMinC: minC, priceMaxC: maxC }));
    setPage(1);
  };

  const clearAll = () => {
    setFilters({
      cat: new Set(),
      brand: new Set(),
      promo: new Set(),
      priceMinC: null,
      priceMaxC: null,
    });
    setMinValStr("");
    setMaxValStr("");
    setPriceErr("");
    setPage(1);
  };

  // Filter, sort, paginate
  const filtered = useMemo(() => {
    const f = filters;
    const catSet = new Set([...f.cat].map(norm));
    const brandSet = new Set([...f.brand].map(norm));
    const promoSet = new Set([...f.promo].map(norm));

    return PRODUCTS.filter((p) => {
      const pCat = norm(p.cat);
      const pBrand = norm(p.brand);
      const pPromo = norm(p.promo);

      // 🔍 ใช้ tolerant search + synonym น้ำ ↔ water
      if (hasSearch && !matchProductWithQuery(p, searchQ)) return false;

      if (catSet.size && !catSet.has(pCat)) return false;
      if (brandSet.size && !brandSet.has(pBrand)) return false;
      if (promoSet.size && !promoSet.has(pPromo)) return false;

      if (f.priceMinC != null || f.priceMaxC != null) {
        const pc = priceToCents(p.price);
        if (f.priceMinC != null && pc < f.priceMinC) return false;
        if (f.priceMaxC != null && pc > f.priceMaxC) return false;
      }
      return true;
    });
  }, [filters, PRODUCTS, hasSearch, searchQ]);

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
    if (filters.priceMinC != null || filters.priceMaxC != null)
      out.push({
        key: "price",
        label: `฿${
          filters.priceMinC != null ? fromCents(filters.priceMinC) : "0.00"
        }–${
          filters.priceMaxC != null ? fromCents(filters.priceMaxC) : "∞"
        }`,
      });
    return out;
  }, [filters]);

  const removeChip = (c) => {
    if (c.key === "price") {
      setFilters((p) => ({ ...p, priceMinC: null, priceMaxC: null }));
      setMinValStr("");
      setMaxValStr("");
      setPriceErr("");
    } else {
      setFilters((p) => {
        const s = new Set(p[c.key]);
        s.delete(c.label);
        return { ...p, [c.key]: s };
      });
    }
    setPage(1);
  };

  const hasPriceFilter =
    filters.priceMinC != null || filters.priceMaxC != null;
  const noProductsDueToPrice =
    !loading && !loadErr && sorted.length === 0 && hasPriceFilter;

  // Product card
  const ProductCard = ({ p }) => {
    const nav = useNavigate();
    const [src, setSrc] = useState(p.img);
    const [loaded, setLoaded] = useState(false);
    const [added, setAdded] = useState(false);

    // ใช้ boolean liked + sync กับ localStorage แบบ global
    const [liked, setLiked] = useState(false);

    // init: อ่านว่าตัวนี้อยู่ใน wishlist ไหม
    useEffect(() => {
      const ids = readWishIdsStr();
      setLiked(ids.includes(String(p.id)));
    }, [p.id]);

    const to = `/detail/${encodeURIComponent(p.id)}`;
    const stop = (e) => e.stopPropagation();

    const out = !!p.outOfStock;
    const btnLabel = out
      ? "OUT OF STOCK"
      : added
      ? "ADDED ✓"
      : "ADD TO CART";

    const onAdd = () => {
      if (out) return;
      addItemToCart({
        id: String(p.id),
        name: p.name || "Unnamed product",
        price: Number(p.price) || 0,
        qty: 1,
        img: src || PLACEHOLDER_DATA,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 900);
    };

    const toggleWish = (e) => {
      stop(e);
      const pid = String(p.id);
      const ids = readWishIdsStr();
      const idx = ids.indexOf(pid);
      let next;
      if (idx >= 0) {
        // remove
        next = [...ids.slice(0, idx), ...ids.slice(idx + 1)];
        setLiked(false);
      } else {
        // add
        next = [...ids, pid];
        setLiked(true);
      }
      writeWishIdsStr(next);
    };

    return (
      <article
        className="card"
        tabIndex={0}
        onClick={() => nav(to)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            nav(to);
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <div className="p-thumb">
          {p.promo && p.promo !== "-" ? (
            <span className="p-badge">{p.promo}</span>
          ) : null}
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
          <h3 className="p-title" title={p.name}>
            {p.name}
          </h3>
          <div className="p-price-row">
            <div className="p-price">฿ {Number(p.price).toFixed(2)}</div>
          </div>

          <button
            className={`p-wishline ${liked ? "on" : ""}`}
            type="button"
            aria-pressed={liked}
            onClick={toggleWish}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="heart"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{liked ? "ADDED TO WISHLIST" : "ADD TO WISHLIST"}</span>
          </button>

          <button
            className="btn btn--cta"
            type="button"
            onClick={(e) => {
              stop(e);
              if (!out) onAdd();
            }}
            title={btnLabel}
            disabled={out}
            aria-disabled={out ? "true" : "false"}
            style={{
              cursor: out ? "not-allowed" : "pointer",
              opacity: out ? 0.7 : 1,
            }}
          >
            {btnLabel}
          </button>
        </div>
      </article>
    );
  };

  // Checklist
  const CheckList = ({ list, setKey, selected }) => (
    <div className={`checklist ${setKey === "brand" ? "scroll" : ""}`}>
      {list.map((val, idx) => {
        const id = `${setKey}-${val}-${idx}`;
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
          <div
            className="shop-toolbar v2"
            role="region"
            aria-label="Filters and sort"
          >
            <div className="af-bar">
              <span className="af-label">ACTIVE FILTER</span>
              <div className="chips" aria-live="polite">
                {chips.map((c, i) => (
                  <span key={i} className="chip">
                    {c.label}
                    <button
                      aria-label={`Remove ${c.label}`}
                      onClick={() => removeChip(c)}
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                className="link"
                hidden={chips.length === 0}
                onClick={clearAll}
                type="button"
              >
                Clear All
              </button>
            </div>

            <div className="toolbar-row">
              <p className="result-count">
                {loading
                  ? "Loading…"
                  : `${filtered.length} items found${
                      hasSearch && searchQ
                        ? ` for "${searchQ}"`
                        : ""
                    }`}
              </p>
              <div className="sort-area">
                <label className="sr-only" htmlFor="sort">
                  Sort by
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="featured">Recommended</option>
                  <option value="price-asc">Low → High</option>
                  <option value="price-desc">High → Low</option>
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
                    const now =
                      blk.getAttribute("aria-expanded") !== "true";
                    blk.setAttribute("aria-expanded", String(now));
                  }}
                >
                  <h3>Product Categories</h3>
                  <button
                    className="acc-btn"
                    type="button"
                    aria-label="Toggle"
                  ></button>
                </div>
                <div className="filter-body">
                  <CheckList
                    list={CAT_LIST}
                    setKey="cat"
                    selected={filters.cat}
                  />
                </div>
              </section>

              <section className="filter-block" aria-expanded="true">
                <div
                  className="filter-head"
                  onClick={(e) => {
                    const blk = e.currentTarget.parentElement;
                    const now =
                      blk.getAttribute("aria-expanded") !== "true";
                    blk.setAttribute("aria-expanded", String(now));
                  }}
                >
                  <h3>Price (฿)</h3>
                  <button
                    className="acc-btn"
                    type="button"
                    aria-label="Toggle"
                  ></button>
                </div>
                <div className="filter-body">
                  <div className="price-row">
                    <input
                      data-cy="min-input"
                      type="number"
                      inputMode="decimal"
                      placeholder="min"
                      min={MIN_ALLOWED}
                      max={MAX_ALLOWED}
                      step={STEP}
                      value={minValStr}
                      onChange={(e) => setMinValStr(e.target.value)}
                      onInput={(e) => {
                        const v = e.currentTarget.value;
                        if (v === "") return;
                        let num = Number(v);
                        if (!Number.isNaN(num)) {
                          num = clamp(num, MIN_ALLOWED, MAX_ALLOWED);
                          if (String(num) !== v)
                            e.currentTarget.value = String(num);
                        }
                      }}
                      onKeyUp={(e) => e.key === "Enter" && applyPrice()}
                    />
                    <span>–</span>
                    <input
                      data-cy="max-input"
                      type="number"
                      inputMode="decimal"
                      placeholder="max"
                      min={MIN_ALLOWED}
                      max={MAX_ALLOWED}
                      step={STEP}
                      value={maxValStr}
                      onChange={(e) => setMaxValStr(e.target.value)}
                      onInput={(e) => {
                        const v = e.currentTarget.value;
                        if (v === "") return;
                        let num = Number(v);
                        if (!Number.isNaN(num)) {
                          num = clamp(num, MIN_ALLOWED, MAX_ALLOWED);
                          if (String(num) !== v)
                            e.currentTarget.value = String(num);
                        }
                      }}
                      onKeyUp={(e) => e.key === "Enter" && applyPrice()}
                    />
                  </div>
                  {priceErr && (
                    <p className="price-error" role="alert">
                      {priceErr}
                    </p>
                  )}
                  <button
                    data-cy="apply-btn"
                    className="btn btn--apply"
                    type="button"
                    onClick={applyPrice}
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
                    const now =
                      blk.getAttribute("aria-expanded") !== "true";
                    blk.setAttribute("aria-expanded", String(now));
                  }}
                >
                  <h3>Brands</h3>
                  <button
                    className="acc-btn"
                    type="button"
                    aria-label="Toggle"
                  ></button>
                </div>
                <div className="filter-body">
                  <CheckList
                    list={BRANDS}
                    setKey="brand"
                    selected={filters.brand}
                  />
                </div>
              </section>

              <section className="filter-block" aria-expanded="true">
                <div
                  className="filter-head"
                  onClick={(e) => {
                    const blk = e.currentTarget.parentElement;
                    const now =
                      blk.getAttribute("aria-expanded") !== "true";
                    blk.setAttribute("aria-expanded", String(now));
                  }}
                >
                  <h3>Promotions</h3>
                  <button
                    className="acc-btn"
                    type="button"
                    aria-label="Toggle"
                  ></button>
                </div>
                <div className="filter-body">
                  <CheckList
                    list={PROMO_LIST}
                    setKey="promo"
                    selected={filters.promo}
                  />
                </div>
              </section>
            </div>
          </aside>

          <section className="products" aria-label="Products">
            <div className="grid" aria-live="polite">
              {loading || loadErr ? (
                loading ? (
                  <p className="no-result">Loading…</p>
                ) : (
                  <p className="no-result">No products found.</p>
                )
              ) : (
                pageItems.map((p) => <ProductCard key={p.id} p={p} />)
              )}
              {!loading && !loadErr && pageItems.length === 0 && (
                <p className="no-result">
                  {noProductsDueToPrice
                    ? "No products found in the selected price range."
                    : "No products found."}
                </p>
              )}
            </div>

            <nav className="pagination" aria-label="Pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage(Math.max(1, page - 1))}
                type="button"
              >
                Prev
              </button>
              <span className="page-info">
                Page {page} / {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                type="button"
              >
                Next
              </button>
            </nav>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
