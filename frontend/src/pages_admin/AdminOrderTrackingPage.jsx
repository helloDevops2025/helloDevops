// src/pages_admin/AdminOrderTrackingPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminOrderTrackingPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/** ลำดับสถานะสำหรับไทม์ไลน์ */
const STATUS_STEPS = ["PREPARING", "READY_TO_SHIP", "SHIPPING", "DELIVERED"];
const TITLE_BY_STATUS = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPING: "Shipping",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function AdminOrderTrackingPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // ต้องมีเส้นทาง /admin/orders/tracking/:id

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ===== โหลดคำสั่งซื้อ =====
  useEffect(() => {
    let abort = false;

    async function load() {
      if (!id) {
        setErr("ไม่พบรหัสคำสั่งซื้อ (order id) ใน URL");
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr("");

      try {
        const res = await fetch(`${API_URL}/api/orders/${encodeURIComponent(id)}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ");
        const data = await res.json();

        // รองรับ key ที่ต่างกัน (orderItems/items)
        const rawItems = Array.isArray(data.orderItems)
          ? data.orderItems
          : Array.isArray(data.items)
          ? data.items
          : [];

        // ✅ จุดสำคัญ: เก็บทั้ง productDbId (เลขจริง) และ productCode ('#00001')
        const items = rawItems.map((it) => {
          const productDbId =
            it.product_id_fk ?? it.productIdFk ?? it?.product?.id ?? it.productIdNumeric;
          const productCode =
            it.product_id ?? it.productId ?? it?.product?.product_id ?? it.productCode;
          const qty = Number(it.quantity || 0);
          const priceEach = Number(it.priceEach ?? it.price ?? it.unitPrice ?? 0);
          return {
            productDbId,              // ใช้ตัวนี้ยิง /api/products/:id/cover
            productCode,              // เก็บไว้เผื่อแสดงผล/ดีบัก
            productName:
              it.productName || it?.product?.name || it.name || `#${productCode ?? ""}`,
            qty,
            priceEach,
            totalPrice: Number(it.totalPrice ?? priceEach * qty),
            brandName: it.brandName || it?.product?.brandName || "",
          };
        });

        const normalized = {
          ...data,
          orderItems: items,
          orderStatus: (data.orderStatus || data.status || "PENDING").toUpperCase(),
        };

        if (!abort) setOrder(normalized);
      } catch (e) {
        if (!abort) setErr(e.message || "ดึงข้อมูลล้มเหลว");
      } finally {
        if (!abort) setLoading(false);
      }
    }

    load();
    return () => {
      abort = true;
    };
  }, [id]);

  // ===== คำนวณขั้นของไทม์ไลน์/เปอร์เซ็นต์ =====
  const { stepIndex, cancelled } = useMemo(() => {
    const st = (order?.orderStatus || "").toUpperCase();
    if (st === "CANCELLED") return { stepIndex: -1, cancelled: true };
    const i = STATUS_STEPS.indexOf(st); // ถ้าไม่เจอ = -1 (ยังไม่เริ่ม)
    return { stepIndex: i, cancelled: false };
  }, [order]);

  const progressPercent = useMemo(() => {
    if (cancelled || stepIndex < 0) return 0;
    const denom = STATUS_STEPS.length - 1; // 3
    const idx = Math.min(stepIndex, denom);
    return Math.round((idx / denom) * 100);
  }, [stepIndex, cancelled]);

  // ใช้สินค้าชิ้นแรกเป็นการ์ดโชว์
  const mainItem =
    Array.isArray(order?.orderItems) && order.orderItems.length > 0
      ? order.orderItems[0]
      : null;

  // ✅ ใช้ productDbId (เลขจริง) เพื่อดึงรูป cover จาก backend
  const productDbId = mainItem?.productDbId;
  const mainCover = productDbId
    ? `${API_URL}/api/products/${encodeURIComponent(productDbId)}/cover`
    : "/assets/products/p1.png";

  // ===== UI guard =====
  if (loading) {
    return (
      <div className="admin-order-tracking">
        <main className="content">
          <header className="header"><h1>ORDER TRACKING</h1></header>
          <p style={{ padding: 16 }}>กำลังโหลด…</p>
        </main>
      </div>
    );
  }
  if (err) {
    return (
      <div className="admin-order-tracking">
        <main className="content">
          <header className="header"><h1>ORDER TRACKING</h1></header>
          <p style={{ padding: 16, color: "#c00" }}>✖ {err}</p>
        </main>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="admin-order-tracking">
        <main className="content">
          <header className="header"><h1>ORDER TRACKING</h1></header>
          <p style={{ padding: 16 }}>ไม่พบข้อมูลคำสั่งซื้อ</p>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-order-tracking">
      {/* Main Content */}
      <main className="content">
        <header className="header">
          <div>
            <h1>ORDER TRACKING</h1>
          </div>
        </header>

        {/* Detail / Timeline */}
        <div className="detail">
          <section className="card">
            <h1 className="card-title">Detail</h1>

            <div className="progress">
              <div className="progress-line">
                <span className="line-fill" style={{ width: `${progressPercent}%` }}></span>
              </div>

              <div className="steps">
                {STATUS_STEPS.map((code, idx) => {
                  const label = TITLE_BY_STATUS[code] || code;
                  const done = !cancelled && stepIndex >= 0 && idx <= stepIndex;
                  return (
                    <div
                      key={code}
                      className={`step ${done ? "done" : ""} ${cancelled ? "cancel" : ""}`}
                    >
                      <div className="dot" aria-hidden="true"></div>
                      <div className="step-label">
                        <strong>{label}</strong>
                        {!done ? <small className="muted">Inactive</small> : null}
                        {cancelled && idx === 0 ? (
                          <small className="cancelled">Canceled</small>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Product Card */}
          <section className="card product-card">
            <div className="product-media">
              <img
                src={mainCover}
                alt={mainItem?.productName || "Product"}
                onError={(e) => {
                  // ถ้า backend ไม่มีรูป → fallback mock
                  e.currentTarget.src = "/assets/products/p1.png";
                }}
              />
            </div>

            <div className="product-info">
              <h2>{mainItem?.productName || "-"}</h2>
              <div className="kv-list">
                <div className="kv">
                  <span>Order ID</span>
                  <span>#{order.id}</span>
                </div>
                <div className="kv">
                  <span>Order Code</span>
                  <span>{order.orderCode || "-"}</span>
                </div>
                <div className="kv">
                  <span>Status</span>
                  <span>{TITLE_BY_STATUS[order.orderStatus] || order.orderStatus}</span>
                </div>
                <div className="kv">
                  <span>Quantity</span>
                  <span>{mainItem?.qty ?? "-"}</span>
                </div>
              </div>
              <div>
                {/* ไปหน้า Order Detail ของออเดอร์นี้ */}
                <button
                  className="btn view-btn"
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  View Order
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
