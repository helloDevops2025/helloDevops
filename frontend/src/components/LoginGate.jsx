import { useEffect } from "react";
import { clearAuth } from "../auth";
import LoginPage from "../pages/LoginPage.jsx";

// เวลาเข้า /login → ล้าง session ทิ้งเสมอ
export default function LoginGate() {
  useEffect(() => {
    clearAuth();
  }, []);

  return <LoginPage />;
}
