// src/pages/PlaceOrderPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/header";
import Footer from "./../components/Footer.jsx";
import "./PlaceOrderPage.css";
import "./breadcrumb.css";

/* ===== Config / API ===== */
const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

/** พยายามหา userId จากแหล่งต่าง ๆ ใน localStorage/SessionStorage */
function resolveUserId() {
  // ปรับให้ตรงกับโปรเจ็กต์คุณได้ เช่น AuthContext
  const candidates = [
    () => JSON.parse(localStorage.getItem("auth_user") || "null")?.id,
    () => JSON.parse(localStorage.getItem("user") || "null")?.id,
    () => JSON.parse(sessionStorage.getItem("auth_user") || "null")?.id,
    () => Number(localStorage.getItem("pm_user_id") || ""),
  ];
  for (const fn of candidates) {
    const v = fn();
    if (v && Number(v) > 0) return Number(v);
  }
  return 1; // 🔧 fallback สำหรับ dev/test
}

/* ===== Utils ===== */
function isValidThaiMobile(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("66")) {
    const n = "0" + digits.slice(2);
    return /^0[689]\d{8}$/.test(n);
  }
  return /^0[689]\d{8}$/.test(digits);
}

function formatThaiMobile(raw) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("66")) d = "0" + d.slice(2);
  if (d.length > 10) d = d.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + "-" + d.slice(3);
  return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
}
const currencyTHB = (n) =>
  n.toLocaleString("th-TH", { style: "currency", currency: "THB" });

function formatZipCode(raw) {
  if (!raw) return "";
  return raw.replace(/\D/g, "").slice(0, 5);
}
function isValidZipCode(raw) {
  const d = (raw || "").replace(/\D/g, "");
  return /^\d{5}$/.test(d);
}

/* ===== Breadcrumb ===== */
function Breadcrumb({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav className="pm-breadcrumb" aria-label="Breadcrumb">
      {items.map((it, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="pm-breadcrumb__item">
            {isLast ? (
              <span className="current">{it.label}</span>
            ) : (
              <a href={it.href || "#"}>{it.label}</a>
            )}
            {!isLast && <span className="divider">›</span>}
          </span>
        );
      })}
    </nav>
  );
}

/* ===== API helpers (addresses) ===== */
async function apiGetAddresses(userId) {
  const res = await fetch(`${API}/api/addresses/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("โหลดที่อยู่ไม่สำเร็จ");
  return res.json();
}
async function apiCreateAddress(userId, payload) {
  const res = await fetch(`${API}/api/addresses/${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("บันทึกที่อยู่ไม่สำเร็จ");
  return res.json();
}
async function apiUpdateAddress(id, payload) {
  const res = await fetch(`${API}/api/addresses/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("อัปเดตที่อยู่ไม่สำเร็จ");
  return res.json();
}
async function apiDeleteAddress(id) {
  const res = await fetch(`${API}/api/addresses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("ลบที่อยู่ไม่สำเร็จ");
}

/* ===== Mapper: FE <-> BE ===== */
// FE shape -> BE AddressRequest
function toRequest(addr) {
  return {
    name: addr.name,
    phoneNumber: addr.phone,
    address: addr.house,
    street: addr.street,
    subdistrict: addr.subdistrict,
    district: addr.district,
    province: addr.province,
    zipcode: addr.zipcode,
    status: addr.isDefault ? "DEFAULT" : "NON_DEFAULT",
  };
}
// BE AddressResponse -> FE shape
function fromResponse(r) {
  const phone = r.phoneNumber || "";
  const text = `${r.address || ""}${r.street ? " " + r.street + "," : ""} ${r.subdistrict || ""}, ${r.district || ""}, ${r.province || ""} ${r.zipcode || ""} | Tel: ${phone}`;
  return {
    id: r.id,
    name: r.name || "",
    phone,
    house: r.address || "",
    street: r.street || "",
    subdistrict: r.subdistrict || "",
    district: r.district || "",
    province: r.province || "",
    zipcode: r.zipcode || "",
    isDefault: r.status === "DEFAULT",
    text,
  };
}

/* ===== Order API (จริง) ===== */
// แปลง id สินค้าใน cart ให้เป็น productIdFk (เลข id ของ product ใน DB)
function toProductIdFk(item) {
  if (item == null) return null;
  // รองรับรูปแบบ "#00001"
  if (typeof item.id === "string" && item.id.startsWith("#")) {
    const n = Number(item.id.replace(/\D/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  // ถ้ามีฟิลด์ productId / productIdFk อยู่แล้ว
  return (
    item.productId ||
    item.product_id ||
    item.productIdFk ||
    item.product_id_fk ||
    (Number.isFinite(Number(item.id)) ? Number(item.id) : null)
  );
}

async function apiCreateOrder({ customerName, customerPhone, shippingAddress, cart }) {
  const payload = {
    customerName,
    customerPhone,
    shippingAddress,
    orderItems: cart.map((it) => ({
      productIdFk: toProductIdFk(it),
      quantity: Number(it.qty || 1),
    })),
  };

  const res = await fetch(`${API}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "สร้างคำสั่งซื้อไม่สำเร็จ");
  }
  return res.json(); // คาดหวัง { id, orderCode, ... }
}

/* ===== Address Form ===== */
function AddressForm({ initial, onCancel, onSave, onError }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [house, setHouse] = useState(initial?.house ?? "");
  const [street, setStreet] = useState(initial?.street ?? "");
  const [subdistrict, setSubdistrict] = useState(initial?.subdistrict ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [zipcode, setZipcode] = useState(initial?.zipcode ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);

  const handlePhoneInput = (e) => setPhone(formatThaiMobile(e.target.value));
  const handleZipCodeInput = (e) => setZipcode(formatZipCode(e.target.value));

  const submit = (e) => {
    e.preventDefault();
    if (!name || !phone || !house || !subdistrict || !district || !province || !zipcode) {
      onError?.("Please fill in all required fields");
      return;
    }
    if (!isValidThaiMobile(phone)) {
      onError?.("Please enter a valid Thai mobile number");
      return;
    }
    if (!isValidZipCode(zipcode)) {
      onError?.("Please enter a valid Zip Code (5 digits only)");
      return;
    }
    const text = `${house} ${street ? street + ", " : ""}${subdistrict}, ${district}, ${province} ${zipcode} | Tel: ${phone}`;
    onSave({
      id: initial?.id ?? null,
      name,
      phone,
      house,
      street,
      subdistrict,
      district,
      province,
      zipcode,
      text,
      isDefault,
    });
  };

  useEffect(() => {
    document.getElementById("addr-name")?.focus();
  }, []);

  return (
    <form className="address-form" onSubmit={submit} noValidate>
      <label>
        <span className="label-text">Full name</span>
        <input id="addr-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label>
        <span className="label-text">Phone number</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0xx-xxx-xxxx"
          maxLength={12}
          value={phone}
          onChange={handlePhoneInput}
          required
        />
      </label>

      <label>
        <span className="label-text">House / Building / Village</span>
        <input type="text" value={house} onChange={(e) => setHouse(e.target.value)} required />
      </label>

      <label>
        <span className="label-text">Street / Soi</span>
        <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} />
      </label>

      <div className="form-row">
        <label>
          <span className="label-text">Subdistrict</span>
          <input type="text" value={subdistrict} onChange={(e) => setSubdistrict(e.target.value)} required />
        </label>
        <label>
          <span className="label-text">District</span>
          <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} required />
        </label>
      </div>

      <div className="form-row">
        <label>
          <span className="label-text">Province</span>
          <select value={province} onChange={(e) => setProvince(e.target.value)} required>
            <option value="">-- Select province --</option>
            <option>Bangkok</option>
            <option>Chiang Mai</option>
            <option>Khon Kaen</option>
            <option>Phuket</option>
          </select>
        </label>
        <label>
          <span className="label-text">Zip code</span>
          <input
            type="text"
            value={zipcode}
            onChange={handleZipCodeInput}
            required
            inputMode="numeric"
            maxLength={5}
            pattern="\d{5}"
            placeholder="e.g. 10110"
          />
        </label>
      </div>

      <label className="inline">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        <span>Save as default address</span>
      </label>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Back
          </button>
        )}
        <button type="submit" className="btn-save">Save address</button>
      </div>
    </form>
  );
}

/* ===== Address List ===== */
function AddressList({ addresses, onSetDefault, onAddNew, onEdit, onDelete }) {
  if (!addresses.length) return null;
  return (
    <div className="saved-addresses">
      {addresses.map((addr) => (
        <label key={addr.id} className="address-option">
          <input type="radio" name="address" checked={!!addr.isDefault} readOnly />
          <div className="address-box" style={{ position: "relative" }}>
            {addr.isDefault ? (
              <span className="tag default">Default</span>
            ) : (
              <button type="button" className="link set-default-link" onClick={() => onSetDefault(addr.id)}>
                Set as default
              </button>
            )}
            <p className="addr-name">{addr.name}</p>
            <p className="addr-text">{addr.text}</p>
            <div className="addr-actions">
              <button type="button" className="icon-btn" onClick={() => onEdit(addr)} aria-label="Edit address">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                </svg>
                <span>Edit</span>
              </button>

              <button type="button" className="icon-btn danger" onClick={() => onDelete(addr.id)} aria-label="Delete address">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                </svg>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </label>
      ))}
      <button
        type="button"
        className="btn-add-inline"
        onClick={onAddNew}
        style={{ marginTop: 12 }}
      >
        + Add new address
      </button>
    </div>
  );
}

/* ===== Order Summary ===== */
function OrderSummary({ cart, canConfirm, onConfirm }) {
  const { subtotal, itemsCount } = useMemo(() => {
    let subtotal = 0, itemsCount = 0;
    for (const it of cart) {
      subtotal += it.price * it.qty;
      itemsCount += it.qty;
    }
    return { subtotal, itemsCount };
  }, [cart]);
  const shipping = 0, discount = 0, total = subtotal - discount + shipping;

  return (
    <aside className="card summary-card">
      <h2 className="section-title">Your order</h2>
      <div id="order-list">
        {cart.map((item) => {
          const t = item.price * item.qty;
          return (
            <div key={item.id} className="order-item">
              <img src={item.img} alt="" />
              <div className="order-item__body">
                <p className="order-item__name">{item.name}</p>
                <div className="qty-row">
                  <span>Quantity: {item.qty}</span>
                </div>
              </div>
              <div>
                <p className="order-item__price">
                  {currencyTHB(t)}
                  <span className="unit-price">{currencyTHB(item.price)} each</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="totals">
        <div className="line"><span>Item(s) total</span><span>{currencyTHB(subtotal)}</span></div>
        <div className="line"><span>Shop-discount</span><span>−{currencyTHB(discount)}</span></div>
        <div className="line"><span>Subtotal</span><span>{currencyTHB(subtotal)}</span></div>
        <div className="line"><span>Shipping</span><span>{currencyTHB(shipping)}</span></div>
        <div className="line total">
          <span> Total ({itemsCount} item{itemsCount > 1 ? "s" : ""}) </span>
          <span className="price">{currencyTHB(total)}</span>
        </div>
      </div>

      <div className="summary-actions">
        <button
          className="btn-primary"
          disabled={!canConfirm}
          onClick={onConfirm}
          title={canConfirm ? "Confirm order" : "Please add/select a shipping address first"}
        >
          Place Order
        </button>
      </div>
    </aside>
  );
}

/* ===== Main Page ===== */
export default function PlaceOrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = resolveUserId();

  // Simple in-app toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "error", timeout = 4000) => {
    setToast({ message, type });
    if (timeout > 0) setTimeout(() => setToast(null), timeout);
  };

  useEffect(() => {
    document.body.classList.add("po-page");
    return () => document.body.classList.remove("po-page");
  }, []);

  // defaultCart: fallback (คงไว้สำหรับ dev ถ้าไม่มี cart ใน storage/route)
  const defaultCart = [
    { id: '#00001', name: "ข้าวขาวหอมมะลิใหม่100% 5กก.", price: 165.0, qty: 1, img: "/assets/products/001.jpg" },
    { id: '#00007', name: "ซูเปอร์เชฟ หมูเด้ง แช่แข็ง 220 กรัม แพ็ค 3", price: 180.0, qty: 4, img: "/assets/products/007.jpg" },
    { id: '#00018', name: "มะม่วงน้ำดอกไม้สุก", price: 120.0, qty: 2, img: "/assets/products/018.jpg" },
    { id: '#00011', name: "ซีพี ชิคแชค เนื้อไก่ปรุงรสทอดกรอบแช่แข็ง 800 กรัม", price: 179.0, qty: 2, img: "/assets/products/011.jpg" },
    { id: '#00004', name: "โกกิแป้งทอดกรอบ 500ก.", price: 45.0, qty: 2, img: "/assets/products/004.jpg" },
  ];

  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [mode, setMode] = useState("list");
  const [editing, setEditing] = useState(null);
  const [loadingAddr, setLoadingAddr] = useState(true);

  /* โหลดสินค้า (เหมือนเดิม) */
  useEffect(() => {
    let initialCart = null;
    if (location.state?.from === "buy-now" && location.state?.item) {
      initialCart = [location.state.item];
    }
    if (!initialCart) {
      const fromHistory = location.state?.from === "history";
      const raw = sessionStorage.getItem("pm_order_preview");
      if (fromHistory && raw) {
        try {
          const order = JSON.parse(raw);
          if (order && Array.isArray(order.items)) {
            initialCart = order.items.map((it, idx) => ({
              id: `${order.id}-${idx + 1}`,
              name: it.name,
              price: Number(it.price || 0),
              qty: Number(it.qty || 1),
              img: it.thumb || "/assets/products/placeholder.jpg",
            }));
          }
        } catch {}
      }
    }
    if (!initialCart) {
      try {
        const ls = JSON.parse(localStorage.getItem("pm_cart") || "[]");
        if (Array.isArray(ls) && ls.length) initialCart = ls;
      } catch {}
    }
    setCart(initialCart || defaultCart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* โหลด Address จาก DB */
  const refreshAddresses = async () => {
    setLoadingAddr(true);
    try {
      const list = await apiGetAddresses(userId);
      const mapped = Array.isArray(list) ? list.map(fromResponse) : [];
      setAddresses(mapped);
      setMode(mapped.length ? "list" : "add");
    } catch (e) {
      showToast(e.message || "โหลดที่อยู่ไม่สำเร็จ");
      setAddresses([]);
      setMode("add");
    } finally {
      setLoadingAddr(false);
    }
  };
  useEffect(() => {
    refreshAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const breadcrumbItems = [
    { label: "Home", href: "/home" },
    { label: "Cart", href: "/cart" },
    { label: "Checkout" },
  ];

  /* Actions (addresses) */
  const handleSetDefault = async (id) => {
    const target = addresses.find((a) => a.id === id);
    if (!target) return;
    try {
      await apiUpdateAddress(id, toRequest({ ...target, isDefault: true }));
      await refreshAddresses();
    } catch (e) {
      showToast(e.message);
    }
  };
  const handleAddNew = () => {
    setEditing(null);
    setMode("add");
  };
  const handleEdit = (addr) => {
    setEditing(addr);
    setMode("edit");
  };
  const handleDelete = async (id) => {
    const target = addresses.find((a) => a.id === id);
    if (!target) return;
    if (!window.confirm(`Delete address of "${target.name}" ?`)) return;
    try {
      await apiDeleteAddress(id);
      await refreshAddresses();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleSave = async (payload) => {
    try {
      if (payload.id) {
        await apiUpdateAddress(payload.id, toRequest(payload));
      } else {
        await apiCreateAddress(userId, toRequest(payload));
      }
      setEditing(null);
      setMode("list");
      await refreshAddresses();
    } catch (e) {
      showToast(e.message);
    }
  };

  const canConfirm = addresses.some((a) => a.isDefault);

  // ✅ แก้ไขให้ POST จริง และเอา mock ออก
  const handleConfirm = async () => {
    const selectedAddress =
      addresses.find((a) => a.isDefault) || addresses[0] || null;

    if (!selectedAddress) {
      showToast("กรุณาเพิ่มที่อยู่ก่อนทำการสั่งซื้อ", "error");
      return;
    }

    // สร้าง shippingAddress string ให้ตรงกับ Postman ตัวอย่าง
    const shippingAddress = `${selectedAddress.house || ""}${
      selectedAddress.street ? " " + selectedAddress.street + "," : ""
    } ${selectedAddress.subdistrict || ""}, ${selectedAddress.district || ""}, ${
      selectedAddress.province || ""
    } ${selectedAddress.zipcode || ""}`.trim();

    try {
      const created = await apiCreateOrder({
        customerName: selectedAddress.name,
        customerPhone: selectedAddress.phone,
        shippingAddress,
        cart,
      });

      const orderPayload = {
        orderId: created.id,
        orderCode: created.orderCode || created.code || created.id,
        address: selectedAddress,
        cart,
      };
      try {
        sessionStorage.setItem("pm_last_order", JSON.stringify(orderPayload));
      } catch {}

      // ไปหน้า Tracking ด้วย id จริงจาก backend
      navigate(`/tracking-user/${created.id}`, { state: orderPayload });
    } catch (e) {
      showToast(e.message || "สร้างคำสั่งซื้อไม่สำเร็จ", "error");
    }
  };

  return (
    <div className="place-order-page">
      <Header />
      {toast && (
        <div className={`pm-toast pm-toast--${toast.type}`} role="status" aria-live="polite">
          <div className="pm-toast__body">
            <span>{toast.message}</span>
            <button className="pm-toast__close" onClick={() => setToast(null)} aria-label="Close">×</button>
          </div>
        </div>
      )}

      <main className="container">
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="title">Checkout Page</h1>

        <div className="checkout-grid">
          <section className="card form-card">
            <h2 className="section-title">Shipping Address</h2>

            {loadingAddr && <p style={{ padding: 8 }}>Loading addresses…</p>}

            {!loadingAddr && mode === "list" && (
              <AddressList
                addresses={addresses}
                onSetDefault={handleSetDefault}
                onAddNew={handleAddNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}

            {!loadingAddr && mode === "add" && (
              <AddressForm
                initial={null}
                onCancel={() => (addresses.length ? setMode("list") : null)}
                onSave={handleSave}
                onError={showToast}
              />
            )}

            {!loadingAddr && mode === "edit" && editing && (
              <AddressForm
                initial={editing}
                onCancel={() => {
                  setEditing(null);
                  setMode("list");
                }}
                onSave={handleSave}
                onError={showToast}
              />
            )}
          </section>

          <OrderSummary cart={cart} canConfirm={canConfirm} onConfirm={handleConfirm} />
        </div>
      </main>

      <Footer />

      {/* Sticky bottom action (mobile-first) */}
      <div className="sticky-checkout-bar">
        <button
          className="btn-primary"
          disabled={!canConfirm}
          onClick={handleConfirm}
          title={canConfirm ? "Confirm order" : "Please add/select a shipping address first"}
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
