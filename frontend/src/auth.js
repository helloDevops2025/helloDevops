const S = sessionStorage;

export function setAuth({ token, role, user }) {
  S.setItem("token", token);
  S.setItem("role", role); // 'ADMIN' หรือ 'USER'
  if (user) S.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  S.removeItem("token");
  S.removeItem("role");
  S.removeItem("user");
}

export const getToken = () => S.getItem("token");
export const getRole = () => S.getItem("role");
export const isAuthed = () => !!getToken();
