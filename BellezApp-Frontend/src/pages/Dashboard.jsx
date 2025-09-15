import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {   // 👈 aquí va el export default
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <p>No hay sesión iniciada</p>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Bienvenido/a, {user.email}</h1>
      <p>Tu rol es: <b>{user.rol}</b></p>

      {/* Botones visibles según rol */}
      {user.rol === "peluquero" && (
        <button onClick={() => navigate("/administrador-peluquero")}>
          Ir al panel de Peluquero
        </button>
      )}

      {user.rol === "admin" && (
        <button onClick={() => navigate("/administrador")}>
          Ir al panel de Administrador
        </button>
      )}

      {user.rol === "cliente" && (
        <p>Podés reservar turnos, ver promociones y tu perfil.</p>
      )}
    </div>
  );
}
