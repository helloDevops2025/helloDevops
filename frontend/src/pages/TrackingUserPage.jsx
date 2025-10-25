// src/pages/TrackingUserPage.jsx
import "./TrackingUserPage.css";
import "../components/header.css";
import "./breadcrumb.css";

import React, { useMemo } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";

/* ===== Utils ===== */
const THB = (n) =>
  Number(n || 0).toLocaleString("th-TH", {
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

/* ===== Progress Card ===== */
const ProgressCard = ({ steps }) => {
  const { percent } = useMemo(() => {
    const total = steps.length || 1;
    const done = steps.filter((s) => s.done).length;
    let pct = 0;
    if (done === 0) pct = 0;
    else if (done === total) pct = 100;
    else pct = ((done - 0.5) / total) * 100; // ขยับให้เห็นระหว่างสถานะ
    return { percent: Math.max(0, Math.min(100, pct)) };
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
  if (!items?.length) {
    return (
      <section className="order-box">
        <div className="order-head">
          <div>Product</div>
          <div>Price</div>
          <div>Quantity</div>
          <div>Subtotal</div>
        </div>
        <div style={{ padding: 16, color: "#777" }}>ไม่มีรายการสินค้า</div>
      </section>
    );
  }

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
                  {it.desc && <p className="desc">{it.desc}</p>}
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
  const { orderId } = useParams();
  const location = useLocation();

  // 1) รับ payload จาก navigate(..., { state }) ถ้ามี
  // 2) ถ้ารีเฟรชหน้า: ดึงจาก sessionStorage ('pm_last_order')
  // 3) ถ้าไม่พบอะไรเลย: fallback ค่าตัวอย่าง (เพื่อให้หน้าแสดงได้ทันที)
  const order = useMemo(() => {
    if (location.state?.orderId) return location.state;
    try {
      const raw = sessionStorage.getItem("pm_last_order");
      if (raw) return JSON.parse(raw);
    } catch {}
    // fallback ตัวอย่าง (ยังโชว์หน้าได้แม้เปิดตรง ๆ)
    return {
      orderId: orderId || "123456789",
      address: null,
      cart: [
        {
          id: 1,
          name: "โออิชิ อิกโตะเกียวซ่า ไส้หมูแช่แข็ง 660 กรัม",
          desc: "เกี๊ยวซ่าหมูสไตล์ญี่ปุ่น ผลิตคัดคุณภาพจาก โออิชิ รสชาติอร่อย ง่าย สะดวก ในการปรุงและรับประทาน",
          price: 179,
          qty: 1,
          img: "/assets/products/p1.png",
        },
        {
          id: 2,
          name: "เอ็มเคน้ำจิ้มสูตรต้นตำรับ 830กรัม",
          desc: "น้ำจิ้มสุกี้เอ็มเค สูตรดั้งเดิม รสชาติอร่อยเข้มข้น เหมือนได้นั่งกินที่ร้าน",
          price: 119,
          qty: 1,
          img: "/assets/products/p2.png",
        },
        {
          id: 3,
          name: "มะพร้าวน้ำหอมคัดพิเศษ ลูกละ",
          desc: "ผลไม้หอมหวาน เนื้อนุ่ม สดชื่น",
          price: 25,
          qty: 4,
          img: "/assets/products/p3.png",
        },
      ],
    };
  }, [location.state, orderId]);

  const totals = useMemo(() => {
    let subtotal = 0,
      items = 0;
    for (const it of order.cart || []) {
      subtotal += it.price * it.qty;
      items += it.qty;
    }
    return { subtotal, items, total: subtotal };
  }, [order.cart]);

  // If this page was reached via navigate(..., { state }) from PlaceOrder,
  // `location.state` will contain order info — treat that as 'fromPlaceOrder'.
  const fromPlaceOrder = !!(
    location.state && (location.state.orderId || location.state.cart)
  );

  const breadcrumb = fromPlaceOrder
    ? [
        { label: "Home", href: "/home" },
        { label: "Cart", href: "/cart" },
        { label: "Checkout", href: "/checkout" },
        { label: "Order Tracking" },
      ]
    : [
        { label: "Home", href: "/home" },
        { label: "Account", href: "#" },
        { label: "Order Tracking" },
      ];

  // ขั้นความคืบหน้า: ใช้ค่า default แต่คุณสามารถส่งมาด้วยใน state เช่น state.steps ได้
  const defaultSteps = [
    { label: "Preparing", sub: "10:45 AM", done: true },
    { label: "Ready to Ship", sub: "01:21 PM", done: true },
    { label: "Shipping", sub: "Processing", done: true },
    { label: "Delivered", sub: "Pending", done: false },
  ];
  const steps = location.state?.steps || defaultSteps;

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
          ORDER ID : {order.orderId || orderId || "-"}
        </p>

        {/* (ทางเลือก) แสดงที่อยู่จัดส่งหากมี */}
        {order.address && (
          <section className="card" style={{ padding: 16, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 8 }}>Shipping Address</h3>
            <div><strong>{order.address.name}</strong></div>
            <div>{order.address.text}</div>
          </section>
        )}

        <ProgressCard steps={steps} />
        <OrderBox items={order.cart} />

        {/* สรุปยอดรวม */}
        <section className="card" style={{ padding: 16, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>Total {totals.items} items</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              Total Amount {THB(totals.total)}
            </div>
          </div>
        </section>

        <div style={{ marginTop: 24 }}>
          <Link to="/home" className="btn-primary">Back to Home</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
