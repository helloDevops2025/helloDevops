import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",           // ✅ ให้ไฟล์ static อ้างจากรากเสมอ
  plugins: [react()],
});

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
// });

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173,       // ✅ fix ให้ใช้พอร์ต 5173
//     strictPort: true, // ✅ ถ้า 5173 ถูกใช้ -> ให้ error ไปเลย ไม่เด้งไป 5174
//   },
// });
