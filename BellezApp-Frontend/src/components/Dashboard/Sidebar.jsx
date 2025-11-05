import "../../styles/Sidebar.css";

export default function Sidebar({ onSelect }) {
  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">Panel</h3>
      <ul className="sidebar-list">
        <li onClick={() => onSelect && onSelect("inicio")}>Inicio</li>
        <li onClick={() => onSelect && onSelect("turnos")}>Turnos</li>
        <li onClick={() => onSelect && onSelect("promos")}>Promociones</li>
        <li onClick={() => onSelect && onSelect("catalogo")}>Catálogo</li>
        <li onClick={() => onSelect && onSelect("quienes")}>Quiénes Somos</li> 
      </ul>
    </aside>
  );
}
