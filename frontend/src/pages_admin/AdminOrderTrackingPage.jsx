import { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ เพิ่ม useNavigate
import "./AdminOrderTrackingPage.css";

export default function AdminOrderTrackingPage() {
    const navigate = useNavigate(); // ✅ สร้าง navigate object

    useEffect(() => {
        // dropdown toggle (click + keyboard)
        const toggles = document.querySelectorAll(".nav-toggle");
        toggles.forEach((toggle) => {
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

        // sidebar collapse via hamburger
        const sidebar = document.querySelector(".sidebar");
        const menuBtn = document.querySelector(".menu-btn");

        if (localStorage.getItem("sb-collapsed") === "1") {
            sidebar?.classList.add("collapsed");
        }

        const toggleSidebar = () => {
            sidebar?.classList.toggle("collapsed");
            localStorage.setItem("sb-collapsed", sidebar?.classList.contains("collapsed") ? "1" : "0");
        };

        menuBtn?.addEventListener("click", toggleSidebar);
        menuBtn?.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleSidebar();
            }
        });

        // update progress
        const updateProgress = () => {
            const steps = document.querySelectorAll(".step");
            const doneSteps = document.querySelectorAll(".step.done").length;
            const totalSteps = steps.length;

            let percent = 0;
            if (doneSteps > 0) {
                if (doneSteps === 1) percent = 12.5;
                else if (doneSteps === 2) percent = 37.5;
                else if (doneSteps === 3) percent = 62.5;
                else if (doneSteps === 4) percent = 100;
            }
            const line = document.querySelector(".line-fill");
            if (line) line.style.width = percent + "%";
        };

        updateProgress();
    }, []);

    return (
        <div className="admin-order-tracking">
            {/* Main Content */}
            <main className="content">
                <header className="header">
                    <div>
                        <h1>ORDER TRACKING</h1>
                    </div>
                </header>

                {/* Detail / Timeline */}
                <div className="detail">
                    <section className="card">
                        <h1 className="card-title">Detail</h1>

                        <div className="progress">
                            <div className="progress-line">
                                <span className="line-fill" style={{ width: "20%" }}></span>
                            </div>

                            <div className="steps">
                                <div className="step done">
                                    <div className="dot" aria-hidden="true"></div>
                                    <div className="step-label">
                                        <strong>Preparing</strong>
                                        <small className="cancelled">Canceled 05:43 AM</small>
                                    </div>
                                </div>

                                <div className="step cancel">
                                    <div className="dot"></div>
                                    <div className="step-label">
                                        <strong>Ready to Ship</strong>
                                        <small className="muted">Inactive</small>
                                    </div>
                                </div>

                                <div className="step cancel">
                                    <div className="dot"></div>
                                    <div className="step-label">
                                        <strong>Shipping</strong>
                                        <small className="muted">Inactive</small>
                                    </div>
                                </div>

                                <div className="step cancel">
                                    <div className="dot"></div>
                                    <div className="step-label">
                                        <strong>Delivered</strong>
                                        <small className="muted">Inactive</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Product Card */}
                    <section className="card product-card">
                        <div className="product-media">
                            <img src="/assets/products/p1.png" alt="Cookie 9" />
                        </div>

                        <div className="product-info">
                            <h2>รสดีชิคเก้น ปรุงรสไก่ชุบทอด 90 กรัม</h2>
                            <div className="kv-list">
                                <div className="kv">
                                    <span>Order ID</span>
                                    <span>#10023</span>
                                </div>
                                <div className="kv">
                                    <span>Brand</span>
                                    <span>20 Nov 2023</span>
                                </div>
                                <div className="kv">
                                    <span>Order Placed</span>
                                    <span>20 Nov 2023</span>
                                </div>
                                <div className="kv">
                                    <span>Quantity</span>
                                    <span>1</span>
                                </div>
                            </div>
                            <div>
                                {/* ✅ เมื่อคลิกจะไปหน้า Order Detail */}
                                <button
                                    className="btn view-btn"
                                    onClick={() => navigate("/admin/orders/1")}
                                >
                                    View Order
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
