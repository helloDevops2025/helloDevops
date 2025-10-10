// src/pages/DetailPage.jsx
import { useEffect, useState } from "react";
import "./DetailPage.css";
import Footer from "../components/footer.jsx"; // <— เพิ่มบรรทัดนี้

/* Fallback รูปเป็น Data URI (ไม่มีไฟล์ภายนอก) */
const FALLBACK_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='640'>
     <rect fill='#f2f4f8' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9aa3b2' font-family='Poppins, Arial' font-size='24'>No Image</text>
   </svg>`
)}`;

function Breadcrumb({ categorySlug, categoryName, currentTitle }) {
  return (
    <nav className="pm-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="/">HOME</a></li>
        <li><a href={`/category/${categorySlug}`}>{categoryName}</a></li>
        <li aria-current="page">{currentTitle}</li>
      </ol>
    </nav>
  );
}

export default function DetailPage() {
  useEffect(() => { document.title = "Details Page"; }, []);

  // เดต้าใส่จาก DB จริงได้เลย
  const product = {
    title: "เบทาโกร หมูบดปรุงรสหมูผสมไก่บด แพ็คชิ้น 500 ก.",
    brand: "BETAGRO",
    sku: "PSAJK24",
    price: 79.0,
    stock: 120,
    imgMain: "/assets/หมู.png",
    imgDesc: "/assets/หมู.png",
    categoryName: "MEAT",
    categorySlug: "meat",
    excerpt:
      "หมูบดปรุงรสหมูผสมไก่บด (แช่แข็ง) เนื้อสัมผัสนุ่ม ปรุงง่าย เหมาะกับหลายเมนู ขนาด : 500 กรัม / แพ็ค",
  };

  const [qty, setQty] = useState("1");
  const [wish, setWish] = useState(false);
  const clamp = (v) => Math.max(1, parseInt(v || "1", 10));
  const disabled = product.stock <= 0;

  const handleImgError = (e) => {
    if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
  };

  return (
    <>
      <main className="page container detail-page">
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
            <h1 className="product__title">{product.title}</h1>

            <div className="meta">
              <span>
                Brand:{" "}
                <a href="#" className="link" aria-label={`Brand ${product.brand}`}>
                  {product.brand}
                </a>
              </span>
              <span>SKU: {product.sku}</span>
            </div>

            <div className="price">฿ {product.price.toFixed(2)}</div>
            <div className="stock">
              <span className="dot" aria-hidden="true" />
              Availability: <b>{product.stock} in stock</b>
            </div>

            <p className="excerpt">
              หมูบดปรุงรสหมูผสมไก่บด (แช่แข็ง) เนื้อสัมผัสนุ่ม ปรุงง่าย เหมาะกับหลายเมนู ขนาด :{" "}
              <span className="nowrap">500 กรัม / แพ็ค</span>
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
                {product.categoryName}
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
                เนื้อหมูคัดเกรดคุณภาพดี ผสมไก่บดสัดส่วนลงตัว ปรุงรสอ่อนกลมกล่อม พร้อมทำอาหารได้ทันที ขนาด : 500 กรัม/แพ็ค
              </p>
              <p>
                <b>วิธีการเก็บรักษา</b><br />
                เก็บในตู้แช่แข็งที่อุณหภูมิ -18 ถึง -23 °C
              </p>
              <p>
                <b>ประเทศต้นกำเนิด</b><br />
                ไทย
              </p>
            </div>
            <div className="desc__img">
              <img
                src={product.imgDesc}
                alt="แพ็คสินค้า Betagro"
                loading="lazy"
                onError={handleImgError}
              />
            </div>
          </div>
        </section>

        {/* Related products (ตัวอย่าง) */}
        <section className="section">
          <h2 className="section__title">RELATED PRODUCTS</h2>
          <div className="grid">
            {[
              { src: "/assets/หมูเด้ง.png", t: "ซูเปอร์เชฟ หมูเด้ง 220 กรัม แพ็ค 3", p: "฿ 85.00" },
              { src: "/assets/CP.png", t: "ซีพี หมูเด้ง 200 กรัม", p: "฿ 45.00" },
              { src: "/assets/ไก่.png", t: "ไก่ปรุงรสแช่แข็ง 500 กรัม", p: "฿ 49.00" },
              { src: "/assets/หมู.png", t: "ฟู๊ดส์แวร์ เกี๊ยวไส้หมูสับ 420 กรัม", p: "฿ 49.00" },
            ].map((it, i) => (
              <article key={i} className="card product-card">
                <a className="thumb" href="#">
                  <img src={it.src} alt={it.t} loading="lazy" onError={handleImgError} />
                </a>
                <h3 className="product-card__title">{it.t}</h3>
                <div className="product-card__price">{it.p}</div>
                <label className="wish wish--card">
                  <input type="checkbox" />
                  <span>Add to wishlist</span>
                </label>
                <button className="btn btn--primary btn--block" type="button">ADD TO CART</button>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Footer เฉพาะหน้านี้ */}
      <Footer />
    </>
  );
}
