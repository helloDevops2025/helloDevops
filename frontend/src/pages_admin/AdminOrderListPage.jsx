// src/pages_admin/AdminOrderListPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminOrderListPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";


function computeTotal(x = {}) {
  const subtotal = Number(x.subtotal ?? x.subTotal ?? 0);
  const ship = Number(x.shipping_fee ?? x.shippingFee ?? x.shippingCost ?? 0);
  const disc = Number(x.discount_total ?? x.discountTotal ?? 0);
  const tax = Number(x.tax_total ?? x.taxTotal ?? 0);
  const grand = Number(x.grand_total ?? x.grandTotal ?? x.totalAmount ?? x.total ?? 0);

  if (grand) return grand;
  return subtotal + ship + tax - disc;
}


function fmtDateTime(isoLike) {
  if (!isoLike) return "–";
  try {
    const d = new Date(isoLike);

    const datePart = new Intl.DateTimeFormat(
      "en-GB-u-ca-gregory",
      { day: "2-digit", month: "short", year: "numeric" }
    ).format(d);

    const timePart = new Intl.DateTimeFormat(
      "en-US-u-ca-gregory",
      { hour: "2-digit", minute: "2-digit", hour12: true }
    ).format(d);

    return `${datePart} • ${timePart}`;
  } catch {
    return String(isoLike);
  }
}

function normalizeOrder(o) {
  const orderedAt =
    o.orderedAt ??
    o.ordered_at ??
    o.createdAt ??
    o.created_at ??
    o.orderDate ??
    o.order_date ??
    null;

  return {
    id: o.id,
    orderCode: o.orderCode ?? o.order_code ?? o.code ?? "-",
    customerName: o.customerName ?? o.customer_name ?? "-",
    customerPhone: o.customerPhone ?? o.customer_phone ?? "-",
    shippingAddress: o.shippingAddress ?? o.shipping_address ?? "-",
    orderStatus: o.orderStatus ?? o.order_status ?? "PENDING",
    totalAmount: computeTotal(o),
    orderedAt, 
  };
}


function extractList(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  return raw.items || raw.data || raw.content || raw.results || [];
}

export default function AdminOrderListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [confirmOrder, setConfirmOrder] = useState(null); 
  const [showSuccess, setShowSuccess] = useState(false);  

  // ------- โหลดออเดอร์ทั้งหมด (กัน cache + รองรับหลาย payload) -------
  async function fetchOrders() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(
        `${API_URL}/api/orders?ts=${Date.now()}`, 
        { headers: { Accept: "application/json" }, cache: "no-store" }
      );
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้");


      const raw = await res.json();
      const list = extractList(raw);

   
      const normalized = list.map(normalizeOrder);

      setItems(Array.isArray(normalized) ? normalized : []);
    } catch (e) {
      setErr(e.message || "โหลดล้มเหลว");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  // ---------- pagination ----------
  useEffect(() => {
    function initTablePager({
      container = ".table-card",
      rowsPerPage = 10,
      windowSize = 3,
    } = {}) {
      const root = document.querySelector(container);
      if (!root) return;

      const rows = Array.from(root.querySelectorAll(".table-row"));
      const hint = root.querySelector(".hint");
      const prev = root.querySelector("#prevBtn");
      const next = root.querySelector("#nextBtn");
      const nums = root.querySelector("#pagerNumbers");
      if (!hint || !prev || !next || !nums) return;

      const totalItems = rows.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
      let currentPage = 1;

      const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
      const pageRange = (page) => {
        const start = (page - 1) * rowsPerPage;
        const end = Math.min(start + rowsPerPage, totalItems);
        return { start, end };
      };
      const windowRange = (page) => {
        const lastStart = Math.max(1, totalPages - windowSize + 1);
        const start = clamp(page, 1, lastStart);
        const end = Math.min(totalPages, start + windowSize - 1);
        return { start, end };
      };

      function renderRows(page) {
        const { start, end } = pageRange(page);
        rows.forEach((row, i) => {
          row.style.display = i >= start && i < end ? "grid" : "none";
        });
      }
      function renderHint(page) {
        const { start, end } = pageRange(page);
        const a = totalItems ? start + 1 : 0;
        const b = totalItems ? end : 0;
        hint.textContent = `Showing ${a}–${b} of ${totalItems} entries`;
      }
      function renderPager(page) {
        nums.innerHTML = "";
        const { start, end } = windowRange(page);
        for (let p = start; p <= end; p++) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "pill" + (p === page ? " active" : "");
          btn.textContent = String(p);
          btn.setAttribute("aria-current", p === page ? "page" : "false");
          btn.addEventListener("click", () => goTo(p));
          nums.appendChild(btn);
        }
        prev.disabled = page === 1;
        next.disabled = page === totalPages;
      }
      function goTo(page) {
        currentPage = clamp(page, 1, totalPages);
        renderRows(currentPage);
        renderHint(currentPage);
        renderPager(currentPage);
      }

      prev.addEventListener("click", () => goTo(currentPage - 1));
      next.addEventListener("click", () => goTo(currentPage + 1));
      goTo(1);
    }

    initTablePager({ container: ".table-card", rowsPerPage: 10, windowSize: 3 });
  }, [items]);

  // ---------- helpers ----------
  const showOrderCode = (code) => {
    if (!code) return "-";
    return String(code).startsWith("#") ? code : `#${code}`;
  };
  const getKey = (p) => p.id ?? p.orderCode;
  const getEditPath = (p) => `/admin/orders/${encodeURIComponent(p.id)}`;

  // ---------- DELETE ----------
    async function handleConfirmDelete() {
        if (!confirmOrder) return;
        try {
            const res = await fetch(`${API_URL}/api/orders/${confirmOrder.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete the order.");

            setConfirmOrder(null);
            setShowSuccess(true);
            await fetchOrders();
        } catch (error) {
            alert("❌ " + (error.message || "Failed to delete the order."));
        }
    }


  return (
    <div className="app" data-page="AdminProductListPage">
      <main className="main">
        <div className="content">
          <div className="content-header">
            <h1 className="title">ORDER LIST</h1>

            <div className="action-bar">
              <div className="search">
                <i className="fa-solid fa-magnifying-glass" />
                <select defaultValue="orderCode" aria-label="Search by">
                  <option value="orderCode">Order Code</option>
                  <option value="customerName">Customer</option>
                  <option value="orderStatus">Status</option>
                </select>
                <input type="text" placeholder="Search Here" />
              </div>

              {/* ปุ่มรีเฟรช แบบ manual กรณีอยากกดดูของใหม่ทันที */}
              <button className="btn" onClick={fetchOrders} title="Reload">
                Reload
              </button>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <div>Order Code</div>
              {/*  เพิ่มคอลัมน์ Ordered At ระหว่าง Order Code และ Customer Name */}
              <div>Ordered At</div>
              <div>Customer Name</div>
              <div>Phone</div>
              <div>Shipping Address</div>
              <div>Total</div>
              <div>Status</div>
              <div>Action</div>
            </div>

            {loading && (
              <div className="table-row" style={{ display: "grid" }}>
                <div style={{ gridColumn: "1 / -1" }}>Loading orders…</div>
              </div>
            )}

            {!loading && err && (
              <div className="table-row" style={{ display: "grid", color: "#c00" }}>
                <div style={{ gridColumn: "1 / -1" }}>Error: {err}</div>
              </div>
            )}

            {!loading && !err && items.length === 0 && (
              <div className="table-row" style={{ display: "grid" }}>
                <div style={{ gridColumn: "1 / -1" }}>No orders found.</div>
              </div>
            )}

            {!loading &&
              !err &&
              items.length > 0 &&
              items.map((p) => (
                <div
                  className="table-row"
                  key={getKey(p)}
                  data-order-code={p.orderCode}
                  data-name={p.customerName}
                  data-status={p.orderStatus}
                >
                  <div>{showOrderCode(p.orderCode)}</div>
                  {/* คอลัมน์ใหม่: แสดงวัน-เวลาแบบ ค.ศ. + AM/PM */}
                  <div title={p.orderedAt || ""}>{fmtDateTime(p.orderedAt)}</div>
                  <div>{p.customerName ?? "-"}</div>
                  <div>{p.customerPhone ?? "-"}</div>
                  <div>{p.shippingAddress ?? "-"}</div>
                  <div>{Number(p.totalAmount ?? 0).toFixed(2)}</div>
                  <div>{p.orderStatus ?? "-"}</div>

                  <div className="act">
                    {/*  ปุ่ม Edit ไปหน้า Detail */}
                    <Link
                      to={getEditPath(p)}
                      aria-label="Edit order"
                      title="Edit"
                    >
                      <i className="fa-solid fa-pen" />
                    </Link>
                    <button
                      type="button"
                      aria-label="Delete order"
                      title="Delete"
                      onClick={() => setConfirmOrder(p)}
                      style={{
                        background: "transparent",
                        border: 0,
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              ))}

            <div className="table-footer">
              <div className="hint">Showing entries</div>
              <div className="pager">
                <button className="circle" aria-label="Prev" id="prevBtn">
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <div id="pagerNumbers" />
                <button className="circle" aria-label="Next" id="nextBtn">
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ✅ Popup ยืนยันการลบ */}
        {confirmOrder && (
            <div className="modal-overlay">
                <div className="modal">
                    <h3>Are you sure you want to delete this order?</h3>
                    <p>Order: {showOrderCode(confirmOrder.orderCode)}</p>
                    <div className="modal-buttons">
                        <button className="btn-cancel" onClick={() => setConfirmOrder(null)}>
                            Cancel
                        </button>
                        <button className="btn-confirm" onClick={handleConfirmDelete}>
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ✅ Popup ลบสำเร็จ */}
        {showSuccess && (
            <div className="modal-overlay">
                <div className="modal">
                    <h3>Order has been successfully deleted.</h3>
                    <button className="btn-ok" onClick={() => setShowSuccess(false)}>
                        OK
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}
