import { useEffect, useMemo, useState } from "react";
import "./ShopPage.css";

/* ===== Placeholder (ถ้ารูปหาย) ===== */
const PLACEHOLDER_DATA =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
      <rect width="100%" height="100%" fill="#f6f7fb"/>
      <g fill="#9aa3af" font-family="Arial, sans-serif" text-anchor="middle">
        <text x="160" y="120" font-size="14">image not found</text>
      </g>
    </svg>`);

/* ===== Demo Data ===== */
const PRODUCTS = [
  { id:1,  name:"มะพร้าวน้ำหอมปอกเปลือก ลูกละ", price:25.00,  brand:"CP",        cat:"Fruits & Vegetables", promo:"-",           img:"/assets/products/p1.png" },
  { id:2,  name:"ซุปแห้งสำเร็จรูป (หมูเด้ง)",     price:35.00,  brand:"MK2",       cat:"Dried Foods",         promo:"1แถม1",       img:"/assets/products/p2.png" },
  { id:3,  name:"ถั่วแระ แช่แข็ง 500g",           price:88.00,  brand:"Betagro",   cat:"Frozen Foods",        promo:"-",           img:"/assets/products/p3.png" },
  { id:4,  name:"ขนมปังฝอยทอง 4 ชิ้น",            price:19.00,  brand:"CP",        cat:"Dried Foods",         promo:"Flash Sale",  img:"/assets/products/p4.png" },
  { id:5,  name:"หมูบดแช่แข็ง 250g",              price:78.00,  brand:"Betagro",   cat:"Frozen Foods",        promo:"-",           img:"/assets/products/p5.png" },
  { id:6,  name:"อกไก่ 2 กก.",                    price:564.00, brand:"CP",        cat:"Meats",               promo:"-",           img:"/assets/products/p6.png" },
  { id:7,  name:"ซอสมะเขือเทศ 260 ก.",            price:33.00,  brand:"Roza",      cat:"Dried Foods",         promo:"Best Seller", img:"/assets/products/p7.png" },
  { id:8,  name:"โฮลวีทแซนด์วิช 170 กรัม",         price:20.00,  brand:"Farmhouse", cat:"Dried Foods",         promo:"-",           img:"/assets/products/p8.png" },
  { id:9,  name:"อกไก่สไลซ์ 100g",                price:39.00,  brand:"CP",        cat:"Meats",               promo:"Flash Sale",  img:"/assets/products/p9.png" },
  { id:10, name:"นม UHT 1 ลิตร",                  price:32.00,  brand:"Dutchie",   cat:"Frozen Foods",        promo:"On Sale",     img:"/assets/products/p10.png" },
];

const PAGE_SIZE = 9;
const LS_WISH = "pm_wishlist";

/* ===== ใช้ไอคอนหัวใจ “ตัวเดียว” แล้วสลับถม/เส้นด้วย CSS ===== */
const HeartIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="heart" {...props}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function ShopPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("featured");
  const [filters, setFilters] = useState({
    cat: new Set(),
    brand: new Set(),
    promo: new Set(),
    priceMin: null,
    priceMax: null,
  });

  const [wish, setWish] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(LS_WISH) || "[]")); }
    catch { return new Set(); }
  });
  useEffect(() => { localStorage.setItem(LS_WISH, JSON.stringify([...wish])); }, [wish]);

  const CAT_LIST = useMemo(() => ["Meats","Fruits & Vegetables","Frozen Foods","Dried Foods"], []);
  const BRANDS   = useMemo(() => [...new Set(PRODUCTS.map(p=>p.brand))].sort(), []);
  const PROMOS   = useMemo(() => [...new Set(PRODUCTS.map(p=>p.promo))].filter(x=>x!=="-").sort(), []);

  const toggleSet = (key, v, on) => {
    setFilters(prev => {
      const next = { ...prev, [key]: new Set(prev[key]) };
      on ? next[key].add(v) : next[key].delete(v);
      return next;
    });
    setPage(1);
  };
  const applyPrice = (min, max) => { setFilters(p=>({ ...p, priceMin:min, priceMax:max })); setPage(1); };
  const clearAll = () => { setFilters({ cat:new Set(), brand:new Set(), promo:new Set(), priceMin:null, priceMax:null }); setPage(1); };

  const filtered = useMemo(() => {
    const f = filters;
    return PRODUCTS.filter(p=>{
      if (f.cat.size   && !f.cat.has(p.cat)) return false;
      if (f.brand.size && !f.brand.has(p.brand)) return false;
      if (f.promo.size && !f.promo.has(p.promo)) return false;
      if (f.priceMin!=null && p.price < f.priceMin) return false;
      if (f.priceMax!=null && p.price > f.priceMax) return false;
      return true;
    });
  }, [filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort==="price-asc") arr.sort((a,b)=>a.price-b.price);
    else if (sort==="price-desc") arr.sort((a,b)=>b.price-a.price);
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page-1)*PAGE_SIZE;
    return sorted.slice(start, start+PAGE_SIZE);
  }, [sorted, page]);
  useEffect(()=>{ if (page>totalPages) setPage(totalPages); }, [totalPages, page]);

  const chips = useMemo(() => {
    const out = [];
    filters.cat.forEach(v=>out.push({key:"cat",label:v}));
    filters.brand.forEach(v=>out.push({key:"brand",label:v}));
    filters.promo.forEach(v=>out.push({key:"promo",label:v}));
    if (filters.priceMin!=null || filters.priceMax!=null) out.push({key:"price",label:`฿${filters.priceMin ?? 0}–${filters.priceMax ?? "∞"}`});
    return out;
  }, [filters]);
  const removeChip = (c) => {
    if (c.key==="price") setFilters(p=>({ ...p, priceMin:null, priceMax:null }));
    else setFilters(p=>{ const s=new Set(p[c.key]); s.delete(c.label); return { ...p, [c.key]:s }; });
    setPage(1);
  };

  const [minVal, setMinVal] = useState(""); 
  const [maxVal, setMaxVal] = useState("");
  useEffect(()=>{ setMinVal(filters.priceMin ?? ""); setMaxVal(filters.priceMax ?? ""); }, [filters.priceMin, filters.priceMax]);

  const ProductCard = ({ p }) => {
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
            onLoad={()=>setLoaded(true)}
            onError={()=>setSrc(PLACEHOLDER_DATA)}
          />
        </div>

        <div className="p-body">
          <h3 className="p-title" title={p.name}>{p.name}</h3>
          <div className="p-price-row"><div className="p-price">฿ {p.price.toFixed(2)}</div></div>

          <button
            className={`p-wishline ${liked ? "on" : ""}`}
            type="button"
            aria-pressed={liked}
            onClick={() =>
              setWish(prev => { const n=new Set(prev); n.has(p.id)?n.delete(p.id):n.add(p.id); return n; })
            }
          >
            <HeartIcon/>
            <span>{liked ? "ADDED TO WISHLIST" : "ADD TO WISHLIST"}</span>
          </button>

          <button className="btn btn--cta" type="button">ADD TO CART</button>
        </div>
      </article>
    );
  };

  const CheckList = ({ list, setKey, selected }) => (
    <div className={`checklist ${setKey==="brand" ? "scroll" : ""}`}>
      {list.map((val)=> {
        const id = `${setKey}-${val}`;
        return (
          <label key={id} htmlFor={id}>
            <input id={id} type="checkbox" checked={selected.has(val)} onChange={(e)=>toggleSet(setKey,val,e.target.checked)} />
            <span>{val}</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <main className="shop-page">
      <section className="wl-hero">
        <div className="wl-hero__inner">
          <h1 className="wl-title">SHOP</h1>
          <nav className="pm-breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li><a href="/">HOME</a></li>
              <li aria-current="page">SHOP</li>
            </ol>
          </nav>
        </div>
      </section>

      <div className="container">
        <div className="shop-toolbar v2" role="region" aria-label="Filters and sort">
          <div className="af-bar">
            <span className="af-label">ACTIVE FILTER</span>
            <div className="chips" aria-live="polite">
              {chips.map((c,i)=>(
                <span key={i} className="chip">
                  {c.label}
                  <button aria-label={`Remove ${c.label}`} onClick={()=>removeChip(c)} type="button">×</button>
                </span>
              ))}
            </div>
            <button className="link" hidden={chips.length===0} onClick={clearAll} type="button">Clear All</button>
          </div>

          <div className="toolbar-row">
            <p className="result-count">{filtered.length} items found</p>
            <div className="sort-area">
              <label className="sr-only" htmlFor="sort">Sort by</label>
              <select id="sort" value={sort} onChange={(e)=>{ setSort(e.target.value); setPage(1); }}>
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
              <div className="filter-head" onClick={(e)=>{ const blk=e.currentTarget.parentElement; const now=blk.getAttribute("aria-expanded")!=="true"; blk.setAttribute("aria-expanded", String(now)); }}>
                <h3>Product Categories</h3><button className="acc-btn" type="button" aria-label="Toggle"></button>
              </div>
              <div className="filter-body"><CheckList list={CAT_LIST} setKey="cat" selected={filters.cat}/></div>
            </section>

            <section className="filter-block" aria-expanded="true">
              <div className="filter-head" onClick={(e)=>{ const blk=e.currentTarget.parentElement; const now=blk.getAttribute("aria-expanded")!=="true"; blk.setAttribute("aria-expanded", String(now)); }}>
                <h3>Price (฿)</h3><button className="acc-btn" type="button" aria-label="Toggle"></button>
              </div>
              <div className="filter-body">
                <div className="price-row">
                  <input type="number" inputMode="decimal" placeholder="min"
                         value={minVal} onChange={(e)=>setMinVal(e.target.value)}
                         onKeyUp={(e)=> e.key==="Enter" && applyPrice(minVal?Number(minVal):null, maxVal?Number(maxVal):null)} />
                  <span>–</span>
                  <input type="number" inputMode="decimal" placeholder="max"
                         value={maxVal} onChange={(e)=>setMaxVal(e.target.value)}
                         onKeyUp={(e)=> e.key==="Enter" && applyPrice(minVal?Number(minVal):null, maxVal?Number(maxVal):null)} />
                </div>
                <button className="btn btn--apply" type="button"
                        onClick={()=>applyPrice(minVal?Number(minVal):null, maxVal?Number(maxVal):null)}>Apply</button>
              </div>
            </section>

            <section className="filter-block" aria-expanded="true">
              <div className="filter-head" onClick={(e)=>{ const blk=e.currentTarget.parentElement; const now=blk.getAttribute("aria-expanded")!=="true"; blk.setAttribute("aria-expanded", String(now)); }}>
                <h3>Brands</h3><button className="acc-btn" type="button" aria-label="Toggle"></button>
              </div>
              <div className="filter-body"><CheckList list={BRANDS} setKey="brand" selected={filters.brand}/></div>
            </section>

            <section className="filter-block" aria-expanded="true">
              <div className="filter-head" onClick={(e)=>{ const blk=e.currentTarget.parentElement; const now=blk.getAttribute("aria-expanded")!=="true"; blk.setAttribute("aria-expanded", String(now)); }}>
                <h3>Promotions</h3><button className="acc-btn" type="button" aria-label="Toggle"></button>
              </div>
              <div className="filter-body"><CheckList list={PROMOS} setKey="promo" selected={filters.promo}/></div>
            </section>
          </div>
        </aside>

        <section className="products" aria-label="Products">
          <div className="grid" aria-live="polite">
            {pageItems.map((p)=> <ProductCard key={p.id} p={p} />)}
            {pageItems.length===0 && <p className="no-result">No products found.</p>}
          </div>

          <nav className="pagination" aria-label="Pagination">
            <button className="page-btn" disabled={page<=1} onClick={()=>setPage(Math.max(1,page-1))} type="button">Prev</button>
            <span className="page-info">Page {page} / {totalPages}</span>
            <button className="page-btn" disabled={page>=totalPages} onClick={()=>setPage(page+1)} type="button">Next</button>
          </nav>
        </section>
      </div>
    </main>
  );
}
