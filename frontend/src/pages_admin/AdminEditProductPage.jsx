// src/pages_admin/AdminEditProductPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminEditProductPage.css";

export default function AdminEditProductPage() {
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
  const { id } = useParams();
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
    quantity: "",
    categoryId: "",
    brandId: "",
    inStock: true,
  });
  const [original, setOriginal] = useState(null);

  // ── image state ───────────────────────────────────────────────────────────────
  const [serverCoverUrl, setServerCoverUrl] = useState("");
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [qtyError, setQtyError] = useState("");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [pidError, setPidError] = useState("");
  const [checkingPid, setCheckingPid] = useState(false);

  // ── custom alert ────────────────────────────────
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertLines, setAlertLines] = useState([]);

  const openAlert = (lines) => {
    const arr = Array.isArray(lines) ? lines : [String(lines || "")];
    setAlertLines(arr.filter(Boolean));
    setAlertOpen(true);
  };

  // ── โหลดหมวด/ยี่ห้อ ─────────────────────────────────────────────────────────
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

  // ── โหลดสินค้า + รูป ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const r = await fetch(`${API_URL}/api/products/${encodeURIComponent(id)}`, {
          headers: { Accept: "application/json" },
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (cancelled) return;

        setOriginal(data);
        setForm((f) => ({
          ...f,
          productId: data.productId ?? "",
          name: data.name ?? "",
          description: data.description ?? "",
          price: data.price ?? "",
          quantity: Number.isFinite(Number(data.quantity)) ? Number(data.quantity) : "",
          categoryId: data.categoryId ?? "",
          brandId: data.brandId ?? "",
          inStock: typeof data.inStock === "boolean" ? data.inStock : true,
        }));

        try {
          const imgRes = await fetch(
            `${API_URL}/api/products/${encodeURIComponent(id)}/images`,
            { headers: { Accept: "application/json" } }
          );
          if (imgRes.ok) {
            const imgs = await imgRes.json();
            const cover = imgs.find((x) => x.isCover) || imgs[0];
            if (cover?.imageUrl) setServerCoverUrl(cover.imageUrl);
          }
        } catch { }
      } catch (e) {
        setMsg(`โหลดข้อมูลไม่สำเร็จ: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [API_URL, id]);

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

  // ── sync dropzone + ปุ่มลบรูป ────────────────────────────────────────────────
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
        const ok = window.confirm("ภาพจะถูกลบออกจากสินค้า ต้องการลบหรือไม่?");
        if (!ok) return;

        if (coverFile) {
          setCoverFile(null);
        } else if (serverCoverUrl) {
          try {
            let deleted = false;
            const m = serverCoverUrl.match(/\/images\/(\d+)\/raw$/);
            if (m && m[1]) {
              const imageId = m[1];
              const del = await fetch(
                `${API_URL}/api/products/${encodeURIComponent(id)}/images/${imageId}`,
                { method: "DELETE" }
              );
              if (del.ok) deleted = true;
            }
            if (!deleted) {
              await fetch(
                `${API_URL}/api/products/${encodeURIComponent(id)}/cover?mode=delete`,
                { method: "DELETE" }
              );
            }
          } catch { }
          setServerCoverUrl("");
        }

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
  }, [displayImageUrl, serverCoverUrl, API_URL, id, coverFile]);

  // ── helpers ──────────────────────────────────────────────────────────────────
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

  // ── handlers ─────────────────────────────────────────────────────────────────
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
      setForm((s) => ({ ...s, quantity: limited }));
      const res = validateQuantity(limited);
      setQtyError(res.ok ? "" : res.msg);
      return;
    }

    if (name === "price") {
      // เฉพาะตัวเลข+จุดทศนิยม, จำกัด 1 จุดทศนิยม, ไม่เกิน 10000
      let cleaned = value.replace(/[^\d.]/g, "");
      const parts = cleaned.split(".");
      if (parts.length > 2) cleaned = parts[0] + "." + parts[1];
      const num = Number(cleaned);
      if (num > 10000) cleaned = "10000";
      setForm((s) => ({ ...s, price: cleaned }));
      setPriceError("");
      return;
    }

    setForm((s) => ({ ...s, [name]: value }));
  };

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

  // ── Product Code ─────────────────────────────────────────────────────────────
  const onProductIdChange = (e) => {
    const v = digitsOnly(e.target.value).slice(0, 5);
    setForm((s) => ({ ...s, productId: v }));
    const vr = validateProductId(v);
    setPidError(vr.ok ? "" : vr.msg);
  };

  const onProductIdBlur = async () => {
    const pidRes = validateProductId(form.productId);
    if (!pidRes.ok) {
      setPidError(pidRes.msg);
      productIdRef.current?.focus();
      return;
    }
    if (normCode(pidRes.value) === normCode(original?.productId)) {
      setPidError("");
      return;
    }
    setCheckingPid(true);
    try {
      const dup = await clientCheckDuplicateProductId(pidRes.value);
      if (dup) {
        setPidError("รหัสสินค้านี้ถูกใช้แล้ว");
        productIdRef.current?.focus();
        return;
      }
      setPidError("");
    } finally {
      setCheckingPid(false);
    }
  };

  // ── sync inStock จาก quantity ────────────────────────────────────────────────
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

  // ── เช็คซ้ำ productId ฝั่ง client (ยกเว้นตัวเอง) ────────────────────────────
  const clientCheckDuplicateProductId = async (pid) => {
    if (!pid) return false;
    const target = normCode(pid);
    const isDupHit = (rec) => normCode(rec?.productId) === target && String(rec?.id) !== String(id);
    const qs = [
      `${API_URL}/api/products?productId=${encodeURIComponent(pid)}`,
      `${API_URL}/api/products/search?productId=${encodeURIComponent(pid)}`
    ];
    for (const url of qs) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();
        if (Array.isArray(data)) return data.some(isDupHit);
        if (data && typeof data === "object") return isDupHit(data);
      } catch { }
    }
    const lists = [
      `${API_URL}/api/products`,
      `${API_URL}/api/products/all`,
      `${API_URL}/api/products?size=1000`,
      `${API_URL}/api/products/list`,
    ];
    for (const url of lists) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const arr = await r.json();
        if (Array.isArray(arr)) return arr.some(isDupHit);
      } catch { }
    }
    return false;
  };

  // ── SAVE ─────────────────────────────────────────────────────────────────────
  const onSave = async (e) => {
    e.preventDefault();
    setMsg("");
    setNameError(""); setPriceError(""); setQtyError("");

    if (checkingPid) return; // กันกดระหว่างเช็ค PID

    // ✅ ตรวจรวมทุกช่องที่จำเป็น แล้ว alert ทีเดียว
    const missing = [];
    let firstFocus = null;

    // name
    if (!String(form.name || "").trim()) {
      const msg = "กรุณากรอกชื่อสินค้า";
      setNameError(msg); missing.push(msg);
      firstFocus ||= nameRef.current;
    }

    // price
    if (form.price === "") {
      const msg = "กรุณากรอกราคา";
      setPriceError(msg); missing.push(msg);
      firstFocus ||= priceRef.current;
    } else {
      const nPrice = Number(form.price);
      if (!Number.isFinite(nPrice)) {
        const msg = "ราคาต้องเป็นตัวเลขเท่านั้น";
        setPriceError(msg); missing.push(msg);
        firstFocus ||= priceRef.current;
      } else if (nPrice <= 0) {
        const msg = "ราคาต้องมากกว่า 0";
        setPriceError(msg); missing.push(msg);
        firstFocus ||= priceRef.current;
      } else if (nPrice > 10000) {
        const msg = "ราคาห้ามเกิน 10,000";
        setPriceError(msg); missing.push(msg);
        firstFocus ||= priceRef.current;
      }
    }

    // quantity
    if (form.quantity === "") {
      const msg = "กรุณากรอกจำนวนสต็อก";
      setQtyError(msg); missing.push(msg);
      firstFocus ||= qtyRef.current;
    } else {
      const qRes = validateQuantity(form.quantity);
      if (!qRes.ok) {
        setQtyError(qRes.msg); missing.push(qRes.msg);
        firstFocus ||= qtyRef.current;
      }
    }

    // category / brand
    if (!form.categoryId) missing.push("กรุณาเลือก Category");
    if (!form.brandId) missing.push("กรุณาเลือก Brand");

    // if (missing.length) {
    //   window.alert("• " + missing.join("\n• "));
    //   (firstFocus || nameRef.current || productIdRef.current)?.focus();
    //   return;
    // }
    if (missing.length) {
      openAlert(missing); // ✅ ใช้ modal แทน alert เดิม
      (firstFocus || nameRef.current || productIdRef.current)?.focus();
      return;
    }


    // validate + กันซ้ำ Product Code (เว้นถ้าไม่เปลี่ยน)
    const pidRes = validateProductId(form.productId);
    if (!pidRes.ok) {
      setPidError(pidRes.msg);
      productIdRef.current?.focus();
      return;
    }
    if (normCode(pidRes.value) !== normCode(original?.productId)) {
      const dup = await clientCheckDuplicateProductId(pidRes.value);
      if (dup) {
        setPidError("รหัสสินค้านี้ถูกใช้แล้ว");
        productIdRef.current?.focus();
        return;
      }
    }

    // ทำ payload
    const nQty = toInt(form.quantity) ?? 0;
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

    setSaving(true);
    try {
      const up = await fetch(`${API_URL}/api/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (up.status === 409) {
        setPidError("รหัสสินค้านี้ถูกใช้แล้ว");
        productIdRef.current?.focus();
        throw new Error("ไม่สามารถบันทึกได้: Product Code ซ้ำ");
      }
      if (!up.ok) {
        const t = await up.text().catch(() => "");
        throw new Error(t || `HTTP ${up.status}`);
      }

      // อัปโหลดรูปถ้ามี
      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const upImg = await fetch(`${API_URL}/api/products/${encodeURIComponent(id)}/cover`, {
          method: "POST",
          body: fd,
        });
        if (!upImg.ok) {
          const t = await upImg.text().catch(() => "");
          setMsg(`อัปเดตสำเร็จ แต่รูปอัปโหลดไม่สำเร็จ: ${t || upImg.status}`);
        }
      }

      setMsg("บันทึกการแก้ไขสำเร็จ");
      navigate("/admin/products");
    } catch (err) {
      setMsg(String(err?.message || err));
      console.error("[Edit PUT] error:", err);
    } finally {
      setSaving(false);
    }
  };

  // --------- RENDER ---------
  return (
    <div className="app" data-page="AdminAddProductPage">
      <main className="main">
        <div className="content">
          <div className="content-header">
            <h1 className="title">Edit PRODUCT</h1>
            <div className="header-actions" />
          </div>

          {loading ? (
            <p style={{ padding: 12 }}>Loading item...</p>
          ) : (
            <div className="grid">
              {/* Left card: form */}
              <section className="card">
                {/* Product ID */}
                <div className="field">
                  <label>Product Code *</label>
                  <input
                    name="productId"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{1,5}"
                    maxLength={5}
                    placeholder="เช่น 00001 (ตัวเลขไม่เกิน 5 หลัก)"
                    value={form.productId}
                    onChange={onProductIdChange}
                    onBlur={onProductIdBlur}
                    ref={productIdRef}
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

                {/* Name */}
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
                      value={form.categoryId || ""}
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
                      value={form.brandId || ""}
                      onChange={onChange}
                      required
                    >
                      <option value="" disabled>— Select Brand —</option>
                      {brands.map((b) => (
                        <option key={b.id} value={String(b.id)}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Stock */}
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

              {/* Right card: image + buttons */}
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
          )}

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
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
              display: "grid", placeItems: "center", zIndex: 9999
            }}
            onClick={() => setAlertOpen(false)}
          >
            <div
              style={{
                width: "min(520px, 92vw)",
                background: "#fff",
                borderRadius: 12,
                padding: "18px 20px",
                boxShadow: "0 10px 30px rgba(0,0,0,.2)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: 0, fontSize: 18 }}>โปรดตรวจสอบ</h3>
              <ul style={{ margin: "10px 0 0 18px" }}>
                {alertLines.map((l, i) => <li key={i}>{l}</li>)}
              </ul>

              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setAlertOpen(false)}
                  style={{ padding: "8px 14px", borderRadius: 8 }}
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
