import React, { useState } from "react";
import "../styles/LoginCard.css";
import "../styles/InputField.css";
import ButtonCustom from "./ButtonCustom";

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr("");
    if (!email || !pass) {
      setErr("Completá email y contraseña.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginOk({ email, role: "cliente" });
    }, 600);
  };

  return (
    <div className="contenedor-general">
      <div className="grid-left">
        <h1 className="titulo">
          {titulo}
          {subtitulo ? (
            <span className="subtitulo-overlay">{subtitulo}</span>
          ) : null}
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
              aria-label="Correo electrónico"
            />

            <input
              className="form-control custom"
              type="password"
              placeholder="Contraseña"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              aria-label="Contraseña"
            />

            {err && <div style={{ color: "#B00020", marginTop: 10 }}>{err}</div>}

            {/* Botón de login */}
            <ButtonCustom
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </ButtonCustom>

            {/* Enlace accesible */}
            <p className="link-assist">¿Olvidaste tu contraseña?</p>

            <div className="sep"></div>

            {/* Botón secundario */}
            <ButtonCustom
              type="button"
              variant="dark"
              onClick={onSecundarioClick}
            >
              {botonSecundarioTexto}
            </ButtonCustom>
          </form>
        </div>
      </div>
    </div>
  );
}
