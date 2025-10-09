// src/layouts/AdminLayout.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { getEmail, logout, isAuthed } from "../auth";  // << ใช้ helper
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isAuthed()) navigate("/login", { replace: true });
    setEmail(getEmail() || "");
  }, [navigate]);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = email ? email.split("@")[0] : "ACCOUNT";

  return (
    <div className="app">
      <AdminSidebar />
      <main className="main">
        <header className="topbar">
          <div />
          <div className="account" ref={menuRef}>
            <div className="account-btn" onClick={() => setOpen(!open)} style={{cursor:"pointer",display:"flex",alignItems:"center"}}>
              <i className="fa-regular fa-circle-user" style={{ marginRight: 6 }} />
              {displayName}
              <i className={`fa-solid fa-chevron-${open ? "up" : "down"}`} style={{ marginLeft: 6, fontSize: 12 }} />
            </div>
            {open && (
              <div className="account-menu">
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

// src/layouts/AdminLayout.jsx   version 1
// import { Outlet } from "react-router-dom";
// import AdminSidebar from "../components/AdminSidebar";
// import "./AdminLayout.css";

// export default function AdminLayout() {
//   return (
//     <div className="app">
//       {/* ซ้าย: เมนูแอดมิน */}
//       <AdminSidebar />

//       {/* ขวา: พื้นที่ทำงาน */}
//       <main className="main">
//         {/* ถ้าต้องการแถบด้านบนคงที่ไว้ทุกหน้า ใส่ที่นี่ได้ */}
//         <header className="topbar">
//           <div />
//           <div className="account">
//             <i className="fa-regular fa-circle-user" /> ACCOUNT
//           </div>
//         </header>

//         {/* เนื้อหาแต่ละหน้า (เช่น AdminProductListPage) จะมาแสดงตรงนี้ */}
//         <Outlet />
//       </main>
//     </div>
//   );
// }
