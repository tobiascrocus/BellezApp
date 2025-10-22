// src/components/auth/LoginCard/LoginCard.jsx

import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/auth/LoginCard.css";
import ButtonCustom from "../../common/ButtonCustom";
import { UserContext } from "../../../contexts/UserContext";

export default function LoginCard({
  titulo = "BellezApp",
  subtitulo = "",
  mensajeHTML = "",
  botonSecundarioTexto = "Crear cuenta nueva",
  onSecundarioClick = () => {},
  onLoginOk = () => {},
  messageVariant = "default",
}) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!email || !pass) {
      setErr("Completá email y contraseña.");
      return;
    }

    // Validación básica de email
    if (!email.includes('@')) {
      setErr("Ingresá un email válido.");
      return;
    }

    setLoading(true);
    try {
      // Llamar al login del contexto con email y password
      await login(email, pass);
      
      // Login exitoso - redirigir a INICIO (no dashboard)
      navigate("/inicio");
      
      // Llamar al callback opcional
      if (onLoginOk) {
        onLoginOk();
      }
    } catch (error) {
      // Manejar errores específicos
      if (error.message === "Usuario no encontrado") {
        setErr("Email no registrado. Verificá tus credenciales.");
      } else if (error.message === "Contraseña incorrecta") {
        setErr("Contraseña incorrecta. Intentá nuevamente.");
      } else {
        setErr(error.message || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contenedor-general public-page">
      <div className="grid-left">
        <h1 className="titulo">
          {titulo}
          {subtitulo && (
            <span className="subtitulo-overlay">{subtitulo}</span>
          )}
        </h1>
        {mensajeHTML && (
          <div
            className={`mensaje-bienvenida ${
              messageVariant === "compact" ? "compact" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: mensajeHTML }}
          />
        )}
      </div>

      <div className="grid-right">
        <div className="login-card">
          <form onSubmit={handleSubmit}>
            <input
              className="form-control custom"
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />

            <input
              className="form-control custom"
              type="password"
              placeholder="Contraseña"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />

            {err && <div className="error-message">{err}</div>}

            <ButtonCustom 
              type="submit" 
              variant="primary" 
              disabled={loading}
              className="btn-login"
            >
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </ButtonCustom>

            <p className="link-assist">¿Olvidaste tu contraseña?</p>
            <div className="sep"></div>

            <ButtonCustom 
              type="button" 
              variant="dark" 
              onClick={onSecundarioClick}
              disabled={loading}
            >
              {botonSecundarioTexto}
            </ButtonCustom>
          </form>
        </div>
      </div>
    </div>
  );
}
