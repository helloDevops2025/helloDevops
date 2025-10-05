// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const [username, setUsername] = useState(""); // รองรับทั้ง email/username
  const [password, setPassword] = useState("");
  const [pwdVisible, setPwdVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  // ไอคอนตาปิด/ตาเปิด (เหมือนของเดิม)
  const EyeClosed = () => (
    <svg
      id="eye-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3E40AE"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.71 21.71 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.74 21.74 0 0 1-2.45 3.94"/>
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
  const EyeOpen = () => (
    <svg
      id="eye-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3E40AE"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);

    // หน่วงนิดหน่อยเพื่อแสดงสถานะปุ่ม
    await new Promise((r) => setTimeout(r, 300));

    // เงื่อนไขล็อกอิน
    if (username === "user" && password === "user123") {
      localStorage.setItem("auth", JSON.stringify({ role: "user", name: "user" }));
      navigate("/"); // ไปหน้า Home
    } else if (username === "admin" && password === "admin123") {
      localStorage.setItem("auth", JSON.stringify({ role: "admin", name: "admin" }));
      navigate("/admin/products"); // ไปหน้า AdminProductListPage
    } else {
      setErr("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }

    setSubmitting(false);
  };

  return (
    <main className="shell">
      {/* ซ้าย: ฟอร์ม */}
      <section className="form-side">
        <div className="logo">
          {/* คงพาธและดีไซน์เดิม */}
          <img src="/assets/logo.png" alt="Logo" />
        </div>

        <div className="welcome-text">
          <h1>Welcome Back!</h1>
          <p className="lead">Sign in with your email address and Password.</p>
        </div>

        <form id="loginForm" onSubmit={onSubmit} noValidate>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="text" // ใช้ text เพื่อรองรับ 'user' / 'admin'
            className="input"
            placeholder="Enter your Email or username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <div className="password-wrap">
            <input
              id="password"
              type={pwdVisible ? "text" : "password"}
              className="input"
              placeholder="Enter your password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="toggle-eye"
              type="button"
              aria-label="แสดง/ซ่อนรหัสผ่าน"
              onClick={() => setPwdVisible((v) => !v)}
            >
              {pwdVisible ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>

          <div className="row-end">
            <a href="#" className="link">Forgot Password?</a>
          </div>

          {/* แสดงข้อความผิดพลาดเหมือนฟอร์มทั่วไป */}
          {err && (
            <p style={{ color: "crimson", fontSize: 14, marginTop: 8 }}>
              {err}
            </p>
          )}

          <button id="submitBtn" className="btn" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "LOGIN"}
          </button>

          <p className="note">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </form>
      </section>

      {/* ขวา: ภาพ/พื้นม่วงขวา (คงดีไซน์เดิมทั้งหมด) */}
      <aside className="art-side" aria-label="Pure Mart artwork">
        <div className="illustration">
          <div className="phone" aria-hidden="true">
            <div style={{ display: "grid", placeItems: "center", gap: 10 }}>
              <img
                src="/assets/user/useraccess.png"
                style={{ width: 686, height: 383 }}
                alt=""
              />
              <h2 style={{ color: "white", fontWeight: 600, fontSize: 24, margin: 0 }}>
                Pure Mart
              </h2>
              <p style={{ color: "white", fontSize: 14, margin: 0, textAlign: "center" }}>
                Your one-stop shop for all things fresh and organic.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
