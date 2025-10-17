import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminOrderListPage.css";

export default function AdminOrderListPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // ✅ mock data (แทนการ fetch)
    const mockOrders = [
        {
            id: 1,
            productId: "ORD001",
            name: "รสดีชิคเก้น ปรุงรสไก่ชุบทอด 90 กรัม",
            price: 391.0,
            category: 3,
            brand: "Preparing",
            quantity: 3,
        },
        {
            id: 2,
            productId: "ORD002",
            name: "คุกกี้เนยอบกรอบ 1 กล่อง",
            price: 480.0,
            category: 2,
            brand: "Shipping",
            quantity: 2,
        },
        {
            id: 3,
            productId: "ORD003",
            name: "ปลากระป๋อง 3 กระป๋อง",
            price: 90.0,
            category: 1,
            brand: "Delivered",
            quantity: 1,
        },
        {
            id: 4,
            productId: "ORD004",
            name: "ข้าวหอมมะลิใหม่ 100% 5 กก.",
            price: 330.0,
            category: 1,
            brand: "Preparing",
            quantity: 2,
        },
        {
            id: 5,
            productId: "ORD005",
            name: "น้ำปลาแท้ตราปลาหมึก 700 มล.",
            price: 62.0,
            category: 1,
            brand: "Delivered",
            quantity: 2,
        },
        {
            id: 6,
            productId: "ORD006",
            name: "แป้งทอดกรอบตราว่าว 500 กรัม",
            price: 45.0,
            category: 3,
            brand: "Cancelled",
            quantity: 1,
        },
        {
            id: 7,
            productId: "ORD007",
            name: "บะหมี่กึ่งสำเร็จรูป รสต้มยำกุ้ง 10 ซอง",
            price: 120.0,
            category: 2,
            brand: "Ready to Ship",
            quantity: 1,
        },
        {
            id: 8,
            productId: "ORD008",
            name: "ขนมปังแผ่นโฮลวีต 1 แพ็ค",
            price: 65.0,
            category: 2,
            brand: "Pending",
            quantity: 4,
        },
        {
            id: 9,
            productId: "ORD009",
            name: "นม UHT รสจืด 6 กล่อง",
            price: 180.0,
            category: 1,
            brand: "Shipping",
            quantity: 2,
        },
        {
            id: 10,
            productId: "ORD010",
            name: "ผงกาแฟสำเร็จรูป 3-in-1 20 ซอง",
            price: 199.0,
            category: 3,
            brand: "Preparing",
            quantity: 1,
        }
    ];

    useEffect(() => {
        // 模拟 fetch delay
        setTimeout(() => {
            setItems(mockOrders);
            setLoading(false);
        }, 500);
    }, []);

    // ---------- helpers ----------
    const showProductId = (val) => {
        const s = (val ?? "").toString();
        if (s.startsWith("#")) return s;
        const padded = String(s).replace(/\D/g, "");
        return "#" + padded.padStart(5, "0");
    };
    const getKey = (p) => p.id ?? p.productId;

    // ✅ เปลี่ยนเฉพาะ path ให้ไปหน้า detail
    const getEditPath = (p) => `/admin/orders/${encodeURIComponent(p.id)}`;

    const toInt = (v) => {
        const n = parseInt(String(v ?? "").replace(/[^\d-]/g, ""), 10);
        return Number.isFinite(n) ? n : 0;
    };
    const isInStock = (p) => toInt(p.quantity) > 0;
    const stockLabelOf = (p) => (isInStock(p) ? "In Stock" : "Out of stock");
    const stockStyleOf = (p) =>
        isInStock(p)
            ? {
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: 12,
                lineHeight: 1,
                border: "1px solid #a7f3d0",
                background: "#ecfdf5",
                color: "#065f46",
            }
            : {
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: 12,
                lineHeight: 1,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#7f1d1d",
            };

    // ---------- DELETE ----------
    async function handleDelete(p) {
        alert(`(Mock) Delete order id=${p.id}`);
        setItems((prev) => prev.filter((x) => x.id !== p.id));
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
                                <select defaultValue="name" aria-label="Search by">
                                    <option value="name">Product</option>
                                    <option value="productId">Order ID</option>
                                    <option value="category">Status</option>
                                    {/*<option value="stock">Stock</option>*/}
                                </select>
                                <input type="text" placeholder="ค้นหาชื่อสินค้า…" />
                            </div>
                            <Link to="/admin/products/new" className="btn-add">
                <span className="box">
                  <i className="fa-solid fa-plus" />
                </span>
                                ADD NEW
                            </Link>
                        </div>
                    </div>

                    <div className="table-card">
                        <div className="table-header">
                            <div>Product Name</div>
                            <div>Order ID</div>
                            <div>Price</div>
                            <div>Quantity</div>
                            <div>Status</div>
                            {/*<div>Tracking</div>*/}
                            <div></div>
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
                                    data-product-id={p.productId}
                                    data-name={p.name}
                                    data-category={p.category}
                                    data-brand={p.brand}
                                    data-quantity={p.quantity}
                                >
                                    <div className="prod">
                    <span className="cube">
                      <i className="fa-solid fa-cube" />
                    </span>{" "}
                                        {p.name}
                                    </div>
                                    <div>{showProductId(p.productId)}</div>
                                    <div>{Number(p.price ?? 0).toFixed(2)}</div>
                                    <div>{p.quantity}</div>
                                    <div>{p.brand ?? "-"}</div>
                                    {/*<div>{p.quantity ?? 0}</div>*/}
                                    <div></div>
                                    {/*<div>*/}
                                    {/*    <span style={stockStyleOf(p)}>{stockLabelOf(p)}</span>*/}
                                    {/*</div>*/}
                                    <div className="act">
                                        {/* ✅ ปุ่ม Edit ไปหน้า Detail */}
                                        <Link
                                            to={getEditPath(p)}
                                            aria-label="Edit product"
                                            title="Edit"
                                        >
                                            <i className="fa-solid fa-pen" />
                                        </Link>
                                        <button
                                            type="button"
                                            aria-label="Delete product"
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
