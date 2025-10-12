// CartPage.jsx
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";

import "../components/header.css";              // สไตล์ของ Header
import "./CartPage.css";
import "./breadcrumb.css";
import Footer from "../components/footer";

// Remove this incomplete CartPage component and keep only the main one below

const LS_KEY = "pm_cart";
// ใช้ locale ให้ถูกต้อง
const THB = (n) =>
  (n ?? 0).toLocaleString("th-TH", { style: "currency", currency: "THB" });

/* ===== Breadcrumb (แก้ให้เหมือนหน้า Place: ใช้ isLast) ===== */
function Breadcrumb({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav className="pm-breadcrumb" aria-label="Breadcrumb">
      {items.map((it, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="pm-breadcrumb__item">
            {isLast ? (
              <span className="current">{it.label}</span>
            ) : (
              <a href={it.href || "#"}>{it.label}</a>
            )}
            {!isLast && <span className="divider">›</span>}
          </span>
        );
      })}
    </nav>
  );
}

export default function CartPage() {
  const defaultCart = useMemo(
    () => [
      { id: 2, name: "MK Suki Sauce", price: 119, qty: 1, img: "/assets/products/p2.png" },
      { id: 3, name: "Coconut", price: 25, qty: 4, img: "/assets/products/p3.png" },
    ],
    []
  );

  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      return Array.isArray(saved) && saved.length ? saved : defaultCart;
    } catch {
      return defaultCart;
    }
  });

  const subtotal = useMemo(
    () => cart.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0),
    [cart]
  );
  const discount = 0;
  const grand = Math.max(0, subtotal - discount);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(cart));
  }, [cart]);

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, (it.qty || 1) + delta) } : it
      )
    );
  };
  const removeItem = (id) => setCart((prev) => prev.filter((it) => it.id !== id));
  const handleGoCheckout = () => localStorage.setItem(LS_KEY, JSON.stringify(cart));

  return (
    <>
      {/* Header เหมือนหน้า Place */}
      <Header />

      <main className="cart-page container cart-container">
        <Breadcrumb items={[{ label: "Home", href: "/home" }, { label: "Cart" }]} />

        <div className="title-row">
          <h1 className="title">Shopping Cart</h1>
          <a className="back-top-link" href="/home">← Continue shopping</a>
        </div>

        {cart.length === 0 ? (
          <div id="emptyState" className="empty">
            <p>Your cart is empty.</p>
            <a className="btn btn-primary" href="/home">Browse products</a>
          </div>
        ) : (
          <div className="cart-grid">
            <section className="cart-list">
              <div id="cartList">
                {cart.map((item) => {
                  const total = (item.price || 0) * (item.qty || 1);
                  return (
                    <article className="cart-item" key={item.id}>
                      <img src={item.img} alt={item.name} />
                      <div>
                        <p className="cart-item__name">{item.name}</p>
                        <p className="cart-item__meta">{THB(item.price)} / each</p>
                        <div className="qty" role="group" aria-label="Quantity">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => updateQty(item.id, -1)}
                          >
                            −
                          </button>
                          <span aria-live="polite">{item.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() => updateQty(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="remove"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeItem(item.id)}
                        >
                          ✕ Remove
                        </button>
                      </div>
                      <div className="price-box">
                        <p className="line">{THB(total)}</p>
                        <span className="unit">{THB(item.price)} each</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="card summary-card">
              <h2 className="section-title">Order summary</h2>
              <div className="totals">
                <div className="line">
                  <span>Item(s) total</span>
                  <span id="itemsTotal">{THB(subtotal)}</span>
                </div>
                <div className="line">
                  <span>Discount</span>
                  <span id="discount">−{THB(discount)}</span>
                </div>
                <div className="line total">
                  <span>Total</span>
                  <span id="grandTotal" className="price">{THB(grand)}</span>
                </div>
              </div>
              <div className="actions">
                <a
                  className="btn btn-primary"
                  id="goCheckout"
                  href="/place-order"
                  onClick={handleGoCheckout}
                >
                  Proceed to Checkout
                </a>
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}