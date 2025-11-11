
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Header from "../components/header";

import "../components/header.css";
import "./CartPage.css";
import "./breadcrumb.css";

import Footer from "./../components/Footer.jsx";


const LS_CART = "pm_cart";

function loadCart() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_CART) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function saveCart(arr) {
  localStorage.setItem(LS_CART, JSON.stringify(arr || []));
}

const norm = (v) => String(v ?? "").trim();
const makeKey = (o) =>
  `${norm(o.productId ?? o.id ?? o.product_id)}::${norm(
    o.variantId ?? o.variant ?? o.sku ?? ""
  )}`;

/* Hook จัดการตะกร้า: ใช้ได้เฉพาะหน้านี้ */
function useCart() {
  const [items, setItems] = useState(() => loadCart());

  // sync เมื่อมีการแก้ไขจากแท็บอื่น
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key || e.key === LS_CART) setItems(loadCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setQty = useCallback((keyObj, qty) => {
    const q = Math.max(0, Number(qty) || 0);
    const next = loadCart()
      .map((x) => (makeKey(x) === makeKey(keyObj) ? { ...x, qty: q } : x))
      .filter((x) => (x.qty || 0) > 0);
    saveCart(next);
    setItems(next);
  }, []);

  const removeItem = useCallback((keyObj) => {
    const next = loadCart().filter((x) => makeKey(x) !== makeKey(keyObj));
    saveCart(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    saveCart([]);
    setItems([]);
  }, []);

  const totalQty = useMemo(
    () => items.reduce((s, x) => s + (Number(x.qty) || 0), 0),
    [items]
  );
  const totalPrice = useMemo(
    () =>
      items.reduce(
        (s, x) => s + (Number(x.qty) || 0) * (Number(x.price) || 0),
        0
      ),
    [items]
  );

  return { items, setQty, removeItem, clear, totalQty, totalPrice };
}

/*  Formatter  */
const THB = (n) =>
  (Number(n) || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
  });

/*  Breadcrumb  */
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
  const { items, setQty, removeItem, clear, totalQty, totalPrice } = useCart();

  // map ให้ฟิลด์ที่มาจากหลายหน้าเป็นรูปแบบเดียวกัน
  const rows = useMemo(
    () =>
      items.map((x) => {
        const productId = x.productId ?? x.id ?? x.product_id;
        const variantId = x.variantId ?? x.variant ?? x.sku ?? "";
        const title = x.title ?? x.name ?? x.productName ?? `#${productId}`;
        const image =
          x.image ||
          x.img ||
          x.cover ||
          x.coverImageUrl ||
          x.imageUrl ||
          x.image_url ||
          "/assets/products/placeholder.png";
        const price = Number(x.price) || 0;
        const qty = Math.max(1, Number(x.qty) || 1);
        return {
          key: `${productId}::${variantId}`,
          productId,
          variantId,
          title,
          image,
          price,
          qty,
        };
      }),
    [items]
  );

  return (
    <>
      <Header />

      <main className="cart-page container cart-container">
        <Breadcrumb
          items={[{ label: "Home", href: "/home" }, { label: "Cart" }]}
        />

        <div className="title-row">
          <h1 className="title">Shopping Cart</h1>
          <a className="back-top-link" href="/home">
            ← Continue shopping
          </a>
        </div>

        {rows.length === 0 ? (
          <div id="emptyState" className="empty">
            <p>Your cart is empty.</p>
            <a className="btn btn-primary" href="/home">
              Browse products
            </a>
          </div>
        ) : (
          <div className="cart-grid">
            <section className="cart-list">
              <div id="cartList">
                {rows.map((it) => {
                  const total = (it.price || 0) * (it.qty || 1);
                  return (
                    <article className="cart-item" key={it.key}>
                      <img src={it.image} alt={it.title} />
                      <div>
                        <p className="cart-item__name">{it.title}</p>
                        <p className="cart-item__meta">{THB(it.price)} / each</p>
                        <div className="qty" role="group" aria-label="Quantity">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() =>
                              setQty(
                                { productId: it.productId, variantId: it.variantId },
                                (it.qty || 1) - 1
                              )
                            }
                          >
                            −
                          </button>
                          <span aria-live="polite">{it.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() =>
                              setQty(
                                { productId: it.productId, variantId: it.variantId },
                                (it.qty || 1) + 1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="remove"
                          aria-label={`Remove ${it.title}`}
                          onClick={() =>
                            removeItem({
                              productId: it.productId,
                              variantId: it.variantId,
                            })
                          }
                        >
                          ✕ Remove
                        </button>
                      </div>
                      <div className="price-box">
                        <p className="line">{THB(total)}</p>
                        <span className="unit">{THB(it.price)} each</span>
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
                  <span>Items</span>
                  <span>{totalQty}</span>
                </div>
                <div className="line total">
                  <span>Grand Total</span>
                  <span id="grandTotal" className="price">
                    {THB(totalPrice)}
                  </span>
                </div>
              </div>
              <div className="actions">
                <a className="btn btn-primary" id="goCheckout" href="/place-order">
                  Proceed to Checkout
                </a>
                <button className="btn btn-outline" onClick={clear} type="button">
                  Clear Cart
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
