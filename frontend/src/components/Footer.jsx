import { useState } from "react";
import "./footer.css";

const ASSETS_BASE = "/assets/user"; // ปรับให้ตรงที่เก็บไฟล์จริง

// style ที่ต้อง “ชนะทุกกฎ” จะถูกฉีดท้ายฟุตเตอร์เสมอ
const FORCE_COLORS = `
/* ลิงก์คอลัมน์ซ้าย/กลาง */
.pm-footer .pm-foot-col a,
.pm-footer .pm-foot-col a:link,
.pm-footer .pm-foot-col a:visited{
  color:#cfd2f5 !important;
  -webkit-text-fill-color:#cfd2f5 !important;
  text-decoration:none !important;
  opacity:1 !important;
}
.pm-footer .pm-foot-col a:hover,
.pm-footer .pm-foot-col a:focus{
  color:#ffffff !important;
  -webkit-text-fill-color:#ffffff !important;
}

/* ข้อความบรรยายใต้ Subscribe */
.pm-footer .pm-sub-note{
  color:#cfd2f5 !important;
  opacity:1 !important;
}

/* ลิงก์ Terms / Privacy / Cookies */
.pm-footer .pm-foot-legal a,
.pm-footer .pm-foot-legal a:link,
.pm-footer .pm-foot-legal a:visited{
  color:#cfd2f5 !important;
  -webkit-text-fill-color:#cfd2f5 !important;
  text-decoration:none !important;
  opacity:1 !important;
}
.pm-footer .pm-foot-legal a:hover,
.pm-footer .pm-foot-legal a:focus{
  color:#ffffff !important;
  -webkit-text-fill-color:#ffffff !important;
}

/* กันกฎ global ประเภท filter/underline มาก่อกวน */
.pm-footer, .pm-footer *{ filter:none !important; text-shadow:none !important; }
.pm-footer a{ text-decoration:none !important; }
`;

export default function Footer() {
  const [msg, setMsg] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email")?.toString().trim();
    if (!email) return setMsg("Please enter your email.");
    setMsg("Thanks for subscribing! 🎉");
    e.currentTarget.reset();
  };

  return (
    <footer className="pm-footer">
      <div className="pm-footer__inner">
        <div className="pm-footer__cols">
          <nav className="pm-foot-col">
            <h4>Shopping</h4>
            <ul>
              <li><a href="#">Fresh Vegetables</a></li>
              <li><a href="#">Fruits</a></li>
              <li><a href="#">Meat & Seafood</a></li>
              <li><a href="#">Frozen Food</a></li>
              <li><a href="#">Snacks & Beverages</a></li>
              <li><a href="#">Household Essentials</a></li>
            </ul>
          </nav>

          <nav className="pm-foot-col">
            <h4>About Pure Mart</h4>
            <ul>
              <li><a href="#">About us</a></li>
              <li><a href="#">Our Suppliers</a></li>
              <li><a href="#">Contact us</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </nav>

          <nav className="pm-foot-col">
            <h4>Customer Care</h4>
            <ul>
              <li><a href="#">Blog / Recipes</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Shipping & Delivery</a></li>
              <li><a href="#">Returns & Refunds</a></li>
              <li><a href="#">Promotions</a></li>
            </ul>
          </nav>

          <section className="pm-foot-sub">
            <h4>Subscribe</h4>
            <form noValidate onSubmit={onSubmit}>
              <label className="sr-only" htmlFor="sub-email">Email address</label>
              <div className="pm-sub-input">
                <input id="sub-email" name="email" type="email" placeholder="Email address" required />
                <button type="submit" aria-label="Subscribe">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <p className="pm-sub-note">
                Pure Mart carefully selects fresh ingredients from trusted farms and suppliers,
                delivering them straight to your home quickly and safely.
              </p>
              <p className="pm-sub-msg" role="status" aria-live="polite">{msg}</p>
            </form>
          </section>
        </div>

        <hr className="pm-foot-sep" />

        <div className="pm-foot-bottom">
          <a className="pm-foot-logo" href="/" aria-label="Pure Mart">
            <img src={`${ASSETS_BASE}/whitelogo.png`} alt="PURE MART" loading="lazy" />
          </a>

          <ul className="pm-foot-legal">
            <li><a href="#">Terms</a></li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Cookies</a></li>
          </ul>

          <div className="pm-foot-social">
            <a href="#" aria-label="Facebook"><img src={`${ASSETS_BASE}/facebook.svg`} alt="Facebook" loading="lazy" /></a>
            <a href="#" aria-label="Instagram"><img src={`${ASSETS_BASE}/ig.svg`} alt="Instagram" loading="lazy" /></a>
            <a href="#" aria-label="Twitter"><img src={`${ASSETS_BASE}/Twit.svg`} alt="Twitter" loading="lazy" /></a>
            <a href="#" aria-label="LinkedIn"><img src={`${ASSETS_BASE}/in.svg`} alt="LinkedIn" loading="lazy" /></a>
          </div>
        </div>
      </div>

      {/* ฉีดสไตล์สำคัญให้โหลดหลังสุด ชนะทุกไฟล์ CSS อื่น */}
      <style>{FORCE_COLORS}</style>
    </footer>
  );
}
