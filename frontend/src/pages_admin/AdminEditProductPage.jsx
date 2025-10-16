// src/pages_admin/AdminEditProductPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminEditProductPage.css";
// import "./AdminAddProductPage.css";

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
    productId: "",  // NEW: มีฟิลด์ productId ในฟอร์ม
    name: "",
    description: "",
    price: "",
    quantity: "", // ว่างได้ เพื่อแจ้งเตือนให้กรอก
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

  // ── ui state ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
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

  // ── โหลดสินค้า + โหลดรูป cover ───────────────────────────────────────────────
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
          productId: data.productId ?? "", // NEW
          name: data.name ?? "",
          description: data.description ?? "",
          price: data.price ?? "",
          quantity: Number.isFinite(Number(data.quantity)) ? Number(data.quantity) : "",
          categoryId: data.categoryId ?? "",
          brandId: data.brandId ?? "",
          inStock: typeof data.inStock === "boolean" ? data.inStock : true,
        }));

        // โหลดรูป
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
        } catch {}
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

  // ── sync dropzone + ปุ่มลบรูป (มี confirm) ───────────────────────────────────
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

        // 1) ถ้าเป็นไฟล์ใหม่ที่ยังไม่อัปโหลด แค่เคลียร์สถานะก็พอ
        if (coverFile) {
          setCoverFile(null);

        } else if (serverCoverUrl) {
          // 2) ถ้าเป็นรูปจากเซิร์ฟเวอร์ → พยายามดึง imageId จาก URL แล้วลบตาม id
          try {
            let deleted = false;

            // ตัวอย่าง URL: http://127.0.0.1:8080/api/products/21/images/21/raw
            const m = serverCoverUrl.match(/\/images\/(\d+)\/raw$/);
            if (m && m[1]) {
              const imageId = m[1];
              const del = await fetch(
                `${API_URL}/api/products/${encodeURIComponent(id)}/images/${imageId}`,
                { method: "DELETE" }
              );
              if (del.ok) {
                deleted = true;
              } else {
                console.warn("DELETE image by id failed", del.status);
              }
            }

            // 3) ถ้า parse imageId ไม่ได้ (หรือ delete by id ไม่ผ่าน) → fallback ไปที่ /cover?mode=delete
            if (!deleted) {
              const delCover = await fetch(
                `${API_URL}/api/products/${encodeURIComponent(id)}/cover?mode=delete`,
                { method: "DELETE" }
              );
              if (!delCover.ok) {
                console.warn("DELETE cover failed", delCover.status);
              }
            }
          } catch (err) {
            console.warn("DELETE error", err);
          }

          // เคลียร์ state ฝั่ง UI
          setServerCoverUrl("");
        }

        // 4) เคลียร์ UI เสมอ
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
    if (n === null || Number.isNaN(n)) {
      return { ok: false, msg: "จำนวนต้องเป็นตัวเลขจำนวนเต็ม" };
    }
    if (n < 0) {
      return { ok: false, msg: "ห้ามจำนวนติดลบ" };
    }
    if (n > 1000000) {
      return { ok: false, msg: "ห้ามเกิน 1,000,000 ชิ้น" };
    }
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

      const v = limited;
      const res = validateQuantity(v);
      setQtyError(res.ok ? "" : res.msg);
      return;
    }

    setForm((s) => ({ ...s, [name]: value }));
  };

  // NEW: productId—กันช่องว่าง/ช่องวรรค
  const onProductIdChange = (e) => {
    const v = (e.target.value ?? "").toString().replace(/\s+/g, "");
    setForm((s) => ({ ...s, productId: v }));
  };

  // บังคับ sync inStock ตามกฎ: 0 -> false, ≥1 -> true
  useEffect(() => {
    const n = toInt(form.quantity);
    if (n === null) return; // ยังไม่กรอก
    const forced = n >= 1;
    if (form.inStock !== forced) {
      setForm((s) => ({ ...s, inStock: forced }));
    }
  }, [form.quantity]); // eslint-disable-line react-hooks/exhaustive-deps

  const onCancel = (e) => {
    e.preventDefault();
    if (original) {
      setForm({
        productId: original.productId ?? "",   // NEW: reset productId
        name: original.name ?? "",
        description: original.description ?? "",
        price: original.price ?? "",
        quantity: Number.isFinite(Number(original.quantity)) ? Number(original.quantity) : "",
        categoryId: original.categoryId ?? "",
        brandId: original.brandId ?? "",
        inStock: typeof original.inStock === "boolean" ? original.inStock : true,
      });
      setCoverFile(null);
      setQtyError("");
    }
    navigate("/admin/products");
  };

  const onSave = async (e) => {
    e.preventDefault();
    setMsg("");

    // ตรวจ quantity ก่อนเซฟ
    const res = validateQuantity(form.quantity);
    if (!res.ok) {
      setQtyError(res.msg);
      return;
    }

    setSaving(true);
    try {
      const nQty = toInt(form.quantity) ?? 0;

      const sanitizeNumber = (v, fallback) => {
        if (v === "" || v === null || v === undefined) return fallback;
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
      };

      // inStock ถูกบังคับตามจำนวน
      const payload = {
        productId: (form.productId ?? original?.productId) || original?.productId, // NEW
        name: (form.name ?? "").trim() || original?.name,
        description: (form.description ?? "").trim(),
        price: sanitizeNumber(form.price, sanitizeNumber(original?.price, 0)),
        quantity: nQty,
        inStock: nQty >= 1,
        categoryId: form.categoryId || null,
        brandId: form.brandId || null,
      };

      if (!payload.productId) throw new Error("กรุณากรอก Product ID"); // NEW
      if (!payload.name) throw new Error("กรุณากรอกชื่อสินค้า");
      if (!Number.isFinite(payload.price) || payload.price < 0) throw new Error("ราคาไม่ถูกต้อง");

      const up = await fetch(`${API_URL}/api/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!up.ok) {
        const t = await up.text().catch(() => "");
        throw new Error(t || `HTTP ${up.status}`);
      }

      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const upImg = await fetch(`${API_URL}/api/products/${encodeURIComponent(id)}/cover`, {
          method: "POST",
          body: fd,
        });
        if (upImg.ok) {
          const json = await upImg.json();
          setServerCoverUrl(json.imageUrl);
          setCoverFile(null);
          setMsg("อัปเดตรูปเรียบร้อยแล้ว");
        } else {
          const t = await upImg.text().catch(() => "");
          setMsg(`อัปเดตสำเร็จ แต่รูปอัปโหลดไม่สำเร็จ: ${t || upImg.status}`);
        }
      }

      setMsg("บันทึกการแก้ไขสำเร็จ");
      navigate("/admin/products");
    } catch (err) {
      setMsg(String(err?.message || err));
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

                {/* NEW: Product ID */}
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
                      value={form.categoryId}
                      onChange={onChange}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
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
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock (quantity) with validations */}
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
                <h3 style={{ margin: "4px 0 10px", fontSize: 16 }}>
                  Upload images
                </h3>

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
                    disabled={saving || !!qtyError || form.quantity === ""} // ปิด Save ถ้า invalid
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

          {msg && (
            <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</p>
          )}
          <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            API_URL: {API_URL}
          </p>
        </div>
      </main>
    </div>
  );
}
