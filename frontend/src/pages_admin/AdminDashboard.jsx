// src/pages_admin/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";

/**
 * Weekly Stock Report (Admin)
 * - แสดง KPI cards
 * - กราฟแท่ง (mock แบบ CSS bar ไม่พึ่ง lib เพิ่ม)
 * - ตารางรายละเอียดสินค้า + สถานะสต็อก
 * - Export CSV / Print PDF
 *
 * NOTE:
 * - ตอนนี้ใช้ mock data เพื่อให้เห็น layout ทันที
 * - ถ้าจะผูกจริง ให้ fetch จาก /api/products และ /api/orders แล้ว map เข้าช่องเดียวกันนี้ได้เลย
 */
// ===== Utility: แปลงและจัดรูปแบบวันที่ =====
function formatDateToDisplay(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.toLocaleString("en-US", { month: "long" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${y} ${m} ${day}`;
}



export default function AdminDashboard() {
    // --- set page scope attribute for CSS scoping ---
    useEffect(() => {
        const app = document.querySelector(".app");
        const prev = app?.getAttribute("data-page");
        app?.setAttribute("data-page", "AdminDashboard");
        return () => prev ? app.setAttribute("data-page", prev) : app?.removeAttribute("data-page");
    }, []);

    // ===== Mock Data (แทนที่ภายหลังด้วย fetch API) ===========================
    const [products] = useState(() => [
        { id: "P0001", name: "ข้าวหอมมะลิ 5 กก.", category: "Rice", brand: "Chat", price: 165, stock: 20, soldThisWeek: 35, lastRestocked: "2025-10-14" },
        { id: "P0002", name: "ทูน่ากระป๋อง 150 กรัม", category: "Seafood", brand: "SEAlect", price: 45, stock: 0, soldThisWeek: 22, lastRestocked: "2025-10-10" },
        { id: "P0003", name: "ไก่ชุบแป้งทอดแช่แข็ง", category: "Meats", brand: "CP", price: 120, stock: 8, soldThisWeek: 12, lastRestocked: "2025-10-15" },
        { id: "P0004", name: "น้ำปลาแท้ 700 มล.", category: "Sauce", brand: "ARO", price: 31, stock: 55, soldThisWeek: 9, lastRestocked: "2025-10-12" },
        { id: "P0005", name: "กระเทียมจีน 1 กก.", category: "Veggies", brand: "Import", price: 80, stock: 5, soldThisWeek: 18, lastRestocked: "2025-10-13" },
        { id: "P0006", name: "หอมหัวใหญ่ 1 กก.", category: "Veggies", brand: "Local", price: 65, stock: 2, soldThisWeek: 14, lastRestocked: "2025-10-13" },
        { id: "P0007", name: "ปลากระป๋อง 155 กรัม", category: "Seafood", brand: "LIGO", price: 28, stock: 0, soldThisWeek: 6, lastRestocked: "2025-10-08" },
        { id: "P0008", name: "น้ำมันพืช 1 ลิตร", category: "Oil", brand: "GOGI", price: 59, stock: 34, soldThisWeek: 16, lastRestocked: "2025-10-17" },
    ]);


    // ===== Date range (แทน Refresh) =====
    const getThisWeekRange = () => {
        const now = new Date();
        const day = (now.getDay() + 6) % 7;            // 0=Mon ... 6=Sun
        const monday = new Date(now); monday.setDate(now.getDate() - day);
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        const pad = (n) => String(n).padStart(2, "0");
        const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        return { from: toISO(monday), to: toISO(sunday) };
    };

    const initialRange = getThisWeekRange();
    const [dateFrom, setDateFrom] = useState(initialRange.from);
    const [dateTo, setDateTo] = useState(initialRange.to);

    // ถ้าจะคำนวณ/โหลดข้อมูลตามช่วง ให้ใช้ตัวนี้เป็น "ค่าที่ใช้จริง"
    const [appliedRange, setAppliedRange] = useState(initialRange);

    const applyRange = () => {
        // ป้องกันเลือกสลับ
        const f = new Date(dateFrom);
        const t = new Date(dateTo);
        if (t < f) {
            setAppliedRange({ from: dateTo, to: dateFrom });
        } else {
            setAppliedRange({ from: dateFrom, to: dateTo });
        }
        // TODO: ที่นี่คือจุด fetch API จริง เช่น:
        // fetch(`/api/orders?from=${dateFrom}&to=${dateTo}`).then(...)
    };

    // ใช้โชว์ label ด้านบน
    const rangeLabel = `${new Date(appliedRange.from).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
 – ${new Date(appliedRange.to).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;


    // ===== Derived Metrics =====================================================
    const metrics = useMemo(() => {
        const totalProducts = products.length;
        const lowStockThreshold = 10;
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;
        const outOfStock = products.filter(p => p.stock === 0).length;
        const totalWeeklySales = products.reduce((acc, p) => acc + p.soldThisWeek * p.price, 0);

        // top 8 by soldThisWeek
        const topSelling = [...products].sort((a, b) => b.soldThisWeek - a.soldThisWeek).slice(0, 8);

        // สำหรับ bar scale
        const maxSold = Math.max(1, ...topSelling.map(p => p.soldThisWeek));

        // สำหรับตาราง
        const tableRows = [...products]
            .sort((a, b) => (a.stock === 0 ? -1 : b.stock === 0 ? 1 : a.stock - b.stock));

        return { totalProducts, lowStock, outOfStock, totalWeeklySales, topSelling, maxSold, tableRows, lowStockThreshold };
    }, [products]);

    // ===== Week label ==========================================================
    const weekLabel = useMemo(() => {
        const now = new Date();
        const day = now.getDay(); // 0 Sun
        const diffToMon = (day + 6) % 7; // days since Monday
        const monday = new Date(now); monday.setDate(now.getDate() - diffToMon);
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        const fmt = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        return `${fmt(monday)} – ${fmt(sunday)}`;
    }, []);

    // ===== Exporters ===========================================================
    const handlePrint = () => window.print();

    const handleExportCSV = () => {
        const headers = ["Product ID", "Product Name", "Category", "Brand", "Price", "In Stock", "Sold This Week", "Status", "Last Restocked"];
        const rows = metrics.tableRows.map(p => {
            const status = p.stock === 0 ? "Out of Stock" : (p.stock <= metrics.lowStockThreshold ? "Low Stock" : "In Stock");
            return [p.id, p.name, p.category, p.brand, p.price, p.stock, p.soldThisWeek, status, p.lastRestocked];
        });
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `weekly-stock-report.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ===== UI =================================================================
    return (
        <div className="admin-dashboard">
            {/* Header */}
            <div className="header">
                <div>
                    <h1>Weekly Stock Report</h1>
                    <p className="sub">
                        Date Range: {formatDateToDisplay(appliedRange.from)} – {formatDateToDisplay(appliedRange.to)}
                    </p>


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

                        <button className="btn inline" onClick={applyRange}>Apply</button>
                    </div>
                    <button className="btn" onClick={handleExportCSV}>⬇ Export CSV</button>
                    <button className="btn primary" onClick={handlePrint}>🖨 Print</button>
                </div>
            </div>

            {/* KPI Cards */}
            <section className="kpi-grid">
                <KpiCard title="Total Products" value={metrics.totalProducts} note="" />
                <KpiCard title="Low Stock Items" value={metrics.lowStock} tone="warn" note="" />
                <KpiCard title="Out of Stock" value={metrics.outOfStock} tone="danger" note="" />
                <KpiCard title="Total Weekly Sales" value={`฿${metrics.totalWeeklySales.toLocaleString()}`} tone="success" note="" />
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
                                <div className="bar-label" title={p.name}>{p.name}</div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill"
                                        style={{ width: `${(p.soldThisWeek / metrics.maxSold) * 100}%` }}
                                        aria-valuenow={p.soldThisWeek}
                                        aria-valuemax={metrics.maxSold}
                                    />
                                </div>
                                <div className="bar-value">{p.soldThisWeek}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card notes">
                    <h3>Restock Suggestions</h3>
                    <ul className="suggest">
                        {metrics.tableRows
                            .filter(p => p.stock === 0 || p.stock <= metrics.lowStockThreshold)
                            .slice(0, 6)
                            .map(p => (
                                <li key={p.id}>
                                    <b>{p.name}</b> — <span className={p.stock === 0 ? "pill danger" : "pill warn"}>
                                        {p.stock === 0 ? "Out of Stock" : `Low Stock (${p.stock})`}
                                    </span>
                                    <div className="muted">Last restocked: {p.lastRestocked}</div>
                                </li>
                            ))}
                    </ul>
                </div>
            </section>
        </div>
    );
}

// ===== Small Components ======================================================
function KpiCard({ title, value, note, tone }) {
    return (
        <div className={`card kpi ${tone || ""}`}>
            <div className="kpi-title">{title}</div>
            <div className="kpi-value">{value}</div>
            {note && <div className="kpi-note">{note}</div>}
        </div>
    );
}



// src/pages_admin/AdminDashboard.jsx
// import { useEffect, useMemo, useState } from "react";
// import "./AdminDashboard.css";

// /* ===== Config ===== */
// const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
// const apiUrl = (p) => `${API_BASE}/${String(p).replace(/^\//, "")}`;

// /* ===== Utils ===== */
// function formatDateToDisplay(dateStr) {
//     if (!dateStr) return "-";
//     const d = new Date(dateStr);
//     const y = d.getFullYear();
//     const m = d.toLocaleString("en-US", { month: "long" });
//     const day = String(d.getDate()).padStart(2, "0");
//     return `${y} ${m} ${day}`;
// }
// const pad2 = (n) => String(n).padStart(2, "0");
// const toISODate = (d) => {
//     const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
//     return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
// };

// /* ===== Helper เรียกสรุปตามสเปก backend ===== */
// async function fetchSummary(headers, from, to) {
//   const url = apiUrl(`/order-items/summary?from=${from}&to=${to}`);
//   const res = await fetch(url, { headers });
//   if (!res.ok) {
//     const body = await res.text().catch(() => "");
//     throw new Error(`Summary HTTP ${res.status}${body ? ` body=${body.slice(0,200)}` : ""}`);
//   }
//   const json = await res.json();
//   // backend อาจห่อใน {data: [...]}
//   return Array.isArray(json) ? json : (json.data ?? []);
// }


// /* ===== Page Component ===== */
// export default function AdminDashboard() {
//     // scope class for page-specific CSS
//     useEffect(() => {
//         const app = document.querySelector(".app");
//         const prev = app?.getAttribute("data-page");
//         app?.setAttribute("data-page", "AdminDashboard");
//         return () =>
//             prev ? app.setAttribute("data-page", prev) : app?.removeAttribute("data-page");
//     }, []);

//     /* ===== Date range (weekly default) ===== */
//     const getThisWeekRange = () => {
//         const now = new Date();
//         const day = (now.getDay() + 6) % 7; // Monday = 0
//         const mon = new Date(now);
//         mon.setDate(now.getDate() - day);
//         const sun = new Date(mon);
//         sun.setDate(mon.getDate() + 6);
//         return { from: toISODate(mon), to: toISODate(sun) };
//     };

//     const initialRange = getThisWeekRange();
//     const [dateFrom, setDateFrom] = useState(initialRange.from);
//     const [dateTo, setDateTo] = useState(initialRange.to);
//     const [appliedRange, setAppliedRange] = useState(initialRange);

//     const applyRange = () => {
//         const f = new Date(dateFrom);
//         const t = new Date(dateTo);
//         const fromISO = toISODate(f <= t ? f : new Date(dateTo));
//         const toISO = toISODate(f <= t ? t : new Date(dateFrom));
//         setAppliedRange({ from: fromISO, to: toISO });
//     };

//     /* ===== Data states ===== */
//     const [products, setProducts] = useState([]);
//     const [summary, setSummary] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");

//     // fetch data when range changes
//     useEffect(() => {
//         let canceled = false;

//         async function load() {
//             setLoading(true);
//             setError("");

//             const token = localStorage.getItem("pm_token");
//             const headers = token ? { Authorization: `Bearer ${token}` } : {};

//             try {
//                 console.log("[AdminDashboard] Fetch range:", appliedRange);

//                 const [pRes, sJson] = await Promise.all([
//                     fetch(apiUrl("/products"), { headers }),
//                     fetchSummary(headers, appliedRange.from, appliedRange.to),
//                 ]);

//                 if (!pRes.ok) throw new Error(`Products HTTP ${pRes.status}`);

//                 const pJson = await pRes.json();

//                 if (!canceled) {
//                     setProducts(Array.isArray(pJson) ? pJson : pJson.data ?? []);
//                     setSummary(Array.isArray(sJson) ? sJson : sJson.data ?? []);
//                 }
//             } catch (e) {
//                 if (!canceled) setError(e.message || "Load failed");
//                 console.error("[AdminDashboard] Error:", e);
//             } finally {
//                 if (!canceled) setLoading(false);
//             }
//         }

//         load();
//         return () => { canceled = true; };
//     }, [appliedRange.from, appliedRange.to]);

//     /* ===== Derived metrics ===== */
//     const metrics = useMemo(() => {
//         const lowStockThreshold = 10;
//         const smap = new Map(summary.map((s) => [String(s.productId), s]));

//         const enriched = products.map((p) => {
//             const s = smap.get(String(p.id));
//             const sold = Number(s?.sold ?? 0);
//             const revenue = Number(s?.revenue ?? 0);

//             const categoryName = p.category?.name ?? p.categoryName ?? p.category ?? "-";
//             const brandName = p.brand?.name ?? p.brandName ?? p.brand ?? "-";
//             const lastRestocked = p.updatedAt ?? p.updated_at ?? p.lastRestocked ?? "-";
//             const qty = Number(p.quantity ?? 0);
//             const projectedStock = Math.max(0, qty - sold);

//             return {
//                 id: p.id,
//                 productCode: p.product_id ?? p.productCode ?? "",
//                 name: p.name,
//                 category: categoryName,
//                 brand: brandName,
//                 price: Number(p.price ?? 0),
//                 soldThisWeek: sold,
//                 projectedStock,
//                 lastRestocked,
//                 revenue,
//             };
//         });

//         const totalProducts = enriched.length;
//         const lowStock = enriched.filter(
//             (p) => p.projectedStock > 0 && p.projectedStock <= lowStockThreshold
//         ).length;
//         const outOfStock = enriched.filter((p) => p.projectedStock === 0).length;
//         const totalWeeklySales = enriched.reduce((acc, p) => acc + p.revenue, 0);

//         const topSelling = [...enriched]
//             .sort((a, b) => (b.soldThisWeek || 0) - (a.soldThisWeek || 0))
//             .slice(0, 8);
//         const maxSold = Math.max(1, ...topSelling.map((p) => p.soldThisWeek || 0));

//         const tableRows = [...enriched].sort((a, b) => {
//             if (a.projectedStock === 0 && b.projectedStock !== 0) return -1;
//             if (a.projectedStock !== 0 && b.projectedStock === 0) return 1;
//             return (a.projectedStock ?? 0) - (b.projectedStock ?? 0);
//         });

//         return {
//             totalProducts,
//             lowStock,
//             outOfStock,
//             totalWeeklySales,
//             topSelling,
//             maxSold,
//             tableRows,
//             lowStockThreshold,
//         };
//     }, [products, summary]);

//     const handlePrint = () => window.print();

//     const handleExportCSV = () => {
//         const headers = [
//             "Product ID",
//             "Product Name",
//             "Category",
//             "Brand",
//             "Price",
//             "Projected In Stock",
//             "Sold (Selected Range)",
//             "Status",
//             "Last Restocked",
//         ];
//         const rows = metrics.tableRows.map((p) => {
//             const status =
//                 p.projectedStock === 0
//                     ? "Out of Stock"
//                     : p.projectedStock <= metrics.lowStockThreshold
//                         ? "Low Stock"
//                         : "In Stock";
//             return [
//                 p.id,
//                 p.name,
//                 p.category,
//                 p.brand,
//                 p.price,
//                 p.projectedStock,
//                 p.soldThisWeek,
//                 status,
//                 p.lastRestocked,
//             ];
//         });
//         const csv = [headers, ...rows]
//             .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
//             .join("\n");
//         const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `weekly-stock-report_${appliedRange.from}_${appliedRange.to}.csv`;
//         a.click();
//         URL.revokeObjectURL(url);
//     };

//     return (
//         <div className="admin-dashboard">
//             {/* Header */}
//             <div className="header">
//                 <div>
//                     <h1>Weekly Stock Report</h1>
//                     <p className="sub">
//                         Date Range: {formatDateToDisplay(appliedRange.from)} –{" "}
//                         {formatDateToDisplay(appliedRange.to)}
//                     </p>
//                     {loading && <p className="muted" style={{ marginTop: 4 }}>Loading…</p>}
//                     {!loading && error && (
//                         <p className="error" style={{ marginTop: 4 }}>Error: {error}</p>
//                     )}
//                 </div>

//                 <div className="header-actions">
//                     <div className="daterange">
//                         <label className="dr-label">
//                             <span>From</span>
//                             <input
//                                 type="date"
//                                 lang="en-CA"
//                                 value={dateFrom}
//                                 onChange={(e) => setDateFrom(e.target.value)}
//                             />
//                         </label>

//                         <span className="dr-sep">–</span>

//                         <label className="dr-label">
//                             <span>To</span>
//                             <input
//                                 type="date"
//                                 lang="en-CA"
//                                 value={dateTo}
//                                 onChange={(e) => setDateTo(e.target.value)}
//                             />
//                         </label>

//                         <button className="btn inline" onClick={applyRange} disabled={loading}>
//                             {loading ? "Loading..." : "Apply"}
//                         </button>
//                     </div>
//                     <button className="btn" onClick={handleExportCSV} disabled={loading}>
//                         ⬇ Export CSV
//                     </button>
//                     <button className="btn primary" onClick={handlePrint}>
//                         🖨 Print
//                     </button>
//                 </div>
//             </div>

//             {/* KPI Cards */}
//             <section className="kpi-grid">
//                 <KpiCard title="Total Products" value={metrics.totalProducts} />
//                 <KpiCard title="Low Stock Items" value={metrics.lowStock} tone="warn" />
//                 <KpiCard title="Out of Stock" value={metrics.outOfStock} tone="danger" />
//                 <KpiCard
//                     title="Total Sales (Selected Range)"
//                     value={`฿${(metrics.totalWeeklySales || 0).toLocaleString()}`}
//                     tone="success"
//                 />
//             </section>

//             {/* Charts */}
//             <section className="charts">
//                 <div className="card chart">
//                     <div className="card-head">
//                         <h3>Top Selling Products (Selected Range)</h3>
//                         <span className="mini-hint">Total</span>
//                     </div>
//                     <div className="bars">
//                         {metrics.topSelling.map((p) => (
//                             <div className="bar-row" key={p.id}>
//                                 <div className="bar-label" title={p.name}>
//                                     {p.name}
//                                 </div>
//                                 <div className="bar-track">
//                                     <div
//                                         className="bar-fill"
//                                         style={{
//                                             width: `${((p.soldThisWeek || 0) / metrics.maxSold) * 100}%`,
//                                         }}
//                                         aria-valuenow={p.soldThisWeek || 0}
//                                         aria-valuemax={metrics.maxSold}
//                                     />
//                                 </div>
//                                 <div className="bar-value">{p.soldThisWeek || 0}</div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 <div className="card notes">
//                     <h3>Restock Suggestions</h3>
//                     <ul className="suggest">
//                         {metrics.tableRows
//                             .filter(
//                                 (p) =>
//                                     p.projectedStock === 0 ||
//                                     p.projectedStock <= metrics.lowStockThreshold
//                             )
//                             .slice(0, 6)
//                             .map((p) => (
//                                 <li key={p.id}>
//                                     <b>{p.name}</b> —{" "}
//                                     <span
//                                         className={p.projectedStock === 0 ? "pill danger" : "pill warn"}
//                                     >
//                                         {p.projectedStock === 0
//                                             ? "Out of Stock"
//                                             : `Low Stock (${p.projectedStock})`}
//                                     </span>
//                                     <div className="muted">
//                                         Last restocked: {p.lastRestocked || "-"}
//                                     </div>
//                                 </li>
//                             ))}
//                     </ul>
//                 </div>
//             </section>
//         </div>
//     );
// }

// /* ===== Small Components ===== */
// function KpiCard({ title, value, note, tone }) {
//     return (
//         <div className={`card kpi ${tone || ""}`}>
//             <div className="kpi-title">{title}</div>
//             <div className="kpi-value">{value}</div>
//             {note && <div className="kpi-note">{note}</div>}
//         </div>
//     );
// }
