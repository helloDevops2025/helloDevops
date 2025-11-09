// src/pages_admin/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";

/**
 * Weekly Stock Report (Admin)
 * Features:
 * - KPI cards
 * - Top selling bar (placeholder in CSS only, not chart lib)
 * - Table of products with stock status
 * - Date range filter (From / To / Apply)
 * - Export CSV / Print
 *
 * This version:
 * - มีการ fetch data จริงจาก backend
 * - มี loading / error state
 * - Apply จะ re-fetch ใหม่ตามช่วงวันที่
 *
 * คุณสามารถปรับชื่อ endpoint / field ให้ตรง backend ของคุณได้ในส่วน // TODO:
 */

// ====== CONFIG ==========================================================
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
const apiUrl = (p) => `${API_BASE}/${String(p).replace(/^\//, "")}`;

// ====== HELPERS =========================================================
function toISODateOnly(d) {
    // รับ Date หรือ string -> คืน YYYY-MM-DD
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function AdminDashboard() {
    // ---------------------------------------------------------------------
    // page scope for CSS scoping (เหมือนโค้ดเดิม)
    useEffect(() => {
        const app = document.querySelector(".app");
        const prev = app?.getAttribute("data-page");
        app?.setAttribute("data-page", "AdminDashboard");
        return () =>
            prev
                ? app.setAttribute("data-page", prev)
                : app?.removeAttribute("data-page");
    }, []);

    // ---------------------------------------------------------------------
    // Date range state
    const todayISO = toISODateOnly(new Date());
    const [dateFrom, setDateFrom] = useState(todayISO);
    const [dateTo, setDateTo] = useState(todayISO);

    // ---------------------------------------------------------------------
    // Data state
    const [products, setProducts] = useState([]); // [{id,name,...}, ...]
    const [loading, setLoading] = useState(false); // สำหรับทั้งหน้า
    const [error, setError] = useState(null);

    // ---------------------------------------------------------------------
    // Fetch function
    async function fetchStockData({ fromDate, toDate }) {
        setLoading(true);
        setError(null);
        try {
            const url = apiUrl(
                `/api/products` // ใช้ endpoint เดียวกับ Product List ของคุณ
            );

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Fetch failed with status ${res.status}`);
            }

            const data = await res.json();

            const normalized = data.map((item) => ({
                id: item.id ?? item.product_id ?? item.productId ?? "",
                name: item.name ?? item.product_name ?? "",
                category: item.category ?? "",
                brand: item.brand ?? "",
                price: Number(item.price ?? 0),

                // <<<<<< key part
                stock: Number(
                    item.quantity ??    // <--- ใช้อันนี้เป็นหลัก
                    item.qty ??
                    item.in_stock ??
                    item.stock ??
                    0
                ),

                soldThisWeek: Number(item.soldThisWeek ?? item.sold_week ?? 0),

                lastRestocked:
                    item.lastRestocked ??
                    item.last_restocked ??
                    item.updated_at ??
                    item.restock_date ??
                    "",
            }));

            setProducts(normalized);
        } catch (err) {
            console.error("fetchStockData error:", err);
            setError(err.message || "Failed to load data");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }



    // ---------------------------------------------------------------------
    // Load initial (เรียกครั้งแรกตอน mount)
    useEffect(() => {
        fetchStockData({ fromDate: dateFrom, toDate: dateTo });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------------------------------------------------------------------
    // Apply button (re-fetch ตามช่วงวันที่ใหม่)
    function handleApplyRange() {
        fetchStockData({ fromDate: dateFrom, toDate: dateTo });
    }

    // ---------------------------------------------------------------------
    // Derived metrics
    const metrics = useMemo(() => {
        const lowStockThreshold = 10;

        const totalProducts = products.length;
        const lowStock = products.filter(
            (p) => p.stock > 0 && p.stock <= lowStockThreshold
        ).length;
        const outOfStock = products.filter((p) => p.stock === 0).length;

        const totalWeeklySales = products.reduce(
            (acc, p) => acc + p.soldThisWeek * p.price,
            0
        );

        // Top selling (optional: for chart)
        const topSelling = [...products]
            .sort((a, b) => b.soldThisWeek - a.soldThisWeek)
            .slice(0, 8);

        const maxSold = Math.max(1, ...topSelling.map((p) => p.soldThisWeek));

        // Table rows: sort เพื่อให้ Out of Stock, Low Stock ลอยขึ้นก่อน
        const tableRows = [...products].sort((a, b) => {
            if (a.stock === 0 && b.stock !== 0) return -1;
            if (b.stock === 0 && a.stock !== 0) return 1;
            return a.stock - b.stock;
        });

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

    // ---------------------------------------------------------------------
    // Week label (เหมือนเดิม)
    const weekLabel = useMemo(() => {
        const now = new Date();
        const day = now.getDay(); // 0=Sun
        const diffToMon = (day + 6) % 7; // days since Monday
        const monday = new Date(now);
        monday.setDate(now.getDate() - diffToMon);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const fmt = (d) =>
            d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        return `${fmt(monday)} – ${fmt(sunday)}`;
    }, []);

    // ---------------------------------------------------------------------
    // Export CSV
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
                p.stock === 0
                    ? "Out of Stock"
                    : p.stock <= metrics.lowStockThreshold
                        ? "Low Stock"
                        : "In Stock";
            return [
                p.id,
                p.name,
                p.category,
                p.brand,
                p.price,
                p.stock,
                p.soldThisWeek,
                status,
                p.lastRestocked,
            ];
        });
        const csv = [headers, ...rows]
            .map((r) =>
                r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
            )
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `weekly-stock-report.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ---------------------------------------------------------------------
    // Print
    const handlePrint = () => window.print();

    // ---------------------------------------------------------------------
    // Render
    return (
        <div className="admin-dashboard">
            {/* HEADER */}
            <div className="header">
                <div>
                    <h1>Weekly Stock Report</h1>
                    <p className="sub">Week: {weekLabel}</p>
                </div>

                <div className="header-actions">
                    {/* Date Range Picker */}
                    <div className="daterange">
                        <label className="dr-label">
                            <span>From</span>
                            <input
                                type="date"
                                lang="en-CA"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                disabled={loading}
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
                                disabled={loading}
                            />
                        </label>

                        <button
                            className="btn inline"
                            onClick={handleApplyRange}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Apply"}
                        </button>
                    </div>

                    {/* Export CSV */}
                    <button
                        className="btn"
                        onClick={handleExportCSV}
                        disabled={loading || products.length === 0}
                    >
                        ⬇ Export CSV
                    </button>

                    {/* Print */}
                    <button className="btn primary" onClick={handlePrint}>
                        🖨 Print
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <section className="kpi-grid">
                <KpiCard
                    title="Total Products"
                    value={loading ? "…" : metrics.totalProducts}
                    
                />
                <KpiCard
                    title="Low Stock Items"
                    value={loading ? "…" : metrics.lowStock}
                    tone="warn"
                    
                />
                <KpiCard
                    title="Out of Stock"
                    value={loading ? "…" : metrics.outOfStock}
                    tone="danger"
                    
                />
                <KpiCard
                    title="Total Weekly Sales"
                    value={
                        loading
                            ? "…"
                            : `฿${metrics.totalWeeklySales.toLocaleString()}`
                    }
                    tone="success"
                    
                />
            </section>

            {/* ERROR BANNER (ถ้ามี) */}
            {error && (
                <div
                    style={{
                        background: "#fef2f2",
                        color: "#7f1d1d",
                        border: "1px solid #fecaca",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        fontSize: "14px",
                        marginBottom: "16px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                        fontWeight: 500,
                    }}
                >
                    ⚠ Failed to load data: {error}
                </div>
            )}

            {/* TABLE */}
            <section className="card table-wrap">
                <div className="card-head">
                    <h3>Stock Details</h3>
                    <input
                        className="search"
                        placeholder="Search here…"
                        disabled={loading || products.length === 0}
                        onChange={(e) => {
                            const q = e.target.value.toLowerCase();
                            document.querySelectorAll(".data-row").forEach((row) => {
                                const t = row.getAttribute("data-text") || "";
                                row.classList.toggle("hide", !t.includes(q));
                            });
                        }}
                    />
                </div>

                <div className="table">
                    {/* หัวตาราง */}
                    <div className="thead">
                        <div>Product</div>
                        <div>Product ID</div>
                        <div>Category</div>
                        <div>Brand</div>
                        <div className="num">Price</div>
                        <div className="num">In Stock</div>
                        <div>Status</div>            {/* <-- moved Status up */}
                        <div className="num">Sold (Week)</div>
                        <div>Last Restocked</div>
                    </div>

                    {/* แถวข้อมูล */}
                    {metrics.tableRows.map((p) => {
                        const status =
                            p.stock === 0
                                ? "Out of Stock"
                                : p.stock <= metrics.lowStockThreshold
                                    ? "Low Stock"
                                    : "In Stock";

                        const pillClass =
                            p.stock === 0
                                ? "pill danger"
                                : p.stock <= metrics.lowStockThreshold
                                    ? "pill warn"
                                    : "pill ok";

                        return (
                            <div
                                className="trow data-row"
                                key={p.id + p.name}
                                data-text={`${p.name} ${p.id} ${p.category} ${p.brand}`.toLowerCase()}
                            >
                                {/* 1 */} <div className="cell name">{p.name}</div>
                                {/* 2 */} <div className="cell">{p.id}</div>
                                {/* 3 */} <div className="cell">{p.category}</div>
                                {/* 4 */} <div className="cell">{p.brand}</div>
                                {/* 5 */} <div className="cell num">฿{p.price.toFixed(2)}</div>
                                {/* 6 */} <div className="cell num">{p.stock}</div>
                                {/* 7 */} <div className="cell">
                                    <span className={pillClass}>{status}</span>
                                </div>
                                {/* 8 */} <div className="cell num">{p.soldThisWeek}</div>
                                {/* 9 */} <div className="cell">{p.lastRestocked}</div>
                            </div>
                        );
                    })}

                    {/* กรณีไม่มีข้อมูล */}
                    {(!loading && products.length === 0 && !error) && (
                        <div
                            className="trow"
                            style={{
                                gridColumn: "1 / -1",
                                display: "block",
                                textAlign: "center",
                                color: "#64748b",
                                fontSize: "14px",
                                padding: "24px 0",
                            }}
                        >
                            No data for this range.
                        </div>
                    )}
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

