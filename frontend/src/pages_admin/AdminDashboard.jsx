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

