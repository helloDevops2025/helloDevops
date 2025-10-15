import "./TrackingUserPage.css";
import "../components/Header.css";
import "./breadcrumb.css";

import React, { useMemo } from "react";

/* ===== Utils ===== */
const THB = (n) =>
  n.toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
  });

/* ===== Components ===== */
const Breadcrumb = ({ items = [] }) => {
  if (!items.length) return null;
  return (
    <nav className="pm-breadcrumb" aria-label="Breadcrumb">
      {items.map((it, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="pm-breadcrumb__item">
            {isLast ? (
              <span className="current">{it.label}</span>
            ) : (
              <a href={it.href || "#"}>{it.label}</a>
            )}
            {!isLast && <span className="divider">›</span>}
          </span>
        );
      })}
    </nav>
  );
};

import Header from "../components/Header";
import Footer from "../components/Footer";

/* ===== Progress Card ===== */
const ProgressCard = ({ steps }) => {
  const { doneCount, percent } = useMemo(() => {
    const total = steps.length;
    const done = steps.filter((s) => s.done).length;
    let pct = 0;
    if (done === 0) pct = 0;
    else if (done === total) pct = 100;
    else pct = ((done - 0.5) / total) * 100;
    return { doneCount: done, percent: pct };
  }, [steps]);

  return (
    <section className="progress-card">
      <div className="card-title">Detail</div>

      <div className="progress">
        <div className="progress-line">
          <span className="line-fill" style={{ width: `${percent}%` }} />
        </div>

        <div className="steps">
          {steps.map((s, i) => (
            <div key={i} className={`step ${s.done ? "done" : ""}`}>
              <div className="dot" />
              <div className="step-label">
                <strong>{s.label}</strong>
                <small>{s.sub || ""}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ===== Order Box ===== */
const OrderBox = ({ items }) => {
  return (
    <section className="order-box">
      <div className="order-head">
        <div>Product</div>
        <div>Price</div>
        <div>Quantity</div>
        <div>Subtotal</div>
      </div>
      <div id="orderBody">
        {items.map((it) => {
          const subtotal = it.price * it.qty;
          return (
            <div key={it.id} className="order-row">
              <div className="product">
                <img src={it.img} alt={it.name} />
                <div className="info">
                  <p className="name">{it.name}</p>
                  <p className="desc">{it.desc}</p>
                </div>
              </div>
              <div className="price">{THB(it.price)}</div>
              <div className="qty">
                <span className="pill">{it.qty}</span>
              </div>
              <div className="subtotal">{THB(subtotal)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

/* ===== Main Page ===== */
export default function TrackingUserPage() {
  const breadcrumb = [
    { label: "Home", href: "/home" },
    { label: "Account", href: "#" },
    { label: "Order Tracking" },
  ];

  const steps = [
    { label: "Preparing", sub: "10:45 AM", done: true },
    { label: "Ready to Ship", sub: "01:21 PM", done: true },
    { label: "Shipping", sub: "Processing", done: true },
    { label: "Delivered", sub: "Pending", done: false },
  ];

  const ITEMS = [
    {
      id: 1,
      name: "โออิชิ อิกโตะเกียวซ่า ไส้หมูแช่แข็ง 660 กรัม",
      desc: "เกี๊ยวซ่าหมูสไตล์ญี่ปุ่น ผลิตคัดคุณภาพจาก โออิชิ รสชาติอร่อย ง่าย สะดวก ในการปรุงและรับประทาน",
      price: 179,
      qty: 1,
      img: "assets/products/p1.png",
    },
    {
      id: 2,
      name: "เอ็มเคน้ำจิ้มสูตรต้นตำรับ 830กรัม",
      desc: "น้ำจิ้มสุกี้เอ็มเค สูตรดั้งเดิม รสชาติอร่อยเข้มข้น เหมือนได้นั่งกินที่ร้าน",
      price: 119,
      qty: 1,
      img: "assets/products/p2.png",
    },
    {
      id: 3,
      name: "มะพร้าวน้ำหอมคัดพิเศษ ลูกละ",
      desc: "ผลไม้หอมหวาน เนื้อนุ่ม สดชื่น",
      price: 25,
      qty: 4,
      img: "assets/products/p3.png",
    },
  ];

  return (
    <div className="tracking-page">
      <div className="pm-topbar" />
      <Header />

      <main className="container tracking">
        <Breadcrumb items={breadcrumb} />
        <h1 className="title">ORDER TRACKING</h1>
        <p
          style={{
            margin: "-18px 0 28px",
            color: "#111",
            fontWeight: 600,
          }}
        >
          ORDER ID : 123456789
        </p>

        <ProgressCard steps={steps} />
        <OrderBox items={ITEMS} />
      </main>

      <Footer />
    </div>
  );
}
