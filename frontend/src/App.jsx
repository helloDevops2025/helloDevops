// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// // Layouts
// import UserLayout from "./layouts/UserLayout.jsx";
// import AdminLayout from "./layouts/AdminLayout.jsx";

// // User pages
// import LoginPage from "./pages/LoginPage.jsx";
// import SignUpPage from "./pages/SignUpPage.jsx";
// import HomePage from "./pages/HomePage.jsx";
// import ShopPage from "./pages/ShopPage.jsx";
// import ProductPage from "./pages/ProductPage.jsx";
// import PlaceOrderPage from "./pages/PlaceOrderPage.jsx";
// import DetailPage from "./pages/DetailPage.jsx";
// import TrackingUserPage from "./pages/TrackingUserPage.jsx";
// import WishListPage from "./pages/WishListPage.jsx";
// import HistoryPage from "./pages/HistoryPage.jsx";

// // Admin pages
// import AdminProductListPage from "./pages_admin/AdminProductListPage.jsx";
// import AdminAddProductPage from "./pages_admin/AdminAddProductPage.jsx";
// import AdminOrderListPage from "./pages_admin/AdminOrderListPage.jsx";
// import AdminOrderDetailPage from "./pages_admin/AdminOrderDetailPage.jsx";
// import AdminOrderTrackingPage from "./pages_admin/AdminOrderTrackingPage.jsx";
// import AdminEditProductPage from "./pages_admin/AdminEditProductPage.jsx";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* ✅ Default route: redirect ไป login  ถ้าใครอยากให้หน้าไหนรันครั้งแรก ให้เปลี่ยนตรงนี้ */}
//         <Route path="/" element={<Navigate to="/login" replace />} />

//         {/* ✅ User side with header */}
//         <Route element={<UserLayout />}>
//           <Route path="/home" element={<HomePage />} />
//           <Route path="/shop" element={<ShopPage />} />
//           <Route path="/products" element={<ProductPage />} />
//           <Route path="/place-order" element={<PlaceOrderPage />} />
//           <Route path="/detail/:id" element={<DetailPage />} />
//           <Route path="/tracking" element={<TrackingUserPage />} />
//           <Route path="/wishlist" element={<WishListPage />} />
//           <Route path="/history" element={<HistoryPage />} />
//         </Route>

//         {/* ❌ No header */}
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/signup" element={<SignUpPage />} />

//         {/* ✅ Admin with sidebar */}
//         <Route element={<AdminLayout />}>
//           <Route path="/admin/products" element={<AdminProductListPage />} />
//           <Route path="/admin/products/new" element={<AdminAddProductPage />} />
//           <Route path="/admin/orders" element={<AdminOrderListPage />} />
//           <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
//           <Route path="/admin/orders/tracking" element={<AdminOrderTrackingPage />} />
//           <Route path="/admin/products/:id/edit" element={<AdminEditProductPage />} />
//         </Route>
//       </Routes>
//     </BrowserRouter>
//   );
// }
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UserLayout from "./layouts/UserLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import PlaceOrderPage from "./pages/PlaceOrderPage.jsx";
import DetailPage from "./pages/DetailPage.jsx";
import TrackingUserPage from "./pages/TrackingUserPage.jsx";
import WishListPage from "./pages/WishListPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import AdminProductListPage from "./pages_admin/AdminProductListPage.jsx";
import AdminAddProductPage from "./pages_admin/AdminAddProductPage.jsx";
import AdminOrderListPage from "./pages_admin/AdminOrderListPage.jsx";
import AdminOrderDetailPage from "./pages_admin/AdminOrderDetailPage.jsx";
import AdminOrderTrackingPage from "./pages_admin/AdminOrderTrackingPage.jsx";
import AdminEditProductPage from "./pages_admin/AdminEditProductPage.jsx";

import { RequireAuth, RequireRole } from "./route-guards";
import LoginGate from "./components/LoginGate.jsx"; // ✅ ใช้ตัวนี้

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ เปิดเว็บครั้งแรก → ไป login เสมอ */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ✅ login จะล้าง session เสมอ (บังคับให้ล็อกอินใหม่ทุกครั้ง) */}
        <Route path="/login" element={<LoginGate />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* ✅ ต้องล็อกอินก่อน */}
        <Route element={<RequireAuth />}>
          {/* ฝั่ง user (ทั้ง USER และ ADMIN เข้าได้) */}
          <Route element={<UserLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/place-order" element={<PlaceOrderPage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="/tracking" element={<TrackingUserPage />} />
            <Route path="/wishlist" element={<WishListPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/cart" element={<CartPage />} />
          </Route>

          {/* ฝั่ง admin (เฉพาะ ADMIN) */}
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

        {/* fallback → กลับไป login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
