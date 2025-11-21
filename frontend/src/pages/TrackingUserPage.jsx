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
    // if cancelled -> show 0%
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
          <div>Discount</div>
          <div>Qty</div>
          <div>Total</div>
        </div>
        <div style={{ padding: 16, color: "#777" }}>No items</div>
      </section>
    );
  }

  return (
    <section className="order-box">
      <div className="order-head">
        <div>Item</div>
        <div>Unit Price</div>
        <div>Discount</div>
        <div>Qty</div>
        <div>Total</div>
      </div>
      <div id="orderBody">
        {items.map((it) => {
          const price = Number(it.price || 0);
          const qty = Number(it.qty || 0);
          const perUnitTotalDisc = Number(it.totalPerUnitDiscount || it.perUnitDisc || 0) || 0;
          const lineTotal = Number(it.lineAfter ?? Math.max(0, (price - perUnitTotalDisc) * qty)) || 0;
          return (
            <div key={it.id} className="order-row">
              <div className="product">
                <img src={it.img} alt={it.name} />
                <div className="info">
                  <p className="name">{it.name}</p>
                  {it.desc && <p className="desc">{it.desc}</p>}
                </div>
              </div>
              <div className="price">{THB(price)}</div>
              <div className="discount">{THB(perUnitTotalDisc)}</div>
              <div className="qty">
                <span className="pill">{qty}</span>
              </div>
              <div className="subtotal">{THB(lineTotal)}</div>
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
    discount: 0,
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
              // try multiple possible discount field names on the order item
              const discountPerUnit = Number(
                it.discountPerUnit ?? it.discount_per_unit ?? it.discount_each ?? it.discountEach ?? it.discountAmount ?? it.discount ?? 0
              );
              return {
                id: String(pid ?? Math.random()),
                name: p.name || it.productName || "-",
                desc: p.description || "",
                price: Number(p.price ?? it.priceEach ?? it.price ?? 0),
                qty: Number(it.quantity || it.qty || 1),
                discountPerUnit: isNaN(discountPerUnit) ? 0 : discountPerUnit,
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
          // support multiple possible discount field names from backend
          discount: Number(
            data.discountAmount ?? data.discount ?? data.promoDiscount ?? data.promo_amount ?? 0
          ),
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

  // Enrich cart items with allocated order-level discount (proportional by line value)
  const enrichedCart = useMemo(() => {
    const raw = Array.isArray(order.cart) ? order.cart : [];
    const items = raw.map((it) => {
      const price = Number(it.price || 0);
      const qty = Number(it.qty || it.quantity || 0) || 0;
      const perUnitDisc = Number(
        it.discountPerUnit ?? it.discount_per_unit ?? it.discount_each ?? it.discountEach ?? it.discountAmount ?? it.discount ?? 0
      ) || 0;
      const lineBefore = Math.max(0, (price - perUnitDisc) * qty);
      return { ...it, price, qty, perUnitDisc, lineBefore };
    });

    const subtotalBefore = items.reduce((s, i) => s + (i.lineBefore || 0), 0);
    const orderDiscount = Number(order.discount || 0) || 0;

    if (orderDiscount > 0 && subtotalBefore > 0) {
      return items.map((i) => {
        const allocatedTotal = (i.lineBefore / subtotalBefore) * orderDiscount;
        const allocatedPerUnit = i.qty > 0 ? allocatedTotal / i.qty : 0;
        const totalPerUnitDiscount = (i.perUnitDisc || 0) + allocatedPerUnit;
        const lineAfter = Math.max(0, (i.price - totalPerUnitDiscount) * i.qty);
        return { ...i, allocatedTotal, allocatedPerUnit, totalPerUnitDiscount, lineAfter };
      });
    }

    // no order-level discount to allocate
    return items.map((i) => ({
      ...i,
      allocatedTotal: 0,
      allocatedPerUnit: 0,
      totalPerUnitDiscount: i.perUnitDisc || 0,
      lineAfter: i.lineBefore || 0,
    }));
  }, [order.cart, order.discount]);

  const totals = useMemo(() => {
    const subtotal = (enrichedCart || []).reduce((s, i) => s + (i.lineAfter || 0), 0);
    const items = (enrichedCart || []).reduce((s, i) => s + (i.qty || 0), 0);
    const discount = Number(order.discount || 0);
    const total = subtotal + (order.shippingFee || 0) + (order.tax || 0);
    return { subtotal, items, discount, total };
  }, [enrichedCart, order.shippingFee, order.tax, order.discount]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");

  const breadcrumb = [
    { label: "Home", href: "/home" },
    { label: "Account", href: "#" },
    { label: "Order Tracking" },
  ];

  const openPreview = () => {
    const items = enrichedCart || [];
    if (!items.length) return alert("No items to preview");

    const styles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map((n) => n.outerHTML)
      .join("\n");
    const base = `<base href="${window.location.origin}" />`;

    const rows = items
      .map((it, idx) => {
        const price = Number(it.price || 0);
        const qty = Number(it.qty || 0);
        const perUnitTotalDisc = Number(it.totalPerUnitDiscount || it.perUnitDisc || 0) || 0;
        const lineTotal = Number(it.lineAfter ?? Math.max(0, (price - perUnitTotalDisc) * qty)) || 0;
        const discDisplay = THB(perUnitTotalDisc);
        return `
          <tr>
            <td class="idx" style="width:40px">${idx + 1}</td>
            <td class="desc">
              <div style="font-weight:700;color:#0b2545">${it.name}</div>
              ${it.desc ? `<div class="item-desc">${it.desc}</div>` : ""}
            </td>
            <td class="price" style="width:120px">${THB(price)}</td>
            <td class="discount" style="width:120px;text-align:center">${discDisplay}</td>
            <td class="qty" style="width:80px;text-align:center">${qty}</td>
            <td class="total" style="width:140px;text-align:right">${THB(lineTotal)}</td>
          </tr>
        `;
      })
      .join("\n");

    const orderDate = formatDateAD(order.createdAt);
    const shippingText = order.address ? order.address.text : "-";
    const paymentMethod = order.paymentMethod || "-";

    const shippingFee = order.shippingFee || 0;
    const tax = order.tax || 0;
    const discount = totals.discount || 0;
    const grandTotal = totals.total;
    const discountDisplay = Number(discount || 0) === 0 ? THB(0) : `-${THB(discount)}`;

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
                  <th style="width:120px;text-align:center">Discount</th>
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
                <div class="row"><div class="muted">Shipping Fee</div><div>${THB(shippingFee)}</div></div>
                <div class="row"><div class="muted">Tax / VAT</div><div>${THB(tax)}</div></div>
                <div class="row"><div class="muted">Discount</div><div style="color:#0b2545">${discountDisplay}</div></div>
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
      alert("Cannot open print preview — please allow popups or try again");
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

        <OrderBox items={enrichedCart} />

        <section className="card" style={{ padding: 16, marginTop: 16 }}>
          <div style={{ maxWidth: 420, marginLeft: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div className="muted">Subtotal</div>
              <div>{THB(totals.subtotal)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div className="muted">Shipping Fee</div>
              <div>{THB(order.shippingFee || 0)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div className="muted">Tax / VAT</div>
              <div>{THB(order.tax || 0)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="muted">Discount</div>
              <div style={{ color: "#0b2545" }}>{Number(totals.discount || 0) === 0 ? THB(0) : `-${THB(totals.discount)}`}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Grand Total ({totals.items} items)</div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{THB(totals.total)}</div>
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
