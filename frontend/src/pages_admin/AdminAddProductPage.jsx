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
  const productIdRef = useRef(null);
  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const qtyRef = useRef(null);


  // ── ui state ─────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  // ✅ Modal แจ้งเตือนแบบ custom
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertList, setAlertList] = useState([]);
  const showAlert = (items) => { setAlertList(items); setAlertOpen(true); };

  const [qtyError, setQtyError] = useState("");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");

  // inline errors per field
  const [errors, setErrors] = useState({});
  const setFieldError = (field, msg) =>
    setErrors((s) => ({ ...s, [field]: msg }));
  const clearFieldError = (field) =>
    setErrors((s) => { const n = { ...s }; delete n[field]; return n; });


  // --- Product ID validations ---
  const [pidError, setPidError] = useState("");
  const [checkingPid, setCheckingPid] = useState(false);
  const [pidOkUnique, setPidOkUnique] = useState(null); // true/false/null

  const digitsOnly = (s) => (s ?? "").toString().replace(/\D/g, "");
  const validateProductId = (raw) => {
    const v = digitsOnly(raw);
    if (v.length === 0) return { ok: false, msg: "กรุณากรอกตัวเลข 1–5 หลัก" };
    if (v.length > 5) return { ok: false, msg: "ห้ามเกิน 5 หลัก" };
    return { ok: true, msg: "", value: v };
  };

  const normCode = (v) => {
    const d = String(v ?? "").replace(/\D/g, "");
    return d.replace(/^0+/, "") || "0";
  };


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
  const onDragOver = (e) => { e.preventDefault(); };
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
    if (name === "name") setNameError("");
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

    if (name === "price") {
      // ✅ กรองให้เหลือเฉพาะตัวเลขและจุดทศนิยม
      let cleaned = value.replace(/[^\d.]/g, "");

      // ✅ จำกัดให้ไม่เกิน 2 จุดทศนิยม
      const parts = cleaned.split(".");
      if (parts.length > 2) cleaned = parts[0] + "." + parts[1];

      // ✅ จำกัดราคาไม่เกิน 10000
      const num = Number(cleaned);
      if (num > 10000) cleaned = "10000";

      setForm((s) => ({ ...s, price: cleaned }));
      setPriceError("");
      return;
    }

    setForm((s) => ({ ...s, [name]: value }));
  };



  // กันเว้นวรรคใน Product ID
  const onProductIdChange = (e) => {
    const v = digitsOnly(e.target.value).slice(0, 5); // ตัวเลขเท่านั้น สูงสุด 5 หลัก
    setForm((s) => ({ ...s, productId: v }));
    const vr = validateProductId(v);
    setPidError(vr.ok ? "" : vr.msg);
    setPidOkUnique(null); // reset ผลเช็คซ้ำทุกครั้งที่พิมพ์
  };

  const onProductIdBlur = async () => {
    const pidRes = validateProductId(form.productId);

    // ถ้ากรอกไม่ถูกต้อง
    if (!pidRes.ok) {
      setPidError(pidRes.msg);
      productIdRef.current?.focus();
      return;
    }

    setCheckingPid(true);
    try {
      const dup = await clientCheckDuplicateProductId(pidRes.value);

      // ถ้ามีรหัสสินค้าซ้ำ
      if (dup) {
        setPidError("รหัสสินค้านี้ถูกใช้แล้ว");
        productIdRef.current?.focus();
        return;
      }

      // ถ้าไม่ซ้ำ
      setPidError("");
    } finally {
      setCheckingPid(false);
    }
  };






  // เช็คซ้ำแบบ client: พยายามเรียกด้วย query ก่อน ไม่ได้ค่อยดึงทั้งหมดแล้ว filter
  const clientCheckDuplicateProductId = async (pid) => {
    if (!pid) return false;
    const target = normCode(pid);

    // ใช้ฟังก์ชันช่วยเช็กซ้ำ (เทียบแบบ normalize)
    const isDupHit = (rec) => normCode(rec?.productId) === target;

    // 1) พยายาม query ก่อน
    const queryCandidates = [
      `${API_URL}/api/products?productId=${encodeURIComponent(pid)}`,
      `${API_URL}/api/products/search?productId=${encodeURIComponent(pid)}`,
    ];
    for (const url of queryCandidates) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();
        if (Array.isArray(data)) return data.some(isDupHit);
        if (data && typeof data === "object") return isDupHit(data);
      } catch { }
    }

    // 2) fallback ดึงลิสต์ทั้งหมดแล้วเช็ก
    const listCandidates = [
      `${API_URL}/api/products`,
      `${API_URL}/api/products/all`,
      `${API_URL}/api/products?size=1000`,
      `${API_URL}/api/products/list`,
    ];
    for (const url of listCandidates) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const arr = await r.json();
        if (Array.isArray(arr)) return arr.some(isDupHit);
      } catch { }
    }
    // ถ้าเรียกไม่ได้ ให้ถือว่า “ไม่รู้” → ไปดัก 409 ตอน POST
    return false;
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
    setPidError("");
    setQtyError("");
    setNameError("");
    setPriceError("");

    // กันกดระหว่างกำลังเช็ค PID
    if (checkingPid) return;

    // ---------- ตรวจ “สิ่งที่ต้องมี” แบบรวมแล้วแจ้งทีเดียว ----------
    const missing = [];
    let firstFocus = null;

    // name
    if (!String(form.name || "").trim()) {
      setNameError("กรุณากรอกชื่อสินค้า");
      missing.push("กรุณากรอกชื่อสินค้า");
      firstFocus ||= nameRef.current;
    }

    // price > 0
    // ---- Price ----
    if (form.price === "") {
      const msg = "กรุณากรอกราคา";
      setPriceError(msg);
      missing.push(msg);
      firstFocus ||= priceRef.current;
    } else {
      const nPrice = Number(form.price);
      if (!Number.isFinite(nPrice)) {
        const msg = "ราคาต้องเป็นตัวเลขเท่านั้น";
        setPriceError(msg);
        missing.push(msg);
        firstFocus ||= priceRef.current;
      } else if (nPrice <= 0) {
        const msg = "ราคาต้องมากกว่า 0";
        setPriceError(msg);
        missing.push(msg);
        firstFocus ||= priceRef.current;
      } else if (nPrice > 10000) {
        const msg = "ราคาห้ามเกิน 10,000";
        setPriceError(msg);
        missing.push(msg);
        firstFocus ||= priceRef.current;
      }
    }


    // quantity (จำนวนสต็อก)
    if (form.quantity === "") {
      setQtyError("กรุณากรอกจำนวนสต็อก");
      missing.push("กรุณากรอกจำนวนสต็อก");
      firstFocus ||= qtyRef.current;
    } else {
      const qRes = validateQuantity(form.quantity);
      if (!qRes.ok) {
        setQtyError(qRes.msg);
        missing.push(qRes.msg);
        firstFocus ||= qtyRef.current;
      }
    }

    // category / brand
    if (!form.categoryId) missing.push("กรุณาเลือก Category");
    if (!form.brandId) missing.push("กรุณาเลือก Brand");

    // ถ้ายังขาดอย่างใดอย่างหนึ่ง → แจ้งทั้งหมดทีเดียวแล้วโฟกัสช่องแรก
    if (missing.length) {
      showAlert(missing);                                 // ✅ ใช้ modal
      (firstFocus || nameRef.current || productIdRef.current)?.focus();
      return;
    }

    // ----------------------------------------------------------------

    // ตรวจ Product Code
    const pidRes = validateProductId(form.productId);
    if (!pidRes.ok) {
      setPidError(pidRes.msg);
      productIdRef.current?.focus();
      return;
    }

    // กันซ้ำฝั่ง client
    const dupOnClient = await clientCheckDuplicateProductId(pidRes.value);
    if (dupOnClient) {
      setPidError("รหัสสินค้านี้ถูกใช้แล้ว");
      productIdRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const nQty = Math.trunc(Number(String(form.quantity).replace(/[^\d-]/g, ""))) || 0;
      const nPrice = Number(form.price);

      const payload = {
        productId: pidRes.value,
        name: String(form.name || "").trim(),
        description: String(form.description || "").trim(),
        price: nPrice,
        quantity: nQty,
        inStock: nQty >= 1,
        categoryId: Number(form.categoryId),
        brandId: Number(form.brandId),
      };

      const resCreate = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (resCreate.status === 409) {
        setPidError("รหัสสินค้านี้ถูกใช้แล้ว");
        window.alert("Product ID ซ้ำ: กรุณาใช้หมายเลขอื่น");
        productIdRef.current?.focus();
        throw new Error("ไม่สามารถเพิ่มสินค้าได้: Product ID ซ้ำ");
      }

      if (!resCreate.ok) {
        const t = await resCreate.text().catch(() => "");
        throw new Error(t || `HTTP ${resCreate.status}`);
      }

      const created = await resCreate.json();

      // อัปโหลดรูป (ถ้ามี)
      if (coverFile && created?.id != null) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const upImg = await fetch(
          `${API_URL}/api/products/${encodeURIComponent(created.id)}/cover`,
          { method: "POST", body: fd }
        );
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
                <label>Product Code *</label> {/* แก้ */}
                <input
                  name="productId"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{1,5}"
                  maxLength={5}
                  placeholder="เช่น 00001 (ตัวเลขไม่เกิน 5 หลัก)"
                  value={form.productId}
                  onChange={onProductIdChange}
                  onBlur={onProductIdBlur}                 // ← เปลี่ยนมาใช้ handler ใหม่
                  ref={productIdRef}                       // ← ผูก ref เพื่อโฟกัสกลับ
                  required
                />
                {pidError && (
                  <small style={{ color: "#b91c1c", display: "block", marginTop: 4 }}>
                    {pidError}
                  </small>
                )}
                {checkingPid && (
                  <small style={{ color: "#374151", display: "block", marginTop: 4 }}>
                    กำลังตรวจสอบรหัสซ้ำ...
                  </small>
                )}


              </div>

              {/* Product name */}
              <div className="field">
                <label>Product name *</label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g., Apple Fuji"
                  value={form.name}
                  onChange={onChange}
                  ref={nameRef}
                  required
                />
                {nameError && (
                  <small style={{ color: "#b91c1c", display: "block", marginTop: 4 }}>
                    {nameError}
                  </small>
                )}
              </div>


              <div className="row">
                <div className="field">
                  <label>Category *</label>
                  <select
                    name="categoryId"
                    value={form.categoryId || ""}   // คงให้เป็น "" ตอนเปิดหน้า
                    autoComplete="off"
                    onChange={onChange}
                    required
                  >
                    <option value="" disabled>— Select Category —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="field">
                  <label>Price *</label>
                  <input
                    name="price"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.price}
                    onChange={onNumberChange}
                    ref={priceRef}
                  />

                  {priceError && (
                    <small style={{ color: "#b91c1c", display: "block", marginTop: 4 }}>
                      {priceError}
                    </small>
                  )}
                </div>

              </div>

              <div className="row">
                <div className="field">
                  <label>Brand *</label>
                  <select
                    name="brandId"
                    value={form.brandId || ""}      // คงให้เป็น "" ตอนเปิดหน้า
                    onChange={onChange}
                    required
                  >
                    <option value="" disabled>— Select Brand —</option>
                    {brands.map((b) => (
                      <option key={b.id} value={String(b.id)}>{b.name}</option>
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
                    ref={qtyRef}
                  />
                  {(qtyError || errors.quantity) && (
                    <small style={{ color: "#b91c1c", display: "block", marginTop: 4 }}>
                      {qtyError || errors.quantity}
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
                <label>Description</label>
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
                  disabled={saving || checkingPid || !!pidError}
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
          <p
            style={{
              position: "absolute",
              bottom: 0,
              left: 10,
              fontSize: 12,
              color: "rgba(102,102,102,0.2)",
              zIndex: -1,            // ✅ ดันไปอยู่ “หลัง” layer อื่นทั้งหมด
              pointerEvents: "none",
            }}
          >
            API_URL: {API_URL}
          </p>

        </div>
        {alertOpen && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999
          }}>
            <div style={{
              width: "min(560px, 92vw)", background: "#fff", borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)", padding: 24
            }}>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>โปรดตรวจสอบ</h3>
              <ul style={{ margin: "14px 0 0 18px" }}>
                {alertList.map((m, i) => <li key={i} style={{ marginBottom: 6 }}>{m}</li>)}
              </ul>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setAlertOpen(false)}
                  style={{ padding: "10px 28px", borderRadius: 10, fontWeight: 600, fontSize: 15 }}
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
