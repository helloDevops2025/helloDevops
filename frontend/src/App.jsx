// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import UserLayout from "./layouts/UserLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

// User pages
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import PlaceOrderPage from "./pages/PlaceOrderPage.jsx";
import DetailPage from "./pages/DetailPage.jsx";
import TrackingUserPage from "./pages/TrackingUserPage.jsx";
import WishListPage from "./pages/WishListPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import CartPage from "./pages/CartPage.jsx"; // 🆕 เติมจากฟลุ๊ค

// Admin pages
import AdminProductListPage from "./pages_admin/AdminProductListPage.jsx";
import AdminAddProductPage from "./pages_admin/AdminAddProductPage.jsx";
import AdminOrderListPage from "./pages_admin/AdminOrderListPage.jsx";
import AdminOrderDetailPage from "./pages_admin/AdminOrderDetailPage.jsx";
import AdminOrderTrackingPage from "./pages_admin/AdminOrderTrackingPage.jsx";
import AdminEditProductPage from "./pages_admin/AdminEditProductPage.jsx";

// Guards (ตามโครงของ ploy)
import { RequireAuth, RequireRole } from "./route-guards";
import LoginGate from "./components/LoginGate.jsx"; // ใช้เพื่อล้าง session ก่อนเข้า /login

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* เปิดเว็บครั้งแรก → ไป login เสมอ (กันเข้าเพจอื่นโดยยังไม่ล็อกอิน) */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* /login ใช้ LoginGate เพื่อล้าง session ให้สะอาด แล้วค่อย render LoginPage ภายใน */}
        <Route path="/login" element={<LoginGate />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* ต้องล็อกอินก่อน */}
        <Route element={<RequireAuth />}>
          {/* ฝั่งผู้ใช้ (ทั้ง USER และ ADMIN เข้าได้) */}
          <Route element={<UserLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/place-order" element={<PlaceOrderPage />} />
            {/* รองรับทั้งแบบมี/ไม่มี :id เพื่อกันลิงก์เดิมไม่พัง (ของฟลุ๊คเพิ่ม) */}
            <Route path="/detail" element={<DetailPage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="/tracking" element={<TrackingUserPage />} />
            <Route path="/wishlist" element={<WishListPage />} />
            <Route path="/history" element={<HistoryPage />} />
            {/* Alias route used by tests and some links */}
            <Route path="/orders" element={<HistoryPage />} />
            {/* 🆕 รถเข็นจากฟลุ๊ค */}
            <Route path="/cart" element={<CartPage />} />
          </Route>

          {/* ฝั่งแอดมิน (เฉพาะ ADMIN) */}
          <Route element={<RequireRole allow={["ADMIN"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/products" element={<AdminProductListPage />} />
              <Route path="/admin/products/new" element={<AdminAddProductPage />} />
              <Route path="/admin/orders" element={<AdminOrderListPage />} />
              <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
              <Route path="/admin/orders/tracking" element={<AdminOrderTrackingPage />} />
              <Route path="/admin/products/:id/edit" element={<AdminEditProductPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback → ไม่รู้จักเส้นทางให้กลับไป /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
