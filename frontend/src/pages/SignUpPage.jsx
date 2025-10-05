// src/pages/SignUpPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./SignUpPage.css";

export default function SignUpPage() {
  const [pwdVisible, setPwdVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // ใส่คลาสลง body เฉพาะหน้านี้ เพื่อซ่อน header/topbar และตัด padding-top
  useEffect(() => {
    document.body.classList.add("signup-page");
    return () => document.body.classList.remove("signup-page");
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    // HTML5 validity
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    if (password !== confirm) {
      alert("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    alert("Signed up (demo)");
  };

  const EyeClosed = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3E40AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.71 21.71 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.74 21.74 0 0 1-2.45 3.94"/>
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
  const EyeOpen = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3E40AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <main className="shell reverse signup-page">
      {/* ซ้าย: ภาพ/พื้นม่วงสำหรับ Sign Up */}
      <aside className="art-side" aria-label="Pure Mart artwork">
        <div className="illustration">
          <div className="phone" aria-hidden="true">
            <div style={{ display: "grid", placeItems: "center", gap: 10 }}>
              <img src="/assets/user/useraccess.png" style={{ width: 686, height: 383 }} alt="Illustration of shopping with a smartphone" />
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

      {/* ขวา: ฟอร์ม Sign Up */}
      <section className="form-side_signup">
        <div className="logo_signup">
          <img src="/assets/logo.png" alt="Pure Mart" />
        </div>

        <div className="welcome-text_signup">
          <h1>Welcome!!!</h1>
          <p className="lead">Create your account to start shopping.</p>
        </div>

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
              aria-label={pwdVisible ? "Hide password" : "Show password"}
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
              aria-label={confirmVisible ? "Hide confirm password" : "Show confirm password"}
              onClick={() => setConfirmVisible((v) => !v)}
            >
              {confirmVisible ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>

          <button id="submitBtn" className="btn_signup" type="submit" disabled={submitting} aria-busy={submitting}>
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