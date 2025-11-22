// src/pages_admin/AdminPromotion.jsx
import { useEffect, useState, useMemo } from "react";
import "./AdminPromotion.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");

/* -------------------- Utilities -------------------- */
const fmtDT = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const safeNumber = (x) =>
  x === null || x === undefined || x === "" ? null : Number(x);

/* -------------------- Normalizers -------------------- */
function extractPromotions(raw) {
  if (Array.isArray(raw)) return raw;
  return raw?.items || raw?.data || raw?.content || raw?.results || [];
}

function normalizePromotion(p) {
  if (!p) return null;
  return {
    id: p.id ?? null,
    name: p.name ?? "",
    code: p.code ?? "",
    description: p.description ?? "",
    promoType: p.promo_type ?? p.promoType ?? "PERCENT_OFF",
    scope: p.scope ?? "ORDER",
    percentOff: p.percent_off ?? p.percentOff ?? null,
    amountOff: p.amount_off ?? p.amountOff ?? null,
    fixedPrice: p.fixed_price ?? p.fixedPrice ?? null,
    buyQty: p.buy_qty ?? p.buyQty ?? null,
    getQty: p.get_qty ?? p.getQty ?? null,
    appliesToShipping: Boolean(
      p.applies_to_shipping ?? p.appliesToShipping ?? false
    ),
    minOrderAmount: p.min_order_amount ?? p.minOrderAmount ?? null,
    minQuantity: p.min_quantity ?? p.minQuantity ?? null,
    stackMode: p.stack_mode ?? p.stackMode ?? "EXCLUSIVE",
    priority: p.priority ?? 100,
    status: p.status ?? "DRAFT",
    startAt: p.start_at ?? p.startAt ?? null,
    endAt: p.end_at ?? p.endAt ?? null,
    timezone: p.timezone ?? "Asia/Bangkok",
  };
}

function denormalizePromotion(p) {
  return {
    id: p.id ?? null,
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
    timezone: p.timezone || "Asia/Bangkok",
  };
}

function extractProducts(raw) {
  if (Array.isArray(raw)) return raw;
  return raw?.items || raw?.data || raw?.content || raw?.results || [];
}

function normalizeProduct(x) {
  const rawCat = x.category;
  const rawBrand = x.brand;

  const catObj = rawCat && typeof rawCat === "object" ? rawCat : null;
  const brObj = rawBrand && typeof rawBrand === "object" ? rawBrand : null;

  const categoryName =
    x.categoryName ??
    x.category_name ??
    (typeof rawCat === "string" ? rawCat : undefined) ??
    catObj?.name ??
    "";

  const brandName =
    x.brandName ??
    x.brand_name ??
    (typeof rawBrand === "string" ? rawBrand : undefined) ??
    brObj?.name ??
    "";

  return {
    id: x.id,
    pid: x.product_id ?? x.productId ?? x.code ?? x.sku ?? null,
    name: x.name ?? "-",
    price: Number(x.price ?? 0),

    categoryId:
      x.categoryId ??
      x.category_id ??
      (typeof rawCat === "number" ? rawCat : undefined) ??
      catObj?.id ??
      null,
    category: categoryName,

    brandId:
      x.brandId ??
      x.brand_id ??
      (typeof rawBrand === "number" ? rawBrand : undefined) ??
      brObj?.id ??
      null,
    brand: brandName,

    inStock: x.in_stock ?? x.inStock ?? true,
  };
}


/* -------------------- Real API wrappers -------------------- */
async function getJSON(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "Request failed");
    throw new Error(txt || "Request failed");
  }
  return res.json();
}

async function sendJSON(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "Request failed");
    throw new Error(txt || "Request failed");
  }
  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}

async function listPromotions({ q = "", status = "" } = {}) {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (status) qs.set("status", status);
  const raw = await getJSON(
    `${API}/api/promotions${qs.toString() ? `?${qs}` : ""}`
  );
  return extractPromotions(raw).map(normalizePromotion);
}

async function getPromotion(id) {
  const p = await getJSON(`${API}/api/promotions/${encodeURIComponent(id)}`);
  return normalizePromotion(p);
}

async function createPromotion(data) {
  const body = denormalizePromotion(data);
  const created = await sendJSON(`${API}/api/promotions`, "POST", body);
  return normalizePromotion(created);
}

async function updatePromotion(id, patch) {
  const body = denormalizePromotion(patch);
  const updated = await sendJSON(
    `${API}/api/promotions/${encodeURIComponent(id)}`,
    "PUT",
    body
  );
  return normalizePromotion(updated);
}

async function listProducts() {
  const raw = await getJSON(`${API}/api/products`);
  return extractProducts(raw).map(normalizeProduct);
}

async function listProductsOfPromotion(pid) {
  const raw = await getJSON(
    `${API}/api/promotions/${encodeURIComponent(pid)}/products`
  );
  return extractProducts(raw).map(normalizeProduct);
}

async function attachProducts(promoId, productIds = []) {
  const body = { productIds };
  return sendJSON(
    `${API}/api/promotions/${encodeURIComponent(promoId)}/products`,
    "POST",
    body
  );
}

async function detachProduct(promoId, productId) {
  const res = await fetch(
    `${API}/api/promotions/${encodeURIComponent(
      promoId
    )}/products/${encodeURIComponent(productId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "delete failed");
    throw new Error(txt || "delete failed");
  }
  return true;
}

/* -------------------- UI -------------------- */

function makeBlankPromotion() {
  return {
    id: null,
    name: "",
    code: "",
    description: "",
    promoType: "PERCENT_OFF",
    scope: "ORDER",
    percentOff: null,
    amountOff: null,
    fixedPrice: null,
    buyQty: null,
    getQty: null,
    appliesToShipping: false,
    minOrderAmount: null,
    minQuantity: null,
    stackMode: "EXCLUSIVE",
    priority: 100,
    status: "DRAFT",
    startAt: null,
    endAt: null,
    timezone: "Asia/Bangkok",
  };
}

export default function AdminPromotion() {
  // ===== Left: Promotion List & Editor =====
  const [promotions, setPromotions] = useState([]);
  const [pQ, setPQ] = useState("");
  const [pStatus, setPStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);   // popup แจ้งผล Save
  const [alertText, setAlertText] = useState("");

  // ===== Right: Product picker =====
  const [allProducts, setAllProducts] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [prodQ, setProdQ] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [picked, setPicked] = useState(new Set());

  const [masterCategories, setMasterCategories] = useState([]);
  const [masterBrands, setMasterBrands] = useState([]);
  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        const [ps, products] = await Promise.all([
          listPromotions(),
          listProducts(),
        ]);
        console.log("products from API:", products);
        setPromotions(ps);
        setAllProducts(products);
        if (ps.length) {
          setSelectedId(ps[0].id);
        }
      } catch (e) {
        setMsg(` ${e.message || "Load error"}`);
      }
    })();
  }, []);


  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setMsg("");
      setIsNew(false);
      try {
        const [p, linked] = await Promise.all([
          getPromotion(selectedId),
          listProductsOfPromotion(selectedId),
        ]);
        setCurrent(p);
        setAssigned(linked);
        setPicked(new Set());
      } catch (e) {
        setMsg(` ${e.message || "Load error"}`);
      }
    })();

  }, [selectedId]);

  async function refreshPromotions() {
    try {
      const ps = await listPromotions({ q: pQ, status: pStatus });
      setPromotions(ps);
    } catch (e) {
      setMsg(` ${e.message || "Load error"}`);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const safeFetch = async (url) => {
      try {
        const r = await fetch(url, { headers: { Accept: "application/json" } });
        if (!r.ok) return null;
        return await r.json();
      } catch {
        return null;
      }
    };

    (async () => {
      const [cats, brs] = await Promise.all([
        safeFetch(`${API}/api/categories`),
        safeFetch(`${API}/api/brands`),
      ]);
      if (cancelled) return;
      if (Array.isArray(cats)) setMasterCategories(cats);
      if (Array.isArray(brs)) setMasterBrands(brs);
    })();

    return () => {
      cancelled = true;
    };
  }, []);


  // New promotion
  function handleNewPromotion() {
    setSelectedId(null);
    setIsNew(true);
    setCurrent(makeBlankPromotion());
    setAssigned([]);
    setPicked(new Set());
    setMsg("");
  }

  // Derived filters for products
  const categories = useMemo(() => {
    if (masterCategories.length) {
      // API /api/categories น่าจะเป็น { id, name }
      return masterCategories
        .filter((c) => c && c.id && c.name)
        .map((c) => ({ id: c.id, name: c.name }));
    }

    // fallback จาก products
    const map = new Map();
    for (const p of allProducts) {
      if (p.categoryId && p.category && !map.has(p.categoryId)) {
        map.set(p.categoryId, { id: p.categoryId, name: p.category });
      }
    }
    return Array.from(map.values());
  }, [masterCategories, allProducts]);

  const brands = useMemo(() => {
    if (masterBrands.length) {
      return masterBrands
        .filter((b) => b && b.id && b.name)
        .map((b) => ({ id: b.id, name: b.name }));
    }

    const map = new Map();
    for (const p of allProducts) {
      if (p.brandId && p.brand && !map.has(p.brandId)) {
        map.set(p.brandId, { id: p.brandId, name: p.brand });
      }
    }
    return Array.from(map.values());
  }, [masterBrands, allProducts]);

  // brand ที่ต้องใช้ตาม filterCat
  const brandOptions = useMemo(() => {
    if (!filterCat) return brands;

    const set = new Set(
      allProducts
        .filter((p) => p.category === filterCat)
        .map((p) => p.brand)
        .filter(Boolean)
    );

    return brands.filter((b) => set.has(b.name));
  }, [filterCat, brands, allProducts]);



  const assignedIds = useMemo(
    () => new Set(assigned.map((x) => x.id)),
    [assigned]
  );

  const availableProducts = useMemo(() => {
    let list = allProducts.filter((p) => !assignedIds.has(p.id));

    if (prodQ.trim()) {
      const q = prodQ.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.pid || p.id).toLowerCase().includes(q)
      );
    }

    if (filterCat) {
      list = list.filter((p) => p.category === filterCat);
    }
    if (filterBrand) {
      list = list.filter((p) => p.brand === filterBrand);
    }

    return list.slice(0, 200);
  }, [allProducts, assignedIds, prodQ, filterCat, filterBrand]);



  async function handleAttachPicked() {
    if (!current || !current.id || picked.size === 0) return;
    try {
      const ids = Array.from(picked);
      await attachProducts(current.id, ids);
      const linked = await listProductsOfPromotion(current.id);
      setAssigned(linked);
      setPicked(new Set());
      setMsg("Attached products to promotion.");
    } catch (e) {
      setMsg(`Attach failed: ${e.message}`);
    }
  }

  // กดปุ่ม Remove → แค่เปิดกล่องยืนยัน
  function handleAskDetach(product) {
    if (!current || !current.id) return;
    setConfirmTarget(product);
    setConfirmOpen(true);
  }

  // กด Confirm ใน modal → ลบจริง
  async function handleConfirmDetach() {
    if (!current || !current.id || !confirmTarget) return;

    try {
      await detachProduct(current.id, confirmTarget.id);
      setAssigned(prev => prev.filter(x => x.id !== confirmTarget.id));
      setMsg("Removed.");
    } catch (e) {
      setMsg(` Remove failed: ${e.message}`);
    } finally {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  }

  // กด Cancel / ปิด modal
  function handleCancelDetach() {
    setConfirmOpen(false);
    setConfirmTarget(null);
  }


  async function handleSavePromotion() {
    if (!current) return;
    setSaving(true);
    setMsg("");
    try {
      let saved;
      let text = "";

      if (isNew || !current.id) {
        // CREATE
        saved = await createPromotion(current);
        setIsNew(false);
        setCurrent(saved);
        setSelectedId(saved.id);
        text = "Promotion has been created successfully.";
      } else {
        // UPDATE
        saved = await updatePromotion(current.id, current);
        setCurrent(saved);
        text = "Promotion has been saved successfully.";
      }

      await refreshPromotions();

      // แสดง popup แบบสวย ๆ
      setAlertText(text);
      setAlertOpen(true);
    } catch (e) {
      setMsg(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }



  return (
    <div className="promo-page">
      <header className="promo-header">
        <div className="left">
          <h1>Promotion Manager</h1>
          <p className="muted">
            Create, edit and assign promotions to products from your database.
          </p>
        </div>
        <div className="right">
          <button className="btn primary" onClick={handleNewPromotion}>
            + New promotion
          </button>
        </div>
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
              <select
                className="inp"
                value={pStatus}
                onChange={(e) => setPStatus(e.target.value)}
              >
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
                  className={
                    "promo-item" +
                    (selectedId === p.id && !isNew ? " active" : "")
                  }
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

            {isNew && (
              <div className="promo-item active new">
                <div className="pi-name">New promotion (unsaved)</div>
                <div className="pi-sub">
                  <span className="pill ghost">DRAFT</span>
                </div>
              </div>
            )}
          </div>

          {/* Editor */}
          {current && (
            <div className="editor">
              <h3>{isNew ? "Create Promotion" : "Edit Promotion"}</h3>
              <div className="form">
                <label>
                  <span>Name</span>
                  <input
                    className="inp"
                    value={current.name}
                    onChange={(e) =>
                      setCurrent({ ...current, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Code (optional)</span>
                  <input
                    className="inp"
                    value={current.code || ""}
                    onChange={(e) =>
                      setCurrent({ ...current, code: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>Description</span>
                  <textarea
                    className="inp"
                    rows={3}
                    value={current.description || ""}
                    onChange={(e) =>
                      setCurrent({ ...current, description: e.target.value })
                    }
                  />
                </label>

                <div className="row gap row-type-scope-status">
                  <label className="flex">
                    <span>Type</span>
                    <select
                      className="inp"
                      value={current.promoType}
                      onChange={(e) =>
                        setCurrent({ ...current, promoType: e.target.value })
                      }
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
                      onChange={(e) =>
                        setCurrent({ ...current, scope: e.target.value })
                      }
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
                      onChange={(e) =>
                        setCurrent({ ...current, status: e.target.value })
                      }
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
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          percentOff: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          amountOff: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          fixedPrice: e.target.value,
                        })
                      }
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
                        onChange={(e) =>
                          setCurrent({
                            ...current,
                            buyQty: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setCurrent({
                            ...current,
                            getQty: e.target.value,
                          })
                        }
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
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          stackMode: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          priority: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          startAt: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="flex">
                    <span>End at</span>
                    <input
                      className="inp"
                      type="datetime-local"
                      value={fmtDT(current.endAt)}
                      onChange={(e) =>
                        setCurrent({
                          ...current,
                          endAt: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <div className="row end">
                  <button
                    className="btn primary"
                    disabled={saving}
                    onClick={handleSavePromotion}
                  >
                    {saving
                      ? isNew
                        ? "Creating…"
                        : "Saving…"
                      : isNew
                        ? "Create"
                        : "Save"}
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
              {!current || !current.id ? (
                <div className="muted">
                  Save promotion first before assigning products.
                </div>
              ) : assigned.length === 0 ? (
                <div className="muted">No products assigned.</div>
              ) : (
                assigned.map((p) => (
                  <div key={p.id} className="row assigned-item">
                    <div className="grow">
                      <div className="title">{p.name}</div>
                      <div className="sub">
                        {p.brand && p.category
                          ? `${p.brand} • ${p.category}`
                          : p.brand || p.category || ""}
                      </div>
                    </div>
                    <button
                      className="btn ghost danger"
                      onClick={() => handleAskDetach(p)} 
                    >
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
              <select
                className="inp"
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="inp"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
              >
                <option value="">All brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>



            </div>

            <div className="picker">
              {!current || !current.id ? (
                <div className="muted">
                  Create/Save promotion first to attach products.
                </div>
              ) : availableProducts.length === 0 ? (
                <div className="muted">No products found.</div>
              ) : (
                availableProducts.map((p) => {
                  const checked = picked.has(p.id);
                  return (
                    <label
                      key={p.id}
                      className={"pick-item" + (checked ? " picked" : "")}
                    >
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
                          {p.brand} • {p.category} • ฿
                          {p.price.toFixed(2)}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="row end">
              <button
                className="btn"
                disabled={!current || !current.id || picked.size === 0}
                onClick={handleAttachPicked}
              >
                Attach Selected ({picked.size})
              </button>
            </div>
          </div>
        </section>
      </div>
      {confirmOpen && (
        <div className="promo-confirm-overlay">
          <div className="promo-confirm-dialog">
            <h3>Please Confirm</h3>
            <p>
              This product will be removed from this promotion.
              Are you sure you want to continue?
            </p>

            <div className="promo-confirm-actions">
              <button
                type="button"
                className="promo-btn-cancel"
                onClick={handleCancelDetach}
              >
                Cancel
              </button>
              <button
                type="button"
                className="promo-btn-confirm"
                onClick={handleConfirmDetach}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {alertOpen && (
        <div className="promo-confirm-overlay">
          <div className="promo-confirm-dialog">
            <h3>Success</h3>
            <p>{alertText}</p>

            <div className="promo-confirm-actions">
              <button
                type="button"
                className="promo-btn-confirm"
                onClick={() => setAlertOpen(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
