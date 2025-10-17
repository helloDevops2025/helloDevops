import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./AdminOrderDetailPage.css";
import "../components/AdminSidebar";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function AdminOrderDetailPage() {
    const navigate = useNavigate();

    // 🧩 Mock Data (ใช้ useState เพื่อให้แก้ค่าได้)
    const [order, setOrder] = useState({
        id: 10023,
        date: "20 May 2025",
        customerName: "Pim Peace",
        totalAmount: 391.0,
        shippingCost: 60.0,
        shippingAddress: "999 Road, District, Bangkok, Thailand 10110, 0812345678",
        orderStatus: "Pending",
        items: [
            { productName: "ข้าวหอมมะลิ 5กก.", price: 165.0, quantity: 2, total: 330.0 },
            { productName: "น้ำปลาแท้ตราปลาหมึก 700มล.", price: 31.0, quantity: 1, total: 31.0 },
            { productName: "เกลือเสริมไอโอดีน 500กรัม", price: 30.0, quantity: 1, total: 30.0 },
        ],
    });

    // 🧠 Calculate subtotal
    const subtotal = order.items.reduce((sum, i) => sum + i.total, 0);

    // ✅ ฟังก์ชันเปลี่ยนสถานะออเดอร์
    const handleChangeStatus = () => {
        const select = document.getElementById("statusSelect");
        const newStatus = select?.value;

        if (!newStatus) {
            alert("กรุณาเลือกสถานะก่อนเปลี่ยน");
            return;
        }

        // อัปเดตสถานะใน state
        setOrder((prev) => ({
            ...prev,
            orderStatus: newStatus,
        }));

        // alert(`✅ เปลี่ยนสถานะคำสั่งซื้อเป็น "${newStatus}" แล้ว`);
    };

    useEffect(() => {
        // sidebar behavior (ตามโค้ดเดิมทั้งหมด)
        document.querySelectorAll(".nav-toggle").forEach((toggle) => {
            const handler = () => {
                const panel = document.querySelector(toggle.dataset.target);
                if (!panel) return;
                const expanded = toggle.getAttribute("aria-expanded") === "true";
                toggle.setAttribute("aria-expanded", String(!expanded));
                panel.style.display = expanded ? "none" : "block";
                const chev = toggle.querySelector(".right i");
                if (chev) chev.style.transform = expanded ? "rotate(0deg)" : "rotate(180deg)";
            };
            toggle.addEventListener("click", handler);
            toggle.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handler();
                }
            });
        });

        const sidebar = document.querySelector(".sidebar");
        const menuBtn = document.querySelector(".menu-btn");
        if (localStorage.getItem("sb-collapsed") === "1") {
            sidebar?.classList.add("collapsed");
        }
        const toggleSidebar = () => {
            sidebar?.classList.toggle("collapsed");
            localStorage.setItem("sb-collapsed", sidebar?.classList.contains("collapsed") ? "1" : "0");
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

    return (
        <div className="admin-order-detail-page">
            <main className="content">
                <header className="header">
                    <h1>ORDER DETAIL</h1>
                </header>

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
                            <p>Date :</p>
                            <span>{order.date}</span>
                        </div>
                        <div className="info">
                            <p><b>Total :</b></p>
                            <span><b>฿{order.totalAmount.toFixed(2)}</b></span>
                        </div>
                    </div>

                    <div className="card-top">
                        <div className="total-head">
                            <h3>Cart Total</h3>
                            <h3>Price</h3>
                        </div>
                        <div className="info">
                            <p>Subtotal :</p>
                            <span>{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="info">
                            <p>Shipping :</p>
                            <span>{order.shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="info">
                            <p><b>Total price :</b></p>
                            <span><b>{order.totalAmount.toFixed(2)}</b></span>
                        </div>
                    </div>
                </section>

                <section className="order-items">
                    <div className="order">
                        <h3 className="order-head">All Items in Order</h3>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                </tr>
                                </thead>
                                <tbody>
                                {order.items.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.productName}</td>
                                        <td>{item.price.toFixed(2)}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <aside className="right-panel">
                    <div className="card">
                        <div className="info-card">
                            <h3>Shipping Address</h3>
                            <p id="Address">{order.shippingAddress}</p>
                        </div>
                    </div>

                    <div className="card">
                        <div className="status-card">
                            <div className="status-text">
                                <h3>Edit Status</h3>
                                {/* ✅ แสดงสถานะล่าสุด */}
                                <p>{order.orderStatus}</p>
                            </div>
                            <div className="status">
                                <div className="selection-wrapper">
                                    <select className="selection" id="statusSelect" defaultValue="">
                                        <option value="" disabled>status</option>
                                        <option>Pending</option>
                                        <option>Preparing</option>
                                        <option>Ready to Ship</option>
                                        <option>Shipping</option>
                                        <option>Delivered</option>
                                        <option>Cancelled</option>
                                    </select>
                                </div>
                                {/* ✅ เมื่อกดจะอัปเดตสถานะ */}
                                <button className="change" onClick={handleChangeStatus}>Change</button>
                            </div>
                        </div>
                    </div>

                    <div className="tracking">
                        <div className="tracking-text">
                            <h2>Status Timeline</h2>
                            <button className="tracking-btn" onClick={() => navigate("/admin/orders/tracking")}>
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
