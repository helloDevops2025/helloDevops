// src/pages/TrackingUserPage.jsx
import "./TrackingUserPage.css";
import "../components/header.css";
import "./breadcrumb.css";

import React, { useMemo, useRef, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import Header from "../components/header";
import Footer from "./../components/Footer.jsx";

/* ===== Utils ===== */
const THB = (n) =>
  Number(n || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
  });

// Format date in Gregorian (AD) as DD/MM/YYYY HH:mm:ss
const formatDateAD = (input) => {
  try {
    const d = input ? new Date(input) : new Date();
    if (isNaN(d)) return String(input);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch (e) {
    return String(input || "");
  }
};

// Format date in Buddhist Era (BE / พ.ศ.) as DD/MM/YYYY HH:mm:ss
const formatDateBE = (input) => {
  try {
    const d = input ? new Date(input) : new Date();
    if (isNaN(d)) return String(input);
    const pad = (n) => String(n).padStart(2, "0");
    // Buddhist Era year = Gregorian year + 543
    const beYear = d.getFullYear() + 543;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${beYear} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch (e) {
    return String(input || "");
  }
};

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
         <div>Item</div>
         <div>Unit Price</div>
         <div>Qty</div>
         <div>Total</div>
        </div>
        <div style={{ padding: 16, color: "#777" }}>ไม่มีรายการสินค้า</div>
      </section>
    );
  }

  return (
    <section className="order-box">
      <div className="order-head">
        <div>Item</div>
        <div>Unit Price</div>
        <div>Qty</div>
        <div>Total</div>
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

  const printRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");

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

  const openPreview = () => {
    // Build a receipt-style HTML using order data (no reliance on DOM innerHTML)
    const items = order.cart || [];
  if (!items.length) return alert("No items to preview");

    const styles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((n) => n.outerHTML)
      .join("\n");

    const base = `<base href="${window.location.origin}" />`;

    const rows = items
      .map((it, idx) => {
        const subtotal = (it.price || 0) * (it.qty || 0);
        return `
          <tr>
            <td class="idx" style="width:40px">${idx + 1}</td>
            <td class="desc">
              <div style="font-weight:700;color:#0b2545">${it.name}</div>
              ${it.desc ? `<div class="item-desc">${it.desc}</div>` : ""}
            </td>
            <td class="price" style="width:120px">${THB(it.price)}</td>
            <td class="qty" style="width:80px;text-align:center">${it.qty}</td>
            <td class="total" style="width:140px">${THB(subtotal)}</td>
          </tr>
        `;
      })
      .join("\n");

  const orderDate = formatDateAD(order.createdAt);
    const shippingText = order.address ? (order.address.text || "") : "-";
    const paymentMethod = order.paymentMethod || "-";

    const shippingFee = order.shippingFee || 0;
    const tax = order.tax || 0;
    const grandTotal = totals.total + shippingFee + tax;

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          ${base}
          ${styles}
        </head>
        <body>
          <div class="tracking-page">
            <div class="receipt">
            <header class="r-header">
              <div class="left">
                <img src="/assets/logo.png" class="logo" alt="Store logo" />
              </div>
              <div class="center">
                <div class="company">Pure Mart</div>
                <div class="meta">Pure Mart Co., Ltd.</div>
                <div class="meta small">
                  <div>xx/x Moo x, xxxxxxxx 1xxxx • Tel: 0xx-xxx-xxxx</div>
                  <div>contact@puremart.example</div>
                </div>
              </div>
              <div class="right">
                <div class="order-title">Order Receipt</div>
                <div class="order-id">${order.orderId || orderId || "-"}</div>
                <div class="meta">Date: ${orderDate}</div>
                <div class="meta">Payment: ${paymentMethod}</div>
              </div>
            </header>

            <section style="margin-bottom:12px">
              <strong>Ship to</strong>
              <div style="color:#444;margin-top:6px">${order.address && order.address.name ? `<div>${order.address.name}</div>` : "-"}</div>
              <div style="color:#666;margin-top:6px">${shippingText}</div>
            </section>

            <table class="items">
              <thead>
                <tr>
                  <th style="width:40px">#</th>
                  <th>Item</th>
                  <th style="width:120px;text-align:right">Unit Price</th>
                  <th style="width:80px;text-align:center">Qty</th>
                  <th style="width:140px;text-align:right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="totals-wrap">
              <div class="totals-card">
                <div class="row"><div class="muted">Subtotal</div><div>${THB(totals.total)}</div></div>
                <div class="row"><div class="muted">Shipping Fee</div><div>${THB(shippingFee)}</div></div>
                <div class="row"><div class="muted">Tax / VAT</div><div>${THB(tax)}</div></div>
                <div class="grand">Grand Total&nbsp;&nbsp;${THB(grandTotal)}</div>
              </div>
            </div>

            <div style="margin-top:18px;color:#6b7280;font-size:13px">Thank you for ordering with Pure Mart — for questions contact contact@puremart.example</div>
            </div>
          </div>
        </body>
      </html>
    `;

    setPreviewSrc(html);
    setPreviewOpen(true);
  };

  const printIframe = () => {
    const iframe = document.getElementById("order-preview-iframe");
    if (!iframe) return alert("Preview not available");
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถเปิดหน้าพรีวิวการพิมพ์ได้ — กรุณาอนุญาตป๊อปอัพหรือลองอีกครั้ง");
    }
  };

  return (
    <div className="tracking-page">
      <div className="pm-topbar" />
      <Header />

      <main className="container tracking">
        <Breadcrumb items={breadcrumb} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
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
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              className="print-btn"
              onClick={openPreview}
            >
              Print Order Receipt
            </button>
          </div>
        </div>

        {/* (ทางเลือก) แสดงที่อยู่จัดส่งหากมี */}
        {order.address && (
          <section className="card" style={{ padding: 16, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 8 }}>Shipping Address</h3>
            <div><strong>{order.address.name}</strong></div>
            <div>{order.address.text}</div>
          </section>
        )}

        <ProgressCard steps={steps} />

        {/* Printable area */}
        <div ref={printRef}>
          <OrderBox items={order.cart} />

          {/* สรุปยอดรวม */}
          <section className="card" style={{ padding: 16, marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
              <div>Grand Total ({totals.items} items)</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {THB(totals.total)}
              </div>
            </div>
          </section>
        </div>

        <div style={{ marginTop: 24 }}>
          <Link to="/home" className="btn-primary">Back to Home</Link>
        </div>

        {/* Preview modal (iframe) */}
        {previewOpen && (
          <div
            className="preview-overlay"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1200,
              padding: 24,
            }}
            onClick={() => setPreviewOpen(false)}
          >
            <div
              role="dialog"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(1100px, 96%)",
                height: "80%",
                background: "#fff",
                borderRadius: 8,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: 12, borderBottom: "1px solid #eee", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>Print preview</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="print-btn" onClick={printIframe} style={{ padding: '8px 12px' }}>
                    Open Print Dialog
                  </button>
                  <button onClick={() => setPreviewOpen(false)} style={{ padding: '8px 12px' }}>
                    Close
                  </button>
                </div>
              </div>
              <iframe
                id="order-preview-iframe"
                title="order-preview"
                srcDoc={previewSrc}
                style={{ flex: 1, border: 'none' }}
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
