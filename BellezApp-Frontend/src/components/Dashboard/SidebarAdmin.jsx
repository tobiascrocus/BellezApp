// src/components/Dashboard/SidebarAdmin.jsx

import "../../styles/Sidebar.css";

export default function SidebarAdmin() {
  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">Panel Admin</h3>
      <ul className="sidebar-list">
        <li>Panel de Control</li>
        <li>Promociones</li>
        <li>Perfil</li>
      </ul>
    </aside>
  );
}