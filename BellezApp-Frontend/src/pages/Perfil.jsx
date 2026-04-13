import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Perfil.css";

const avatars = Array.from({ length: 21 }, (_, i) =>
  i === 0
    ? "/assets/images/Perfil/Avatar.png"
    : `/assets/images/Perfil/Avatar${i}.png`
);

export default function Perfil() {
  const { user, updateUser, API_URL } = useUser();

  // Usamos un estado local para los campos del formulario
  const [formData, setFormData] = useState({ ...user });
  const [editMode, setEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });
  const [success, setSuccess] = useState("");

  // Sincronizamos el estado del formulario si el usuario del contexto cambia
  useEffect(() => {
    if (user) {
      setFormData({ ...user });
    }
  }, [user]);

  // Maneja cambios en los inputs del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditMode = () => {
    // Al entrar en modo edición, reseteamos los estados a los del usuario actual
    setFormData({ ...user });
    setEditMode(true);
    setErrorModal({ isOpen: false, message: "" });
    setSuccess("");
  };

  // Función de validación en el frontend
  const validateForm = () => {
    const { nombre, apellido, telefono } = formData;
    const nameRegex = /^[a-zA-Z\s'-]+$/;

    if (!nombre || nombre.length < 3 || nombre.length > 15) {
      return 'El nombre debe tener entre 3 y 15 caracteres.';
    }
    if (!nameRegex.test(nombre)) {
      return 'El nombre contiene caracteres inválidos.';
    }
    if (!apellido || apellido.length < 3 || apellido.length > 15) {
      return 'El apellido debe tener entre 3 y 15 caracteres.';
    }
    if (!nameRegex.test(apellido)) {
      return 'El apellido contiene caracteres inválidos.';
    }
    if (telefono) {
      const telRegex = /^\+?\d+$/;
      if (!telRegex.test(telefono) || telefono.length < 7 || telefono.length > 15) {
        return 'El teléfono es inválido. Debe contener solo números y tener entre 7 y 15 dígitos.';
      }
    }
    return null; // Sin errores
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrorModal({ isOpen: false, message: "" });
    setSuccess("");

    // Buscamos el token en ambos almacenamientos para asegurar la autenticación.
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) { // Verificamos si el token existe
      setErrorModal({ isOpen: true, message: "No estás autenticado." });
      setIsLoading(false);
      return;
    }

    // 1. Validar en el frontend ANTES de enviar
    const validationError = validateForm();
    if (validationError) {
      setErrorModal({ isOpen: true, message: validationError });
      setIsLoading(false);
      return;
    }

    // Construimos el payload con los campos del formulario
    const payload = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      telefono: formData.telefono,
      avatar: formData.avatar,
    };

    // Si se introduce una nueva contraseña, la anterior es obligatoria.
    if (newPassword.trim()) {
      payload.newPassword = newPassword;
      if (!oldPassword.trim()) {
        setErrorModal({ isOpen: true, message: "Debes introducir tu contraseña anterior para poder cambiarla." });
        setIsLoading(false);
        return;
      }
    }
    // Si se introduce la contraseña anterior (para cambiarla o por error), la incluimos.
    if (oldPassword.trim()) {
      payload.oldPassword = oldPassword;
    }

    try {
      const response = await fetch(`${API_URL}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // Si el código es 429, es por el límite de intentos.
        if (response.status === 429) {
          // El mensaje ya viene formateado desde el backend.
          throw new Error(data.message);
        }
        throw new Error(data.message || "Error al actualizar el perfil.");
      }

      await updateUser();
      setSuccess("¡Perfil actualizado con éxito!");
      setEditMode(false);
      setNewPassword("");
      setOldPassword("");

    } catch (err) {
      setErrorModal({ isOpen: true, message: err.message || "Error desconocido." });
      setOldPassword(""); // Limpiamos la contraseña anterior en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Al cancelar, simplemente volvemos al modo de vista
    setEditMode(false);
    setNewPassword("");
    setOldPassword("");
    setErrorModal({ isOpen: false, message: "" });
    setSuccess("");
  };

  const handleAvatarSelect = (img) => {
    setFormData(prev => ({ ...prev, avatar: img }));
  };

  // Si el usuario no ha cargado, no mostramos nada para evitar errores
  if (!user) {
    return <div className="perfil-container"><p>Cargando perfil...</p></div>;
  }

  return (
    <section className={`perfil-container ${editMode ? "edit-mode" : ""}`}>
      <h1 className="perfil-titulo">Mi Perfil</h1>

      <article className="perfil-card">
        <div className="perfil-avatar">
          <img
            src={editMode ? formData.avatar : user.avatar}
            alt="Avatar"
            role={editMode ? "button" : "img"}
            onClick={() => editMode && setModalOpen(true)}
            className={`perfil-avatar-img ${editMode ? "hover-enabled" : ""}`}
          />
        </div>

        <div className="perfil-info">
          <AnimatePresence mode="wait">
            {editMode ? (
              <motion.div
                key="edit"
                className="perfil-info-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Nombre" autoComplete="off"/>
                <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} placeholder="Apellido" autoComplete="off"/>
                <input type="email" name="email" value={formData.email} placeholder="Correo electrónico" readOnly />
                <input type="tel" name="telefono" value={formData.telefono || ''} onChange={handleInputChange} placeholder="Teléfono" autoComplete="off"/>
                {/* --- Contraseña Anterior con Ojito --- */}
                <div className="perfil-password-container">
                  <input type={showOldPassword ? 'text' : 'password'} name="oldPassword" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Contraseña anterior" autoComplete="new-password"/>
                  <img
                    src={showOldPassword ? '/assets/images/Contraseña/NoVisible.png' : '/assets/images/Contraseña/Visible.png'}
                    alt={showOldPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="perfil-password-toggle-icon"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  />
                </div>
                {/* --- Nueva Contraseña con Ojito --- */}
                <div className="perfil-password-container">
                  <input type={showNewPassword ? 'text' : 'password'} name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña" autoComplete="new-password"/>
                  <img
                    src={showNewPassword ? '/assets/images/Contraseña/NoVisible.png' : '/assets/images/Contraseña/Visible.png'}
                    alt={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="perfil-password-toggle-icon"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  />
                </div>

                <div className="perfil-botones">
                  <button onClick={handleSave} className="btn-guardar" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                  </button>
                  <button onClick={handleCancel} className="btn-cancelar">Cancelar</button>
                </div>
                {success && <p className="perfil-success">{success}</p>}
              </motion.div>
            ) : (
              <motion.div
                key="view"
                className="perfil-info-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <h2>{user.nombre} {user.apellido}</h2>
                <h3 className="perfil-rol">{user.rol}</h3>
                <p><span className="label">Email:</span> <span className="value">{user.email}</span></p>
                <p><span className="label">Teléfono:</span> <span className="value">{user.telefono || 'No especificado'}</span></p>
                {success && !editMode && <p className="perfil-success">{success}</p>}
                <button onClick={handleEditMode} className="btn-editar">Editar perfil</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </article>

      <AnimatePresence>
        {modalOpen && (
          <motion.div className="modal-overlay" onClick={() => setModalOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}>
              <h3>Seleccioná tu avatar</h3>
              <div className="avatar-selector">
                {avatars.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Avatar ${i}`}
                    className={`avatar-option ${formData.avatar === img ? "selected-red" : ""}`}
                    onClick={() => handleAvatarSelect(img)}
                  />
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => setModalOpen(false)} className="btn-cerrar">Cerrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorModal.isOpen && (
          <motion.div className="perfil-modal-overlay" onClick={() => setErrorModal({ isOpen: false, message: "" })} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="perfil-modal-content" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3>Error de Validación</h3>
              <p className="perfil-modal-text">{errorModal.message}</p>
              <div className="perfil-modal-buttons">
                <button className="btn-modal-entendido" onClick={() => setErrorModal({ isOpen: false, message: "" })}>
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}