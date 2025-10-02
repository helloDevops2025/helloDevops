// import "./AdminAddProductPage.css";

// export default function AdminAddProductPage() {
//   return <h1>➕ Admin · Add Product</h1>;
// }

// D:\Devop\Real-Project\helloDevops\frontend\src\pages_admin\AdminAddProductPage.jsx
// import { useState, useEffect, useMemo } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import "./AdminAddProductPage.css";

// export default function AdminAddProductPage() {
//   const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
//   const navigate = useNavigate();
//   const { id } = useParams(); // ถ้าเป็น /admin/products/:id/edit จะมีค่า id

//   const isEdit = useMemo(() => !!id, [id]);

//   const [form, setForm] = useState({
//     name: "",
//     category: "Fruits",
//     price: "",
//     brand: "-",
//     quantity: 0,
//     description: "",
//   });

//   const [coverFile, setCoverFile] = useState(null);
//   const [coverUrl, setCoverUrl] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [msg, setMsg] = useState("");
//   const [loadingItem, setLoadingItem] = useState(isEdit);

//   // โหลดสินค้าตาม id เมื่อเข้าโหมดแก้ไข
//   useEffect(() => {
//     if (!isEdit) return;
//     let ignore = false;

//     async function loadItem() {
//       setLoadingItem(true);
//       setMsg("");
//       try {
//         const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(id)}`, {
//           headers: { Accept: "application/json" },
//         });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = await res.json();

//         if (ignore) return;
//         setForm({
//           name: data.name ?? "",
//           category: data.category ?? "Fruits",
//           price: data.price ?? "",
//           brand: data.brand ?? "-",
//           quantity: data.quantity ?? 0,
//           description: data.description ?? "",
//         });
//       } catch (e) {
//         setMsg(`โหลดข้อมูลไม่สำเร็จ: ${e.message || e}`);
//       } finally {
//         if (!ignore) setLoadingItem(false);
//       }
//     }

//     loadItem();
//     return () => {
//       ignore = true;
//     };
//   }, [isEdit, id, API_URL]);

//   // พรีวิวรูป
//   useEffect(() => {
//     if (!coverFile) {
//       if (coverUrl) URL.revokeObjectURL(coverUrl);
//       setCoverUrl(null);
//       return;
//     }
//     const url = URL.createObjectURL(coverFile);
//     setCoverUrl(url);
//     return () => URL.revokeObjectURL(url);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [coverFile]);

//   function onChange(e) {
//     const { name, value } = e.target;
//     setForm((f) => ({ ...f, [name]: value }));
//   }
//   function onNumberChange(e) {
//     const { name, value } = e.target;
//     setForm((f) => ({ ...f, [name]: value }));
//   }
//   function onPickCover(e) {
//     const file = e.target.files?.[0];
//     if (file && file.type.startsWith("image/")) setCoverFile(file);
//   }
//   function onClearCover() {
//     setCoverFile(null);
//   }
//   function onCancel(e) {
//     e?.preventDefault?.();
//     if (isEdit) {
//       navigate("/admin/products"); // กลับไปหน้าลิสต์
//     } else {
//       setForm({
//         name: "",
//         category: "Fruits",
//         price: "",
//         brand: "-",
//         quantity: 0,
//         description: "",
//       });
//       setCoverFile(null);
//       setMsg("");
//     }
//   }

//   async function onSave(e) {
//     e?.preventDefault?.();
//     setMsg("");
//     setSaving(true);

//     try {
//       const payload = {
//         name: form.name.trim(),
//         category: form.category,
//         brand: form.brand,
//         description: form.description.trim(),
//         price: form.price === "" ? null : Number(form.price),
//         quantity: form.quantity === "" ? null : Number(form.quantity),
//       };

//       if (!payload.name) {
//         setMsg("กรุณากรอกชื่อสินค้า");
//         setSaving(false);
//         return;
//       }

//       let url = `${API_URL}/api/products`;
//       let method = "POST";
//       if (isEdit) {
//         url = `${API_URL}/api/products/${encodeURIComponent(id)}`;
//         method = "PUT";
//       }

//       const res = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       if (!res.ok) {
//         const text = await res.text().catch(() => "");
//         throw new Error(text || `HTTP ${res.status}`);
//       }

//       if (isEdit) {
//         setMsg("บันทึกการแก้ไขสำเร็จ");
//       } else {
//         setMsg("บันทึกสำเร็จ (POST JSON) — รูปยังไม่ได้อัปโหลด");
//         setForm({
//           name: "",
//           category: "Fruits",
//           price: "",
//           brand: "-",
//           quantity: 0,
//           description: "",
//         });
//         setCoverFile(null);
//       }

//       // เสร็จแล้วพากลับหน้าลิสต์
//       navigate("/admin/products");
//     } catch (err) {
//       setMsg(`บันทึกไม่สำเร็จ: ${err?.message || err}`);
//     } finally {
//       setSaving(false);
//     }
//   }

//   return (
//     <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
//       <h1>{isEdit ? "✏️ Admin · Edit Product" : "➕ Admin · Add Product (minimal)"}</h1>

//       {loadingItem ? (
//         <p>Loading item...</p>
//       ) : (
//         <form onSubmit={onSave}>
//           <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
//             <label>
//               Product name *
//               <input
//                 name="name"
//                 type="text"
//                 value={form.name}
//                 onChange={onChange}
//                 placeholder="e.g., Apple Fuji"
//                 style={{ width: "100%", padding: 6 }}
//                 required
//               />
//             </label>

//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
//               <label>
//                 Category *
//                 <select
//                   name="category"
//                   value={form.category}
//                   onChange={onChange}
//                   style={{ width: "100%", padding: 6 }}
//                 >
//                   <option>Fruits</option>
//                   <option>Vegetables</option>
//                   <option>Beverages</option>
//                 </select>
//               </label>

//               <label>
//                 Price
//                 <input
//                   name="price"
//                   type="number"
//                   step="0.01"
//                   value={form.price}
//                   onChange={onNumberChange}
//                   placeholder="0.00"
//                   style={{ width: "100%", padding: 6 }}
//                 />
//               </label>
//             </div>

//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
//               <label>
//                 Brand *
//                 <select
//                   name="brand"
//                   value={form.brand}
//                   onChange={onChange}
//                   style={{ width: "100%", padding: 6 }}
//                 >
//                   <option>-</option>
//                   <option>Pure Mart</option>
//                   <option>Local Farm</option>
//                 </select>
//               </label>

//               <label>
//                 Quantity
//                 <input
//                   name="quantity"
//                   type="number"
//                   min="0"
//                   value={form.quantity}
//                   onChange={onNumberChange}
//                   placeholder="0"
//                   style={{ width: "100%", padding: 6 }}
//                 />
//               </label>
//             </div>

//             <label>
//               Description *
//               <textarea
//                 name="description"
//                 rows={4}
//                 value={form.description}
//                 onChange={onChange}
//                 placeholder="Short description..."
//                 style={{ width: "100%", padding: 6 }}
//                 required
//               />
//             </label>
//           </div>

//           {/* อัปโหลดรูป (ยังไม่ส่งจริง) */}
//           <div style={{ marginTop: 16 }}>
//             <div>Cover image (optional)</div>
//             {coverUrl ? (
//               <div style={{ marginTop: 8 }}>
//                 <img
//                   src={coverUrl}
//                   alt="cover preview"
//                   style={{ maxWidth: "100%", height: "auto", display: "block", border: "1px solid #ccc" }}
//                 />
//                 <button type="button" onClick={onClearCover} style={{ marginTop: 8 }}>
//                   Remove image
//                 </button>
//               </div>
//             ) : (
//               <input type="file" accept="image/*" onChange={onPickCover} style={{ marginTop: 8 }} />
//             )}
//           </div>

//           <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
//             <button type="button" onClick={onCancel}>
//               Cancel
//             </button>
//             <button type="submit" disabled={saving}>
//               {saving ? "Saving..." : "Save"}
//             </button>
//           </div>
//         </form>
//       )}

//       {msg && <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</p>}

//       <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
//         API_URL: {API_URL}
//       </p>
//     </div>
//   );
// }

