import React, { useState } from "react";
import '../styles/Perfil.css';

const Perfil = () => {
  const [formData, setFormData] = useState({
    nombre: "Jose",
    apellido: "Peréz",
    email: "JosePerez@mail.com",
    telefono: "3511234567",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos guardados:", formData);
    alert("Perfil actualizado con éxito ✅");
  };

  return (
    <div className="perfil-container">
      <h2>Perfil de Usuario</h2>
      <form className="perfil-form" onSubmit={handleSubmit}>
        <label htmlFor="nombre">Nombre</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
        />

        <label htmlFor="apellido">Apellido</label>
        <input
          type="text"
          id="apellido"
          name="apellido"
          value={formData.apellido}
          onChange={handleChange}
        />

        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />

        <label htmlFor="telefono">Teléfono</label>
        <input
          type="tel"
          id="telefono"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
        />

        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
};

export default Perfil;
