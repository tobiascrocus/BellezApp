// src/pages/LoginCliente.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "../components/LoginCard";
import "../styles/LoginCliente.css";

import { login, getProfile } from "../services/authService";

export default function LoginCliente() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async ({ email, pass }) => {
    try {
      setError("");
      // 1. Loguear
      const { token } = await login(email, pass);
      localStorage.setItem("token", token);

      // 2. Pedir perfil
      const user = await getProfile(token);
      localStorage.setItem("user", JSON.stringify(user)); // guardamos perfil en localStorage

      // 3. Redirigir al dashboard (común a todos)
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <LoginCard
      titulo="BellezApp"
      subtitulo=""
      mensajeHTML={`
        Vos también podés reservar tu turno online <br/>
        <b>Simple</b><br/>
        <b>Ágil</b><br/>
        <b>y en un click.<b>
      `}
      botonSecundarioTexto="Crear cuenta nueva"
      onSecundarioClick={() => navigate("/register")}
      onLoginOk={handleLogin}
      messageVariant="compact"
      errorMessage={error}
    />
  );
}

