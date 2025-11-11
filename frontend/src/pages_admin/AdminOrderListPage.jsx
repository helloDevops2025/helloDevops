import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminOrderListPage.css";

export default function AdminOrderListPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

    // ✅ ดึงข้อมูล order ทั้งหมดจาก backend
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch("${API_URL}/api/orders");
                if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้");
                const data = await res.json();
                setItems(data);
            } catch (error) {
                setErr(error.message);
            } finally {
                setLoading(false);
            }
        };
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
        return code.startsWith("#") ? code : `#${code}`;
    };
    const getKey = (p) => p.id ?? p.orderCode;
    const getEditPath = (p) => `/admin/orders/${encodeURIComponent(p.id)}`;

    // ---------- DELETE ----------
    async function handleDelete(p) {
        if (!window.confirm(`ต้องการลบคำสั่งซื้อ #${p.orderCode} ใช่ไหม?`)) return;
        try {
            const res = await fetch(`http://localhost:8080/api/orders/${p.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("ลบคำสั่งซื้อไม่สำเร็จ");
            setItems((prev) => prev.filter((x) => x.id !== p.id));
            alert("✅ ลบคำสั่งซื้อสำเร็จแล้ว");
        } catch (error) {
            alert("❌ " + error.message);
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
                                <input type="text" placeholder="ค้นหาคำสั่งซื้อ…" />
                            </div>
                        </div>
                    </div>

                    <div className="table-card">
                        <div className="table-header">
                            <div>Order Code</div>
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
                                    <div>{p.customerName ?? "-"}</div>
                                    <div>{p.customerPhone ?? "-"}</div>
                                    <div>{p.shippingAddress ?? "-"}</div>
                                    <div>{Number(p.totalAmount ?? 0).toFixed(2)}</div>
                                    <div>{p.orderStatus ?? "-"}</div>

                                    <div className="act">
                                        {/* ✅ ปุ่ม Edit ไปหน้า Detail */}
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
                                            onClick={() => handleDelete(p)}
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
        </div>
    );
}
