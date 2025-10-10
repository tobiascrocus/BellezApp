import "../../styles/Sidebar.css";

export default function Sidebar({ onSelect }) {
  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">Panel</h3>
      <ul className="sidebar-list">
        <li onClick={() => onSelect("perfil")}>Perfil</li>
        <li onClick={() => onSelect("turnos")}>Turnos</li>
        <li onClick={() => onSelect("promos")}>Promociones</li>
      </ul>
    </aside>
  );
}
