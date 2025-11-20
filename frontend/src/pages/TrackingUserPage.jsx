import "./TrackingUserPage.css"; 
import "../components/header.css";
import "./breadcrumb.css";

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import Header from "../components/header";
import Footer from "./../components/Footer.jsx";

/* ===== Config / Utils ===== */
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

const THB = (n) =>
  Number(n || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
  });

const formatDateAD = (input) => {
  try {
    const d = input ? new Date(input) : new Date();
    if (isNaN(d)) return String(input);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return String(input || "");
  }
};

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
const ProgressCard = ({ steps, cancelled }) => {
  const { percent } = useMemo(() => {
    // ถ้ายกเลิก → ให้ 0%
    if (cancelled) return { percent: 0 };
    const total = steps.length || 1;
    const done = steps.filter((s) => s.done).length;
    let pct = 0;
    if (done === 0) pct = 0;
    else if (done === total) pct = 100;
    else pct = ((done - 0.5) / total) * 100;
    return { percent: Math.max(0, Math.min(100, pct)) };
  }, [steps, cancelled]);

  return (
    <section className="progress-card">
      <div className="card-title">Detail</div>
      <div className="progress">
        <div className="progress-line">
          <span className={`line-fill ${cancelled ? "is-cancel" : ""}`} style={{ width: `${percent}%` }} />
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div key={i} className={`step ${s.done ? "done" : ""} ${cancelled ? "cancel" : ""}`}>
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
          const subtotal = (it.price || 0) * (it.qty || 0);
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

/* ===== Helpers ===== */
function normalizeStatus(s) {
  return String(s || "").trim().toUpperCase();
}

function buildStepsFromStatus(rawStatus) {
  const st = normalizeStatus(rawStatus);

  // โครงตามลำดับเดียวกับ Admin
  const base = [
    { label: "Preparing", sub: "", done: false },
    { label: "Ready to Ship", sub: "", done: false },
    { label: "Shipping", sub: "Processing", done: false },
    { label: "Delivered", sub: "Pending", done: false },
  ];

  // ยกเลิก = ไม่ติ๊ก และปัก "Cancelled" ทุกขั้น
  if (st === "CANCELLED" || st === "CANCELED") {
    base.forEach((s) => {
      s.done = false;
      s.sub = "Cancelled";
    });
    return { steps: base, cancelled: true };
  }

  // เดินหน้าแบบปกติ
  switch (st) {
    case "PENDING":
    case "PREPARING":
      base[0].done = true;
      break;

    case "CONFIRMED":
    case "PROCESSING":
    case "READY_TO_SHIP":
      base[0].done = true;
      base[1].done = true;
      break;

    case "SHIPPING":
    case "SHIPPED":
    case "ON_DELIVERY":
    case "DELIVERING":
      base[0].done = true;
      base[1].done = true;
      base[2].done = true;
      break;

    case "DELIVERED":
      base.forEach((s) => (s.done = true));
      base[2].sub = "Delivered";
      base[3].sub = "Delivered";
      break;

    default:
      // ไม่รู้จัก → ให้เริ่มอย่างน้อยที่ Preparing
      base[0].done = true;
      break;
  }

  return { steps: base, cancelled: false };
}

/* ===== Main Page ===== */
export default function TrackingUserPage() {
  const { orderId } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState({
    orderId: orderId,
    createdAt: new Date().toISOString(),
    address: null,
    cart: [],
    shippingFee: 0,
    tax: 0,
    // ✅ ฟิลด์ใหม่: ดึงจาก backend เพื่อให้รู้ส่วนลด +ยอดหลังลด
    discountTotal: 0,
    grandTotal: 0,
    status: "PENDING",
  });

  // โหลดออเดอร์จริงจาก API ด้วย orderId
  useEffect(() => {
    let aborted = false;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("ไม่พบออเดอร์หรือเซิร์ฟเวอร์ไม่ตอบสนอง");

        const data = await res.json();

        // map เป็นโครงสำหรับหน้าแสดงผล
        const addrText = data.shippingAddress || "-";
        const mappedItems = Array.isArray(data.orderItems)
          ? data.orderItems.map((it) => {
              const p = it.product || {};
              const pid = p.id ?? it.productIdFk ?? it.productId;
              return {
                id: String(pid ?? Math.random()),
                name: p.name || it.productName || "-",
                desc: p.description || "",
                price: Number(p.price ?? it.priceEach ?? 0),
                qty: Number(it.quantity || 1),
                img:
                  pid !== undefined
                    ? `${API_BASE}/api/products/${encodeURIComponent(pid)}/cover`
                    : "/assets/products/placeholder.jpg",
              };
            })
          : [];

        const mapped = {
          orderId: String(data.id ?? data.orderCode ?? orderId),
          createdAt: data.createdAt || data.updatedAt || new Date().toISOString(),
          address: addrText ? { name: data.customerName || "-", text: addrText } : null,
          cart: mappedItems,
          shippingFee: Number(data.shippingFee ?? data.shipping_fee ?? 0),
          tax: Number(data.taxTotal ?? data.tax_total ?? 0),
          // ✅ ดึงส่วนลด + ยอดหลังลด จาก backend
          discountTotal: Number(data.discountTotal ?? data.discount_total ?? 0),
          grandTotal: Number(data.grandTotal ?? data.grand_total ?? 0),
          status: normalizeStatus(data.orderStatus ?? data.status ?? "PENDING"),
        };

        if (!aborted) setOrder(mapped);
      } catch (e) {
        if (!aborted) setErr(String(e?.message || "โหลดข้อมูลล้มเหลว"));
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => {
      aborted = true;
    };
  }, [orderId]);

  // ✅ ใช้ grandTotal / discountTotal จาก backend
  const totals = useMemo(() => {
    let subtotal = 0,
      items = 0;
    for (const it of order.cart || []) {
      subtotal += (it.price || 0) * (it.qty || 0);
      items += it.qty || 0;
    }

    const discount = Number(order.discountTotal || 0);
    const shipping = Number(order.shippingFee || 0);
    const tax = Number(order.tax || 0);

    // ถ้ามี grandTotal จาก DB ให้ใช้เลย (ราคา "หลังลด")
    let total = Number(order.grandTotal || 0);
    if (!total) {
      total = subtotal - discount + shipping + tax;
    }

    return { subtotal, items, discount, shipping, tax, total };
  }, [order]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");

  const breadcrumb = [
    { label: "Home", href: "/home" },
    { label: "Account", href: "#" },
    { label: "Order Tracking" },
  ];

  const openPreview = () => {
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
    const shippingText = order.address ? order.address.text : "-";
    const paymentMethod = order.paymentMethod || "-";

    // ✅ ใช้ totals ที่คำนวณจาก grandTotal / discountTotal แล้ว
    const shippingFee = totals.shipping;
    const tax = totals.tax;
    const grandTotal = totals.total;

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
                <div class="order-id">${order.orderId || "-"}</div>
                <div class="meta">Date: ${orderDate}</div>
                <div class="meta">Payment: ${paymentMethod}</div>
              </div>
            </header>

            <section style="margin-bottom:12px">
              <strong>Ship to</strong>
              <div style="color:#444;margin-top:6px">${order.address?.name || "-"}</div>
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
                <div class="row"><div class="muted">Subtotal</div><div>${THB(totals.subtotal)}</div></div>
                <!-- ถ้าอยากโชว์จำนวนส่วนลดชัด ๆ สามารถเพิ่มบรรทัดนี้ได้ภายหลัง
                <div class="row"><div class="muted">Discount</div><div>−${THB(totals.discount)}</div></div>
                -->
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

  if (loading) {
    return (
      <div className="tracking-page">
        <div className="pm-topbar" />
        <Header />
        <main className="container tracking">
          <div style={{ padding: 24 }}>กำลังโหลดข้อมูลออเดอร์…</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (err) {
    return (
      <div className="tracking-page">
        <div className="pm-topbar" />
        <Header />
        <main className="container tracking">
          <div style={{ padding: 24, color: "#c00" }}>Error: {err}</div>
          <Link to="/history" className="btn-primary" style={{ marginTop: 12 }}>
            กลับไปหน้า History
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // แปลงสถานะจริงจาก Admin เพื่อสร้างขั้นตอน + ธงยกเลิก
  const { steps, cancelled } = buildStepsFromStatus(order.status);

  return (
    <div className="tracking-page">
      <div className="pm-topbar" />
      <Header />

      <main className="container tracking">
        <Breadcrumb items={breadcrumb} />

        {/* ป้ายแจ้งยกเลิก ชัดเจนแบบเดียวกับฝั่ง Admin */}
        {cancelled && (
          <section
            className="card"
            style={{
              padding: 12,
              marginBottom: 12,
              color: "#b91c1c",
              background: "#fee2e2",
              border: "1px solid #fecaca",
            }}
          >
            คำสั่งซื้อนี้ถูกยกเลิกแล้ว
          </section>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 className="title">ORDER TRACKING</h1>
            <p
              style={{
                margin: "-18px 0 28px",
                color: "#111",
                fontWeight: 600,
              }}
            >
              ORDER ID : {order.orderId || "-"}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button type="button" className="print-btn" onClick={openPreview}>
              Print Order Receipt
            </button>
          </div>
        </div>

        {order.address && (
          <section className="card" style={{ padding: 16, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 8 }}>Shipping Address</h3>
            <div>
              <strong>{order.address.name}</strong>
            </div>
            <div>{order.address.text}</div>
          </section>
        )}

        {/* แสดงขั้นตอนที่แมปจากสถานะจริง + ธงยกเลิก */}
        <ProgressCard steps={steps} cancelled={cancelled} />

        <OrderBox items={order.cart} />

        <section className="card" style={{ padding: 16, marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>Grand Total ({totals.items} items)</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {THB(totals.total)}
            </div>
          </div>
        </section>

        <div style={{ marginTop: 24 }}>
          <Link to="/home" className="btn-primary">
            Back to Home
          </Link>
        </div>

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
              <div
                style={{
                  padding: 12,
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 700 }}>Print preview</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="print-btn"
                    onClick={printIframe}
                    style={{ padding: "8px 12px" }}
                  >
                    Open Print Dialog
                  </button>
                  <button
                    onClick={() => setPreviewOpen(false)}
                    style={{ padding: "8px 12px" }}
                  >
                    Close
                  </button>
                </div>
              </div>
              <iframe
                id="order-preview-iframe"
                title="order-preview"
                srcDoc={previewSrc}
                style={{ flex: 1, border: "none" }}
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
