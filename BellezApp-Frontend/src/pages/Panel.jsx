import { useState } from "react";
import Navbar from "../components/Dashboard/Navbar"; 
import Footer from "../components/Dashboard/Footer"; 
import Sidebar from "../components/Dashboard/Sidebar";
import "../styles/Panel.css";

export default function Panel() {
  const [section, setSection] = useState("perfil");

  return (
    <div className="panel-page">
      <Navbar />

      <div className="panel-content">
        <Sidebar onSelect={setSection} />

        <main className="panel-main">
          {section === "perfil" && (
            <section className="panel-section">
              <h2>Perfil del Usuario</h2>
              <p>
                Aquí podés ver y editar tus datos personales, como nombre, correo
                o preferencias.
              </p>
            </section>
          )}

          {section === "turnos" && (
            <section className="panel-section">
              <h2>Turnos de Peluqueros</h2>
              <p>
                Visualizá los turnos asignados a cada peluquero, su disponibilidad
                y horarios.
              </p>
            </section>
          )}

          {section === "promos" && (
            <section className="panel-section">
              <h2>Promociones</h2>
              <p>
                Enterate de las últimas promociones, descuentos y novedades de
                BellezApp.
              </p>
            </section>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
