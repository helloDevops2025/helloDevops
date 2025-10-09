// src/pages/SignUpPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";             // ✅ ใช้ axios instance เดิม
import "./SignUpPage.css";

export default function SignUpPage() {
  const [pwdVisible, setPwdVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");

  const navigate = useNavigate();

  const normalizePhone = (s) => s.replace(/[^\d]/g, "");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    // HTML5 validation ก่อน
    if (!e.currentTarget.reportValidity()) return;

    // ตรวจรหัสผ่านตรงกัน
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    // (ออปชัน) เช็คความยาว/ความแข็งแรงขั้นต่ำ
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    // (ออปชัน) ทำเบอร์ให้เหลือแต่ตัวเลข
    const phoneDigits = normalizePhone(phone);
    if (phoneDigits.length < 9) {
      setErr("Please enter a valid phone number.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = { email: email.trim(), phone: phoneDigits, password };
      const res = await api.post("/api/auth/signup", payload);

      // สมัครสำเร็จ
      // ถ้า backend ส่ง 201/200 มา ถือว่าสำเร็จ
      if (res.status === 200 || res.status === 201) {
        // เคลียร์ฟอร์ม
        setEmail("");
        setPhone("");
        setPassword("");
        setConfirm("");

        alert("Sign up successful! Please log in.");
        navigate("/login", { replace: true });
        return;
      }

      // เผื่อกรณีสถานะอื่น ๆ
      setErr(`Unexpected response: ${res.status}`);
    } catch (error) {
      // อ่านข้อความจาก backend ให้ได้มากที่สุด
      const msgFromBackend =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Sign up failed";

      // กรณีซ้ำอีเมล (ส่วนใหญ่จะ 409)
      if (error?.response?.status === 409) {
        setErr("This email is already registered.");
      } else {
        setErr(msgFromBackend);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ไอคอนตา
  const EyeClosed = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3E40AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.71 21.71 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.74 21.74 0 0 1-2.45 3.94"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
  const EyeOpen = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3E40AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <main className="shell reverse">
      {/* ซ้าย: ภาพ/พื้นม่วง */}
      <aside className="art-side" aria-label="Pure Mart artwork">
        <div className="illustration">
          <div className="phone" aria-hidden="true">
            <div style={{ display: "grid", placeItems: "center", gap: 10 }}>
              <img src="/assets/user/useraccess.png" style={{ width: 686, height: 383 }} />
              <h2 style={{ color: "white", fontWeight: 600, fontSize: 24, margin: 0 }}>Pure Mart</h2>
              <p style={{ color: "white", fontSize: 14, margin: 0, textAlign: "center" }}>
                Your one-stop shop for all things fresh and organic.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ขวา: ฟอร์ม Sign Up */}
      <section className="form-side_signup">
        <div className="logo_signup">
          <img src="/assets/logo.png" alt="Logo" />
        </div>

        <div className="welcome-text_signup">
          <h1>Welcome!!!</h1>
          <p className="lead">Create your account to start shopping.</p>
        </div>

        {/* แสดง error */}
        {err && (
          <p role="alert" style={{ color: "#c00", margin: "8px 0", whiteSpace: "pre-wrap" }}>
            {err}
          </p>
        )}

        <form id="signupForm" onSubmit={onSubmit} noValidate>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="Enter your Email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            className="input"
            placeholder="Phone number"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <div className="password-wrap">
            <input
              id="password"
              type={pwdVisible ? "text" : "password"}
              className="input"
              placeholder="Enter your password"
              minLength={6}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="toggle-eye"
              type="button"
              aria-label="Show/Hide password"
              onClick={() => setPwdVisible((v) => !v)}
            >
              {pwdVisible ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>

          <label htmlFor="confirm-password">Confirm Password</label>
          <div className="password-wrap">
            <input
              id="confirm-password"
              type={confirmVisible ? "text" : "password"}
              className="input"
              placeholder="Confirm Password"
              minLength={6}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button
              className="toggle-eye"
              type="button"
              aria-label="Show/Hide confirm password"
              onClick={() => setConfirmVisible((v) => !v)}
            >
              {confirmVisible ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>

          <button id="submitBtn" className="btn_signup" type="submit" disabled={submitting}>
            {submitting ? "Signing up..." : "SIGN UP"}
          </button>

          <p className="note_signup">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
