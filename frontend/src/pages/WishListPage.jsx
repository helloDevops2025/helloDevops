import "./WishListPage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useEffect, useMemo, useState } from "react";

const LS_KEY = "pm_wishlist";

const SEED = [
  { id:1, name:"มะพร้าวน้ำหอม ปอกเปลือก 1 ลูก", price:25.00, liked:true, img:"/assets/products/coconut.png" },
  { id:2, name:"ข้าวโอ๊ตธัญพืช 190 กรัม",       price:80.00, liked:true, img:"/assets/products/cereal.png" },
  { id:3, name:"ซูเปอร์เชฟ อกไก่สด 600g.",      price:130.00, liked:true, img:"/assets/products/chicken.png" },
  { id:4, name:"ซอสพริกศรีราชา 200 มล.",       price:33.00, liked:true, img:"/assets/products/sauce.png" },
  { id:5, name:"หมูสันคอ สไลซ์ 0.5 กก.",        price:84.00, liked:true, img:"/assets/products/pork.png" },
  { id:6, name:"ขนมปังโฮลวีท 270 กรัม",        price:28.00, liked:true, img:"/assets/products/bread.png" },
  { id:7, name:"มะพร้าวน้ำหอม (ลูก)",          price:25.00, liked:true, img:"/assets/products/coconut.png" },
  { id:8, name:"ซีเรียลธัญพืช 250 กรัม",        price:89.00, liked:true, img:"/assets/products/cereal.png" },
  { id:9, name:"หมูบด 300 กรัม",                price:54.00, liked:true, img:"/assets/products/pork.png" }
];

function formatPrice(n){ return `฿ ${Number(n).toFixed(2)}`; }

function ConfirmModal({ open, onOk, onCancel, title, message, okText="ล้างทั้งหมด", cancelText="ยกเลิก" }) {
  useEffect(()=> {
    const onKey = (e)=>{ if(e.key==="Escape") onCancel?.(); };
    if(open) document.addEventListener("keydown", onKey);
    return ()=> document.removeEventListener("keydown", onKey);
  }, [open]);
  if(!open) return null;
  return (
    <div id="confirm-modal" className="pm-modal">
      <div className="pm-modal__overlay" onClick={onCancel}></div>
      <div className="pm-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cm-title">
        <h3 id="cm-title">{title}</h3>
        <p className="pm-modal__text">{message}</p>
        <div className="pm-modal__actions">
          <button className="btn" onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-danger" onClick={onOk}>{okText}</button>
        </div>
      </div>
    </div>
  );
}

export default function WishListPage() {
  const [items, setItems] = useState(()=> {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
      localStorage.setItem(LS_KEY, JSON.stringify(SEED));
      return SEED;
    } catch { return SEED; }
  });
  const [sortBy, setSortBy] = useState("recent");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(()=> {
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const sorted = useMemo(()=> {
    const arr = [...items];
    if (sortBy==="priceAsc")  arr.sort((a,b)=>a.price-b.price);
    if (sortBy==="priceDesc") arr.sort((a,b)=>b.price-a.price);
    if (sortBy==="nameAsc")   arr.sort((a,b)=>a.name.localeCompare(b.name,"th"));
    if (sortBy==="recent")    arr.sort((a,b)=>a.id-b.id);
    return arr;
  }, [items, sortBy]);

  const removeItem = (id)=> setItems(prev=> prev.filter(x=> x.id!==id));
  const handleAddToCart = (id)=> {
    const p = items.find(x=>x.id===id);
    if (p) alert(`เพิ่ม "${p.name}" ลงตะกร้าแล้ว`);
  };
  const clearAll = ()=> setConfirmOpen(true);
  const handleClearOk = ()=> { setItems([]); setConfirmOpen(false); };

  return (
    <>
      <Header />

      <div className="wl-page">
        {/* HERO */}
        <section className="wl-hero">
          <div className="wl-hero__inner">
            <h1 className="wl-title">WISHLIST</h1>
            

<nav className="custom-breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li className="custom-breadcrumb__item">
      <a href="/">HOME</a>
    </li>
    <li className="custom-breadcrumb__item">
      <span className="divider">›</span><a href="/shop">SHOP</a>
      <span className="divider">›</span>
    </li>
    <li className="custom-breadcrumb__item current" aria-current="page">WISHLIST</li>
  </ol>
</nav>


          </div>
        </section>

        {/* CONTENT */}
        <main className="wl-wrap">
          {/* Toolbar */}
          <div className="wl-toolbar">
            <div className="wl-total"><span id="wl-count">{items.length}</span> items</div>
            <div className="wl-controls">
              <select id="wl-sort" value={sortBy} onChange={(e)=> setSortBy(e.target.value)}>
                <option value="recent">ล่าสุด</option>
                <option value="priceAsc">ราคาต่ำ→สูง</option>
                <option value="priceDesc">ราคาสูง→ต่ำ</option>
              </select>
              <button id="wl-clear" className="btn" onClick={clearAll}>ล้างทั้งหมด</button>
            </div>
          </div>

          {/* Grid */}
          <div className="wl-grid">
            {sorted.map(item=> (
              <article key={item.id} className="wl-card">
                <div className="wl-thumb">
                  <button
                    className="wl-like"
                    aria-label="remove from wishlist"
                    title="Remove"
                    onClick={()=> removeItem(item.id)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <line x1="6" y1="6" x2="18" y2="18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"></line>
                      <line x1="18" y1="6" x2="6" y2="18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"></line>
                    </svg>
                  </button>
                  <img src={item.img} alt={item.name} />
                </div>

                <div className="wl-body">
                  <h3 className="wl-name">{item.name}</h3>
                  <div className="wl-price">{formatPrice(item.price)}</div>
                  <div className="wl-meta">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.8 7.1a5 5 0 0 0-7.1 0L12 8.8l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.1 8.8-8.1a5 5 0 0 0 0-7.1Z"></path>
                    </svg>
                    <span>{item.liked ? "In wishlist" : "—"}</span>
                  </div>
                </div>

                <div className="wl-actions">
                  <button className="btn btn-primary" onClick={()=> handleAddToCart(item.id)}>
                    ADD TO CART
                  </button>
                </div>
              </article>
            ))}
          </div>

          <p className="wl-empty" hidden={items.length !== 0}>
            ยังไม่มีรายการใน Wishlist
          </p>
        </main>
      </div>

      <Footer />

      <ConfirmModal
        open={confirmOpen}
        onOk={handleClearOk}
        onCancel={()=> setConfirmOpen(false)}
        title="ล้าง Wishlist ทั้งหมด?"
        message="รายการทั้งหมดจะถูกลบออกจาก Wishlist ของคุณ"
      />
    </>
  );
}
