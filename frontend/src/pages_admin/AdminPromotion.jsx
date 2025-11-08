// src/pages_admin/AdminPromotion.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminPromotion.css";

/* =========================================================
   MOCK MODE SWITCH
   - true  = ใช้ข้อมูลจำลองทั้งหมด (ไม่ยิง API จริง)
   - false = ใช้ API จริงตามเดิม
========================================================= */
const USE_MOCK = true;

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

/* -------------------- Utilities -------------------- */
const fmtDT = (v) => {
  if (!v) return "";
  const d = new Date(v);
  const pad = (n) => String(n).padStart(2, "0");
  const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
  return s;
};
const safeNumber = (x) => (x === null || x === undefined || x === "" ? null : Number(x));

/* -------------------- MOCK DATABASE (in-memory) -------------------- */
function seedMockDb() {
  const now = new Date();
  const plusDays = (n) => new Date(now.getTime() + n * 86400000).toISOString();

  // สินค้าจำลอง
  const products = [
    { id: 1, product_id: "RM-001", name: "Royal Jasmine Rice 5kg", price: 189, brandName: "Royal", categoryName: "Rice", inStock: true },
    { id: 2, product_id: "CF-101", name: "Canned Tuna in Oil 185g", price: 35, brandName: "SeaBoy", categoryName: "Canned", inStock: true },
    { id: 3, product_id: "BV-550", name: "Soda Sparkle 325ml", price: 18, brandName: "FizzUp", categoryName: "Beverage", inStock: true },
    { id: 4, product_id: "BV-777", name: "100% Orange Juice 1L", price: 69, brandName: "SunDay", categoryName: "Beverage", inStock: true },
    { id: 5, product_id: "SN-008", name: "Potato Chips Hot Chili 75g", price: 29, brandName: "Crispy", categoryName: "Snack", inStock: true },
    { id: 6, product_id: "HC-300", name: "Shower Gel 500ml", price: 115, brandName: "Freshie", categoryName: "Health & Care", inStock: true },
    { id: 7, product_id: "DM-999", name: "Whole Milk 2L", price: 92, brandName: "MooMoo", categoryName: "Dairy", inStock: true },
    { id: 8, product_id: "CF-888", name: "Canned Mackerel in Tomato Sauce 155g", price: 27, brandName: "SeaBoy", categoryName: "Canned", inStock: true },
    { id: 9, product_id: "RM-005", name: "Brown Rice 5kg", price: 159, brandName: "Royal", categoryName: "Rice", inStock: true },
    { id: 10, product_id: "SN-050", name: "Mixed Nuts 150g", price: 79, brandName: "Nutty", categoryName: "Snack", inStock: true },
  ];

  // โปรจำลอง (หลายประเภท/สถานะ)
  const promotions = [
    {
      id: 101,
      name: "11.11 Mega Sale",
      code: "MEGA1111",
      description: "ลดแรงวันคนโสด ทั้งร้าน 11%",
      promo_type: "PERCENT_OFF",
      scope: "ORDER",
      percent_off: 11,
      amount_off: null,
      fixed_price: null,
      buy_qty: null,
      get_qty: null,
      applies_to_shipping: false,
      min_order_amount: 300,
      min_quantity: null,
      stack_mode: "EXCLUSIVE",
      priority: 10,
      status: "ACTIVE",
      start_at: plusDays(-1),
      end_at: plusDays(3),
      timezone: "Asia/Bangkok",
    },
    {
      id: 102,
      name: "Snack Lover ฿10 OFF",
      code: "SNACK10",
      description: "ส่วนลด 10 บาท สำหรับหมวด Snack",
      promo_type: "AMOUNT_OFF",
      scope: "CATEGORY",
      percent_off: null,
      amount_off: 10,
      fixed_price: null,
      buy_qty: null,
      get_qty: null,
      applies_to_shipping: false,
      min_order_amount: null,
      min_quantity: 2,
      stack_mode: "STACKABLE",
      priority: 50,
      status: "ACTIVE",
      start_at: plusDays(-7),
      end_at: plusDays(30),
      timezone: "Asia/Bangkok",
    },
    {
      id: 103,
      name: "Buy 2 Get 1 (Canned)",
      code: "CAN-2-1",
      description: "ซื้อปลากระป๋อง 2 แถม 1",
      promo_type: "BUY_X_GET_Y",
      scope: "CATEGORY",
      percent_off: null,
      amount_off: null,
      fixed_price: null,
      buy_qty: 2,
      get_qty: 1,
      applies_to_shipping: false,
      min_order_amount: null,
      min_quantity: null,
      stack_mode: "PRIORITY",
      priority: 20,
      status: "PAUSED",
      start_at: plusDays(-2),
      end_at: plusDays(10),
      timezone: "Asia/Bangkok",
    },
    {
      id: 104,
      name: "Royal Rice Fixed Price",
      code: "RICE149",
      description: "ข้าวถุง Royal ราคาเหมา 149 บาท",
      promo_type: "FIXED_PRICE",
      scope: "BRAND",
      percent_off: null,
      amount_off: null,
      fixed_price: 149,
      buy_qty: null,
      get_qty: null,
      applies_to_shipping: false,
      min_order_amount: null,
      min_quantity: null,
      stack_mode: "EXCLUSIVE",
      priority: 30,
      status: "DRAFT",
      start_at: plusDays(1),
      end_at: plusDays(15),
      timezone: "Asia/Bangkok",
    },
    {
      id: 105,
      name: "Free/Discounted Shipping",
      code: "SHIP5",
      description: "ลดค่าส่ง 5 บาท",
      promo_type: "SHIPPING_DISCOUNT",
      scope: "ORDER",
      percent_off: null,
      amount_off: 5,
      fixed_price: null,
      buy_qty: null,
      get_qty: null,
      applies_to_shipping: true,
      min_order_amount: 200,
      min_quantity: null,
      stack_mode: "STACKABLE",
      priority: 70,
      status: "EXPIRED",
      start_at: plusDays(-30),
      end_at: plusDays(-1),
      timezone: "Asia/Bangkok",
    },
  ];

  // ความสัมพันธ์โปร↔สินค้า (id สินค้าที่แนบกับโปร)
  const links = {
    101: new Set([1, 3, 5]), // 11.11 ผูกสินค้าบางตัว
    102: new Set([5, 10]),   // Snack
    103: new Set([2, 8]),    // Canned
    104: new Set([1, 9]),    // Royal Rice
    105: new Set([]),
  };

  return { products, promotions, links };
}

// โมดูลสโคปเดียวกัน -> จำลอง DB คงอยู่ระหว่างการเรนเดอร์
const MOCK_DB = seedMockDb();

/* -------------------- Normalizers (เหมือนเดิม) -------------------- */
function extractPromotions(raw) {
  if (Array.isArray(raw)) return raw;
  return raw.items || raw.data || raw.content || raw.results || [];
}
function normalizePromotion(p) {
  return {
    id: p.id,
    name: p.name ?? "-",
    code: p.code ?? "",
    description: p.description ?? "",
    promoType: p.promo_type ?? p.promoType ?? "PERCENT_OFF",
    scope: p.scope ?? "ORDER",
    percentOff: p.percent_off ?? p.percentOff ?? null,
    amountOff: p.amount_off ?? p.amountOff ?? null,
    fixedPrice: p.fixed_price ?? p.fixedPrice ?? null,
    buyQty: p.buy_qty ?? p.buyQty ?? null,
    getQty: p.get_qty ?? p.getQty ?? null,
    appliesToShipping: Boolean(p.applies_to_shipping ?? p.appliesToShipping ?? false),
    minOrderAmount: p.min_order_amount ?? p.minOrderAmount ?? null,
    minQuantity: p.min_quantity ?? p.minQuantity ?? null,
    stackMode: p.stack_mode ?? p.stackMode ?? "EXCLUSIVE",
    priority: p.priority ?? 100,
    status: p.status ?? "DRAFT",
    startAt: p.start_at ?? p.startAt ?? null,
    endAt: p.end_at ?? p.endAt ?? null,
    timezone: p.timezone ?? null,
  };
}
function denormalizePromotion(p) {
  return {
    id: p.id,
    name: p.name,
    code: p.code || null,
    description: p.description || null,
    promo_type: p.promoType,
    scope: p.scope,
    percent_off: safeNumber(p.percentOff),
    amount_off: safeNumber(p.amountOff),
    fixed_price: safeNumber(p.fixedPrice),
    buy_qty: safeNumber(p.buyQty),
    get_qty: safeNumber(p.getQty),
    applies_to_shipping: !!p.appliesToShipping,
    min_order_amount: safeNumber(p.minOrderAmount),
    min_quantity: safeNumber(p.minQuantity),
    stack_mode: p.stackMode,
    priority: Number(p.priority || 100),
    status: p.status,
    start_at: p.startAt ? new Date(p.startAt).toISOString() : null,
    end_at: p.endAt ? new Date(p.endAt).toISOString() : null,
    timezone: p.timezone || null,
  };
}
function extractProducts(raw) {
  if (Array.isArray(raw)) return raw;
  return raw.items || raw.data || raw.content || raw.results || [];
}
function normalizeProduct(x) {
  return {
    id: x.id,
    pid: x.product_id ?? x.productId ?? x.code ?? x.sku ?? null,
    name: x.name ?? "-",
    price: Number(x.price ?? 0),
    brand: x.brand?.name ?? x.brandName ?? "",
    category: x.category?.name ?? x.categoryName ?? "",
    inStock: x.in_stock ?? x.inStock ?? true,
  };
}

/* -------------------- API wrappers -------------------- */
/* ============== MOCK IMPLEMENTATIONS ============== */
function mockDelay(ms = 250) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mockListPromotions({ q = "", status = "" } = {}) {
  await mockDelay();
  let list = [...MOCK_DB.promotions];
  if (q) {
    const s = q.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(s) || (p.code || "").toLowerCase().includes(s));
  }
  if (status) list = list.filter((p) => p.status === status);
  return list.map(normalizePromotion);
}
async function mockGetPromotion(id) {
  await mockDelay();
  const row = MOCK_DB.promotions.find((p) => String(p.id) === String(id));
  if (!row) throw new Error("Not found");
  return normalizePromotion(row);
}
async function mockUpdatePromotion(id, patch) {
  await mockDelay();
  const idx = MOCK_DB.promotions.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) throw new Error("Not found");
  const merged = { ...MOCK_DB.promotions[idx], ...denormalizePromotion(patch) };
  MOCK_DB.promotions[idx] = merged;
  return { ok: true, id };
}
async function mockListProducts() {
  await mockDelay();
  return MOCK_DB.products.map(normalizeProduct);
}
async function mockListProductsOfPromotion(pid) {
  await mockDelay();
  const set = MOCK_DB.links[pid] || new Set();
  return MOCK_DB.products.filter((p) => set.has(p.id)).map(normalizeProduct);
}
async function mockAttachProducts(pid, productIds = []) {
  await mockDelay();
  if (!MOCK_DB.links[pid]) MOCK_DB.links[pid] = new Set();
  productIds.forEach((id) => MOCK_DB.links[pid].add(Number(id)));
  return { ok: true };
}
async function mockDetachProduct(pid, productId) {
  await mockDelay();
  if (MOCK_DB.links[pid]) MOCK_DB.links[pid].delete(Number(productId));
  return true;
}

/* ============== REAL IMPLEMENTATIONS (เผื่อสลับกลับ) ============== */
async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));
  return res.json();
}
async function sendJSON(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));
  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}
async function realListPromotions({ q = "", status = "" } = {}) {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (status) qs.set("status", status);
  const raw = await getJSON(`${API}/api/promotions${qs.toString() ? `?${qs}` : ""}`);
  return extractPromotions(raw).map(normalizePromotion);
}
async function realGetPromotion(id) {
  const p = await getJSON(`${API}/api/promotions/${encodeURIComponent(id)}`);
  return normalizePromotion(p);
}
async function realUpdatePromotion(id, patch) {
  const body = denormalizePromotion(patch);
  try {
    return await sendJSON(`${API}/api/promotions/${encodeURIComponent(id)}`, "PUT", body);
  } catch {
    return await sendJSON(`${API}/api/promotions/${encodeURIComponent(id)}`, "PATCH", body);
  }
}
async function realListProducts() {
  const raw = await getJSON(`${API}/api/products`);
  return extractProducts(raw).map(normalizeProduct);
}
async function realListProductsOfPromotion(pid) {
  try {
    const raw = await getJSON(`${API}/api/promotions/${encodeURIComponent(pid)}/products`);
    const arr = extractProducts(raw);
    return arr.map(normalizeProduct);
  } catch {
    const all = await realListProducts();
    const map = await getJSON(`${API}/api/promotion-products?promotionId=${encodeURIComponent(pid)}`).catch(() => []);
    const ids = new Set(
      (Array.isArray(map) ? map : extractProducts(map)).map(
        (m) => m.product_id ?? m.productId ?? m.product_id_fk ?? m.productIdFk
      )
    );
    return all.filter((p) => ids.has(p.id));
  }
}
async function realAttachProducts(pid, productIds = []) {
  const body = { productIds };
  try {
    return await sendJSON(`${API}/api/promotions/${encodeURIComponent(pid)}/products`, "POST", body);
  } catch {
    return await sendJSON(`${API}/api/promotion-products/bulk`, "POST", { promotionId: pid, productIds });
  }
}
async function realDetachProduct(pid, productId) {
  try {
    const res = await fetch(
      `${API}/api/promotions/${encodeURIComponent(pid)}/products/${encodeURIComponent(productId)}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error(await res.text().catch(() => "delete failed"));
    return true;
  } catch {
    await sendJSON(`${API}/api/promotion-products/unlink`, "POST", { promotionId: pid, productId });
    return true;
  }
}

/* ---------- Choose implementation by flag ---------- */
const apiListPromotions = USE_MOCK ? mockListPromotions : realListPromotions;
const apiGetPromotion = USE_MOCK ? mockGetPromotion : realGetPromotion;
const apiUpdatePromotion = USE_MOCK ? mockUpdatePromotion : realUpdatePromotion;
const apiListProducts = USE_MOCK ? mockListProducts : realListProducts;
const apiListProductsOfPromotion = USE_MOCK ? mockListProductsOfPromotion : realListProductsOfPromotion;
const apiAttachProducts = USE_MOCK ? mockAttachProducts : realAttachProducts;
const apiDetachProduct = USE_MOCK ? mockDetachProduct : realDetachProduct;

/* -------------------- UI -------------------- */
export default function AdminPromotion() {
  // ===== Left: Promotion List & Editor =====
  const [promotions, setPromotions] = useState([]);
  const [pQ, setPQ] = useState("");
  const [pStatus, setPStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // ===== Right: Product picker =====
  const [allProducts, setAllProducts] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [prodQ, setProdQ] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [picked, setPicked] = useState(new Set());

  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        const [ps, products] = await Promise.all([apiListPromotions(), apiListProducts()]);
        setPromotions(ps);
        setAllProducts(products);
        if (ps.length) setSelectedId(ps[0].id);
      } catch (e) {
        setMsg(`⚠️ ${e.message || "Load error"}`);
      }
    })();
  }, []);

  // When selecting a promotion, load its details & linked products
  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setMsg("");
      try {
        const [p, linked] = await Promise.all([
          apiGetPromotion(selectedId),
          apiListProductsOfPromotion(selectedId),
        ]);
        setCurrent(p);
        setAssigned(linked);
        setPicked(new Set());
      } catch (e) {
        setMsg(`⚠️ ${e.message || "Load error"}`);
      }
    })();
  }, [selectedId]);

  // search/filter promotions
  async function refreshPromotions() {
    try {
      const ps = await apiListPromotions({ q: pQ, status: pStatus });
      setPromotions(ps);
    } catch (e) {
      setMsg(`⚠️ ${e.message || "Load error"}`);
    }
  }

  // Derived filters for products
  const categories = useMemo(
    () => Array.from(new Set(allProducts.map((p) => p.category).filter(Boolean))).sort(),
    [allProducts]
  );
  const brands = useMemo(
    () => Array.from(new Set(allProducts.map((p) => p.brand).filter(Boolean))).sort(),
    [allProducts]
  );

  const assignedIds = useMemo(() => new Set(assigned.map((x) => x.id)), [assigned]);

  const availableProducts = useMemo(() => {
    let list = allProducts.filter((p) => !assignedIds.has(p.id));
    if (prodQ.trim()) {
      const q = prodQ.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || String(p.pid || p.id).toLowerCase().includes(q)
      );
    }
    if (filterCat) list = list.filter((p) => p.category === filterCat);
    if (filterBrand) list = list.filter((p) => p.brand === filterBrand);
    return list.slice(0, 200);
  }, [allProducts, assignedIds, prodQ, filterCat, filterBrand]);

  async function attachPicked() {
    if (!current || picked.size === 0) return;
    try {
      const ids = Array.from(picked);
      await apiAttachProducts(current.id, ids);
      const linked = await apiListProductsOfPromotion(current.id);
      setAssigned(linked);
      setPicked(new Set());
      setMsg("✅ Attached products to promotion.");
    } catch (e) {
      setMsg(`❌ Attach failed: ${e.message}`);
    }
  }

  async function detachOne(productId) {
    if (!current) return;
    if (!confirm("Remove this product from the promotion?")) return;
    try {
      await apiDetachProduct(current.id, productId);
      setAssigned((prev) => prev.filter((x) => x.id !== productId));
      setMsg("✅ Removed.");
    } catch (e) {
      setMsg(`❌ Remove failed: ${e.message}`);
    }
  }

  async function savePromotion() {
    if (!current) return;
    setSaving(true);
    setMsg("");
    try {
      await apiUpdatePromotion(current.id, current);
      setMsg("✅ Saved promotion.");
      await refreshPromotions();
    } catch (e) {
      setMsg(`❌ Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="promo-page">
      <header className="promo-header">
        <h1>Promotion Manager {USE_MOCK ? <span className="pill ghost">MOCK</span> : null}</h1>
        <p className="muted">
          Assign one promotion to multiple products • Edit schedule •{" "}
          {USE_MOCK ? "Mock data only (no DB calls)" : "Use existing promotions from DB"}
        </p>
      </header>

      {msg && <div className="promo-toast">{msg}</div>}

      <div className="promo-grid">
        {/* ============ LEFT: Promotions ============ */}
        <section className="panel">
          <div className="panel-head">
            <h2>Promotions</h2>
            <div className="row gap">
              <input
                className="inp"
                placeholder="Search name/code…"
                value={pQ}
                onChange={(e) => setPQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refreshPromotions()}
              />
              <select className="inp" value={pStatus} onChange={(e) => setPStatus(e.target.value)}>
                <option value="">All status</option>
                <option>ACTIVE</option>
                <option>DRAFT</option>
                <option>PAUSED</option>
                <option>EXPIRED</option>
              </select>
              <button className="btn" onClick={refreshPromotions}>
                Search
              </button>
            </div>
          </div>

          <div className="promo-list">
            {promotions.length === 0 ? (
              <div className="muted">No promotions.</div>
            ) : (
              promotions.map((p) => (
                <button
                  key={p.id}
                  className={"promo-item" + (selectedId === p.id ? " active" : "")}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div className="pi-name">{p.name}</div>
                  <div className="pi-sub">
                    <span className="pill">{p.promoType}</span>
                    <span className="pill ghost">{p.status}</span>
                    {p.code && <span className="pill code">#{p.code}</span>}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Editor */}
          {current && (
            <div className="editor">
              <h3>Edit Promotion</h3>
              <div className="form">
                <label>
                  <span>Name</span>
                  <input
                    className="inp"
                    value={current.name}
                    onChange={(e) => setCurrent({ ...current, name: e.target.value })}
                  />
                </label>
                <label>
                  <span>Code (optional)</span>
                  <input
                    className="inp"
                    value={current.code || ""}
                    onChange={(e) => setCurrent({ ...current, code: e.target.value })}
                  />
                </label>
                <label>
                  <span>Description</span>
                  <textarea
                    className="inp"
                    rows={3}
                    value={current.description || ""}
                    onChange={(e) => setCurrent({ ...current, description: e.target.value })}
                  />
                </label>

                <div className="row gap">
                  <label className="flex">
                    <span>Type</span>
                    <select
                      className="inp"
                      value={current.promoType}
                      onChange={(e) => setCurrent({ ...current, promoType: e.target.value })}
                    >
                      <option value="PERCENT_OFF">PERCENT_OFF</option>
                      <option value="AMOUNT_OFF">AMOUNT_OFF</option>
                      <option value="BUY_X_GET_Y">BUY_X_GET_Y</option>
                      <option value="FIXED_PRICE">FIXED_PRICE</option>
                      <option value="SHIPPING_DISCOUNT">SHIPPING_DISCOUNT</option>
                    </select>
                  </label>
                  <label className="flex">
                    <span>Scope</span>
                    <select
                      className="inp"
                      value={current.scope}
                      onChange={(e) => setCurrent({ ...current, scope: e.target.value })}
                    >
                      <option value="ORDER">ORDER</option>
                      <option value="PRODUCT">PRODUCT</option>
                      <option value="CATEGORY">CATEGORY</option>
                      <option value="BRAND">BRAND</option>
                    </select>
                  </label>
                  <label className="flex">
                    <span>Status</span>
                    <select
                      className="inp"
                      value={current.status}
                      onChange={(e) => setCurrent({ ...current, status: e.target.value })}
                    >
                      <option>DRAFT</option>
                      <option>ACTIVE</option>
                      <option>PAUSED</option>
                      <option>EXPIRED</option>
                    </select>
                  </label>
                </div>

                {/* Dynamic fields by type */}
                {current.promoType === "PERCENT_OFF" && (
                  <label>
                    <span>Percent Off (%)</span>
                    <input
                      className="inp"
                      type="number"
                      min="0"
                      step="0.01"
                      value={current.percentOff ?? ""}
                      onChange={(e) => setCurrent({ ...current, percentOff: e.target.value })}
                    />
                  </label>
                )}
                {current.promoType === "AMOUNT_OFF" && (
                  <label>
                    <span>Amount Off (฿)</span>
                    <input
                      className="inp"
                      type="number"
                      min="0"
                      step="0.01"
                      value={current.amountOff ?? ""}
                      onChange={(e) => setCurrent({ ...current, amountOff: e.target.value })}
                    />
                  </label>
                )}
                {current.promoType === "FIXED_PRICE" && (
                  <label>
                    <span>Fixed Price (฿)</span>
                    <input
                      className="inp"
                      type="number"
                      min="0"
                      step="0.01"
                      value={current.fixedPrice ?? ""}
                      onChange={(e) => setCurrent({ ...current, fixedPrice: e.target.value })}
                    />
                  </label>
                )}
                {current.promoType === "BUY_X_GET_Y" && (
                  <div className="row gap">
                    <label className="flex">
                      <span>Buy Qty (X)</span>
                      <input
                        className="inp"
                        type="number"
                        min="1"
                        step="1"
                        value={current.buyQty ?? ""}
                        onChange={(e) => setCurrent({ ...current, buyQty: e.target.value })}
                      />
                    </label>
                    <label className="flex">
                      <span>Get Qty (Y)</span>
                      <input
                        className="inp"
                        type="number"
                        min="1"
                        step="1"
                        value={current.getQty ?? ""}
                        onChange={(e) => setCurrent({ ...current, getQty: e.target.value })}
                      />
                    </label>
                  </div>
                )}

                <div className="row gap">
                  <label className="flex">
                    <span>Stack Mode</span>
                    <select
                      className="inp"
                      value={current.stackMode}
                      onChange={(e) => setCurrent({ ...current, stackMode: e.target.value })}
                    >
                      <option>EXCLUSIVE</option>
                      <option>STACKABLE</option>
                      <option>PRIORITY</option>
                    </select>
                  </label>
                  <label className="flex">
                    <span>Priority</span>
                    <input
                      className="inp"
                      type="number"
                      min="1"
                      step="1"
                      value={current.priority ?? 100}
                      onChange={(e) => setCurrent({ ...current, priority: e.target.value })}
                    />
                  </label>
                </div>

                {/* Schedule */}
                <div className="row gap">
                  <label className="flex">
                    <span>Start at</span>
                    <input
                      className="inp"
                      type="datetime-local"
                      value={fmtDT(current.startAt)}
                      onChange={(e) => setCurrent({ ...current, startAt: e.target.value })}
                    />
                  </label>
                  <label className="flex">
                    <span>End at</span>
                    <input
                      className="inp"
                      type="datetime-local"
                      value={fmtDT(current.endAt)}
                      onChange={(e) => setCurrent({ ...current, endAt: e.target.value })}
                    />
                  </label>
                </div>

                <div className="row end">
                  <button className="btn primary" disabled={saving} onClick={savePromotion}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ============ RIGHT: Product assignment ============ */}
        <section className="panel">
          <div className="panel-head">
            <h2>Assign Products</h2>
            <p className="muted">
              Assign <b>one</b> promotion to <b>multiple</b> products
            </p>
          </div>

          {/* Assigned list */}
          <div className="card">
            <div className="card-head">
              <h3>Currently assigned to this promotion</h3>
            </div>
            <div className="assigned-list">
              {assigned.length === 0 ? (
                <div className="muted">No products assigned.</div>
              ) : (
                assigned.map((p) => (
                  <div key={p.id} className="row assigned-item">
                    <div className="grow">
                      <div className="title">{p.name}</div>
                      <div className="sub">
                        {p.brand} • {p.category}
                      </div>
                    </div>
                    <button className="btn ghost danger" onClick={() => detachOne(p.id)}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available picker */}
          <div className="card">
            <div className="card-head">
              <h3>Add more products</h3>
            </div>
            <div className="row gap wrap">
              <input
                className="inp"
                placeholder="Search product name / code"
                value={prodQ}
                onChange={(e) => setProdQ(e.target.value)}
              />
              <select className="inp" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select className="inp" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
                <option value="">All brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="picker">
              {availableProducts.length === 0 ? (
                <div className="muted">No products found.</div>
              ) : (
                availableProducts.map((p) => {
                  const checked = picked.has(p.id);
                  return (
                    <label key={p.id} className={"pick-item" + (checked ? " picked" : "")}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(picked);
                          if (e.target.checked) next.add(p.id);
                          else next.delete(p.id);
                          setPicked(next);
                        }}
                      />
                      <div className="meta">
                        <div className="title">{p.name}</div>
                        <div className="sub">
                          {p.brand} • {p.category} • ฿{p.price.toFixed(2)}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="row end">
              <button className="btn" disabled={!current || picked.size === 0} onClick={attachPicked}>
                Attach Selected ({picked.size})
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
