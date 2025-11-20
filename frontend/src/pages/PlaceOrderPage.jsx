import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/header";
import Footer from "./../components/Footer.jsx";
import "./PlaceOrderPage.css";
import "./breadcrumb.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";
const LS_CART = "pm_cart";
const LS_CHECKOUT = "pm_checkout_selection";

function resolveUserId() {
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
  return 1;
}

// Utils
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

// Breadcrumb
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

// API helpers (addresses)
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

// Mapper: FE <-> BE
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
function fromResponse(r) {
  const phone = r.phoneNumber || "";
  const text = `${r.address || ""}${r.street ? " " + r.street + "," : ""} ${
    r.subdistrict || ""
  }, ${r.district || ""}, ${r.province || ""} ${r.zipcode || ""} | Tel: ${phone}`;
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

// Order API (จริง)
function toProductIdFk(item) {
  if (item == null) return null;
  if (typeof item.id === "string" && item.id.startsWith("#")) {
    const n = Number(item.id.replace(/\D/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return (
    item.productId ||
    item.product_id ||
    item.productIdFk ||
    item.product_id_fk ||
    (Number.isFinite(Number(item.id)) ? Number(item.id) : null)
  );
}

async function apiCreateOrder({
  customerName,
  customerPhone,
  shippingAddress,
  cart,
  subtotal,
  discountTotal,
  shippingFee,
  grandTotal,
}) {
  const payload = {
    customerName,
    customerPhone,
    shippingAddress,
    subtotal,
    discountTotal,
    shippingFee,
    grandTotal,
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
  return res.json();
}

/* ---------- Promotion helpers (อ่านจาก backend) ---------- */

function normalizePromotion(p) {
  if (!p) return null;
  return {
    id: p.id ?? null,
    promoType: p.promo_type ?? p.promoType ?? "PERCENT_OFF",
    scope: p.scope ?? "ORDER",
    percentOff: Number(p.percent_off ?? p.percentOff ?? 0) || 0,
    amountOff: Number(p.amount_off ?? p.amountOff ?? 0) || 0,
    fixedPrice: p.fixed_price ?? p.fixedPrice ?? null,
    buyQty: p.buy_qty ?? p.buyQty ?? null,
    getQty: p.get_qty ?? p.getQty ?? null,
    minOrderAmount: Number(p.min_order_amount ?? p.minOrderAmount ?? 0) || 0,
    minQuantity: p.min_quantity ?? p.minQuantity ?? null,
  };
}

async function apiListActivePromotions() {
  const res = await fetch(`${API}/api/promotions?status=ACTIVE`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "load promotion failed");
    throw new Error(txt || "load promotion failed");
  }
  const raw = await res.json();
  const arr = Array.isArray(raw)
    ? raw
    : raw?.items || raw?.data || raw?.content || raw?.results || [];
  return arr.map(normalizePromotion).filter(Boolean);
}

async function apiListProductsOfPromotion(promoId) {
  const res = await fetch(
    `${API}/api/promotions/${encodeURIComponent(promoId)}/products`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "load promo products failed");
    throw new Error(txt || "load promo products failed");
  }
  const raw = await res.json();
  return Array.isArray(raw)
    ? raw
    : raw?.items || raw?.data || raw?.content || raw?.results || [];
}

// คำนวณส่วนลดต่อบรรทัด จาก promotion ระดับสินค้า
function calcLineDiscount(unitPrice, qty, promo) {
  const price = Number(unitPrice) || 0;
  const q = Math.max(1, Number(qty) || 1);
  const lineTotal = price * q;
  if (!promo) return 0;

  const type = promo.promoType;
  if (type === "PERCENT_OFF") {
    const pct = promo.percentOff || 0;
    if (pct <= 0) return 0;
    return (lineTotal * pct) / 100;
  }
  if (type === "AMOUNT_OFF") {
    const off = promo.amountOff || 0;
    if (off <= 0) return 0;
    return Math.min(lineTotal, off * q);
  }
  if (type === "FIXED_PRICE") {
    if (promo.fixedPrice == null) return 0;
    const fp = Number(promo.fixedPrice) || 0;
    if (fp <= 0 || fp >= price) return 0;
    return (price - fp) * q;
  }
  if (type === "BUY_X_GET_Y") {
    const bx = Number(promo.buyQty || 0);
    const gy = Number(promo.getQty || 0);
    if (bx <= 0 || gy <= 0) return 0;
    const group = bx + gy;
    const fullGroups = Math.floor(q / group);
    const freeQty = fullGroups * gy;
    return freeQty * price;
  }
  return 0;
}

/* ---------- helper รวมสูตร subtotal / discount ใช้ทั้ง FE + ส่งเข้า backend ---------- */
function computeCartTotals(cart, productPromosByProductId, orderPromos) {
  let subtotal = 0;
  let itemsCount = 0;
  let productDiscountTotal = 0;

  for (const it of cart) {
    const price = Number(it.price) || 0;
    const qty = Math.max(1, Number(it.qty) || 1);
    const lineTotal = price * qty;

    subtotal += lineTotal;
    itemsCount += qty;

    const key = String(it.productId ?? it.id ?? "");
    const promosForProduct =
      (productPromosByProductId && productPromosByProductId[key]) || [];
    if (promosForProduct.length > 0) {
      const promo = promosForProduct[0]; // ตอนนี้สมมติ 1 โปรต่อสินค้า
      productDiscountTotal += calcLineDiscount(price, qty, promo);
    }
  }

  let orderDiscount = 0;
  const baseAfterProduct = subtotal - productDiscountTotal;
  if (orderPromos && orderPromos.length && baseAfterProduct > 0) {
    for (const promo of orderPromos) {
      const minAmt = promo.minOrderAmount || 0;
      if (minAmt > 0 && baseAfterProduct < minAmt) continue;

      let d = 0;
      if (promo.promoType === "PERCENT_OFF") {
        const pct = promo.percentOff || 0;
        if (pct > 0) d = (baseAfterProduct * pct) / 100;
      } else if (promo.promoType === "AMOUNT_OFF") {
        const off = promo.amountOff || 0;
        if (off > 0) d = Math.min(baseAfterProduct, off);
      }
      if (d > orderDiscount) orderDiscount = d;
    }
  }

  const totalDiscount = productDiscountTotal + orderDiscount;
  return { subtotal, itemsCount, discount: totalDiscount };
}

// Address Form
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
        <input
          id="addr-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
        <input
          type="text"
          value={house}
          onChange={(e) => setHouse(e.target.value)}
          required
        />
      </label>

      <label>
        <span className="label-text">Street / Soi</span>
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
        />
      </label>

      <div className="form-row">
        <label>
          <span className="label-text">Subdistrict</span>
          <input
            type="text"
            value={subdistrict}
            onChange={(e) => setSubdistrict(e.target.value)}
            required
          />
        </label>
        <label>
          <span className="label-text">District</span>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          <span className="label-text">Province</span>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            required
          >
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
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
        <span>Save as default address</span>
      </label>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Back
          </button>
        )}
        <button type="submit" className="btn-save">
          Save address
        </button>
      </div>
    </form>
  );
}

// Address List
function AddressList({ addresses, onSetDefault, onAddNew, onEdit, onDelete }) {
  if (!addresses.length) return null;

  // กรณีมีที่อยู่เดียวและไม่มีตัวไหนเป็น default ให้ถือว่าอันนั้นถูกเลือกอัตโนมัติ
  const singleAndNoDefault =
    addresses.length === 1 && !addresses[0]?.isDefault;

  return (
    <div className="saved-addresses">
      {addresses.map((addr, index) => {
        const isSelected =
          addr.isDefault || (singleAndNoDefault && index === 0);

        return (
          <label key={addr.id} className="address-option">
            <input
              type="radio"
              name="address"
              checked={isSelected}
              readOnly
            />
            <div className="address-box" style={{ position: "relative" }}>
              {isSelected ? (
                <span className="tag default">Default</span>
              ) : (
                <button
                  type="button"
                  className="link set-default-link"
                  onClick={() => onSetDefault(addr.id)}
                >
                  Set as default
                </button>
              )}

              <p className="addr-name">{addr.name}</p>
              <p className="addr-text">{addr.text}</p>
              <div className="addr-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onEdit(addr)}
                  aria-label="Edit address"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => onDelete(addr.id)}
                  aria-label="Delete address"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </label>
        );
      })}
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

// Confirm Dialog
function ConfirmDialog({
  open,
  title,
  message,
  cancelText = "Cancel",
  confirmText = "Delete",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div className="pm-modal-backdrop">
      <div className="pm-modal" role="dialog" aria-modal="true">
        <h3 className="pm-modal__title">{title}</h3>
        <p className="pm-modal__body">{message}</p>
        <div className="pm-modal__actions">
          <button
            type="button"
            className="btn-outline"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Order Summary
function OrderSummary({ cart, canConfirm, onConfirm, productPromos, orderPromos }) {
  const { subtotal, itemsCount, discount } = useMemo(
    () => computeCartTotals(cart, productPromos, orderPromos),
    [cart, productPromos, orderPromos]
  );

  const shipping = 0;
  const total = subtotal - discount + shipping;

  return (
    <aside className="card summary-card">
      <h2 className="section-title">Your order</h2>
      <div id="order-list">
        {cart.map((item, idx) => {
          const t =
            (Number(item.price) || 0) * (Number(item.qty) || 0);
          return (
            <div key={item.id ?? idx} className="order-item">
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
                  <span className="unit-price">
                    {currencyTHB(Number(item.price) || 0)} each
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="totals">
        <div className="line">
          <span>Item(s) total</span>
          <span>{currencyTHB(subtotal)}</span>
        </div>
        <div className="line">
          <span>Shop-discount</span>
          <span>−{currencyTHB(discount)}</span>
        </div>
        <div className="line">
          <span>Subtotal</span>
          <span>{currencyTHB(subtotal - discount)}</span>
        </div>
        <div className="line">
          <span>Shipping</span>
          <span>{currencyTHB(shipping)}</span>
        </div>
        <div className="line total">
          <span>
            {" "}
            Total ({itemsCount} item{itemsCount > 1 ? "s" : ""}){" "}
          </span>
          <span className="price">{currencyTHB(total)}</span>
        </div>
      </div>

      <div className="summary-actions">
        <button
          className="btn-primary"
          disabled={!canConfirm}
          onClick={onConfirm}
          title={
            canConfirm
              ? "Confirm order"
              : "Please add/select a shipping address first"
          }
        >
          Place Order
        </button>
      </div>
    </aside>
  );
}

// แปลงแหล่งข้อมูลไปเป็น cart shape เดียวกัน
function mapSelectionToCartItems(selItems = []) {
  return selItems.map((r, i) => ({
    id: r.productId ?? r.id ?? r.key ?? `sel-${i}`,
    productId: r.productId,
    name: r.title ?? r.name ?? `#${r.productId ?? r.id ?? (i + 1)}`,
    price: Number(r.price) || 0,
    qty: Math.max(1, Number(r.qty) || 1),
    img: r.image || r.img || "/assets/products/placeholder.jpg",
  }));
}

// จาก pm_cart เดิม (หลายรูปแบบ field)
function mapCartStorageToCartItems(raw = []) {
  return raw.map((x, i) => {
    const id =
      x.id ??
      x.productId ??
      x.product_id ??
      x.productIdFk ??
      x.product_id_fk ??
      `cart-${i}`;
    const name = x.title ?? x.name ?? x.productName ?? `#${id}`;
    const img =
      x.image ||
      x.img ||
      x.cover ||
      x.coverImageUrl ||
      x.imageUrl ||
      x.image_url ||
      "/assets/products/placeholder.jpg";
    return {
      id,
      productId:
        x.productId ?? x.product_id ?? x.productIdFk ?? x.product_id_fk,
      name,
      price: Number(x.price) || 0,
      qty: Math.max(1, Number(x.qty) || 1),
      img,
    };
  });
}

// Main Page
export default function PlaceOrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = resolveUserId();

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "error", timeout = 4000) => {
    setToast({ message, type });
    if (timeout > 0) setTimeout(() => setToast(null), timeout);
  };

  useEffect(() => {
    document.body.classList.add("po-page");
    return () => document.body.classList.remove("po-page");
  }, []);

  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [mode, setMode] = useState("list");
  const [editing, setEditing] = useState(null);
  const [loadingAddr, setLoadingAddr] = useState(true);

  // promotion state
  const [productPromosByProductId, setProductPromosByProductId] = useState({});
  const [orderLevelPromos, setOrderLevelPromos] = useState([]);

  // state สำหรับ popup ลบ
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    let initialCart = null;

    // จาก selection
    try {
      const sel = JSON.parse(
        localStorage.getItem(LS_CHECKOUT) || "null"
      );
      if (sel && Array.isArray(sel.items) && sel.items.length > 0) {
        initialCart = mapSelectionToCartItems(sel.items);
      }
    } catch {}

    // จาก buy-now
    if (
      !initialCart &&
      location.state?.from === "buy-now" &&
      location.state?.item
    ) {
      initialCart = [location.state.item];
    }

    // จาก history preview
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

    // จาก pm_cart ทั้งหมด
    if (!initialCart) {
      try {
        const ls = JSON.parse(localStorage.getItem(LS_CART) || "[]");
        if (Array.isArray(ls) && ls.length)
          initialCart = mapCartStorageToCartItems(ls);
      } catch {}
    }

    setCart(initialCart || []);
  }, [location.state]);

  // โหลด promotion ตามสินค้าใน cart
  useEffect(() => {
    if (!cart || cart.length === 0) {
      setProductPromosByProductId({});
      setOrderLevelPromos([]);
      return;
    }

    (async () => {
      try {
        const promos = await apiListActivePromotions();
        const orderPromos = promos.filter((p) => p.scope === "ORDER");
        const productPromos = promos.filter((p) => p.scope === "PRODUCT");

        const map = {};
        for (const promo of productPromos) {
          try {
            const products = await apiListProductsOfPromotion(promo.id);
            for (const prod of products) {
              const pid =
                prod.id ??
                prod.productId ??
                prod.product_id ??
                prod.productIdFk ??
                prod.product_id_fk;
              if (pid == null) continue;
              const key = String(pid);
              if (!map[key]) map[key] = [];
              map[key].push(promo);
            }
          } catch (e) {
            console.warn("load products of promo failed", e);
          }
        }

        setProductPromosByProductId(map);
        setOrderLevelPromos(orderPromos);
      } catch (e) {
        console.warn("load promotions failed", e);
      }
    })();
  }, [cart]);

  // โหลด Address จาก DB
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

  // เมื่อกดปุ่ม Delete ใน list ให้แค่เปิด popup
  const handleRequestDelete = (id) => {
    const target = addresses.find((a) => a.id === id);
    if (!target) return;
    setDeleteTarget(target);
  };

  // กดยืนยันลบใน popup
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiDeleteAddress(deleteTarget.id);
      setDeleteTarget(null);
      await refreshAddresses();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleCancelDelete = () => setDeleteTarget(null);

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

  // set address
  const canConfirm =
    addresses.length === 1 || addresses.some((a) => a.isDefault);

  const handleConfirm = async () => {
    const selectedAddress =
      addresses.find((a) => a.isDefault) || addresses[0] || null;

    if (!selectedAddress) {
      showToast("กรุณาเพิ่มที่อยู่ก่อนทำการสั่งซื้อ", "error");
      return;
    }

    const shippingAddress = `${selectedAddress.house || ""}${
      selectedAddress.street ? " " + selectedAddress.street + "," : ""
    } ${selectedAddress.subdistrict || ""}, ${selectedAddress.district || ""}, ${
      selectedAddress.province || ""
    } ${selectedAddress.zipcode || ""}`.trim();

    // ✅ คำนวณ subtotal / discount จาก cart + promotions เดียวกับที่โชว์ในหน้า
    const { subtotal, itemsCount, discount } = computeCartTotals(
      cart,
      productPromosByProductId,
      orderLevelPromos
    );
    const shippingFee = 0; // ตอนนี้ fix 0 ก่อน
    const grandTotal = subtotal - discount + shippingFee;

    try {
      const created = await apiCreateOrder({
        customerName: selectedAddress.name,
        customerPhone: selectedAddress.phone,
        shippingAddress,
        cart,
        subtotal,
        discountTotal: discount,
        shippingFee,
        grandTotal,
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

      try {
        localStorage.removeItem(LS_CHECKOUT);
      } catch {}

      navigate(`/tracking-user/${created.id}`, { state: orderPayload });
    } catch (e) {
      showToast(e.message || "สร้างคำสั่งซื้อไม่สำเร็จ", "error");
    }
  };

  return (
    <div className="place-order-page">
      <Header />
      {toast && (
        <div
          className={`pm-toast pm-toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <div className="pm-toast__body">
            <span>{toast.message}</span>
            <button
              className="pm-toast__close"
              onClick={() => setToast(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* popup ลบ address */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete address"
        message={
          deleteTarget
            ? `Are you sure you want to delete address of "${deleteTarget.name}" ?`
            : ""
        }
        cancelText="Cancel"
        confirmText="Delete"
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

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
                onDelete={handleRequestDelete}
              />
            )}

            {!loadingAddr && mode === "add" && (
              <AddressForm
                initial={null}
                onCancel={() =>
                  addresses.length ? setMode("list") : null
                }
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

          <OrderSummary
            cart={cart}
            canConfirm={canConfirm}
            onConfirm={handleConfirm}
            productPromos={productPromosByProductId}
            orderPromos={orderLevelPromos}
          />
        </div>
      </main>

      <Footer />

      {/* Sticky bottom action (mobile-first) */}
      <div className="sticky-checkout-bar">
        <button
          className="btn-primary"
          disabled={!canConfirm}
          onClick={handleConfirm}
          title={
            canConfirm
              ? "Confirm order"
              : "Please add/select a shipping address first"
          }
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
