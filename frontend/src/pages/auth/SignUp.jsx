// export default function SignUp() {  hello
//     return <div>Sign Up Page</div>;
// }

// SignUp.jsx
import React, { useRef, useState } from "react";
// import "./style.css"; // ใช้ CSS เดิมได้เลย

export default function SignUp() {
  const formRef = useRef(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    // ใช้ HTML5 validation ก่อน
    if (!form.reportValidity()) return;

    // ตรวจรหัสผ่านตรงกัน
    const p1 = form.password.value;
    const p2 = form["confirm-password"].value;
    if (p1 !== p2) {
      alert("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900)); // demo async
    setSubmitting(false);
    alert("Signed up (demo)");
  };

  return (
    <main className="shell reverse">
      {/* ซ้าย: ภาพ/พื้นม่วงสำหรับ Sign Up */}
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

      {/* ขวา: ฟอร์ม Sign Up */}
      <section className="form-side_signup">
        <div className="logo_signup">
          <img src="/assets/logo-no-bg.png" alt="Logo" />
        </div>

        <div className="welcome-text_signup">
          <h1>Welcome!!!</h1>
          <p className="lead">Create your account to start shopping.</p>
        </div>

        <form id="signupForm" ref={formRef} noValidate onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="Enter your Email"
            autoComplete="email"
            required
          />

          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="input"
            placeholder="Enter your Phone number"
            inputMode="tel"
            autoComplete="tel"
            required
          />

          <label htmlFor="password">Password</label>
          <div className="password-wrap">
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              className="input"
              placeholder="Enter your password"
              minLength={6}
              autoComplete="new-password"
              required
            />
            <button
              className="toggle-eye"
              type="button"
              aria-label={showPwd ? "Hide password" : "Show password"}
              onClick={() => setShowPwd((s) => s ? false : true)}
            >
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
                {showPwd ? (
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

          <label htmlFor="confirm-password">Confirm Password</label>
          <div className="password-wrap">
            <input
              id="confirm-password"
              name="confirm-password"
              type={showConfirm ? "text" : "password"}
              className="input"
              placeholder="Confirm your password"
              minLength={6}
              autoComplete="new-password"
              required
            />
            <button
              className="toggle-eye"
              type="button"
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              onClick={() => setShowConfirm((s) => s ? false : true)}
            >
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
                {showConfirm ? (
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

          <button className="btn_signup" type="submit" disabled={submitting}>
            {submitting ? "Signing up..." : "SIGN UP"}
          </button>

          <p className="note_signup">
            Already have an account? <a href="/login.html">Login</a>
          </p>
        </form>
      </section>
    </main>
  );
}

