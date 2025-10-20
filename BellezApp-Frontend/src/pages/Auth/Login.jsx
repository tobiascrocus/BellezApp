// src/pages/Auth/Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "../../components/auth/LoginCard/LoginCard";
import "../../styles/auth/loginPage/Login.css";

export default function Login() {
  const navigate = useNavigate();

  // El LoginCard ya maneja toda la lógica de login internamente
  // Solo le pasamos callbacks para navegación
  
  const handleCrearCuenta = () => {
    navigate("/register");
  };

  const handleLoginExitoso = () => {
    // Este callback se ejecuta después de un login exitoso
    // El LoginCard ya maneja la navegación al dashboard
    console.log("Login exitoso");
  };

  return (
    <div className="login-page">
      <LoginCard
        titulo="BellezApp"
        subtitulo=""
        mensajeHTML={`
          Vos también podés reservar tu turno online<br/>
          <b>Simple</b><br/>
          <b>Ágil</b><br/>
          <b>y en un click.</b>
        `}
        botonSecundarioTexto="Crear cuenta nueva"
        onSecundarioClick={handleCrearCuenta}
        onLoginOk={handleLoginExitoso}
        messageVariant="compact"
      />
    </div>
  );
}