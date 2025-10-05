// src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import "./AdminLayout.css";

export default function AdminLayout() {
  return (
    <div className="app">
      {/* ซ้าย: เมนูแอดมิน */}
      <AdminSidebar />

      {/* ขวา: พื้นที่ทำงาน */}
      <main className="main">
        {/* ถ้าต้องการแถบด้านบนคงที่ไว้ทุกหน้า ใส่ที่นี่ได้ */}
        <header className="topbar">
          <div />
          <div className="account">
            <i className="fa-regular fa-circle-user" /> ACCOUNT
          </div>
        </header>

        {/* เนื้อหาแต่ละหน้า (เช่น AdminProductListPage) จะมาแสดงตรงนี้ */}
        <Outlet />
      </main>
    </div>
  );
}
