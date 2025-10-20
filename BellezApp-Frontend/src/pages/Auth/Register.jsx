import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/auth/Register/Register.css";
import "../../components/auth/LoginCard/LoginCard";
import "../../components/common/input/InputField";
import "../../components/common/button/ButtonCustom";

import EmailIcon from "../../assets/icons/email.png";
import PhoneIcon from "../../assets/icons/phone.png";
import PasswordIcon from "../../assets/icons/password-lock.png";
import VerifyPasswordIcon from "../../assets/icons/password-verify.png";

import { register } from "../../services/authService";

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
    <div className="register-page">
      <div className="register-wrapper">
        <h1 className="register-title">Crea una cuenta</h1>

        <div className="register-card">
          <form onSubmit={handleSubmit}>
            {/* Fila Nombre / Apellido */}
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
            <div className="input-icon-wrapper mt-14">
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
            <div className="input-icon-wrapper mt-14">
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
            <div className="input-icon-wrapper mt-14">
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
            <div className="input-icon-wrapper mt-14">
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

            {/* Error */}
            {error && <div className="form-error">{error}</div>}

            {/* Botón */}
            <button className="btn-register" type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrate"}
            </button>

            <div className="register-hint">
              ¿Ya tenés una cuenta? <a href="/login/usuarios">Iniciá sesión</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
