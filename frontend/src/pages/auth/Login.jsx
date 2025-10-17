// Login.jsx
import React, { useRef, useState } from "react";
// import "./style.css"; // ใช้ไฟล์เดิมได้เลย
//Test Change

export default function Login() {
  const formRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleTogglePassword = () => setShowPassword((s) => !s);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    // ใช้ HTML5 validation เดิม
    if (!form.reportValidity()) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900)); // demo async
    setSubmitting(false);
    alert("Logged in (demo)");
  };

  return (
    <main className="shell">
      {/* ซ้าย: ฟอร์ม */}
      <section className="form-side">
        <div className="logo">
          <img src="/assets/logo-no-bg.png" alt="Logo" />
        </div>

        <div className="welcome-text">
          <h1>Welcome Back!</h1>
          <p className="lead">Sign in with your email address and Password.</p>
        </div>

        <form id="loginForm" ref={formRef} noValidate onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="Enter your Email"
            required
          />

          <label htmlFor="password">Password</label>
          <div className="password-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="input"
              placeholder="Enter your password"
              minLength={6}
              required
            />
            <button
              className="toggle-eye"
              type="button"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              onClick={handleTogglePassword}
            >
              {/* ไอคอนเปลี่ยนตาม state */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3E40AE"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {showPassword ? (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                ) : (
                  <>
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.71 21.71 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.74 21.74 0 0 1-2.45 3.94" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                )}
              </svg>
            </button>
          </div>

          <div className="row-end">
            <a href="#" className="link">
              Forgot Password?
            </a>
          </div>

          <button id="submitBtn" className="btn" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "LOGIN"}
          </button>

          <p className="note">
            Don't have an account? <a href="/signup.html">Sign Up</a>
          </p>
        </form>
      </section>

      {/* ภาพ/พื้นม่วงขวา */}
      <aside className="art-side" aria-label="Pure Mart artwork">
        <div className="illustration">
          <div className="phone" aria-hidden="true">
            <div style={{ display: "grid", placeItems: "center", gap: 10 }}>
              <img
                src="/assets/user/useraccess.png"
                style={{ width: 686, height: 383 }}
                alt=""
              />
              <h2
                style={{
                  color: "white",
                  fontWeight: 600,
                  fontSize: 24,
                  margin: 0,
                }}
              >
                Pure Mart
              </h2>
              <p
                style={{
                  color: "white",
                  fontSize: 14,
                  margin: 0,
                  textAlign: "center",
                }}
              >
                Your one-stop shop for all things fresh and organic.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

