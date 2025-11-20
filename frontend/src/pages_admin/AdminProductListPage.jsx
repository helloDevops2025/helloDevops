import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminProductListPage.css";

export default function AdminProductListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pendingProduct, setPendingProduct] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
  console.log("[AdminProductList] API_URL =", API_URL);

  // ---------- fetch ----------
  useEffect(() => {
    const url = `${API_URL}/api/products`;
    setLoading(true);
    setErr("");
    fetch(url, { headers: { Accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error("[AdminProductList] fetch error:", e);
        setErr(e.message || "Fetch failed");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [API_URL]);

  // ---------- pager + search (Thai-friendly + dropdown) ----------
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

    // ----- Search setup -----
    const input = document.querySelector(".action-bar .search input");
    const scope = document.querySelector(".action-bar .search select"); 
    const table = document.querySelector(".table-card");
    const rows = Array.from(table?.querySelectorAll(".table-row") ?? []);
    const hint = table?.querySelector(".hint");
    const pager = table?.querySelector(".pager");
    const getActivePageBtn = () =>
      document.querySelector(".pager .pill.active") ||
      document.querySelector(".pager .pill");

    // Thai-friendly normalization: lower, trim, collapse spaces, strip accents (latin) + thai diacritics
    const stripThaiDiacritics = (s) =>
      (s || "").replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, "");
    const norm = (s) =>
      stripThaiDiacritics(
        (s || "")
          .toString()
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "") // latin accents
      )
        .trim()
        .replace(/\s+/g, " ");

    const getCell = (row, idx) => (row?.children?.[idx]?.textContent ?? "").trim();

    // ดึงค่าจาก data-* ถ้ามี; fallback index: 1=ProductID, 2=Name, 3=Category, 4=Brand, 5=Qty
    const extractFields = (row) => {
      const productId = row.dataset.productId ?? row.dataset.productid ?? getCell(row, 1);
      const name = row.dataset.name ?? getCell(row, 2);
      const category = row.dataset.category ?? getCell(row, 3);
      const brand = row.dataset.brand ?? getCell(row, 4);
      const qtyRaw =
        row.dataset.quantity ??
        row.dataset.qty ??
        getCell(row, 5);
      const qty = parseInt(String(qtyRaw).replace(/[^\d-]/g, ""), 10);
      const isIn = Number.isFinite(qty) && qty > 0;

     
      const stockText = isIn
        ? "in stock มีสินค้า พร้อมส่ง มีของ"
        : "out of stock หมดสต็อก หมด ไม่มีของ ไม่มีสินค้า";

      return {
        productId: norm(productId),
        name: norm(name),
        category: norm(category),
        brand: norm(brand),
        stock: norm(stockText),
        qty: Number.isFinite(qty) ? qty : 0,
      };
    };

    // 
    // Pre-index
    const record = new WeakMap();     // เก็บ fields แบบแยก
    const hayAll = new WeakMap();     // สำหรับโหมด "ค้นหาทุกฟิลด์" ถ้าจะใช้ภายหลัง
    rows.forEach((row) => {
      const f = extractFields(row);
      record.set(row, f);
      hayAll.set(
        row,
        `${f.productId} ${f.name} ${f.category} ${f.brand} ${f.stock}`
      );
    });

    // parse query สำหรับ stock
    const normalizeStockQuery = (q) => {
      const t = norm(q);
      if (!t) return "";
      const inWords = ["in", "in stock", "instock", "มี", "มีสินค้า", "พร้อมส่ง", "มีของ"];
      const outWords = ["out", "out of stock", "outofstock", "หมด", "หมดสต็อก", "ไม่มี", "ไม่มีของ", "ไม่มีสินค้า"];
      if (inWords.some((w) => t.includes(norm(w)))) return "in";
      if (outWords.some((w) => t.includes(norm(w)))) return "out";
      return t; // ถ้าไม่เข้า keyword ก็ใช้ match ปกติ
    };

    const setPlaceholder = () => {
      if (!input || !scope) return;
      const mode = scope.value;
      const map = {
        name: "Search product name",
        productId: "Search Product ID",
        category: "Search category",
        stock: "Search stock",
      };
      input.placeholder = map[mode] || "Search…";
    };
    setPlaceholder();

    function runSearch(q) {
      const queryRaw = q ?? "";
      if (!scope) return;
      const mode = scope.value; // name | productId | category | stock

      const query = norm(queryRaw);
      if (!query) {
        rows.forEach((row) => (row.style.display = ""));
        if (pager) pager.style.visibility = "visible";
        const active = getActivePageBtn();
        if (active) active.click();
        if (hint) hint.textContent = "";
        return;
      }

      const terms =
        mode === "stock"
          ? [normalizeStockQuery(query)]
          : query.split(" ").filter(Boolean);

      let shown = 0;
      rows.forEach((row) => {
        const f = record.get(row);
        if (!f) return;

        let ok = false;
        if (mode === "name") {
          ok = terms.every((t) => f.name.includes(t));
        } else if (mode === "productId") {
          // รองรับแบบมี/ไม่มี # ด้วยการ normalize
          ok = terms.every((t) => f.productId.replace(/^#/, "").includes(t.replace(/^#/, "")));
        } else if (mode === "category") {
          ok = terms.every((t) => f.category.includes(t));
        } else if (mode === "stock") {
          // ถ้าเป็นคีย์เวิร์ด in/out ให้ match แบบตรง
          if (terms[0] === "in") ok = f.qty >= 1;
          else if (terms[0] === "out") ok = f.qty <= 0;
          else {
            // ไม่ใช่ keyword → ให้หาในคำอธิบาย stockText
            ok = terms.every((t) => f.stock.includes(t));
          }
        } else {
          // fallback: ค้นหาทุกฟิลด์
          const hay = hayAll.get(row) ?? "";
          ok = terms.every((t) => hay.includes(t));
        }

        row.style.display = ok ? "grid" : "none";
        if (ok) shown++;
      });

      if (hint) hint.textContent = `Found ${shown} entries`;
      if (pager) pager.style.visibility = "hidden";
    }

    const onInput = () => runSearch(input?.value ?? "");
    const onKey = (e) => {
      if (e.key === "Enter") runSearch(input?.value ?? "");
      if (e.key === "Escape") {
        if (input) input.value = "";
        runSearch("");
      }
    };
    const onScopeChange = () => {
      setPlaceholder();
      runSearch(input?.value ?? "");
    };

    if (input && rows.length > 0) {
      input.addEventListener("input", onInput);
      input.addEventListener("keydown", onKey);
    }
    if (scope) {
      scope.addEventListener("change", onScopeChange);
    }

    return () => {
      if (input) {
        input.removeEventListener("input", onInput);
        input.removeEventListener("keydown", onKey);
      }
      if (scope) {
        scope.removeEventListener("change", onScopeChange);
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
  const getKey = (p) => p.id ?? p.productId;
  const getEditPath = (p) => `/admin/products/${encodeURIComponent(p.id ?? p.productId)}/edit`;

  // === ป้าย stock (In/Out) ===
  const toInt = (v) => {
    const n = parseInt(String(v ?? "").replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  };
  // ใช้ threshold สำหรับ "Low Stock"
  const LOW_STOCK_THRESHOLD = 10;

  const qtyOf = (p) => {
    const n = parseInt(String(p.quantity ?? 0).replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  };

  // ฟังก์ชันกำหนด label
  const stockLabelOf = (p) => {
    const qty = qtyOf(p);
    if (qty === 0) return "Out of Stock";
    if (qty <= LOW_STOCK_THRESHOLD) return "Low Stock";
    return "In Stock";
  };

  // ฟังก์ชันกำหนดสีป้าย
  const stockStyleOf = (p) => {
    const qty = qtyOf(p);
    if (qty === 0)
      return {
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: 12,
        lineHeight: 1,
        border: "1px solid #fecaca",
        background: "#fef2f2",
        color: "#7f1d1d",
      };
    if (qty <= LOW_STOCK_THRESHOLD)
      return {
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: 12,
        lineHeight: 1,
        border: "1px solid #fde68a",
        background: "#fffbeb",
        color: "#92400e",
      };
    return {
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: 12,
      lineHeight: 1,
      border: "1px solid #a7f3d0",
      background: "#ecfdf5",
      color: "#065f46",
    };
  };

  // ---------- DELETE ----------
  // ช่วยฟอร์แมตรหัสสินค้าให้เป็น #00001
  const fmtCode = (v) =>
    "#" + String(v ?? "").replace(/\D/g, "").padStart(5, "0");

  // 👉 1) เปิดกล่องยืนยัน
  function openConfirmDelete(p) {
    if (!p) return;
    const code = p.productId ?? p.id;
    const label = `${p.name ?? "-"} – ${code ? fmtCode(code) : ""}`;

    setPendingProduct(p);
    setConfirmText(`Delete product: ${label} ?`);
    setConfirmOpen(true);
  }

  // 👉 2) ยืนยันลบ
  async function handleConfirmDelete() {
    if (!pendingProduct) {
      setConfirmOpen(false);
      return;
    }

    const p = pendingProduct;
    const dbId = p?.id ?? null;
    const code = String(p?.productId ?? "");
    const codeClean = code.replace(/\D/g, "");

    try {
      let done = false;

      // ลบด้วย id ก่อน
      if (dbId != null) {
        const r = await fetch(
          `${API_URL}/api/products/${encodeURIComponent(dbId)}`,
          { method: "DELETE" }
        );
        if (r.ok) done = true;
        else if (r.status !== 404)
          throw new Error(`DELETE by id failed: HTTP ${r.status}`);
      }

      // ถ้าไม่สำเร็จลองลบด้วย productId
      if (!done && codeClean) {
        const candidates = [
          `${API_URL}/api/products/byProductId/${encodeURIComponent(codeClean)}`,
          `${API_URL}/api/products/code/${encodeURIComponent(codeClean)}`,
          `${API_URL}/api/products/${encodeURIComponent(codeClean)}?by=productId`,
        ];
        for (const url of candidates) {
          try {
            const r = await fetch(url, { method: "DELETE" });
            if (r.ok) {
              done = true;
              break;
            }
          } catch { }
        }
      }

      if (!done) throw new Error("ไม่พบ endpoint สำหรับลบรายการนี้");

      // ลบออกจาก state
      setItems((prev) =>
        prev.filter(
          (x) =>
            x.id !== dbId &&
            String(x.productId).replace(/\D/g, "") !== codeClean
        )
      );
    } catch (e) {
      console.error(e);
      alert(e.message || "Delete failed.");
    } finally {
      setConfirmOpen(false);
      setPendingProduct(null);
    }
  }

  // 👉 3) ยกเลิก
  function handleCancelDelete() {
    setConfirmOpen(false);
    setPendingProduct(null);
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
                {/* ⬇️ dropdown เลือกประเภทการค้นหา */}
                <select defaultValue="name" aria-label="Search by">
                  <option value="name">Product</option>
                  <option value="productId">Product ID</option>
                  <option value="category">Category</option>
                  <option value="stock">Stock</option>
                </select>
                <input type="text" placeholder="Search product name" />
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
              <div>Product</div>
              <div>Product Code</div>
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

            {!loading && !err && items.length > 0 && items.map((p) => (
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
                  <span className="cube"><i className="fa-solid fa-cube" /></span>{" "}
                  {p.name}
                </div>
                <div>{showProductId(p.productId)}</div>
                <div>{Number(p.price ?? 0).toFixed(2)}</div>
                <div>{p.category}</div>
                <div>{p.brand ?? "-"}</div>
                <div>{p.quantity ?? 0}</div>
                <div>
                  <span style={stockStyleOf(p)}>{stockLabelOf(p)}</span>
                </div>
                <div className="act">
                  <Link to={getEditPath(p)} aria-label="Edit product" title="Edit">
                    <i className="fa-solid fa-pen" />
                  </Link>
                  <button
                    type="button"
                    aria-label="Delete product"
                    title="Delete"
                    onClick={() => openConfirmDelete(p)}
                    style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
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
      {confirmOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Please confirm product deletion</h3>
            <p style={{ marginTop: 10 }}>{confirmText}</p>

            <div className="modal-buttons">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
