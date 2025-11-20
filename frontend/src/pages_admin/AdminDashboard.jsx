// src/pages_admin/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

/**
 * Weekly Stock Report (Admin)
 * - เก็บโหมดเดิม (legacy: ดึง /api/products ตรง ๆ)
 * - เพิ่มโหมดใหม่ byDate (รวมยอดขายตามช่วงวันฝั่ง FE จาก /api/orders?includeItems=true)
 * - KPI cards, ตาราง, ค้นหา, Export CSV, Print, Date range + Apply
 */

// ====== CONFIG ==========================================================
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
const apiUrl = (p) => `${API_BASE}/${String(p).replace(/^\//, "")}`;

// ====== HELPERS =========================================================
function toISODateOnly(d) {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// ตัด YYYY-MM-DD ถ้ามี; ถ้าไม่มีค่อย parse เป็น Date แล้วคืนตามโซนท้องถิ่นแบบ “วันล้วน”
function toYMDPlus(v) {
    if (!v) return null;
    if (typeof v === "string") {
        const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
        if (m) return m[1];
    }
    const d = new Date(v);
    if (isNaN(d)) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

async function buildSoldMap(fromDate, toDate) {
    const listUrl =
        (fromDate && toDate)
            ? apiUrl(`/api/orders?from=${fromDate}&to=${toDate}&includeItems=true`)
            : apiUrl(`/api/orders?includeItems=true`); // <-- all-time (ไม่กรองวันใน URL)

    const oRes = await fetch(listUrl);
    if (!oRes.ok) throw new Error(`orders failed ${oRes.status}`);
    let orders = await oRes.json();

    // hydrate ถ้ารายการยังไม่มี items
    const needsHydrate = (o) => !o?.items && !o?.orderItems && !o?.order_items;
    if (Array.isArray(orders) && orders.some(needsHydrate)) {
        orders = await Promise.all(
            orders.map(async (o) => {
                if (!needsHydrate(o)) return o;
                try {
                    const r = await fetch(apiUrl(`/api/orders/${o.id}`), { headers: { Accept: "application/json" } });
                    return r.ok ? { ...o, ...(await r.json()) } : o;
                } catch { return o; }
            })
        );
    }

    const ACCEPTED = new Set(["PREPARING", "READY_TO_SHIP", "SHIPPING", "DELIVERED"]);

    // เงื่อนไขกรองวัน: ถ้าไม่มี from/to ให้ผ่านทุกอัน
    const toYMD = (v) => {
        if (!v) return null;
        if (typeof v === "string") { const m = v.match(/^(\d{4}-\d{2}-\d{2})/); if (m) return m[1]; }
        const d = new Date(v); if (isNaN(d)) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const useDateFilter = !!(fromDate && toDate);
    const inRange = (ymd) => !useDateFilter || (ymd && ymd >= fromDate && ymd <= toDate);

    const soldMap = new Map(); // productId -> qty
    for (const o of orders || []) {
        const ymd = toYMD(o.created_at ?? o.orderedAt ?? o.createdAt ?? o.orderDate ?? o.order_date);
        if (!inRange(ymd)) continue;

        const st = String(o.order_status ?? o.status ?? o.orderStatus ?? "").toUpperCase();
        if (!ACCEPTED.has(st)) continue;

        const items = o.items ?? o.orderItems ?? o.order_items ?? [];
        for (const it of items) {
            const pid =
                it.product_id_fk ?? it.productIdFk ?? it.productId ?? it.product_id ??
                it.product?.id ?? it.product?.product_id ?? it.product?.productId;
            const qty = Number(it.quantity ?? it.qty ?? 0);
            if (!pid || !qty) continue;
            const key = isNaN(Number(pid)) ? String(pid) : Number(pid);
            soldMap.set(key, (soldMap.get(key) || 0) + qty);
        }
    }
    return soldMap;
}
// ====== RESTOCK META (no-DB) ============================================
const META_KEY = "pm_stock_meta"; // { [productKey]: { lastQty:number, lastRestocked:string|null } }

function loadMeta() {
    try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; }
    catch { return {}; }
}
function saveMeta(meta) {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
}

// คืน products ที่เติม field lastRestocked จาก meta และอัปเดต meta ถ้าพบ "สต็อกเพิ่มขึ้น"
function applyRestockMeta(products) {
    const meta = loadMeta();
    const nowISO = new Date().toISOString();

    const withMeta = products.map(p => {
        const key = String(p.id ?? p.product_id ?? p.productId);
        const qty = Number(p.stock ?? p.quantity ?? 0);
        const rec = meta[key];

        if (!rec) {
            // ครั้งแรก: ตั้ง baseline แต่ยังไม่ถือว่า restock
            meta[key] = { lastQty: qty, lastRestocked: p.lastRestocked || null };
            return { ...p, lastRestocked: p.lastRestocked || null };
        }

        // ถ้า "สต็อกเพิ่มขึ้น" จากค่าที่เคยจำไว้ → ถือว่าเพิ่ง restock
        if (Number.isFinite(rec.lastQty) && qty > rec.lastQty) {
            rec.lastRestocked = nowISO;
        }
        // อัปเดต lastQty ทุกครั้ง
        rec.lastQty = qty;

        return { ...p, lastRestocked: p.lastRestocked || rec.lastRestocked || null };
    });

    saveMeta(meta);
    return withMeta;
}

// utility แสดงวันแบบมนุษย์อ่าน
function fmtDateYMD(s) {
    if (!s) return "—";
    const d = new Date(s);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}




export default function AdminDashboard() {
    const navigate = useNavigate();
    // ---------------------------------------------------------------------
    // page scope (สำหรับ CSS scoping เดิม)
    useEffect(() => {
        const app = document.querySelector(".app");
        const prev = app?.getAttribute("data-page");
        app?.setAttribute("data-page", "AdminDashboard");
        return () => (prev ? app.setAttribute("data-page", prev) : app?.removeAttribute("data-page"));
    }, []);

    // ---------------------------------------------------------------------
    // โหมดทำงาน: เก็บของเดิม + เพิ่มโหมดใหม่
    const [mode, setMode] = useState("legacy"); // "legacy" | "byDate"
    const [filterSoldOnly, setFilterSoldOnly] = useState(true);

    // ถ้าเปลี่ยนโหมดเป็น legacy ให้ปิดกรองอัตโนมัติ
    useEffect(() => {
        setFilterSoldOnly(mode === "byDate");
    }, [mode]);


    // ---------------------------------------------------------------------
    // Date range state
    const todayISO = toISODateOnly(new Date());
    const [dateFrom, setDateFrom] = useState(todayISO);
    const [dateTo, setDateTo] = useState(todayISO);

    // ---------------------------------------------------------------------
    // Data state
    const [products, setProducts] = useState([]);  // [{id,name,...}]
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ---------------------------------------------------------------------
    // ========== FETCH FUNCTIONS ==========
    // 1) ของเดิม (ดึงทั้งหมด ไม่กรองวัน)
    async function fetchStockDataLegacy({ fromDate, toDate }) {
        setLoading(true);
        setError(null);
        try {
            // ดึงสินค้าทั้งหมดเหมือนเดิม
            const res = await fetch(apiUrl(`/api/products`));
            if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
            const data = await res.json();

            // สร้างแผนที่ยอดขายตามช่วงวัน (จะใช้ใน KPI + คอลัมน์ Sold)
            let soldMap = new Map();
            try { soldMap = await buildSoldMap(null, null); } catch (e) { console.warn("sold overlay failed:", e); }


            const normalized = data.map((item) => {
                const pid = item.id ?? item.product_id ?? item.productId ?? "";
                const sold = (isNaN(Number(pid)) ? soldMap.get(String(pid)) : soldMap.get(Number(pid))) || 0;
                return {
                    id: pid,
                    name: item.name ?? item.product_name ?? "",
                    category: item.category ?? "",
                    brand: item.brand ?? "",
                    price: Number(item.price ?? 0),
                    stock: Number(item.quantity ?? item.qty ?? item.in_stock ?? item.stock ?? 0),
                    soldThisWeek: Number(item.soldThisWeek ?? item.sold_week ?? sold), // ใช้ของ backend ถ้ามี ไม่งั้นทับด้วย soldMap
                    lastRestocked:
                        item.lastRestocked ?? item.last_restocked ?? item.updated_at ?? item.updatedAt ?? item.restock_date ?? "",
                };
            });
            const finalRows = applyRestockMeta(normalized);
            setProducts(finalRows);

        } catch (err) {
            console.error("fetchStockDataLegacy error:", err);
            setError(err.message || "Failed to load data");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }


    // 2) โหมดใหม่: รวมยอดขายตามช่วงวันฝั่ง FE (ไม่แตะ DB)
    async function fetchStockDataByDate({ fromDate, toDate }) {
        setLoading(true);
        setError(null);
        try {
            // 1) products — ทำฐานสำหรับผูกยอด
            const prodRes = await fetch(apiUrl("/api/products"));
            if (!prodRes.ok) throw new Error(`products failed ${prodRes.status}`);
            const prodRaw = await prodRes.json();

            const baseProducts = prodRaw.map((item) => ({
                id: item.id ?? item.product_id ?? item.productId ?? "",
                name: item.name ?? item.product_name ?? "",
                category: item.category ?? "",
                brand: item.brand ?? "",
                price: Number(item.price ?? 0),
                stock: Number(item.quantity ?? item.qty ?? item.in_stock ?? item.stock ?? 0),
                lastRestocked:
                    item.lastRestocked ?? item.last_restocked ?? item.updated_at ?? item.restock_date ?? "",
                soldThisWeek: 0,
            }));

            // 2) ดึง orders (ไม่ส่ง status เผื่อ backend ไม่รองรับ)
            const listUrl = apiUrl(`/api/orders?from=${fromDate}&to=${toDate}&includeItems=true`);
            const oRes = await fetch(listUrl);
            if (!oRes.ok) throw new Error(`orders failed ${oRes.status}`);
            let orders = await oRes.json();

            // 2.1 hydrate: ถ้า list ไม่มี items → ดึงรายตัว
            const needsHydrate = (o) => !o?.items && !o?.orderItems && !o?.order_items;
            if (Array.isArray(orders) && orders.some(needsHydrate)) {
                const hydrated = await Promise.all(
                    orders.map(async (o) => {
                        if (!needsHydrate(o)) return o;
                        try {
                            const r = await fetch(apiUrl(`/api/orders/${o.id}`), { headers: { Accept: "application/json" } });
                            if (!r.ok) return o;
                            const full = await r.json();
                            // รวมฟิลด์เดิม + ฟิลด์เต็ม
                            return { ...o, ...full };
                        } catch {
                            return o;
                        }
                    })
                );
                orders = hydrated;
            }

            // 3) กรองช่วงวัน + สถานะที่นับเป็น "ขาย" ฝั่ง FE
            const ACCEPTED = new Set(["PREPARING", "READY_TO_SHIP", "SHIPPING", "DELIVERED"]);
            const inRange = (ymd) => ymd && (ymd >= fromDate && ymd <= toDate);

            const soldMap = new Map(); // productId -> qty

            for (const o of orders || []) {
                const orderedYMD = toYMDPlus(
                    o.created_at ?? o.orderedAt ?? o.createdAt ?? o.orderDate ?? o.order_date
                );
                if (!inRange(orderedYMD)) continue;

                const status = (o.order_status ?? o.status ?? o.orderStatus ?? "").toUpperCase();
                if (!ACCEPTED.has(status)) continue;

                const items = o.items ?? o.orderItems ?? o.order_items ?? [];
                for (const it of items) {
                    const pid =
                        it.product_id_fk ??
                        it.productIdFk ??
                        it.productId ??
                        it.product_id ??
                        it.product?.id ??
                        it.product?.product_id ??
                        it.product?.productId;

                    const qty = Number(it.quantity ?? it.qty ?? it.count ?? 0);
                    if (!pid || !qty) continue;

                    const pidKey = isNaN(Number(pid)) ? String(pid) : Number(pid);
                    soldMap.set(pidKey, (soldMap.get(pidKey) || 0) + qty);
                }
            }

            // 4) ผูกยอดกลับเข้ากับสินค้า
            const merged = baseProducts.map((p) => {
                const keyNum = isNaN(Number(p.id)) ? null : Number(p.id);
                const sold = (keyNum != null ? soldMap.get(keyNum) : undefined) ?? soldMap.get(String(p.id)) ?? 0;
                return { ...p, soldThisWeek: Number(sold || 0) };
            });

            const finalRows = applyRestockMeta(merged);
            setProducts(finalRows);

        } catch (err) {
            console.error("fetchStockDataByDate error:", err);
            setError(err.message || "Failed to load data");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }



    // 3) ฟังก์ชันตัวกลาง (คงชื่อเดิม) เรียกตามโหมด
    async function fetchStockData({ fromDate, toDate }) {
        if (mode === "byDate") return fetchStockDataByDate({ fromDate, toDate });
        return fetchStockDataLegacy({ fromDate, toDate });
    }


    // ---------------------------------------------------------------------
    // Load initial
    useEffect(() => {
        fetchStockData({ fromDate: dateFrom, toDate: dateTo });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]); // เปลี่ยนโหมดให้โหลดใหม่อัตโนมัติ

    // ---------------------------------------------------------------------
    // Apply button
    function handleApplyRange() {
        fetchStockData({ fromDate: dateFrom, toDate: dateTo });
    }

    // ---------------------------------------------------------------------
    // Derived metrics
    const visibleProducts = useMemo(() => {
        if (mode === "byDate" && filterSoldOnly) {
            return products.filter(p => Number(p.soldThisWeek || 0) > 0);
        }
        return products;
    }, [products, mode, filterSoldOnly]);

    const metrics = useMemo(() => {
        const src = visibleProducts;       // ใช้ชุดที่ถูกกรองแล้ว
        const lowStockThreshold = 10;

        const totalProducts = src.length;
        const lowStock = src.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;
        const outOfStock = src.filter(p => p.stock === 0).length;

        const totalWeeklySales = src.reduce(
            (acc, p) => acc + (Number(p.soldThisWeek || 0) * Number(p.price || 0)),
            0
        );

        const topSelling = [...src]
            .sort((a, b) => Number(b.soldThisWeek || 0) - Number(a.soldThisWeek || 0))
            .slice(0, 8);

        const maxSold = Math.max(1, ...topSelling.map(p => Number(p.soldThisWeek || 0)));

        const tableRows = [...src].sort((a, b) => {
            if (a.stock === 0 && b.stock !== 0) return -1;
            if (b.stock === 0 && a.stock !== 0) return 1;
            return a.stock - b.stock;
        });

        return { totalProducts, lowStock, outOfStock, totalWeeklySales, topSelling, maxSold, tableRows, lowStockThreshold };
    }, [visibleProducts]);



    // ---------------------------------------------------------------------
    // Week label: ฉลาดตามโหมด
    const weekLabel = useMemo(() => {
        if (mode === "byDate") {
            const fmt = (s) =>
                new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
            return `${fmt(dateFrom)} – ${fmt(dateTo)}`;
        }
        // legacy: แสดงสัปดาห์ปัจจุบัน
        const now = new Date();
        const day = now.getDay(); // 0=Sun
        const diffToMon = (day + 6) % 7; // days since Monday
        const monday = new Date(now);
        monday.setDate(now.getDate() - diffToMon);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const fmt = (d) =>
            d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        return `${fmt(monday)} – ${fmt(sunday)}`;
    }, [mode, dateFrom, dateTo]);

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
            "Sold (Range)",
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
                p.soldThisWeek || 0,
                status,
                p.lastRestocked || "",
            ];
        });
        const csv = [headers, ...rows]
            .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
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
            <div className="header no-print">

                <div>
                    <h1>Weekly Stock Report</h1>
                    <p className="sub">Week: {weekLabel}</p>
                </div>


                <div className="header-actions">
                    {/* Mode toggle */}
                    {/* Mode toggle (horizontal inline with label) */}
                    <div className="mode-toggle inline">
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="mode"
                                value="legacy"
                                checked={mode === "legacy"}
                                onChange={() => setMode("legacy")}
                                disabled={loading}
                            />
                            <span className="label-text" style={{ fontSize: '16px', fontWeight: 500 }}>
                                Total overview
                            </span>
                        </label>

                        <label className="radio-option">
                            <input
                                type="radio"
                                name="mode"
                                value="byDate"
                                checked={mode === "byDate"}
                                onChange={() => setMode("byDate")}
                                disabled={loading}
                            />
                            <span className="label-text" style={{ fontSize: '16px', fontWeight: 500 }}>
                                Date range selected
                            </span>
                        </label>
                    </div>





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

                        <button className="btn inline" onClick={handleApplyRange} disabled={loading}>
                            {loading ? "Loading..." : "Apply"}
                        </button>
                    </div>

                    {/* Export CSV */}
                    <button className="btn" onClick={handleExportCSV} disabled={loading || metrics.tableRows.length === 0}>
                        ⬇ Export CSV
                    </button>

                    {/* Print */}
                    <button className="btn primary" onClick={handlePrint}>
                        🖨 Print
                    </button>
                </div>
            </div>

            {/* HEADER สำหรับตอน Print */}
            <div className="print-header only-print">
                <h1>Weekly performance</h1>
                <p>Week: {weekLabel}</p>
            </div>

            {/* KPI CARDS */}
            <section className="kpi-grid">
                <KpiCard title="Total Products" value={loading ? "…" : metrics.totalProducts} />
                <KpiCard title="Low Stock Items" value={loading ? "…" : metrics.lowStock} tone="warn" />
                <KpiCard title="Out of Stock" value={loading ? "…" : metrics.outOfStock} tone="danger" />
                <KpiCard
                    title={mode === "byDate" ? "Total Sales (Range)" : "Total Sales (All-time)"}
                    value={loading ? "…" : `฿${metrics.totalWeeklySales.toLocaleString()}`}
                    tone="success"
                />

            </section>

            {/* ERROR BANNER */}
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

            {/* TABLE สำหรับ “หน้าจอ” */}
            <section className="card table-wrap no-print">
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
                    <div className="thead">
                        <div>Product</div>
                        <div>Product ID</div>
                        <div>Category</div>
                        <div>Brand</div>
                        <div className="num">Price</div>
                        <div className="num">In Stock</div>
                        <div>Status</div>
                        <div className="num">Sold (Range)</div>
                        <div>Last Restocked</div>
                        <div style={{ textAlign: "center" }}>Actions</div>
                    </div>

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
                                <div className="cell name">{p.name}</div>
                                <div className="cell">{p.id}</div>
                                <div className="cell">{p.category}</div>
                                <div className="cell">{p.brand}</div>
                                <div className="cell num">฿{Number(p.price || 0).toFixed(2)}</div>
                                <div className="cell num">{p.stock}</div>
                                <div className="cell">
                                    <span className={pillClass}>{status}</span>
                                </div>
                                <div className="cell num">{p.soldThisWeek || 0}</div>
                                <div className="cell">{fmtDateYMD(p.lastRestocked)}</div>
                                <div className="cell actions-cell">
                                    <button
                                        className="btn-edit-inline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/admin/products/${p.id}/edit`);
                                        }}
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* TABLE สำหรับ “Print เท่านั้น” */}
            <section className="card table-wrap only-print">
                <h3>Stock Details</h3>
                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Product ID</th>
                            <th>Category</th>
                            <th>Brand</th>
                            <th>Price</th>
                            <th>In Stock</th>
                            <th>Status</th>
                            <th>Sold (Range)</th>
                            <th>Last Restocked</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metrics.tableRows.map((p) => {
                            const status =
                                p.stock === 0
                                    ? "Out of Stock"
                                    : p.stock <= metrics.lowStockThreshold
                                        ? "Low Stock"
                                        : "In Stock";
                            return (
                                <tr key={`print-${p.id}-${p.name}`}>
                                    <td>{p.name}</td>
                                    <td>{p.id}</td>
                                    <td>{p.category}</td>
                                    <td>{p.brand}</td>
                                    <td className="num">฿{Number(p.price || 0).toFixed(2)}</td>
                                    <td className="num">{p.stock}</td>
                                    <td>{status}</td>
                                    <td className="num">{p.soldThisWeek || 0}</td>
                                    <td>{fmtDateYMD(p.lastRestocked)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
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
