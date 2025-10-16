import React, { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom"; // ✅ เพิ่มเพื่อเช็ค hash แล้วเลื่อน
import "./HomePage.css";
import Header from "../components/header";
import Footer from "../components/Footer";

const HomePage = () => {
  const allProductsRef = useRef(null);

  // ✅ เลื่อนไปยัง anchor (#best-sellers / #categories) แบบ smooth
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      // ถ้ามี header fixed สูง ให้ offset เองได้ภายหลัง
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
          {/* ✅ เปลี่ยนเป็น anchor ไปยังส่วน Best Sellers ในหน้าเดียวกัน */}
          <a href="/home#best-sellers" className="hero-card" aria-label="Shop Best Sellers">
            <img
              src="/assets/user/image48.png"
              alt="Pure & Fresh for Every Meal — Shop Best Sellers"
              loading="lazy"
            />
          </a>

          {/* ===== Best Sellers ===== */}
          {/* ✅ ใส่ id เพื่อให้ anchor ทำงาน */}
          <section id="best-sellers" className="best-sellers" aria-labelledby="best-title">
            <div className="best-sellers__head">
              <h2 id="best-title">Best Sellers.</h2>
              {/* ✅ เปลี่ยนเป็น anchor ในหน้าเดียวกัน */}
              <a href="/home#best-sellers" className="shop-all">Shop all</a>
            </div>

            <div className="products">
              {/* CARD 1 */}
              {/* ✅ เปลี่ยนให้ตรงกับ route จริง /detail/:id */}
              <a className="product" href="/detail/1" aria-label="รสดีชิคเก้น ปรุงรสไก่ชุบทอด 90 กรัม">
                <div className="product__thumb">
                  <img
                    src="/assets/products/p1.png"
                    alt="รสดีชิคเก้น ปรุงรสไก่ชุบทอด 90 กรัม"
                    loading="lazy"
                  />
                </div>
                <div className="product__body">
                  <h3 className="product__title">รสดีชิคเก้น ปรุงรสไก่ชุบทอด 90 กรัม</h3>
                  <div className="product__price">฿ 14.00</div>
                  <button className="add-to-cart" type="button">
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </a>

              {/* CARD 2 */}
              {/* ✅ /detail/:id */}
              <a className="product" href="/detail/2" aria-label="หมูบดปรุงรส เบทาโกร">
                <div className="product__thumb">
                  <img
                    src="/assets/products/p2.jpg"
                    alt="หมูบดปรุงรส เบทาโกร"
                    loading="lazy"
                    onError={(e)=>{ if(!e.currentTarget.dataset.png){ e.currentTarget.dataset.png=1; e.currentTarget.src="/assets/products/p2.png"; } }}
                  />
                </div>
                <div className="product__body">
                  <h3 className="product__title">หมูบดปรุงรส เบทาโกร</h3>
                  <div className="product__price">฿ 79.00</div>
                  <button className="add-to-cart" type="button">
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </a>

              {/* CARD 3 */}
              {/* ✅ /detail/:id */}
              <a className="product" href="/detail/3" aria-label="โออิชิ เกี๊ยวซ่า 660 กรัม">
                <div className="product__thumb">
                  <img
                    src="/assets/products/p3.jpg"
                    alt="โออิชิ เกี๊ยวซ่า 660 กรัม"
                    loading="lazy"
                    onError={(e)=>{ if(!e.currentTarget.dataset.png){ e.currentTarget.dataset.png=1; e.currentTarget.src="/assets/products/p3.png"; } }}
                  />
                </div>
                <div className="product__body">
                  <h3 className="product__title">โออิชิ เกี๊ยวซ่า 660 กรัม</h3>
                  <div className="product__price">฿ 179.00</div>
                  <button className="add-to-cart" type="button">
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </a>

              {/* CARD 4 */}
              {/* ✅ /detail/:id */}
              <a className="product" href="/detail/4" aria-label="มะเขือเทศ 150 กรัม">
                <div className="product__thumb">
                  <img
                    src="/assets/products/p4.jpg"
                    alt="มะเขือเทศ 150 กรัม"
                    loading="lazy"
                    onError={(e)=>{ if(!e.currentTarget.dataset.png){ e.currentTarget.dataset.png=1; e.currentTarget.src="/assets/products/p4.png"; } }}
                  />
                </div>
                <div className="product__body">
                  <h3 className="product__title">มะเขือเทศ 150 กรัม</h3>
                  <div className="product__price">฿ 45.00</div>
                  <button className="add-to-cart" type="button">
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </a>
            </div>
          </section>

            {/* ===== Banner 2 ===== */}
            <a href="#categories" className="hero-card" aria-label="Browse by Category">
              <img
                src="/assets/user/banner2.jpg"
                alt="Browse by Category"
                loading="lazy"
              />
            </a>

            {/* ===== Category ===== */}
            <section id="categories" className="category">
              <div className="category__inner">
                <div className="category__head">
                  <h3>Browse by Category</h3>
                  <span className="category__underline" aria-hidden="true"></span>
                </div>
                <div className="category__grid">
                  <a href={`/shop?cat=${encodeURIComponent("Dried Foods")}`} className="category-card" aria-label="Dried Foods">
                    <img src="/images/cat-dried-food.jpg" alt="Dried Foods" loading="lazy" />
                  </a>
                  <a href={`/shop?cat=${encodeURIComponent("Meats")}`} className="category-card" aria-label="Meats">
                    <img src="/images/cat-meat.jpg" alt="Meats" loading="lazy" />
                  </a>
                  <a href={`/shop?cat=${encodeURIComponent("Frozen Foods")}`} className="category-card" aria-label="Frozen Foods">
                    <img src="/images/cat-frozen.jpg" alt="Frozen Foods" loading="lazy" />
                  </a>
                  <a href={`/shop?cat=${encodeURIComponent("Fruits & Vegetables")}`} className="category-card" aria-label="Fruits & Vegetables">
                    <img src="/images/cat-fruits-veg.jpg" alt="Fruits & Vegetables" loading="lazy" />
                  </a>
                </div>
              </div>
            </section>


          {/* ===== All Products ===== */}
          <section className="all-products" aria-labelledby="all-title">
            <div className="ap-head">
              <h3 id="all-title">All Products</h3>
            </div>

            <span className="ap-underline" aria-hidden="true"></span>

            <div className="products" ref={allProductsRef}>
              {/* ✅ เปลี่ยน /product/:id → /detail/:id ให้ตรง route */}
              <a className="product" href="/detail/101" aria-label="เอ็มเคน้ำจิ้มสูตรต้นตำรับ 830กรัม">
                <div className="product__thumb">
                  <img src="/assets/products/all-1.jpg" alt="เอ็มเคน้ำจิ้มสูตรต้นตำรับ 830กรัม" loading="lazy" />
                </div>
                <div className="product__body">
                  <h3 className="product__title">เอ็มเคน้ำจิ้มสูตรต้นตำรับ 830กรัม</h3>
                  <div className="product__price">฿ 119.00</div>
                  <button className="add-to-cart" type="button">
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </a>

              <a className="product" href="/detail/102" aria-label="ไวไวเส้นหมี่ข้าวกล้องแห้ง 170 กรัม">
                <div className="product__thumb">
                  <img src="/assets/products/all-2.jpg" alt="ไวไวเส้นหมี่ข้าวกล้องแห้ง 170 กรัม" loading="lazy" />
                </div>
                <div className="product__body">
                  <h3 className="product__title">ไวไวเส้นหมี่ข้าวกล้องแห้ง 170 กรัม</h3>
                  <div className="product__price">฿ 20.00</div>
                  <button className="add-to-cart" type="button">
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </a>

              <a className="product" href="/detail/103" aria-label="ซุปเปอร์เฟรช การ์เด้น สลัดมิกซ์ แพ็คละ">
                <div className="product__thumb">
                  <img src="/assets/products/all-3.jpg" alt="ซุปเปอร์เฟรช การ์เด้น สลัดมิกซ์ แพ็คละ" loading="lazy" />
                </div>
                <div className="product__body">
                  <h3 className="product__title">ซุปเปอร์เฟรช การ์เด้น สลัดมิกซ์ แพ็คละ</h3>
                  <div className="product__price">฿ 35.00</div>
                  <button className="add-to-cart" type="button">
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </a>

              <a className="product" href="/detail/104" aria-label="ชุดไหว้บงคล 3 อย่าง 1330 กรัม">
                <div className="product__thumb">
                  <img src="/assets/products/all-4.jpg" alt="ชุดไหว้บงคล 3 อย่าง 1330 กรัม" loading="lazy" />
                </div>
                <div className="product__body">
                  <h3 className="product__title">ชุดไหว้บงคล 3 อย่าง 1330 กรัม</h3>
                  <div className="product__price">฿ 439.00</div>
                  <button className="add-to-cart" type="button">
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </a>
            </div>

            {/* 🔥 ปุ่มดำกลมลูกศรขาว อยู่ข้างหัวข้อ */}
            <button className="arrow-btn" onClick={handleScrollNext} aria-label="เลื่อนไปขวา">
              →
            </button>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
