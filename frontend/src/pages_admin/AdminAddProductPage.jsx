// src/pages_admin/AdminAddProductPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// import "./AdminEditProductPage.css";
import "./AdminAddProductPage.css";

export default function AdminAddProductPage() {
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
  const navigate = useNavigate();

  // ── master data (fallback) ────────────────────────────────────────────────────
  const fallbackCategories = [
    { id: 1, name: "Jasmine Rice" },
    { id: 2, name: "Canned Fish" },
    { id: 3, name: "Fried Chicken (Frozen)" },
    { id: 4, name: "Garlic & Onion" },
    { id: 5, name: "Imported Fruit" },
  ];
  const fallbackBrands = [
    { id: 1, name: "Chatra" },
    { id: 2, name: "Sealext" },
    { id: 3, name: "CP" },
    { id: 4, name: "NO BRAND" },
    { id: 5, name: "LOTUSS NO BRAND" },
  ];
  const [categories, setCategories] = useState(fallbackCategories);
  const [brands, setBrands] = useState(fallbackBrands);

  // ── form state ────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    productId: "",
    name: "",
    description: "",
    price: "",
    quantity: "", // ว่างได้เพื่อให้เตือน
    categoryId: "",
    brandId: "",
    inStock: true, // จะถูกบังคับตาม quantity
  });

  // ── image state ───────────────────────────────────────────────────────────────
  const [serverCoverUrl, setServerCoverUrl] = useState(""); // ควรเป็น "" เสมอในหน้า Add
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // ── refs ─────────────────────────────────────────────────────────────────────
  const dropzoneRef = useRef(null);
  const filePickerRef = useRef(null);
  const hintRef = useRef(null);

  // ── ui state ─────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [qtyError, setQtyError] = useState("");

  // ── โหลดหมวด/ยี่ห้อ (ถ้ามี endpoint จริง) ───────────────────────────────────
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
        safeFetch(`${API_URL}/api/categories`),
        safeFetch(`${API_URL}/api/brands`),
      ]);
      if (cancelled) return;
      if (Array.isArray(cats) && cats.length) setCategories(cats);
      if (Array.isArray(brs) && brs.length) setBrands(brs);
    })();
    return () => { cancelled = true; };
  }, [API_URL]);

  // ── พรีวิวไฟล์ใหม่ ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!coverFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const displayImageUrl = previewUrl || serverCoverUrl;

  // ── sync dropzone + ปุ่มลบรูป (ยืนยันก่อนลบ) ────────────────────────────────
  useEffect(() => {
    const dz = dropzoneRef.current;
    if (!dz) return;

    dz.style.backgroundImage = "";
    dz.classList.remove("cover", "has-image");
    if (displayImageUrl) {
      dz.style.backgroundImage = `url("${displayImageUrl}")`;
      dz.classList.add("cover", "has-image");
      if (hintRef.current) hintRef.current.style.display = "none";
      ensureRemoveBtn();
    } else {
      if (hintRef.current) hintRef.current.style.display = "";
      removeRemoveBtn();
    }

    function ensureRemoveBtn() {
      if (dz.querySelector(".cover-remove")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cover-remove";
      btn.textContent = "×";
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const ok = window.confirm("ภาพจะถูกลบ ต้องการลบหรือไม่?");
        if (!ok) return;

        // ในหน้า Add ยังไม่มีรูปบนเซิร์ฟเวอร์ → เคลียร์สถานะในฟอร์มพอ
        setCoverFile(null);
        setServerCoverUrl("");

        dz.style.backgroundImage = "";
        dz.classList.remove("cover", "has-image");
        if (hintRef.current) hintRef.current.style.display = "";
        removeRemoveBtn();
      });
      dz.appendChild(btn);
    }
    function removeRemoveBtn() {
      dz.querySelectorAll(".cover-remove").forEach((b) => b.remove());
    }
  }, [displayImageUrl]);

  // ── อัปโหลดรูป ───────────────────────────────────────────────────────────────
  const onZoneClick = (e) => {
    if (e.target.closest(".cover-remove")) return;
    filePickerRef.current?.click();
  };
  const onDragEnter = (e) => { e.preventDefault(); dropzoneRef.current?.classList.add("dragover"); };
  const onDragOver  = (e) => { e.preventDefault(); };
  const onDragLeave = (e) => { e.preventDefault(); dropzoneRef.current?.classList.remove("dragover"); };
  const onDrop = (e) => {
    e.preventDefault();
    dropzoneRef.current?.classList.remove("dragover");
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    if (files[0]) setCoverFile(files[0]);
  };
  const onPickCover = (e) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) setCoverFile(f);
  };

  // ── validation helpers ────────────────────────────────────────────────────────
  const toInt = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Math.trunc(Number(String(v).replace(/[^\d-]/g, "")));
    return Number.isFinite(n) ? n : null;
  };

  const validateQuantity = (raw) => {
    if (raw === "" || raw === null || raw === undefined) {
      return { ok: false, msg: "กรุณากรอกจำนวนสต็อก" };
    }
    const n = toInt(raw);
    if (n === null || Number.isNaN(n)) return { ok: false, msg: "จำนวนต้องเป็นตัวเลขจำนวนเต็ม" };
    if (n < 0) return { ok: false, msg: "ห้ามจำนวนติดลบ" };
    if (n > 1000000) return { ok: false, msg: "ห้ามเกิน 1,000,000 ชิ้น" };
    return { ok: true, msg: "" };
  };

  // ── form handlers ─────────────────────────────────────────────────────────────
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const onNumberChange = (e) => {
    const { name, value } = e.target;
    if (name === "quantity") {
      const cleaned = value.replace(/[^\d]/g, "");
      const limited = cleaned === "" ? "" : String(Math.min(Number(cleaned), 1000000));
      setForm((s) => ({ ...s, [name]: limited }));
      const res = validateQuantity(limited);
      setQtyError(res.ok ? "" : res.msg);
      return;
    }
    setForm((s) => ({ ...s, [name]: value }));
  };

  // กันเว้นวรรคใน Product ID
  const onProductIdChange = (e) => {
    const v = (e.target.value ?? "").toString().replace(/\s+/g, "");
    setForm((s) => ({ ...s, productId: v }));
  };

  // บังคับ inStock ตามจำนวน: 0 -> false, ≥1 -> true
  useEffect(() => {
    const n = toInt(form.quantity);
    if (n === null) return;
    const forced = n >= 1;
    if (form.inStock !== forced) {
      setForm((s) => ({ ...s, inStock: forced }));
    }
  }, [form.quantity]); // eslint-disable-line react-hooks/exhaustive-deps

  const onCancel = (e) => {
    e.preventDefault();
    navigate("/admin/products");
  };

  const onSave = async (e) => {
    e.preventDefault();
    setMsg("");

    // validate ก่อน
    const res = validateQuantity(form.quantity);
    if (!res.ok) { setQtyError(res.msg); return; }

    setSaving(true);
    try {
      const nQty = toInt(form.quantity) ?? 0;
      const sanitizeNumber = (v, fallback) => {
        if (v === "" || v === null || v === undefined) return fallback;
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
      };

      const payload = {
        productId: (form.productId ?? "").trim(),
        name: (form.name ?? "").trim(),
        description: (form.description ?? "").trim(),
        price: sanitizeNumber(form.price, 0),
        quantity: nQty,
        inStock: nQty >= 1,
        categoryId: form.categoryId || null,
        brandId: form.brandId || null,
      };

      if (!payload.productId) throw new Error("กรุณากรอก Product ID");
      if (!payload.name) throw new Error("กรุณากรอกชื่อสินค้า");
      if (!Number.isFinite(payload.price) || payload.price < 0) throw new Error("ราคาไม่ถูกต้อง");

      // 1) สร้างสินค้า
      const resCreate = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resCreate.ok) {
        const t = await resCreate.text().catch(() => "");
        throw new Error(t || `HTTP ${resCreate.status}`);
      }
      const created = await resCreate.json(); // ต้องได้ { id, ... }

      // 2) อัปโหลดรูป cover ถ้ามีไฟล์
      if (coverFile && created?.id != null) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const upImg = await fetch(`${API_URL}/api/products/${encodeURIComponent(created.id)}/cover`, {
          method: "POST",
          body: fd,
        });
        if (!upImg.ok) {
          const t = await upImg.text().catch(() => "");
          setMsg(`เพิ่มสินค้าสำเร็จ แต่รูปอัปโหลดไม่สำเร็จ: ${t || upImg.status}`);
        }
      }

      setMsg("เพิ่มสินค้าเรียบร้อย");
      navigate("/admin/products");
    } catch (err) {
      setMsg(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // --------- RENDER (ดีไซน์เดียวกับหน้า Edit) ---------
  return (
    <div className="app" data-page="AdminAddProductPage">
      <main className="main">
        <div className="content">
          <div className="content-header">
            <h1 className="title">Add PRODUCT</h1>
            <div className="header-actions" />
          </div>

          <div className="grid">
            {/* Left card: form */}
            <section className="card">
              {/* Product ID */}
              <div className="field">
                <label>Product ID *</label>
                <input
                  name="productId"
                  type="text"
                  placeholder="เช่น #00001 หรือ 00001"
                  value={form.productId}
                  onChange={onProductIdChange}
                  required
                />
              </div>

              <div className="field">
                <label>Product name *</label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g., Apple Fuji"
                  value={form.name}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="row">
                <div className="field">
                  <label>Category *</label>
                  <select
                    name="categoryId"
                    value={form.categoryId || ""}
                    autoComplete="off"
                    onChange={onChange}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Price</label>
                  <input
                    name="price"
                    type="text"
                    placeholder="0.00"
                    value={form.price}
                    onChange={onNumberChange}
                  />
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label>Brand *</label>
                  <select
                    name="brandId"
                    value={form.brandId}
                    onChange={onChange}
                    required
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stock + validations */}
                <div className="field">
                  <label>Stock (จำนวนคงเหลือ) *</label>
                  <input
                    name="quantity"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="1000000"
                    placeholder="0"
                    value={form.quantity}
                    onChange={onNumberChange}
                  />
                  {qtyError && (
                    <small style={{ color: "#b91c1c", display: "block", marginTop: 4 }}>
                      {qtyError}
                    </small>
                  )}
                  {toInt(form.quantity) !== null && (
                    <small style={{ color: "#374151", display: "block", marginTop: 4 }}>
                      Status: {toInt(form.quantity) >= 1 ? "In stock" : "Out of stock"}
                    </small>
                  )}
                </div>
              </div>

              <div className="field">
                <label>Description *</label>
                <textarea
                  name="description"
                  rows={6}
                  placeholder="Short description..."
                  value={form.description}
                  onChange={onChange}
                  required
                />
              </div>
            </section>

            {/* Right card: image area + buttons */}
            <section className="card">
              <h3 style={{ margin: "4px 0 10px", fontSize: 16 }}>Upload images</h3>

              <div
                className="image-drop"
                id="dropzone"
                aria-label="Upload images area"
                ref={dropzoneRef}
                onClick={onZoneClick}
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div
                  className="hint"
                  id="hint"
                  ref={hintRef}
                  role="button"
                  tabIndex={0}
                  style={{ color: "#6b7280", cursor: "pointer" }}
                />
                <div id="thumbs" className="thumbs" />
              </div>

              <div className="actions">
                <button className="btn ghost" type="button" onClick={onCancel}>
                  Cancel
                </button>
                <button
                  className="btn primary"
                  type="button"
                  onClick={onSave}
                  disabled={saving || !!qtyError || form.quantity === ""}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              <input
                id="filePicker"
                ref={filePickerRef}
                type="file"
                accept="image/*"
                multiple={false}
                hidden
                onChange={onPickCover}
              />
            </section>
          </div>

          {msg && <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</p>}
          <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>API_URL: {API_URL}</p>
        </div>
      </main>
    </div>
  );
}
