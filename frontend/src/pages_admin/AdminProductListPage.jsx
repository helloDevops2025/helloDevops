// import { useEffect, useState } from "react";
// import "./AdminProductListPage.css";

// export default function AdminProductListPage() {
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");

//   // เหมือนเดิม: อ่านจาก ENV, มี fallback
//   const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
//   console.log("[AdminProductList] API_URL =", API_URL);

//   useEffect(() => {
//     const url = `${API_URL}/api/products`;
//     console.log("[AdminProductList] FETCH ->", url);
//     setLoading(true);
//     setErr("");

//     fetch(url, { headers: { Accept: "application/json" } })
//       .then(async (res) => {
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         return res.json();
//       })
//       .then((data) => {
//         const arr = Array.isArray(data) ? data : [];
//         console.log("[AdminProductList] items =", arr);
//         setItems(arr);
//       })
//       .catch((e) => {
//         console.error("[AdminProductList] fetch error:", e);
//         setErr(e.message || "Fetch failed");
//         setItems([]);
//       })
//       .finally(() => setLoading(false));
//   }, [API_URL]);

//   return (
//     <div className="admin-product-list">
//       <h1>🛒 Admin · Product List</h1>

//       {/* debug line */}
//       <p style={{fontSize:12,opacity:.8,margin:"4px 0"}}>
//         <b>API_URL:</b> {API_URL} &nbsp;
//         <b>Status:</b> {loading ? "loading…" : err ? `error: ${err}` : `ok (${items.length})`}
//       </p>

//       {loading && <p>Loading products...</p>}
//       {!loading && err && <p style={{color:"#c00"}}>{err}</p>}
//       {!loading && !err && items.length === 0 && <p>No products found.</p>}

//       {!loading && !err && items.length > 0 && (
//         <table className="product-table">
//           <thead>
//             <tr>
//               <th>ID</th>
//               <th>Product ID</th>
//               <th>Name</th>
//               <th>Price</th>
//               <th>Category</th>
//               <th>Brand</th>
//               <th>Quantity</th>
//               <th>In Stock</th>
//             </tr>
//           </thead>
//           <tbody>
//             {items.map((p) => (
//               <tr key={p.id}>
//                 <td>{p.id}</td>
//                 <td>{p.productId}</td>
//                 <td>{p.name}</td>
//                 <td>{Number(p.price ?? 0).toFixed(2)}</td>
//                 <td>{p.category}</td>
//                 <td>{p.brand ?? "-"}</td>
//                 <td>{p.quantity ?? 0}</td>
//                 <td>{p.inStock ? "✅" : "❌"}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminProductListPage.css";

export default function AdminProductListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
  console.log("[AdminProductList] API_URL =", API_URL);

  // ---------- fetch แบบเดิม ----------
  useEffect(() => {
    const url = `${API_URL}/api/products`;
    console.log("[AdminProductList] FETCH ->", url);

    setLoading(true);
    setErr("");
    fetch(url, { headers: { Accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        console.log("[AdminProductList] items =", arr);
        setItems(arr);
      })
      .catch((e) => {
        console.error("[AdminProductList] fetch error:", e);
        setErr(e.message || "Fetch failed");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [API_URL]);

  // ---------- pager + search (เดิมทั้งหมด) ----------
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

    // Search Product ID (เดิม)
    const input = document.querySelector(".action-bar .search input");
    const table = document.querySelector(".table-card");
    const rows = Array.from(table?.querySelectorAll(".table-row") ?? []);
    const hint = table?.querySelector(".hint");
    const getActivePageBtn = () =>
      document.querySelector(".pager .pill.active") ||
      document.querySelector(".pager .pill");

    const norm = (s) =>
      (s || "").toString().toLowerCase().replace(/\s+/g, "").replace(/^#/, "");
    const productIdOf = (row) => norm(row.children[1]?.textContent || "");

    function runSearch(q) {
      const query = norm(q);
      if (!query) {
        const active = getActivePageBtn();
        if (active) active.click();
        return;
      }
      let shown = 0;
      rows.forEach((row) => {
        const match = productIdOf(row).includes(query);
        row.style.display = match ? "grid" : "none";
        if (match) shown++;
      });
      if (hint) hint.textContent = `Found ${shown} entries`;
    }
    function onInput() {
      runSearch(input.value);
    }
    function onKey(e) {
      if (e.key === "Enter") runSearch(input.value);
      if (e.key === "Escape") {
        input.value = "";
        const active = getActivePageBtn();
        if (active) active.click();
      }
    }
    if (input && rows.length > 0) {
      input.addEventListener("input", onInput);
      input.addEventListener("keydown", onKey);
    }
    return () => {
      if (input) {
        input.removeEventListener("input", onInput);
        input.removeEventListener("keydown", onKey);
      }
    };
  }, [items]);

  // ---------- helpers ----------
  const showProductId = (val) => {
    const s = (val ?? "").toString();
    if (s.startsWith("#")) return s;
    const padded = String(s).replace(/\D/g, "");
    return "#" + padded.padStart(5, "0");
  };
  const getKey = (p) => p.id ?? p.productId;          // ใช้เป็น key/param
  const getEditPath = (p) => `/admin/products/${encodeURIComponent(p.id ?? p.productId)}/edit`;

  // ---------- DELETE ----------
  async function handleDelete(p) {
    const id = p.id;
    if (id == null) {
      alert("ไม่พบ id ของรายการนี้ ลบไม่ได้");
      return;
    }
    if (!confirm(`Delete product id=${id}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`DELETE failed: HTTP ${res.status}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
    }
  }

  return (
    <div className="app" data-page="AdminProductListPage">
      <main className="main">
        <div className="content">
          <div className="content-header">
            <h1 className="title">PRODUCT LIST</h1>

            <div className="action-bar">
              <div className="search">
                <i className="fa-solid fa-magnifying-glass" />
                <input type="text" placeholder="Search product…" />
              </div>
              <Link to="/admin/products/new" className="btn-add">
                <span className="box">
                  <i className="fa-solid fa-plus" />
                </span>
                ADD NEW
              </Link>
            </div>

            {/* 
              Debug Info (ใช้ตอนต้องเช็ค backend)
              - เอา comment ออกเพื่อโชว์ API_URL/Status ได้
            */}
            {/*
            <p className="tiny-debug">
              <b>API_URL:</b> {API_URL} &nbsp;|&nbsp;
              <b>Status:</b>{" "}
              {loading ? "loading…" : err ? `error: ${err}` : `ok (${items.length})`}
            </p>
            */}
          </div>

          <div className="table-card">
            <div className="table-header">
              <div>Product</div>
              <div>Product ID</div>
              <div>Price</div>
              <div>Category</div>
              <div>Brand</div>
              <div>Quantity</div>
              <div>Stock</div>
              <div>Action</div>
            </div>

            {loading && (
              <div className="table-row" style={{ display: "grid" }}>
                <div style={{ gridColumn: "1 / -1" }}>Loading products…</div>
              </div>
            )}
            {!loading && err && (
              <div className="table-row" style={{ display: "grid", color: "#c00" }}>
                <div style={{ gridColumn: "1 / -1" }}>Error: {err}</div>
              </div>
            )}
            {!loading && !err && items.length === 0 && (
              <div className="table-row" style={{ display: "grid" }}>
                <div style={{ gridColumn: "1 / -1" }}>No products found.</div>
              </div>
            )}

            {!loading &&
              !err &&
              items.length > 0 &&
              items.map((p) => (
                <div className="table-row" key={getKey(p)}>
                  <div className="prod">
                    <span className="cube">
                      <i className="fa-solid fa-cube" />
                    </span>{" "}
                    {p.name}
                  </div>
                  <div>{showProductId(p.productId)}</div>
                  <div>{Number(p.price ?? 0).toFixed(2)}</div>
                  <div>{p.category}</div>
                  <div>{p.brand ?? "-"}</div>
                  <div>{p.quantity ?? 0}</div>
                  <div>{p.inStock ? "In Stock" : "Out of stock"}</div>
                  <div className="act">
                    {/* ดินสอ = Edit (ไปหน้าแก้ไข) */}
                    <Link
                      to={getEditPath(p)}
                      aria-label="Edit product"
                      title="Edit"
                    >
                      <i className="fa-solid fa-pen" />
                    </Link>

                    {/* ถังขยะ = Delete (คลิกเรียก handleDelete) */}
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
