// src/pages/HomePage.jsx
import "./HomePage.css";

export default function HomePage() {
  return (
    <>
      {/* Top stripe */}
      <div className="pm-topbar"></div>

      {/* เนื้อหาหลัก */}
      <main className="home">
        <div className="container">
          {/* Banner 1 → ไป Best Sellers */}
          <a
            href="/best-sellers"
            className="hero-card"
            aria-label="Shop Best Sellers"
          >
            <img
              src="/assets/user/image48.png"
              alt="Pure & Fresh for Every Meal — Shop Best Sellers"
            />
          </a>

          {/* Best Sellers */}
          <section className="best-sellers" aria-labelledby="best-title">
            <div className="best-sellers__head">
              <h2 id="best-title">Best Sellers.</h2>
              <a href="/best-sellers" className="shop-all">
                Shop all
              </a>
            </div>

            <div className="products">
              {/* CARD 1 */}
              <div className="product">
                <a
                  className="product__link"
                  href="/product/1"
                  aria-label="ดูรายละเอียดสินค้า: รสดีชิคเก้น ปรุงรสไก่ชุบทอด 90 กรัม"
                ></a>

                <div className="product__thumb">
                  <img
                    src="/assets/products/p1.png"
                    alt="รสดีชิคเก้น ปรุงรสไก่ชุบทอด 90 กรัม"
                  />
                </div>

                <div className="product__body">
                  <h3 className="product__title">
                    รสดีชิคเก้น ปรุงรสไก่ชุบทอด 90 กรัม
                  </h3>
                  <div className="product__price">฿ 14.00</div>

                  <button
                    className="add-to-cart"
                    aria-label="เพิ่มลงตะกร้า: รสดีชิคเก้น ปรุงรสไก่ชุบทอด 90 กรัม"
                  >
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </div>

              {/* CARD 2 */}
              <div className="product">
                <a
                  className="product__link"
                  href="/product/2"
                  aria-label="ดูรายละเอียดสินค้า: หมูบดปรุงรส เบทาโกร"
                ></a>

                <div className="product__thumb">
                  <img
                    src="/assets/products/p2.jpg"
                    alt="หมูบดปรุงรส เบทาโกร"
                  />
                </div>

                <div className="product__body">
                  <h3 className="product__title">หมูบดปรุงรส เบทาโกร</h3>
                  <div className="product__price">฿ 79.00</div>

                  <button
                    className="add-to-cart"
                    aria-label="เพิ่มลงตะกร้า: หมูบดปรุงรส เบทาโกร"
                  >
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </div>

              {/* CARD 3 */}
              <div className="product">
                <a
                  className="product__link"
                  href="/product/3"
                  aria-label="ดูรายละเอียดสินค้า: โออิชิ เกี๊ยวซ่า 660 กรัม"
                ></a>

                <div className="product__thumb">
                  <img
                    src="/assets/products/p3.jpg"
                    alt="โออิชิ เกี๊ยวซ่า 660 กรัม"
                  />
                </div>

                <div className="product__body">
                  <h3 className="product__title">โออิชิ เกี๊ยวซ่า 660 กรัม</h3>
                  <div className="product__price">฿ 179.00</div>

                  <button
                    className="add-to-cart"
                    aria-label="เพิ่มลงตะกร้า: โออิชิ เกี๊ยวซ่า 660 กรัม"
                  >
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </div>

              {/* CARD 4 */}
              <div className="product">
                <a
                  className="product__link"
                  href="/product/4"
                  aria-label="ดูรายละเอียดสินค้า: มะเขือเทศ 150 กรัม"
                ></a>

                <div className="product__thumb">
                  <img
                    src="/assets/products/p4.jpg"
                    alt="มะเขือเทศ 150 กรัม"
                  />
                </div>

                <div className="product__body">
                  <h3 className="product__title">มะเขือเทศ 150 กรัม</h3>
                  <div className="product__price">฿ 45.00</div>

                  <button
                    className="add-to-cart"
                    aria-label="เพิ่มลงตะกร้า: มะเขือเทศ 150 กรัม"
                  >
                    <i className="fas fa-shopping-cart" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Banner 2 → ไปหน้า Discount */}
          <a href="#" className="hero-card" aria-label="#">
            <img src="/assets/banner2.jpg" alt="#" />
          </a>

          {/* ===== Browse by Category ===== */}
          <section className="category">
            <div className="category__inner">
              <div className="category__head">
                <h3>Browse by Category</h3>
                <span className="category__underline" aria-hidden="true"></span>
              </div>

              <div className="category__grid">
                <a
                  href="/category/dried-food"
                  className="category-card"
                  aria-label="Dried Food"
                >
                  <img src="/images/cat-dried-food.jpg" alt="Dried Food" />
                </a>

                <a
                  href="/category/meat"
                  className="category-card"
                  aria-label="Meat"
                >
                  <img src="/images/cat-meat.jpg" alt="Meat" />
                </a>

                <a
                  href="/category/frozen-food"
                  className="category-card"
                  aria-label="Frozen Food"
                >
                  <img src="/images/cat-frozen.jpg" alt="Frozen Food" />
                </a>

                <a
                  href="/category/fruits-vegetables"
                  className="category-card"
                  aria-label="Fruits and Vegetables"
                >
                  <img
                    src="/images/cat-fruits-veg.jpg"
                    alt="Fruits & Vegetables"
                  />
                </a>
              </div>
            </div>
          </section>

          {/* All Products */}
          <section className="all-products" aria-labelledby="all-title">
            <div className="ap-head">
              <h2 id="all-title">All Products</h2>
              <span className="ap-underline" aria-hidden="true"></span>
            </div>

            <div className="ap-wrap">
              <div className="ap-row" id="ap-row">
                {/* CARD 1 */}
                <div className="product">
                  <a
                    className="product__link"
                    href="/product/101"
                    aria-label="ดูรายละเอียดสินค้า: เอ็มเค..."
                  ></a>
                  <div className="product__thumb">
                    <img
                      src="/assets/products/all-1.jpg"
                      alt="เอ็มเคน้ำจิ้มสูตรต้นตำรับ 830กรัม"
                    />
                  </div>
                  <div className="product__body">
                    <h3 className="product__title">
                      เอ็มเคน้ำจิ้มสูตรต้นตำรับ 830กรัม
                    </h3>
                    <div className="product__price">฿ 119.00</div>
                    <button
                      className="add-to-cart"
                      aria-label="เพิ่มลงตะกร้า: เอ็มเคน้ำจิ้ม"
                    >
                      <i className="fas fa-shopping-cart" />
                    </button>
                  </div>
                </div>

                {/* CARD 2 */}
                <div className="product">
                  <a
                    className="product__link"
                    href="/product/102"
                    aria-label="ดูรายละเอียดสินค้า: ไวไวเส้นหมี่..."
                  ></a>
                  <div className="product__thumb">
                    <img
                      src="/assets/products/all-2.jpg"
                      alt="ไวไวเส้นหมี่ข้าวกล้องแห้ง 170 กรัม"
                    />
                  </div>
                  <div className="product__body">
                    <h3 className="product__title">
                      ไวไวเส้นหมี่ข้าวกล้อง 170 กรัม
                    </h3>
                    <div className="product__price">฿ 20.00</div>
                    <button
                      className="add-to-cart"
                      aria-label="เพิ่มลงตะกร้า: เส้นหมี่"
                    >
                      <i className="fas fa-shopping-cart" />
                    </button>
                  </div>
                </div>

                {/* CARD 3 */}
                <div className="product">
                  <a
                    className="product__link"
                    href="/product/103"
                    aria-label="ดูรายละเอียดสินค้า: สลัดมิกซ์"
                  ></a>
                  <div className="product__thumb">
                    <img
                      src="/assets/products/all-3.jpg"
                      alt="ซุปเปอร์เฟรช การ์เด้น สลัดมิกซ์ แพ็คละ"
                    />
                  </div>
                  <div className="product__body">
                    <h3 className="product__title">
                      ซุปเปอร์เฟรช การ์เด้น สลัดมิกซ์ แพ็คละ
                    </h3>
                    <div className="product__price">฿ 35.00</div>
                    <button
                      className="add-to-cart"
                      aria-label="เพิ่มลงตะกร้า: สลัดมิกซ์"
                    >
                      <i className="fas fa-shopping-cart" />
                    </button>
                  </div>
                </div>

                {/* CARD 4 */}
                <div className="product">
                  <a
                    className="product__link"
                    href="/product/104"
                    aria-label="ดูรายละเอียดสินค้า: ชุดไหว้บงคล 3 อย่าง"
                  ></a>
                  <div className="product__thumb">
                    <img
                      src="/assets/products/all-4.jpg"
                      alt="ชุดไหว้บงคล 3 อย่าง 1330 กรัม"
                    />
                  </div>
                  <div className="product__body">
                    <h3 className="product__title">
                      ชุดไหว้บงคล 3 อย่าง 1330 กรัม
                    </h3>
                    <div className="product__price">฿ 439.00</div>
                    <button
                      className="add-to-cart"
                      aria-label="เพิ่มลงตะกร้า: ชุดไหว้"
                    >
                      <i className="fas fa-shopping-cart" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ปุ่มเลื่อนขวา */}
              <button
                className="ap-next"
                type="button"
                aria-label="เลื่อนไปขวา"
                id="ap-next"
              >
                <span>➜</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
