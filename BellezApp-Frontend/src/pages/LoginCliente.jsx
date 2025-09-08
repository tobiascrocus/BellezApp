import React from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "../components/LoginCard";
import "../styles/LoginCliente.css";

export default function LoginCliente() {
  const navigate = useNavigate();

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
      onLoginOk={() => window.location.href = "/cliente"}
      messageVariant="compact"
    />
  );
}
