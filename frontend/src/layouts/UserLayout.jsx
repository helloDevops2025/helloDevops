import { Outlet } from "react-router-dom";
import Header from "../components/header"; // h เล็กให้ตรงชื่อไฟล์

export default function UserLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  ); 
}
