import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";
import "../styles/LoginCard.css";
import "../styles/InputField.css";
import "../styles/ButtonCustom.css";

import EmailIcon from "../assets/icons/email.png";
import PhoneIcon from "../assets/icons/phone.png";
import PasswordIcon from "../assets/icons/password-lock.png";
import VerifyPasswordIcon from "../assets/icons/password-verify.png";

import { register } from "../services/authService";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre || !form.apellido || !form.email || !form.password || !form.confirmPassword) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await register({
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        telefono: form.telefono,
        password: form.password,
      });

      setLoading(false);
      navigate("/login/usuarios");
    } catch (err) {
      setLoading(false);
      setError(err.message || "Error al registrarse");
    }
  };

  return (
    <div className="app-hero" style={{ paddingTop: 40, paddingBottom: 80 }}>
    {/* 🔹 Wrapper exclusivo de Register */}
    <div className="register-wrapper">
      <h1 className="titulo" style={{ textAlign: "center", marginBottom: 18, paddingBottom: 14, fontSize: 64 }}>
        BellezApp
      </h1>

      <div style={{ width: "100%", maxWidth: 540 }}>
        <div className="login-card" style={{ padding: 26 }}>
          <form onSubmit={handleSubmit}>
              {/* fila Nombre / Apellido */}
              <div className="two-col">
                <div className="input-icon-wrapper">
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="form-control custom"
                    placeholder="Nombre"
                    aria-label="Nombre"
                  />
                </div>

                <div className="input-icon-wrapper">
                  <input
                    name="apellido"
                    value={form.apellido}
                    onChange={handleChange}
                    className="form-control custom"
                    placeholder="Apellido"
                    aria-label="Apellido"
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginTop: "14px" }} className="input-icon-wrapper">
                <img src={EmailIcon} alt="" className="icon-left" />
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-control custom"
                  placeholder="Correo electrónico"
                  aria-label="Correo electrónico"
                />
              </div>

              {/* Teléfono */}
              <div style={{ marginTop: "14px" }} className="input-icon-wrapper">
                <img src={PhoneIcon} alt="" className="icon-left" />
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="form-control custom"
                  placeholder="Número telefónico"
                  aria-label="Número telefónico"
                />
              </div>

              {/* Password */}
              <div style={{ marginTop: "14px" }} className="input-icon-wrapper">
                <img src={PasswordIcon} alt="" className="icon-left" />
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="form-control custom"
                  placeholder="Cree una nueva contraseña"
                  aria-label="Contraseña"
                  type="password"
                />
              </div>

              {/* Confirm password */}
              <div style={{ marginTop: "14px" }} className="input-icon-wrapper">
                <img src={VerifyPasswordIcon} alt="" className="icon-left" />
                <input
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="form-control custom"
                  placeholder="Confirme su contraseña"
                  aria-label="Confirmar contraseña"
                  type="password"
                />
              </div>

              {/* error */}
              {error && <div style={{ color: "#B00020", marginTop: 12 }}>{error}</div>}

              {/* Botón */}
              <button className="btn-register" type="submit" disabled={loading}>
                {loading ? "Registrando..." : "Registrate"}
              </button>

              <div className="register-hint">¿Ya tenés una cuenta? <a href="/login/usuarios">Iniciá sesión</a></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
