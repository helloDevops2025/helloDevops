import React, { useEffect, useMemo, useState, useCallback } from "react";
import Header from "../components/header";
import "../components/header.css";
import "./CartPage.css";
import "./breadcrumb.css";
import Footer from "./../components/Footer.jsx";

const LS_CART = "pm_cart";
const LS_REORDER = "pm_reorder";

// เก็บรายการที่ผู้ใช้เลือกไว้
const LS_PICK = "pm_cart_pick";
// เก็บ snapshot สินค้าที่เลือกไว้เวลาจะไป checkout
const LS_CHECKOUT = "pm_checkout_selection";

const norm = (v) => String(v ?? "").trim();
const makeKey = (o) =>
  `${norm(o.productId ?? o.id ?? o.product_id)}::${norm(
    o.variantId ?? o.variant ?? o.sku ?? ""
  )}`;

function loadJSON(key, fallback = []) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    if (Array.isArray(fallback)) return Array.isArray(v) ? v : fallback;
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Hook: main cart
function useCart() {
  const [items, setItems] = useState(() => loadJSON(LS_CART, []));

  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key || e.key === LS_CART) setItems(loadJSON(LS_CART, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setQty = useCallback((keyObj, qty) => {
    const q = Math.max(0, Number(qty) || 0);
    const next = loadJSON(LS_CART, [])
      .map((x) => (makeKey(x) === makeKey(keyObj) ? { ...x, qty: q } : x))
      .filter((x) => (x.qty || 0) > 0);
    saveJSON(LS_CART, next);
    setItems(next);
  }, []);

  const removeItem = useCallback((keyObj) => {
    const key = makeKey(keyObj);
    const next = loadJSON(LS_CART, []).filter((x) => makeKey(x) !== key);
    saveJSON(LS_CART, next);
    setItems(next);

    // ลบออกจาก selection ด้วย
    const pick = new Set(loadJSON(LS_PICK, []));
    if (pick.has(key)) {
      pick.delete(key);
      saveJSON(LS_PICK, Array.from(pick));
    }
  }, []);

  const clear = useCallback(() => {
    saveJSON(LS_CART, []);
    setItems([]);
    saveJSON(LS_PICK, []);
  }, []);

  return { items, setQty, removeItem, clear, setItems };
}

// Hook: reorder tray
function useReorder() {
  const [reorder, setReorder] = useState(() => loadJSON(LS_REORDER, []));
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key || e.key === LS_REORDER) setReorder(loadJSON(LS_REORDER, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const clearReorder = useCallback(() => {
    saveJSON(LS_REORDER, []);
    setReorder([]);
  }, []);
  return { reorder, setReorder, clearReorder };
}

// Hook: pick/selection สำหรับเลือกจ่าย
function usePick(keys) {
  const [pick, setPick] = useState(() => new Set(loadJSON(LS_PICK, [])));

  // sync ให้ selection มีเฉพาะ keys ที่ยังอยู่ในตะกร้า
  useEffect(() => {
    const kset = new Set(keys);
    const next = new Set();
    // ถ้าไม่มี pick ใน storage ให้ default = เลือกทั้งหมด
    const fromStorage = new Set(loadJSON(LS_PICK, []));
    const base = fromStorage.size ? fromStorage : new Set(keys);
    for (const k of base) if (kset.has(k)) next.add(k);
    setPick(next);
    saveJSON(LS_PICK, Array.from(next));
  }, [keys.join("|")]);

  const toggle = useCallback((key) => {
    setPick((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveJSON(LS_PICK, Array.from(next));
      return next;
    });
  }, []);

  const setAll = useCallback((on) => {
    const next = on ? Array.from(keys) : [];
    setPick(new Set(next));
    saveJSON(LS_PICK, next);
  }, [keys]);

  const isAll = pick.size > 0 && pick.size === keys.length;
  const isNone = pick.size === 0;

  return { pick, toggle, setAll, isAll, isNone };
}

//  Formatter
const THB = (n) =>
  (Number(n) || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
  });

// Breadcrumb
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
  const { items, setQty, removeItem, clear, setItems } = useCart();
  const { reorder, clearReorder, setReorder } = useReorder();

  // map ให้ฟิลด์ที่มาจากหลายหน้าเป็นรูปแบบเดียวกัน
  const rows = useMemo(
    () =>
      (items || []).map((x) => {
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

  //  Pick/Selection
  const allKeys = useMemo(() => rows.map((r) => r.key), [rows]);
  const { pick, toggle, setAll, isAll, isNone } = usePick(allKeys);

  const pickedRows = useMemo(() => rows.filter((r) => pick.has(r.key)), [rows, pick]);
  const pickedQty = useMemo(
    () => pickedRows.reduce((s, x) => s + (Number(x.qty) || 0), 0),
    [pickedRows]
  );
  const pickedTotal = useMemo(
    () => pickedRows.reduce((s, x) => s + (Number(x.qty) || 0) * (Number(x.price) || 0), 0),
    [pickedRows]
  );

  // แปลง reorder สำหรับแสดง
  const reorderRows = useMemo(
    () =>
      (reorder || []).map((x) => {
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
    [reorder]
  );

  const reorderTotalQty = useMemo(
    () => reorderRows.reduce((s, x) => s + (Number(x.qty) || 0), 0),
    [reorderRows]
  );
  const reorderTotalPrice = useMemo(
    () =>
      reorderRows.reduce(
        (s, x) => s + (Number(x.qty) || 0) * (Number(x.price) || 0),
        0
      ),
    [reorderRows]
  );

  // รวม reorder เข้า cart (merge โดย key productId::variantId)
  const mergeReorderIntoCart = useCallback(() => {
    const base = loadJSON(LS_CART, []);
    const next = [...base];
    for (const r of reorderRows) {
      const key = `${r.productId}::${r.variantId}`;
      const idx = next.findIndex((x) => makeKey(x) === key);
      if (idx >= 0) {
        next[idx] = { ...next[idx], qty: (Number(next[idx].qty) || 0) + (Number(r.qty) || 0) };
      } else {
        next.push({
          productId: r.productId,
          variantId: r.variantId,
          title: r.title,
          price: r.price,
          qty: r.qty,
          img: r.image,
        });
      }
    }
    saveJSON(LS_CART, next);
    setItems(next);
    clearReorder();

    // เมื่อมีของใหม่ เข้าตะกร้า -> เลือกเพิ่มอัตโนมัติ
    const newKeys = next.map((x) => makeKey(x));
    saveJSON(LS_PICK, newKeys);
  }, [reorderRows, setItems, clearReorder]);

  // ปรับจำนวนในถาดชั่วคราว
  const setReorderQty = useCallback((keyObj, qty) => {
    const q = Math.max(0, Number(qty) || 0);
    const next = (loadJSON(LS_REORDER, []) || [])
      .map((x) => (makeKey(x) === makeKey(keyObj) ? { ...x, qty: q } : x))
      .filter((x) => (x.qty || 0) > 0);
    saveJSON(LS_REORDER, next);
    setReorder(next);
  }, [setReorder]);

  const removeReorderItem = useCallback((keyObj) => {
    const next = (loadJSON(LS_REORDER, []) || []).filter((x) => makeKey(x) !== makeKey(keyObj));
    saveJSON(LS_REORDER, next);
    setReorder(next);
  }, [setReorder]);

  const handleCheckout = useCallback(() => {
    if (isNone) return;
    // เก็บเฉพาะสินค้าที่เลือกไว้ใน storage เผื่อหน้า /place-order ใช้
    const payload = {
      items: pickedRows.map((r) => ({
        productId: r.productId,
        variantId: r.variantId,
        title: r.title,
        image: r.image,
        price: r.price,
        qty: r.qty,
        key: r.key,
      })),
      totalQty: pickedQty,
      totalPrice: pickedTotal,
      ts: Date.now(),
    };
    saveJSON(LS_CHECKOUT, payload);
    // ไปหน้า place-order
    window.location.href = "/place-order";
  }, [isNone, pickedRows, pickedQty, pickedTotal]);

  return (
    <>
      <Header />

      <main className="cart-page container cart-container">
        <Breadcrumb items={[{ label: "Home", href: "/home" }, { label: "Cart" }]} />

        <div className="title-row">
          <h1 className="title">Shopping Cart</h1>
          <a className="back-top-link" href="/home">
            ← Continue shopping
          </a>
        </div>

        {/*  Reorder Panel (separate list)  */}
        {reorderRows.length > 0 && (
          <section className="card summary-card" style={{ marginBottom: 24 }}>
            <h2 className="section-title">Buy Again</h2>
            <p className="muted" style={{ marginTop: -8 }}>
              These items were selected from your Order History. They are separate from your cart until you add them.
            </p>

            <div className="cart-list" style={{ paddingTop: 8 }}>
              {reorderRows.map((it) => {
                const total = (it.price || 0) * (it.qty || 1);
                return (
                  <article className="cart-item" key={`reorder-${it.key}`}>
                    <img src={it.image} alt={it.title} />
                    <div>
                      <p className="cart-item__name">{it.title}</p>
                      <p className="cart-item__meta">{THB(it.price)} / each</p>
                      <div className="qty" role="group" aria-label="Quantity">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() =>
                            setReorderQty(
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
                            setReorderQty(
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
                          removeReorderItem({
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

            <div className="totals" style={{ marginTop: 12 }}>
              <div className="line">
                <span>Items</span>
                <span>{reorderTotalQty}</span>
              </div>
              <div className="line total">
                <span>Subtotal</span>
                <span className="price">{THB(reorderTotalPrice)}</span>
              </div>
            </div>

            <div className="reorder-actions">
              <button className="btn btn-primary" type="button" onClick={mergeReorderIntoCart}>
                Add to Cart
              </button>
              <button className="btn btn-outline danger-hover" type="button" onClick={clearReorder}>
                Discard
              </button>
            </div>
          </section>
        )}

        {/*  Main Cart  */}
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
                  const checked = pick.has(it.key);
                  return (
                    <article className="cart-item" key={it.key}>
                      {/* custom checkbox + รูปให้บาลานซ์ */}
                      <div className="select-thumb">
                        <input
                          type="checkbox"
                          className="pm-check"
                          checked={checked}
                          onChange={() => toggle(it.key)}
                          aria-label={`Select ${it.title}`}
                        />
                        <img src={it.image} alt={it.title} />
                      </div>

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

              {/* Select All */}
              <label className="select-all">
                <input
                  type="checkbox"
                  className="pm-check"
                  checked={isAll}
                  onChange={(e) => setAll(e.target.checked)}
                  aria-label="Select all"
                />
                <span>{isAll ? "Selected all items" : "Select all items"}</span>
              </label>
              <p className="muted" style={{ marginTop: -4, marginBottom: 12 }}>
                Totals are calculated from <strong>selected items</strong>.
              </p>

              <div className="totals">
                <div className="line">
                  <span>Items</span>
                  <span>{pickedQty}</span>
                </div>
                <div className="line total">
                  <span>Grand Total</span>
                  <span id="grandTotal" className="price">
                    {THB(pickedTotal)}
                  </span>
                </div>
              </div>
              <div className="actions">
                <button
                  className="btn btn-primary"
                  id="goCheckout"
                  type="button"
                  onClick={handleCheckout}
                  disabled={isNone}
                  aria-disabled={isNone}
                  title={isNone ? "Please select at least one item" : "Proceed to Checkout"}
                >
                  Proceed to Checkout
                </button>
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
