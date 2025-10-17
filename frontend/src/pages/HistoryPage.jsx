import React, { useEffect, useMemo, useState } from "react";
import "./HistoryPage.css";
import Footer from "../components/footer";
import "./breadcrumb.css";

/* ===== Utils ===== */
const THB = (n) =>
  Number(n || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });

const fDateTime = (iso) =>
  new Date(iso).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function useDebounce(v, d = 400) {
  const [x, setX] = useState(v);
  useEffect(() => {
    const id = setTimeout(() => setX(v), d);
    return () => clearTimeout(id);
  }, [v, d]);
  return x;
}

/* ===== Mock fallback ===== */
function buildMock(n = 18) {
  return Array.from({ length: n }).map((_, i) => {
    const done = i % 3 !== 2;
    const cancelled = i % 3 === 2;
    const status = cancelled ? "cancelled" : done ? "completed" : "processing";
    const items = [
      { name: "สินค้า A", qty: 2, price: 89, thumb: "" },
      { name: "สินค้า B", qty: 1, price: 178, thumb: "" },
      { name: "สินค้า C", qty: 2, price: 0, thumb: "" },
    ];
    const total = items.reduce((s, it) => s + it.qty * it.price, 0);
    return {
      id: `PM-2025-${String(10018 - i).padStart(5, "0")}`,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      status,
      items,
      total,
      address:
        "79/6 หมู่ 4 ถนนกุหลาบงาม, บางพลี, สมุทรปราการ 10540\nโทร 08x-xxx-xxxx",
    };
  });
}

/* ===== Tabs + Search ===== */
const TABS = ["All", "Completed", "Cancelled"];

function FilterBar({ tab, setTab, q, setQ, onSearch }) {
  return (
    <div className="hx-toolbar">
      <div className="hx-tabs" role="tablist" aria-label="Order status tabs">
        {TABS.map((t) => (
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
          placeholder="Search by order ID / address"
          aria-label="Search order"
        />
        <button onClick={onSearch}>Search</button>
      </div>
    </div>
  );
}

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

function OrderCard({ o, onAgain }) {
  const qtySum = o.items.reduce((s, it) => s + it.qty, 0);
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
        <div className="hx-address">{o.address}</div>
        <div className="hx-thumbs">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="hx-thumb" key={i} />
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
          <a className="hx-btn ghost" href={`/orders/${o.id}`}>
            View Details
          </a>
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
      <button
        className="hx-page"
        onClick={go(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ‹ Prev
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1)
        .slice(0, Math.min(3, pages)) /* ดีไซน์ตัวอย่าง: หน้า 1,2,… */
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
      <button
        className="hx-page"
        onClick={go(page + 1)}
        disabled={page === pages}
        aria-label="Next page"
      >
        Next ›
      </button>
    </nav>
  );
}

/* ===== Page ===== */
export default function HistoryPage() {
  const API_BASE = import.meta.env.VITE_API_BASE || "";
  const FORCE_MOCK = import.meta.env.VITE_FORCE_MOCK === "1";

  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);

  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const qDeb = useDebounce(q, 400);

  const [rows, setRows] = useState([]);       // สำหรับ server-side
  const [allRows, setAllRows] = useState([]); // สำหรับ mock/client-side
  const [total, setTotal] = useState(undefined); // ถ้า API ส่ง total มา
  const [isFetching, setIsFetching] = useState(false);
  const [err, setErr] = useState("");

  // โหลดข้อมูลของหน้า (รองรับทั้ง API จริงและ mock)
  useEffect(() => {
    let aborted = false;
    const run = async () => {
      if (FORCE_MOCK) {
        const mock = buildMock();
        if (!aborted) {
          setAllRows(mock);
          setTotal(undefined);
          setRows([]);
        }
        return;
      }

      setIsFetching(true);
      setErr("");
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("size", String(PAGE_SIZE));
        if (qDeb.trim()) params.set("q", qDeb.trim());
        if (tab === "Completed") params.set("status", "completed");
        if (tab === "Cancelled") params.set("status", "cancelled");

        const r = await fetch(`${API_BASE}/api/orders?${params.toString()}`);
        const ct = r.headers.get("content-type") || "";
        if (!r.ok || !ct.includes("application/json")) {
          const mock = buildMock();
          if (!aborted) {
            setAllRows(mock);
            setTotal(undefined);
            setRows([]);
          }
          return;
        }
        const data = await r.json();
        const items = (data.items || []).map((x) => ({
          ...x,
          status:
            x.status === "จัดส่งสำเร็จ"
              ? "completed"
              : x.status === "ยกเลิก"
              ? "cancelled"
              : "processing",
        }));
        if (!aborted) {
          setRows(items);
          setTotal(Number.isFinite(data.total) ? data.total : undefined);
          setAllRows([]);
        }
      } catch (e) {
        if (!aborted) {
          setAllRows(buildMock());
          setTotal(undefined);
          setRows([]);
          setErr(String(e?.message || "Fetch error"));
        }
      } finally {
        if (!aborted) setIsFetching(false);
      }
    };
    run();
    return () => {
      aborted = true;
    };
  }, [API_BASE, FORCE_MOCK, qDeb, tab, page]);

  // client-side filter/paginate (เมื่อไม่มี total)
  const filteredClient = useMemo(() => {
    let list = [...allRows];
    if (tab === "Completed") list = list.filter((x) => x.status === "completed");
    if (tab === "Cancelled") list = list.filter((x) => x.status === "cancelled");
    if (qDeb.trim()) {
      const qq = qDeb.trim().toLowerCase();
      list = list.filter(
        (x) => x.id.toLowerCase().includes(qq) || x.address.toLowerCase().includes(qq)
      );
    }
    return list;
  }, [allRows, tab, qDeb]);

  const clientPages = Math.max(1, Math.ceil(filteredClient.length / PAGE_SIZE));
  const serverPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE));
  const pages = total !== undefined ? serverPages : clientPages;

  const displayRows =
    total !== undefined
      ? rows
      : filteredClient.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // รีเซ็ตหน้าเมื่อเปลี่ยนตัวกรอง/ค้นหา
  useEffect(() => {
    setPage(1);
  }, [tab, qDeb]);

  return (
    <>
      <div className="history-page">
        {/* hero */}
        <section className="wl-hero">
          <div className="wl-hero__inner">
            <h1 className="wl-title">ORDER HISTORY</h1>
            <nav className="custom-breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li className="custom-breadcrumb__item">
      <a href="/">HOME</a>
    </li>
    <li className="custom-breadcrumb__item">
      <span className="divider">›</span><a href="/shop">SHOP</a>
      <span className="divider">›</span>
    </li>
    <li className="custom-breadcrumb__item current" aria-current="page">ORDER HISTORY</li>
  </ol>
</nav>







          </div>
        </section>

        <div className="wl-wrap">
          <FilterBar
            tab={tab}
            setTab={setTab}
            q={q}
            setQ={setQ}
            onSearch={() => setQ((s) => s)}
          />

          {displayRows.length === 0 ? (
            <div className="hx-empty">ไม่พบรายการ</div>
          ) : (
            <>
              <div className="hx-list">
                {displayRows.map((o) => (
                  <OrderCard
                    key={o.id}
                    o={o}
                    onAgain={() => alert(`Buy again #${o.id}`)}
                  />
                ))}
              </div>

              <Pager page={page} pages={pages} onChange={setPage} />
            </>
          )}

          {isFetching && (
            <div className="hx-spinner" aria-live="polite">
              กำลังอัปเดต…
            </div>
          )}
          {err && <div className="hx-error">Error: {err}</div>}
        </div>
      </div>

      <Footer />
    </>
  );
}
