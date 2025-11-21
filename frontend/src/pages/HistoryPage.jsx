import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HistoryPage.css";
import Footer from "./../components/Footer.jsx";
import "./breadcrumb.css";

/* ===== Config & Utils ===== */
const API_BASE = import.meta.env.VITE_API_URL ;
const CART_KEY = "pm_cart";
const REORDER_KEY = "pm_reorder";

const THB = (n) =>
  Number(n || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });

// ✅ 25 Jan 2025 • 01:45 PM
const fDateTime = (iso) => {
  if (!iso) return "–";
  try {
    const d = new Date(iso);
    const datePart = new Intl.DateTimeFormat("en-GB-u-ca-gregory", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
    const timePart = new Intl.DateTimeFormat("en-US-u-ca-gregory", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
    return `${datePart} • ${timePart}`;
  } catch {
    return String(iso);
  }
};

function useDebounce(v, d = 400) {
  const [x, setX] = useState(v);
  useEffect(() => {
    const id = setTimeout(() => setX(v), d);
    return () => clearTimeout(id);
  }, [v, d]);
  return x;
}

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
      <rect width='100%' height='100%' fill='#eef1f5'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9aa3b2' font-size='10'>No Image</text>
    </svg>`
  );

/* ===== Order Card ===== */
function StatusRight({ status }) {
  const map = {
    completed: { text: "Order Completed", cls: "ok" },
    cancelled: { text: "Cancelled", cls: "bad" },
    processing: { text: "Processing", cls: "info" },
  };
  const m = map[status] || map.processing;
  return (
    <div className={`hx-status-right ${m.cls}`}>
      <span className="hx-dot" />
      {m.text}
    </div>
  );
}

function OrderCard({ o, onAgain, onView }) {
  const qtySum = o.items.reduce((s, it) => s + (it.qty || 0), 0);
  const thumbs = o.items.slice(0, 5);

  return (
    <article className="hx-card">
      <header className="hx-card__head">
        <div className="hx-head-left">
          <span className="hx-pill">Deliver</span>
          <div className="hx-id-time">
            <strong>
              Order ID: <span className="hx-id">#{o.id}</span>
            </strong>
            <span className="hx-time">{fDateTime(o.date)}</span>
          </div>
        </div>
        <StatusRight status={o.status} />
      </header>

      <div className="hx-card__body">
        <div className="hx-address">{o.address || "-"}</div>
        <div className="hx-thumbs">
          {thumbs.length === 0
            ? Array.from({ length: 5 }).map((_, i) => <div className="hx-thumb" key={i} />)
            : thumbs.map((it, i) => (
                <div className="hx-thumb" key={i}>
                  <img
                    src={it.thumb || FALLBACK_IMG}
                    alt={it.name || `item-${i + 1}`}
                    onError={(e) => {
                      if (e.currentTarget.src !== FALLBACK_IMG)
                        e.currentTarget.src = FALLBACK_IMG;
                    }}
                  />
                </div>
              ))}
        </div>
      </div>

      <footer className="hx-card__foot">
        <div className="hx-foot-left">
          <div className="hx-qty">จำนวนทั้งหมด {qtySum} ชิ้น</div>
          <div className="hx-total">
            รวม: <strong>{THB(o.total)}</strong>
          </div>
        </div>
        <div className="hx-actions">
          <button className="hx-btn ghost" onClick={() => onView(o)}>
            View Details
          </button>
          <button className="hx-btn primary" onClick={() => onAgain(o)}>
            Buy Again
          </button>
        </div>
      </footer>
    </article>
  );
}

/* ===== Pagination ===== */
function Pager({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const go = (n) => () => onChange(Math.min(Math.max(1, n), pages));
  return (
    <nav className="hx-pager" role="navigation" aria-label="Pagination">
      <button className="hx-page" onClick={go(page - 1)} disabled={page === 1} aria-label="Previous page">
        ‹ Prev
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1)
        .slice(0, Math.min(3, pages))
        .map((n) => (
          <button
            key={n}
            className={`hx-page ${n === page ? "is-current" : ""}`}
            onClick={go(n)}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </button>
        ))}
      <button className="hx-page" onClick={go(page + 1)} disabled={page === pages} aria-label="Next page">
        Next ›
      </button>
    </nav>
  );
}

/* ===== Page ===== */
export default function HistoryPage() {
  const navigate = useNavigate();

  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const qDeb = useDebounce(q, 400);

  const [allRows, setAllRows] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [err, setErr] = useState("");

  const toUiStatus = (db) => {
    const s = String(db || "").toUpperCase();
    if (s === "DELIVERED") return "completed";
    if (s === "CANCELLED") return "cancelled";
    return "processing";
  };

  const mapOrderDetail = (o) => {
    const items = Array.isArray(o.orderItems)
      ? o.orderItems.map((it) => {
          const p = it.product || {};
          const thumb =
            p?.id !== undefined
              ? `${API_BASE}/api/products/${encodeURIComponent(p.id)}/cover`
              : "";
          return {
            name: p.name || it.productName || "",
            qty: Number(it.quantity || 1),
            price: Number(p.price ?? it.priceEach ?? 0),
            thumb,
            productId: p.id,
          };
        })
      : [];

    const total =
      Number(o.totalAmount ?? 0) ||
      items.reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0);

    const dateRaw =
      o.orderedAt ??
      o.ordered_at ??
      o.orderDate ??
      o.order_date ??
      o.createdAt ??
      o.created_at ??
      o.updatedAt ??
      o.updated_at ??
      new Date().toISOString();

    return {
      id: String(o.id ?? o.orderCode ?? ""),
      date: dateRaw,
      status: toUiStatus(o.orderStatus || o.status),
      items,
      total,
      address: o.shippingAddress || "-",
      _oid: o.id,
      _raw: o,
    };
  };

  useEffect(() => {
    let aborted = false;
    (async () => {
      setIsFetching(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE}/api/orders`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Order list loading failed.");
        const list = await res.json();
        const arr = Array.isArray(list) ? list : [];

        const full = await Promise.all(
          arr.map(async (o) => {
            try {
              const r = await fetch(`${API_BASE}/api/orders/${o.id}`, {
                headers: { Accept: "application/json" },
              });
              if (!r.ok) return null;
              const data = await r.json();
              return mapOrderDetail(data);
            } catch {
              return null;
            }
          })
        );

        if (!aborted) setAllRows(full.filter(Boolean));
      } catch (e) {
        if (!aborted) setErr(String(e?.message || "Fetch error"));
      } finally {
        if (!aborted) setIsFetching(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  const filteredClient = useMemo(() => {
    let list = [...allRows];
    if (tab === "Completed") list = list.filter((x) => x.status === "completed");
    if (tab === "Cancelled") list = list.filter((x) => x.status === "cancelled");
    if (qDeb.trim()) {
      const qq = qDeb.trim().toLowerCase();
      list = list.filter((x) => {
        const inId = String(x.id).toLowerCase().includes(qq);
        const inAddress = String(x.address).toLowerCase().includes(qq);
        const inProducts = (x.items || []).some((it) =>
          String(it.name || "").toLowerCase().includes(qq)
        );
        return inId || inAddress || inProducts;
      });
    }
    return list;
  }, [allRows, tab, qDeb]);

  const pages = Math.max(1, Math.ceil(filteredClient.length / PAGE_SIZE));
  const displayRows = filteredClient.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [tab, qDeb]);

  /* ===== Buy again: SAVE TO pm_reorder (do not touch pm_cart) ===== */
  const handleBuyAgain = (order) => {
    const freshReorder = (order.items || []).map((it) => {
      const productId = String(it.productId ?? it.id ?? it.name);
      const variantId = String(it.variantId ?? it.variant ?? it.sku ?? "");
      return {
        productId,
        variantId,
        title: it.name || `#${productId}`,
        price: Number(it.price || 0),
        qty: Math.max(1, Number(it.qty || 1)),
        img: it.thumb || FALLBACK_IMG,
      };
    });

    localStorage.setItem(REORDER_KEY, JSON.stringify(freshReorder));
    navigate("/cart"); // ไปหน้า Cart เพื่อยืนยันว่าจะรวม/ทิ้ง
  };

  const handleViewDetails = (order) => {
    navigate(`/tracking-user/${encodeURIComponent(order._oid || order.id)}`);
  };

  return (
    <>
      <div className="history-page">
        <section className="wl-hero">
          <div className="wl-hero__inner">
            <h1 className="wl-title">ORDER HISTORY</h1>
            <nav className="custom-breadcrumb" aria-label="Breadcrumb">
              <ol>
                <li className="custom-breadcrumb__item">
                  <a href="/">HOME</a>
                </li>
                <li className="custom-breadcrumb__item">
                  <span className="divider">›</span>
                  <a href="/shop">SHOP</a>
                  <span className="divider">›</span>
                </li>
                <li className="custom-breadcrumb__item current" aria-current="page">
                  ORDER HISTORY
                </li>
              </ol>
            </nav>
          </div>
        </section>

        <div className="wl-wrap">
          <div className="hx-toolbar">
            <div className="hx-tabs" role="tablist" aria-label="Order status tabs">
              {["All", "Completed", "Cancelled"].map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  className={`hx-tab ${tab === t ? "is-active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="hx-search">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by order ID, product, or address"
                aria-label="Search order"
              />
              <button onClick={() => setQ((s) => s)}>Search</button>
            </div>
          </div>

          {displayRows.length === 0 ? (
            <div className="hx-empty">{isFetching ? "Update…" : "No items found"}</div>
          ) : (
            <>
              <div className="hx-list">
                {displayRows.map((o) => (
                  <OrderCard
                    key={o.id}
                    o={o}
                    onAgain={handleBuyAgain}
                    onView={handleViewDetails}
                  />
                ))}
              </div>

              <Pager page={page} pages={pages} onChange={setPage} />
            </>
          )}

          {isFetching && (
            <div className="hx-spinner" aria-live="polite">
              Updating…
            </div>
          )}
          {err && <div className="hx-error">Error: {err}</div>}
        </div>
      </div>

      <Footer />
    </>
  );
}
