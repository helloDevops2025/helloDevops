import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./AdminOrderDetailPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// เงินไทย
const THB = (n) =>
  Number(n || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// แผนที่ label ที่โชว์ ↔ code ที่ backend ต้องการ
const TITLE_BY_STATUS = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPING: "Shipping",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
const ALL_STATUS_CODES = Object.keys(TITLE_BY_STATUS);

// ยิงอัปเดตแบบ “ยืดหยุ่น” ให้ครอบคลุม backend หลายสไตล์
async function updateOrderStatusFlexible(orderId, code) {
  const s = String(code || "").trim().toUpperCase();

  // payload ชื่อ field ยอดฮิต
  const payloads = [
    { status: s },
    { orderStatus: s },
    { order_status: s },
  ];

  // endpoint ที่เจอบ่อย
  const endpoints = [
    { url: `${API_URL}/api/orders/${encodeURIComponent(orderId)}/status`, methods: ["PUT", "PATCH"] },
    { url: `${API_URL}/api/orders/${encodeURIComponent(orderId)}`, methods: ["PUT", "PATCH"] },
  ];

  // ลองทุก combination
  for (const ep of endpoints) {
    for (const method of ep.methods) {
      for (const body of payloads) {
        const res = await fetch(ep.url, {
          method,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
        }).catch(() => null);

        if (res && res.ok) {
          try { return await res.json(); } catch { return { ok: true }; }
        } else if (res) {
          // เก็บข้อความ error ไว้ช่วย debug
          const txt = await res.text().catch(() => "");
          console.warn(`[updateOrderStatusFlexible] ${method} ${ep.url}`, body, res.status, txt);
        }
      }
    }
  }

  // fallback: form-urlencoded (บาง backend ต้องการ)
  for (const ep of endpoints) {
    const form = new URLSearchParams();
    form.set("status", s);
    const res = await fetch(ep.url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: form.toString(),
    }).catch(() => null);
    if (res && res.ok) {
      try { return await res.json(); } catch { return { ok: true }; }
    }
  }

  throw new Error("Backend rejected all payloads/endpoints");
}

export default function AdminOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // /admin/orders/:id

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusDraft, setStatusDraft] = useState(""); // เก็บค่า code จาก select

  // ===== Load one order =====
  useEffect(() => {
    let abort = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/api/orders/${id}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้");
        const data = await res.json();

        const orderItems = Array.isArray(data.orderItems)
          ? data.orderItems
          : Array.isArray(data.items)
          ? data.items
          : [];

        const normalized = {
          ...data,
          orderItems: orderItems.map((it) => ({
            productName:
              it.productName ||
              it?.product?.name ||
              it.name ||
              `#${it.productIdFk ?? it.productId ?? ""}`,
            quantity: Number(it.quantity || 0),
            priceEach: Number(it.priceEach ?? it.price ?? it.unitPrice ?? 0),
            totalPrice: Number(
              it.totalPrice ??
                (Number(it.priceEach ?? it.price ?? 0) * Number(it.quantity || 0))
            ),
            brandName: it.brandName || it?.product?.brandName || "",
          })),
          totalAmount: Number(data.totalAmount ?? data.total ?? 0),
          shippingCost: Number(data.shippingCost ?? 0),
          orderStatus: String(data.orderStatus || data.status || "PENDING").toUpperCase(),
        };

        if (!abort) {
          setOrder(normalized);
          setStatusDraft(normalized.orderStatus); // ตั้งค่าเริ่มต้นเป็น code จริง
        }
      } catch (e) {
        if (!abort) setError(e.message || "โหลดข้อมูลล้มเหลว");
      } finally {
        if (!abort) setLoading(false);
      }
    }

    load();
    return () => {
      abort = true;
    };
  }, [id]);

  // ===== Derived totals =====
  const subtotal =
    (order?.orderItems || []).reduce(
      (sum, i) => sum + (Number(i.totalPrice) || 0),
      0
    ) || 0;

  const totalAmount =
    Number(order?.totalAmount || 0) || Number(subtotal + (order?.shippingCost || 0));

  // ===== Change status =====
  async function handleChangeStatus() {
    if (!order) return;
    const code = String(statusDraft || "").toUpperCase();
    if (!code) {
      alert("กรุณาเลือกสถานะก่อน");
      return;
    }
    if (!ALL_STATUS_CODES.includes(code)) {
      alert("รูปแบบสถานะไม่ถูกต้อง");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateOrderStatusFlexible(order.id ?? id, code);

      // อัปเดตสถานะในหน้าจอ
      setOrder((prev) => (prev ? { ...prev, orderStatus: code } : prev));
      alert("อัปเดตสถานะเรียบร้อย");
    } catch (e) {
      console.error(e);
      alert("❌ อัปเดตสถานะไม่สำเร็จ — กรุณาตรวจสอบ log ใน Console/Network");
    } finally {
      setSaving(false);
    }
  }

  // ===== Sidebar collapsing (เดิม) =====
  useEffect(() => {
    const sidebar = document.querySelector(".sidebar");
    const menuBtn = document.querySelector(".menu-btn");
    if (localStorage.getItem("sb-collapsed") === "1") {
      sidebar?.classList.add("collapsed");
    }
    const toggleSidebar = () => {
      sidebar?.classList.toggle("collapsed");
      localStorage.setItem(
        "sb-collapsed",
        sidebar?.classList.contains("collapsed") ? "1" : "0"
      );
    };
    if (menuBtn) {
      menuBtn.addEventListener("click", toggleSidebar);
      menuBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleSidebar();
        }
      });
    }
  }, []);

  // ===== UI guard =====
  if (loading) return <p style={{ padding: 20 }}>⏳ กำลังโหลดคำสั่งซื้อ…</p>;
  if (error) return <p style={{ padding: 20, color: "red" }}>❌ {error}</p>;
  if (!order) return <p style={{ padding: 20 }}>ไม่พบข้อมูลคำสั่งซื้อ</p>;

  return (
    <div className="admin-order-detail-page">
      <main className="content">
        <header className="header">
          <h1>ORDER DETAIL</h1>
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </header>

        {/* ===== Summary ===== */}
        <section className="summary">
          <div className="card-top">
            <div className="summary-text">
              <h2>Summary</h2>
            </div>

            <div className="info">
              <p>Order ID :</p>
              <span>#{order.id}</span>
            </div>

            <div className="info">
              <p>Order Code :</p>
              <span>{order.orderCode || "-"}</span>
            </div>

            <div className="info">
              <p>Customer :</p>
              <span>{order.customerName || "-"}</span>
            </div>

            <div className="info">
              <p>Phone :</p>
              <span>{order.customerPhone || "-"}</span>
            </div>

            <div className="info">
              <p>Shipping Address :</p>
              <span>{order.shippingAddress || "-"}</span>
            </div>

            <div className="info">
              <p>Payment Method :</p>
              <span>{order.paymentMethod || "-"}</span>
            </div>

            <div className="info">
              <p>Shipping Method :</p>
              <span>{order.shippingMethod || "-"}</span>
            </div>

            <div className="info">
              <p>
                <b>Total :</b>
              </p>
              <span>
                <b>{THB(totalAmount)}</b>
              </span>
            </div>
          </div>

          <div className="card-top">
            <div className="total-head">
              <h3>Cart Total</h3>
              <h3>Price</h3>
            </div>

            <div className="info">
              <p>Subtotal :</p>
              <span>{THB(subtotal)}</span>
            </div>

            <div className="info">
              <p>Shipping :</p>
              <span>{THB(order.shippingCost || 0)}</span>
            </div>

            <div className="info">
              <p>
                <b>Total price :</b>
              </p>
              <span>
                <b>{THB(totalAmount)}</b>
              </span>
            </div>
          </div>
        </section>

        {/* ===== Items table ===== */}
        <section className="order-items">
          <div className="order">
            <h3 className="order-head">All Items in Order</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.orderItems || []).map((item, i) => (
                    <tr key={i}>
                      <td>{item.productName || "-"}</td>
                      <td>{item.brandName || "-"}</td>
                      <td>{THB(item.priceEach)}</td>
                      <td>{item.quantity}</td>
                      <td>{THB(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ===== Right panel ===== */}
        <aside className="right-panel">
          <div className="card">
            <div className="info-card">
              <h3>Shipping Info</h3>
              <p>Method: {order.shippingMethod || "-"}</p>
            </div>
          </div>

          <div className="card">
            <div className="status-card">
              <div className="status-text">
                <h3>Edit Status</h3>
                <p>{TITLE_BY_STATUS[order.orderStatus] ?? order.orderStatus ?? "Pending"}</p>
              </div>
              <div className="status">
                <div className="selection-wrapper">
                  {/* ค่า value เป็น CODE (UPPERCASE) ที่ backend ต้องการ */}
                  <select
                    className="selection"
                    id="statusSelect"
                    aria-label="Change order status"
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value)}
                  >
                    {ALL_STATUS_CODES.map((code) => (
                      <option key={code} value={code}>
                        {TITLE_BY_STATUS[code]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="change"
                  onClick={handleChangeStatus}
                  disabled={saving}
                  title="Update order status"
                >
                  {saving ? "Saving…" : "Change"}
                </button>
              </div>
            </div>
          </div>

          <div className="tracking">
            <div className="tracking-text">
              <h2>Status Timeline</h2>
              <button
                className="tracking-btn"
                onClick={() => navigate(`/admin/orders/tracking/${order.id}`)}
              >
                <i className="fa-solid fa-truck" id="icon-track"></i>
                <h2>Tracking</h2>
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
