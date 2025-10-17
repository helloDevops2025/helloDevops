// src/pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./LoginPage.css";
import { setAuth, isAuthed } from "../auth";
import api from "../lib/api";               // ✅ ต้องมี import นี้!

export default function LoginPage() {
  const [username, setUsername] = useState(""); // รองรับทั้ง email/username
  const [password, setPassword] = useState("");
  const [pwdVisible, setPwdVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // ถ้า login อยู่แล้ว เด้งออกจาก /login
  useEffect(() => {
    if (isAuthed()) navigate("/", { replace: true });
  }, [navigate]);

  const EyeClosed = () => (
    <svg id="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3E40AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.71 21.71 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.74 21.74 0 0 1-2.45 3.94"/>
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
  const EyeOpen = () => (
    <svg id="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3E40AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSubmitting(true);

    try {
      // --- ตรวจอินพุตให้ชัด ---
      const emailInput = username.trim();
      if (!emailInput) {
        setErr("กรุณากรอกอีเมล");
        return;
      }
      // อนุญาตให้พิมพ์แค่ชื่อได้ เช่น 'admin' จะเติม @gmail.com ให้
      const email = emailInput.includes("@") ? emailInput : `${emailInput}@gmail.com`;

      if (!password) {
        setErr("กรุณากรอกรหัสผ่าน");
        return;
      }

      // --- ยิง API จริง ---
      const payload = { email, password };
      const res = await api.post("api/auth/login", payload);

      // รองรับทั้งรูปแบบมี/ไม่มี token
      const token = res.data?.token || "dummy-token";
      const role  = res.data?.role  || res.data?.user?.role  || "USER";
      const emailFromApi = res.data?.email || res.data?.user?.email || email;

      setAuth({ token, role, user: { email: emailFromApi } });

      // ปิด/หยุด media ก่อน navigate กัน AbortError
      document.querySelectorAll("video,audio").forEach((m) => {
        try { m.pause(); m.removeAttribute("src"); m.load(); } catch {}
      });

      const fallback = role === "ADMIN" ? "/admin/products" : "/home";
      const to = location.state?.from?.pathname || fallback;
      navigate(to, { replace: true });
    } catch (err) {
      // log ช่วยไล่ปัญหา (ดูใน Console)
      console.error("LOGIN ERROR:", err?.response?.status, err?.response?.data, err);
      const msg = err?.response?.status === 401
        ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
        : (typeof err?.response?.data === "string"
            ? err.response.data
            : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="shell">
      {/* ซ้าย: ฟอร์ม */}
      <section className="form-side">
        <div className="logo">
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
            type="text"
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

      {/* ขวา: ภาพ/พื้นม่วง */}
      <aside className="art-side" aria-label="Pure Mart artwork">
        <div className="illustration">
          <div className="phone" aria-hidden="true">
            <div style={{ display: "grid", placeItems: "center", gap: 10 }}>
              <img src="/assets/user/useraccess.png" style={{ width: 686, height: 383 }} alt="" />
              <h2 style={{ color: "white", fontWeight: 600, fontSize: 24, margin: 0 }}>Pure Mart</h2>
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
