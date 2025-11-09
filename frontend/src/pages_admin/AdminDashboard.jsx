// src/pages_admin/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";

/** ===== Utility: วันที่สำหรับ label ด้านบน (ค.ศ.) ===== */
function formatDateToDisplay(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const y = d.getFullYear(); // ค.ศ.
  const m = d.toLocaleString("en-US", { month: "long" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${y} ${m} ${day}`;
}

/** ===== Utility: ดึง list ไม่ว่าจะถูกห่อแค่ไหน ===== */
function extractList(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  return raw.items || raw.data || raw.content || raw.results || [];
}

/** ===== Utility: หาวันที่ออเดอร์ (รองรับหลายคีย์) ===== */
function pickOrderDate(o) {
  return (
    o.orderedAt ||
    o.ordered_at ||
    o.orderDate ||
    o.order_date ||
    o.createdAt ||
    o.created_at ||
    o.updatedAt ||
    o.updated_at ||
    null
  );
}

/** ===== Utility: ตรวจว่าอยู่ในช่วงวันไหม (ใช้ขอบ inclusive) ===== */
function inRange(iso, fromISO, toISO) {
  if (!iso) return false;
  try {
    const t = new Date(iso).getTime();
    const f = new Date(fromISO + "T00:00:00").getTime();
    const to = new Date(toISO + "T23:59:59").getTime();
    return t >= f && t <= to;
  } catch {
    return false;
  }
}

/** ===== Normalize Product =====
 * รองรับ: id, name, category/name, brand/name, price, stock/quantity, lastRestocked/last_restocked
 */
function normalizeProduct(p) {
  const id =
    p.id ||
    p.productId ||
    p.product_id ||
    p.sku ||
    p.code ||
    String(Math.random()).slice(2);

  const name = p.name || p.productName || p.title || "-";
  const category =
    p.category?.name || p.category || p.categoryName || p.category_name || "-";
  const brand = p.brand?.name || p.brand || p.brandName || p.brand_name || "-";
  const price = Number(p.price ?? p.unitPrice ?? p.priceEach ?? 0);
  const stock = Number(p.stock ?? p.quantity ?? p.qty ?? 0);
  const lastRestocked =
    p.lastRestocked || p.last_restocked || p.updatedAt || p.updated_at || "";

  return {
    id: String(id),
    name,
    category,
    brand,
    price,
    stock,
    soldThisWeek: 0, // คำนวณจาก orders ภายหลัง
    lastRestocked: lastRestocked ? lastRestocked.slice(0, 10) : "",
  };
}

/** ===== แปลง order item ให้ได้ productId + qty + price */
function mapOrderItem(it) {
  const productId =
    it.productIdFk ||
    it.product_id_fk ||
    it.productId ||
    it.product_id ||
    it?.product?.id ||
    it?.product?.productId ||
    it?.product?.product_id ||
    null;
  const qty = Number(it.quantity ?? it.qty ?? 0);
  const price = Number(
    it.priceEach ?? it.unitPrice ?? it.price ?? it?.product?.price ?? 0
  );
  return { productId: productId != null ? String(productId) : null, qty, price };
}

export default function AdminDashboard() {
  // --- set page scope attribute for CSS scoping (เดิม) ---
  useEffect(() => {
    const app = document.querySelector(".app");
    const prev = app?.getAttribute("data-page");
    app?.setAttribute("data-page", "AdminDashboard");
    return () =>
      prev ? app.setAttribute("data-page", prev) : app?.removeAttribute("data-page");
  }, []);

  // ===== Date range (เดิม) =====
  const getThisWeekRange = () => {
    const now = new Date();
    const day = (now.getDay() + 6) % 7; // 0=Mon ... 6=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - day);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const pad = (n) => String(n).padStart(2, "0");
    const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { from: toISO(monday), to: toISO(sunday) };
  };

  const initialRange = getThisWeekRange();
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [appliedRange, setAppliedRange] = useState(initialRange);

  const applyRange = () => {
    const f = new Date(dateFrom);
    const t = new Date(dateTo);
    const from = t < f ? dateTo : dateFrom;
    const to = t < f ? dateFrom : dateTo;
    setAppliedRange({ from, to });
  };

  const rangeLabel = `${new Date(appliedRange.from).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} – ${new Date(appliedRange.to).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  // ====== STATE: data จริงที่ดึงมา ======
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ====== โหลดของจริง: Products + Orders(ตามช่วง) แล้วคำนวณ soldThisWeek ======
  useEffect(() => {
    let aborted = false;

    async function fetchProductsAndOrders() {
      setLoading(true);
      setErr("");

      try {
        // --- 1) Products ---
        const resP = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/products?ts=${Date.now()}`,
          { headers: { Accept: "application/json" }, cache: "no-store" }
        );
        if (!resP.ok) throw new Error("โหลดรายการสินค้าไม่สำเร็จ");
        const rawP = await resP.json();
        const listP = extractList(rawP).map(normalizeProduct);

        // Index ช่วยให้อัปเดต sold ได้เร็ว
        const byId = new Map(listP.map((p) => [p.id, { ...p }]));

        // --- 2) Orders ตามช่วง (ลองแนบ query ถ้า backend รองรับ; ถ้าไม่รองรับจะ filter ฝั่ง FE) ---
        const base = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const urlWithRange = `${base}/api/orders?from=${appliedRange.from}&to=${appliedRange.to}&ts=${Date.now()}`;
        const urlFallback = `${base}/api/orders?ts=${Date.now()}`;

        let ordersRes = await fetch(urlWithRange, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        // ถ้า backend ยังไม่รองรับ query ช่วง ให้ fallback
        if (!ordersRes.ok) {
          ordersRes = await fetch(urlFallback, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
        }
        if (!ordersRes.ok) throw new Error("โหลดคำสั่งซื้อไม่สำเร็จ");
        const rawOrders = await ordersRes.json();
        const listO = extractList(rawOrders);

        // --- 3) รวมยอดขายรายสินค้า ในช่วงวันที่ที่เลือก ---
        for (const o of listO) {
          const dateOk = inRange(pickOrderDate(o), appliedRange.from, appliedRange.to);
          if (!dateOk) continue;

          // เฉพาะรายการที่นับเป็น sales จริง ๆ (optional): ถ้าอยากกรองตามสถานะ
          // const status = String(o.orderStatus || o.status || "").toUpperCase();
          // if (!["DELIVERED", "SHIPPING", "READY_TO_SHIP", "PREPARING", "PENDING"].includes(status)) continue;

          const items = Array.isArray(o.orderItems)
            ? o.orderItems
            : Array.isArray(o.items)
            ? o.items
            : [];

          for (const it of items) {
            const { productId, qty } = mapOrderItem(it);
            if (!productId || !Number.isFinite(qty)) continue;
            const rec = byId.get(String(productId));
            if (!rec) continue; // กรณีสินค้าถูกลบ/ไม่ตรง
            rec.soldThisWeek += Math.max(0, qty);
          }
        }

        const merged = Array.from(byId.values());
        if (!aborted) setProducts(merged);
      } catch (e) {
        console.error(e);
        if (!aborted) {
          setErr(e.message || "Fetch error");
          setProducts([]); // เคลียร์กรณี error
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    fetchProductsAndOrders();
    return () => {
      aborted = true;
    };
  }, [appliedRange.from, appliedRange.to]);

  // ===== Derived Metrics (ไม่แตะดีไซน์/โครง) =====
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const lowStockThreshold = 10;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const totalWeeklySales = products.reduce(
      (acc, p) => acc + (p.soldThisWeek || 0) * (p.price || 0),
      0
    );

    const topSelling = [...products]
      .sort((a, b) => (b.soldThisWeek || 0) - (a.soldThisWeek || 0))
      .slice(0, 8);

    const maxSold = Math.max(1, ...topSelling.map((p) => p.soldThisWeek || 0));

    const tableRows = [...products].sort((a, b) =>
      a.stock === 0 ? -1 : b.stock === 0 ? 1 : a.stock - b.stock
    );

    return {
      totalProducts,
      lowStock,
      outOfStock,
      totalWeeklySales,
      topSelling,
      maxSold,
      tableRows,
      lowStockThreshold,
    };
  }, [products]);

  // ===== Week label (เดิม) =====
  const weekLabel = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 Sun
    const diffToMon = (day + 6) % 7; // days since Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d) =>
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return `${fmt(monday)} – ${fmt(sunday)}`;
  }, []);

  // ===== Exporters (เดิม) =====
  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const headers = [
      "Product ID",
      "Product Name",
      "Category",
      "Brand",
      "Price",
      "In Stock",
      "Sold This Week",
      "Status",
      "Last Restocked",
    ];
    const rows = metrics.tableRows.map((p) => {
      const status =
        p.stock === 0 ? "Out of Stock" : p.stock <= metrics.lowStockThreshold ? "Low Stock" : "In Stock";
      return [
        p.id,
        p.name,
        p.category,
        p.brand,
        p.price,
        p.stock,
        p.soldThisWeek || 0,
        status,
        p.lastRestocked || "",
      ];
    });
    const csv =
      [headers, ...rows]
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-stock-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== UI (ดีไซน์เดิม) =====================================================
  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="header">
        <div>
          <h1>Weekly Stock Report</h1>
          <p className="sub">
            Date Range: {formatDateToDisplay(appliedRange.from)} – {formatDateToDisplay(appliedRange.to)}
          </p>
          {loading && <div className="muted" style={{ marginTop: 4 }}>Loading…</div>}
          {err && !loading && <div className="muted" style={{ color: "#b00020", marginTop: 4 }}>Error: {err}</div>}
        </div>
        <div className="header-actions">
          <div className="daterange">
            <label className="dr-label">
              <span>From</span>
              <input
                type="date"
                lang="en-CA"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>

            <span className="dr-sep">–</span>

            <label className="dr-label">
              <span>To</span>
              <input
                type="date"
                lang="en-CA"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>

            <button className="btn inline" onClick={applyRange}>
              Apply
            </button>
          </div>
          <button className="btn" onClick={handleExportCSV}>
            ⬇ Export CSV
          </button>
          <button className="btn primary" onClick={handlePrint}>
            🖨 Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="kpi-grid">
        <KpiCard title="Total Products" value={metrics.totalProducts} note="" />
        <KpiCard title="Low Stock Items" value={metrics.lowStock} tone="warn" note="" />
        <KpiCard title="Out of Stock" value={metrics.outOfStock} tone="danger" note="" />
        <KpiCard
          title="Total Weekly Sales"
          value={`฿${metrics.totalWeeklySales.toLocaleString()}`}
          tone="success"
          note=""
        />
      </section>

      {/* Charts */}
      <section className="charts">
        <div className="card chart">
          <div className="card-head">
            <h3>Top Selling Products (This Week)</h3>
            <span className="mini-hint">Total</span>
          </div>
          <div className="bars">
            {metrics.topSelling.map((p) => (
              <div className="bar-row" key={p.id}>
                <div className="bar-label" title={p.name}>
                  {p.name}
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${((p.soldThisWeek || 0) / metrics.maxSold) * 100}%` }}
                    aria-valuenow={p.soldThisWeek || 0}
                    aria-valuemax={metrics.maxSold}
                  />
                </div>
                <div className="bar-value">{p.soldThisWeek || 0}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card notes">
          <h3>Restock Suggestions</h3>
          <ul className="suggest">
            {metrics.tableRows
              .filter((p) => p.stock === 0 || p.stock <= metrics.lowStockThreshold)
              .slice(0, 6)
              .map((p) => (
                <li key={p.id}>
                  <b>{p.name}</b> —{" "}
                  <span className={p.stock === 0 ? "pill danger" : "pill warn"}>
                    {p.stock === 0 ? "Out of Stock" : `Low Stock (${p.stock})`}
                  </span>
                  <div className="muted">Last restocked: {p.lastRestocked || "-"}</div>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

// ----------------------------------------------------------
// Small component: KPI card
function KpiCard({ title, value, note, tone }) {
  return (
    <div className={`card kpi ${tone || ""}`}>
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
      {note && <div className="kpi-note">{note}</div>}
    </div>
  );
}
