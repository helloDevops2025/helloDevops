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

export default function AdminOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // /admin/orders/:id

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

        // รองรับทั้งกรณี backend ส่ง "orderItems" หรือ "items"
        const orderItems = Array.isArray(data.orderItems)
          ? data.orderItems
          : Array.isArray(data.items)
          ? data.items
          : [];

        // ทำให้แน่ใจว่าตัวเลขเป็น number
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
                (Number(it.priceEach ?? it.price ?? 0) *
                  Number(it.quantity || 0))
            ),
            brandName: it.brandName || it?.product?.brandName || "",
          })),
          totalAmount: Number(data.totalAmount ?? data.total ?? 0),
          shippingCost: Number(data.shippingCost ?? 0),
        };

        if (!abort) setOrder(normalized);
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

  // ===== Change status (PUT /api/orders/:id/status) =====
  async function handleChangeStatus() {
    if (!order) return;
    const sel = document.getElementById("statusSelect");
    const newStatus = sel?.value;
    if (!newStatus) {
      alert("กรุณาเลือกสถานะก่อน");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("อัปเดตสถานะไม่สำเร็จ");
      const updated = await res.json();
      // บาง backend อาจคืนทั้ง order บางที่คืนเฉพาะ fields — จัดการแบบยืดหยุ่น
      setOrder((prev) => ({
        ...prev,
        orderStatus: updated.orderStatus || newStatus,
      }));
      alert("อัปเดตสถานะเรียบร้อย");
    } catch (e) {
      alert("❌ " + (e.message || "อัปเดตล้มเหลว"));
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
                <p>{order.orderStatus ?? "Pending"}</p>
              </div>
              <div className="status">
                <div className="selection-wrapper">
                  <select
                    className="selection"
                    id="statusSelect"
                    defaultValue=""
                    aria-label="Change order status"
                  >
                    <option value="" disabled>
                      status
                    </option>
                    <option>Pending</option>
                    <option>Preparing</option>
                    <option>Ready to Ship</option>
                    <option>Shipping</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
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
                // onClick={() => navigate("/admin/orders/tracking")}
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
