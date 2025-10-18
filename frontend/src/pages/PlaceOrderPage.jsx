// src/pages/PlaceOrderPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import "./PlaceOrderPage.css";
import "./breadcrumb.css";

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

/* ===== Address Form ===== */
function AddressForm({ initial, onCancel, onSave }) {
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

  const submit = (e) => {
    e.preventDefault();
    if (!name || !phone || !house || !subdistrict || !district || !province || !zipcode) {
      alert("Please fill in all required fields");
      return;
    }
    if (!isValidThaiMobile(phone)) {
      alert("Please enter a valid Thai mobile number");
      return;
    }
    const text = `${house} ${street ? street + ", " : ""}${subdistrict}, ${district}, ${province} ${zipcode} | Tel: ${phone}`;
    onSave({
      id: initial?.id ?? Date.now(),
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
            onChange={(e) => setZipcode(e.target.value)}
            required
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
          <input
            type="radio"
            name="address"
            checked={!!addr.isDefault}
            readOnly
          />
          <div className="address-box" style={{ position: "relative" }}>
            {addr.isDefault ? (
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
              <button type="button" className="icon-btn" onClick={() => onEdit(addr)} aria-label="Edit address">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                </svg>
                <span>Edit</span>
              </button>

              <button type="button" className="icon-btn danger" onClick={() => onDelete(addr.id)} aria-label="Delete address">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
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
          <span>{currencyTHB(subtotal)}</span>
        </div>
        <div className="line">
          <span>Shipping</span>
          <span>{currencyTHB(shipping)}</span>
        </div>
        <div className="line total">
          <span> Total ({itemsCount} item{itemsCount > 1 ? "s" : ""}) </span>
          <span className="price">{currencyTHB(total)}</span>
        </div>
      </div>

      {/* Primary action inside the summary card (desktop-first) */}
      <div className="summary-actions">
        <button
          className="btn-primary"
          disabled={false}  // เดโม: เปิดปุ่มเสมอ
          onClick={onConfirm}
          title={canConfirm ? "Confirm order" : "Please add/select a shipping address first"}
        >
          ยืนยันคำสั่งซื้อ
        </button>
      </div>
    </aside>
  );
}

/* ===== Main Page ===== */
export default function PlaceOrderPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("po-page");
    return () => document.body.classList.remove("po-page");
  }, []);

  const [cart] = useState([
    { id: '#00001' , name: "ข้าวขาวหอมมะลิใหม่100% 5กก.", price: 165.00, qty: 1, img: "/assets/products/001.jpg" },
    { id: '#00007', name: "ซูเปอร์เชฟ หมูเด้ง แช่แข็ง 220 กรัม แพ็ค 3", price: 180.00, qty: 4, img: "/assets/products/007.jpg" },
    { id: '#00018', name: "มะม่วงน้ำดอกไม้สุก", price: 120.00, qty: 2, img: "/assets/products/018.jpg" },
    { id: '#00011' , name: "ซีพี ชิคแชค เนื้อไก่ปรุงรสทอดกรอบแช่แข็ง 800 กรัม", price: 179.00, qty: 2, img: "/assets/products/011.jpg" },
    { id: '#00004', name: "โกกิแป้งทอดกรอบ 500ก.", price: 45.00, qty: 2, img: "/assets/products/004.jpg" },
  ]);
  const [addresses, setAddresses] = useState([]);
  const [mode, setMode] = useState("list");
  const [editing, setEditing] = useState(null);

  const breadcrumbItems = [
    { label: "Home", href: "/home" },
    { label: "Cart", href: "/cart" },
    { label: "Checkout" },
  ];

  const handleSetDefault = (id) =>
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  const handleAddNew = () => {
    setEditing(null);
    setMode("add");
  };
  const handleEdit = (addr) => {
    setEditing(addr);
    setMode("edit");
  };
  const handleDelete = (id) => {
    const target = addresses.find((a) => a.id === id);
    if (!target) return;
    if (!window.confirm(`Delete address of "${target.name}" ?`)) return;
    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (target.isDefault && filtered.length > 0) {
        filtered[0] = { ...filtered[0], isDefault: true };
      }
      return filtered;
    });
    if (editing?.id === id) {
      setEditing(null);
      setMode("list");
    }
  };
  const handleSave = (payload) => {
    setAddresses((prev) => {
      let next = [...prev];
      const willBeDefault = payload.isDefault || next.length === 0;
      if (mode === "edit" && editing) {
        const idx = next.findIndex((a) => a.id === editing.id);
        if (idx !== -1) next[idx] = { ...payload };
      } else {
        next.push({ ...payload });
      }
      if (willBeDefault) {
        next = next.map((a) => ({ ...a, isDefault: a.id === payload.id }));
      } else if (!next.some((a) => a.isDefault) && next.length > 0) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
    setEditing(null);
    setMode("list");
  };

  useEffect(() => {
    if (addresses.length === 0) setMode("add");
    else if (mode === "add" && addresses.length > 0) setMode("list");
    // eslint-disable-next-line
  }, [addresses.length]);

  // ยังเก็บไว้ใช้โชว์ tooltip ได้
  const canConfirm = addresses.some(a => a.isDefault);

  // ✅ แก้: ไม่บล็อกด้วย canConfirm แล้ว และทำ fallback address ให้เอง
  const handleConfirm = () => {
    const orderId = Date.now(); // mock id
    const selectedAddress =
      addresses.find(a => a.isDefault) || addresses[0] || null;

    const orderPayload = { orderId, address: selectedAddress, cart };
    try {
      sessionStorage.setItem("pm_last_order", JSON.stringify(orderPayload));
    } catch {}

    navigate(`/tracking-user/${orderId}`, { state: orderPayload });
  };

  return (
    <div className="place-order-page">
      <Header />

      <main className="container">
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="title">Checkout Page</h1>

        <div className="checkout-grid">
          <section className="card form-card">
            <h2 className="section-title">Shipping Address</h2>

            {mode === "list" && (
              <AddressList
                addresses={addresses}
                onSetDefault={handleSetDefault}
                onAddNew={handleAddNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}

            {mode === "add" && (
              <AddressForm
                initial={null}
                onCancel={() => (addresses.length ? setMode("list") : null)}
                onSave={handleSave}
              />
            )}

            {mode === "edit" && editing && (
              <AddressForm
                initial={editing}
                onCancel={() => {
                  setEditing(null);
                  setMode("list");
                }}
                onSave={handleSave}
              />
            )}
          </section>

          <OrderSummary
            cart={cart}
            canConfirm={canConfirm}
            onConfirm={handleConfirm}
          />
        </div>
      </main>

      <Footer />

      {/* Sticky bottom action (mobile-first) */}
      <div className="sticky-checkout-bar">
        <button
          className="btn-primary"
          disabled={false} // เดโม: เปิดปุ่มเสมอ
          onClick={handleConfirm}
          title={canConfirm ? "Confirm order" : "Please add/select a shipping address first"}
        >
          ยืนยันคำสั่งซื้อ
        </button>
      </div>
    </div>
  );
}
