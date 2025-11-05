import React, { useEffect, useState } from "react";
import "../styles/Perfil.css";

const Modal = ({ message, type, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className={`modal ${type}`}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <p>{message}</p>
      </div>
    </div>
  );
};

const Perfil = () => {
  const TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiIxQGhvdG1haWwuY29tIiwicm9sIjoicGVsdXF1ZXJvIiwiaWF0IjoxNzYyMzgxOTQ5LCJleHAiOjE3NjI0MTA3NDl9.PJCupbTSBrFc5Dcib5_iUrdKCxAph-9sgw7mGMIE1FM";

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    contraseñaAnterior: "",
    contraseñaNueva: "",
  });
  const [originalData, setOriginalData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ message: "", type: "", visible: false });

  const showModal = (message, type = "info") => {
    setModal({ message, type, visible: true });
  };

  const closeModal = () => {
    setModal({ message: "", type: "", visible: false });
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/me", {
          headers: { Authorization: `Bearer ${TOKEN}` },
        });
        if (!res.ok) throw new Error("Error al obtener datos del usuario");
        const data = await res.json();
        setFormData({
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          telefono: data.telefono || "",
          contraseñaAnterior: "",
          contraseñaNueva: "",
        });
        setOriginalData({
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          telefono: data.telefono || "",
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        showModal("No se pudieron cargar los datos del usuario.", "error");
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    if (!isEditing) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({ ...originalData, contraseñaAnterior: "", contraseñaNueva: "" });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
      };

      const resUser = await fetch("http://localhost:3000/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resUser.ok) {
        const errData = await resUser.json();
        throw new Error(errData.error || "Error al actualizar perfil");
      }

      if (formData.contraseñaNueva) {
        if (!formData.contraseñaAnterior) {
          showModal("Debes ingresar tu contraseña anterior para actualizarla.", "error");
          return;
        }
        const resPass = await fetch("http://localhost:3000/me/password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({
            contraseñaAnterior: formData.contraseñaAnterior,
            contraseñaNueva: formData.contraseñaNueva,
          }),
        });

        if (!resPass.ok) {
          const errData = await resPass.json();
          throw new Error(errData.error || "Error al cambiar la contraseña");
        }
      }

      showModal("Perfil actualizado con éxito ✅", "success");
      setOriginalData({ ...payload });
      setFormData({ ...payload, contraseñaAnterior: "", contraseñaNueva: "" });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      showModal(err.message, "error");
    }
  };

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div className="perfil-container">
      <h2>Perfil de Usuario</h2>

      <form
        className={`perfil-form ${isEditing ? "editing" : ""}`}
        onSubmit={handleSubmit}
      >
        <label htmlFor="nombre">Nombre</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          readOnly={!isEditing}
        />

        <label htmlFor="apellido">Apellido</label>
        <input
          type="text"
          id="apellido"
          name="apellido"
          value={formData.apellido}
          onChange={handleChange}
          readOnly={!isEditing}
        />

        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          readOnly={true}
          className="readonly-email"
        />

        <label htmlFor="telefono">Teléfono</label>
        <input
          type="tel"
          id="telefono"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          readOnly={!isEditing}
        />

        {isEditing && (
          <>
            <label htmlFor="contraseñaAnterior">Contraseña anterior</label>
            <input
              type="password"
              id="contraseñaAnterior"
              name="contraseñaAnterior"
              value={formData.contraseñaAnterior}
              onChange={handleChange}
              placeholder="Ingresa tu contraseña actual"
            />

            <label htmlFor="contraseñaNueva">Nueva contraseña</label>
            <input
              type="password"
              id="contraseñaNueva"
              name="contraseñaNueva"
              value={formData.contraseñaNueva}
              onChange={handleChange}
              placeholder="Nueva contraseña"
            />
          </>
        )}

        {isEditing ? (
          <div className="botones-edicion">
            <button type="submit" className="guardar-btn">
              Guardar cambios
            </button>
            <button
              type="button"
              className="cancelar-btn"
              onClick={handleEditToggle}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" className="editar-btn" onClick={handleEditToggle}>
            Editar perfil
          </button>
        )}
      </form>

      {modal.visible && (
        <Modal message={modal.message} type={modal.type} onClose={closeModal} />
      )}
    </div>
  );
};

export default Perfil;
