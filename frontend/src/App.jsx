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

// Admin pages
import AdminProductListPage from "./pages_admin/AdminProductListPage.jsx";
import AdminAddProductPage from "./pages_admin/AdminAddProductPage.jsx";
import AdminOrderListPage from "./pages_admin/AdminOrderListPage.jsx";
import AdminOrderDetailPage from "./pages_admin/AdminOrderDetailPage.jsx";
import AdminOrderTrackingPage from "./pages_admin/AdminOrderTrackingPage.jsx";
import AdminEditProductPage from "./pages_admin/AdminEditProductPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ Default route: redirect ไป login  ถ้าใครอยากให้หน้าไหนรันครั้งแรก ให้เปลี่ยนตรงนี้ */}
        <Route path="/" element={<Navigate to="/detail/:id" replace />} />

        {/* ✅ User side with header */}
        <Route element={<UserLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/place-order" element={<PlaceOrderPage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="/tracking" element={<TrackingUserPage />} />
          <Route path="/wishlist" element={<WishListPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        {/* ❌ No header */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* ✅ Admin with sidebar */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/products" element={<AdminProductListPage />} />
          <Route path="/admin/products/new" element={<AdminAddProductPage />} />
          <Route path="/admin/orders" element={<AdminOrderListPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="/admin/orders/tracking" element={<AdminOrderTrackingPage />} />
          <Route path="/admin/products/:id/edit" element={<AdminEditProductPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
