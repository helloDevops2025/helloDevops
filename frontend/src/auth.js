// auth.js (root)
const S = sessionStorage;

export function setAuth({ token, role, user }) {
  if (token) S.setItem("token", token);
  if (role) S.setItem("role", role); // 'ADMIN' | 'USER'
  if (user) {
    S.setItem("user", JSON.stringify(user));
    if (user.email) S.setItem("email", user.email); // << เพิ่ม
  }
}

export function clearAuth() {
  S.removeItem("token");
  S.removeItem("role");
  S.removeItem("user");
  S.removeItem("email"); // << เพิ่ม
}

export const logout = clearAuth; // ชื่อสั้นๆไว้ใช้ใน UI
export const getToken = () => S.getItem("token");
export const getRole = () => S.getItem("role");
export const getEmail = () => S.getItem("email"); // << เพิ่ม
export const isAuthed = () => !!getToken();
