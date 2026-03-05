import { useState, useEffect, useRef, useCallback } from "react";
import * as api from '../services/api';
import { motion, AnimatePresence } from "framer-motion";
import "./Administrador.css";

const roles = ["admin", "peluquero", "cliente"];

export default function Administrador() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("Todos");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [editUserId, setEditUserId] = useState(null);
  const [tempUser, setTempUser] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [newUser, setNewUser] = useState({
    nombre: "", apellido: "", email: "", telefono: "", rol: "cliente", password: "", avatar: "/assets/images/Perfil/Avatar.png"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [modalRoleDropdownOpen, setModalRoleDropdownOpen] = useState(false);
  const [editRoleDropdownOpen, setEditRoleDropdownOpen] = useState(false);
  const filterDropdownRef = useRef(null);
  const modalDropdownRef = useRef(null);
  const editDropdownRef = useRef(null);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [saveConfirmModal, setSaveConfirmModal] = useState({ visible: false });
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);

  const filteredUsers = users
    .filter(u => filterRole === "Todos" || u.rol === filterRole)
    .filter(u =>
      [u.nombre, u.apellido, u.email, u.telefono, u.rol]
        .some(field => field.toString().toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      const valA = (a[sortField] || "").toString().toLowerCase();
      const valB = (b[sortField] || "").toString().toLowerCase();
      return sortOrder === "asc" ? (valA < valB ? -1 : valA > valB ? 1 : 0) : (valA > valB ? -1 : valA < valB ? 1 : 0);
    });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorModal({ visible: false, message: '' });
    try {
      const data = await api.getUsuarios();
      if (!data.ok) throw new Error(data.message || "Error al obtener los usuarios.");
      setUsers(data.data);
    } catch (err) {
      setErrorModal({ visible: true, message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setRoleDropdownOpen(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target)) {
        setEditRoleDropdownOpen(false);
      }
      if (modalDropdownRef.current && !modalDropdownRef.current.contains(event.target)) {
        setModalRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClearFilters = () => {
    setSearch("");
    setFilterRole("Todos");
    setSortField(null);
    setSortOrder("asc");
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleEdit = (user) => {
    setEditUserId(user.id);
    setTempUser({ ...user, password: "" }); // Inicializamos la contraseña vacía al editar
  };

  const handleSave = () => {
    setSaveConfirmModal({ visible: true });
  };

  const confirmSave = async () => {
    // La contraseña solo se envía si se ha modificado.
    const payload = { ...tempUser };
    if (!payload.password || payload.password.trim() === "") {
      delete payload.password; // No enviar la contraseña si el campo está vacío
    }

    try {
      const data = await api.updateUsuario(editUserId, payload);
      if (!data.ok) throw new Error(data.message || "Error al actualizar el usuario.");

      setUsers(users.map(u => u.id === editUserId ? data.data : u));
      setEditUserId(null);
    } catch (err) {
      setErrorModal({ visible: true, message: err.message });
    } finally {
      setSaveConfirmModal({ visible: false });
    }
  };

  const cancelSave = () => {
    setSaveConfirmModal({ visible: false });
  };

  const handleDelete = (id) => setDeleteUserId(id);

  const confirmDelete = async () => {
    try {
      const data = await api.deleteUsuario(deleteUserId);
      if (!data.ok) throw new Error(data.message || "Error al eliminar el usuario.");

      setUsers(users.filter(u => u.id !== deleteUserId));
      setDeleteUserId(null);
    } catch (err) {
      setErrorModal({ visible: true, message: err.message });
      setDeleteUserId(null);
    }
  };

  const cancelDelete = () => setDeleteUserId(null);

  const handleOpenModal = () => {
    setNewUser({ nombre: "", apellido: "", email: "", telefono: "", rol: "cliente", password: "", avatar: "/assets/images/Perfil/Avatar.png" });
    setModalOpen(true);
  };

  const handleAddUser = async () => {
    try {
      const data = await api.createUsuario(newUser);
      if (!data.ok) throw new Error(data.message || "Error al crear el usuario.");

      // Añadimos el nuevo usuario al principio de la lista
      setUsers([data.data, ...users]);
      setModalOpen(false);
      setCurrentPage(1);

    } catch (err) {
      // El modal de error ya está en el componente, solo necesitamos actualizar su estado
      setErrorModal({ visible: true, message: err.message });
    }
  };

  const renderUserRow = (user) => {
    const isEditing = editUserId === user.id;
    return (
      <motion.tr
        key={user.id}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={isEditing ? "editing-row" : ""}
      >
        <td className={isEditing ? "editing-cell" : ""}>{isEditing ? <input value={tempUser.nombre} onChange={e => setTempUser({ ...tempUser, nombre: e.target.value })} /> : user.nombre}</td>
        <td className={isEditing ? "editing-cell" : ""}>{isEditing ? <input value={tempUser.apellido} onChange={e => setTempUser({ ...tempUser, apellido: e.target.value })} /> : user.apellido}</td>
        <td className={isEditing ? "editing-cell" : ""}>{isEditing ? <input type="email" value={tempUser.email} onChange={e => setTempUser({ ...tempUser, email: e.target.value })} /> : user.email}</td>
        <td className={isEditing ? "editing-cell" : ""}>{isEditing ? <input value={tempUser.telefono} onChange={e => setTempUser({ ...tempUser, telefono: e.target.value })} /> : user.telefono}</td>
        <td className={`${isEditing ? "editing-cell" : ""} ${editRoleDropdownOpen && editUserId === user.id ? "dropdown-open" : ""}`}>
          {isEditing ?
            (<div className="table-dropdown" ref={editDropdownRef}>
              <button type="button" className="table-dropdown-trigger" onClick={() => setEditRoleDropdownOpen(prev => !prev)}>
                {tempUser.rol.charAt(0).toUpperCase() + tempUser.rol.slice(1)}
                <span className="table-dropdown-arrow">{editRoleDropdownOpen ? '▲' : '▼'}</span>
              </button>
            <AnimatePresence>
              {editRoleDropdownOpen && (
                <motion.div
                  className="table-dropdown-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {roles.map(r => (
                    <div
                      key={r}
                      className={`table-dropdown-item ${tempUser.rol === r ? 'active' : ''}`}
                      onClick={() => { setTempUser({ ...tempUser, rol: r }); setEditRoleDropdownOpen(false); }}>
                      {r}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            </div>) : (
            <span className={`role-label ${user.rol}`}>{user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}</span>
          )}
        </td>
        <td className={isEditing ? "editing-cell" : ""}>
          {isEditing ? (
            <div className="admin-password-container">
              <input type={showEditUserPassword ? 'text' : 'password'} placeholder="Nueva contraseña..." value={tempUser.password} onChange={e => setTempUser({ ...tempUser, password: e.target.value })} />
              <img
                src={showEditUserPassword ? '/assets/images/Contraseña/NoVisible.png' : '/assets/images/Contraseña/Visible.png'}
                alt={showEditUserPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="admin-password-toggle-icon"
                onClick={() => setShowEditUserPassword(!showEditUserPassword)}
              />
            </div>
          ) : "••••••"}
        </td>
        <td className="actions-cell">
          <div className="action-buttons">
            {isEditing ? (
              <>
                <button className="btn-save" onClick={handleSave}>Guardar</button>
                <button className="btn-cancel" onClick={() => setEditUserId(null)}>Cancelar</button>
              </>
            ) : (
              <>
                <button className="btn-edit" onClick={() => handleEdit(user)}>Editar</button>
                <button className="btn-delete" onClick={() => handleDelete(user.id)}>Eliminar</button>
              </>
            )}
          </div>
        </td>
      </motion.tr>
    );
  };

  return (
    <section className="admin-container">
      <h1>Administración de Usuarios</h1>

      <div className="admin-controls">
        <input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="custom-dropdown" ref={filterDropdownRef}>
          <button className="dropdown-trigger" onClick={() => setRoleDropdownOpen(prev => !prev)}>
            {filterRole.charAt(0).toUpperCase() + filterRole.slice(1)}
            <span className="dropdown-arrow">{roleDropdownOpen ? '▲' : '▼'}</span>
          </button>
          <AnimatePresence>
            {roleDropdownOpen && (
              <motion.div
                className="dropdown-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`dropdown-item ${filterRole === 'Todos' ? 'active' : ''}`} onClick={() => { setFilterRole('Todos'); setRoleDropdownOpen(false); }}>Todos</div>
                {roles.map(r => (
                  <div
                    key={r}
                    className={`dropdown-item ${filterRole === r ? 'active' : ''}`}
                    onClick={() => { setFilterRole(r); setRoleDropdownOpen(false); }}>{r.charAt(0).toUpperCase() + r.slice(1)}</div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button className="btn-clear-filters" onClick={handleClearFilters}>Limpiar Filtros</button>
        <button className="btn-add" onClick={handleOpenModal}>Agregar Usuario</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            {["nombre", "apellido", "email", "telefono", "rol"].map(field => (
              <th key={field} onClick={() => handleSort(field)} className={sortField === field ? "sorted" : ""}>
                {field.charAt(0).toUpperCase() + field.slice(1)} {sortField === field ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
            ))}
            <th>Contraseña</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={`skeleton-${i}`} className="skeleton-row">
                  <td colSpan="7"><div className="skeleton-bar"></div></td>
                </tr>
              ))
            ) : paginatedUsers.length > 0 ? (
              paginatedUsers.map(renderUserRow)
            ) : (
              <tr><td colSpan="7" className="no-users-found">No se encontraron usuarios.</td></tr>
            )}
          </AnimatePresence>
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={currentPage === 1 || totalPages === 0} onClick={() => setCurrentPage(currentPage - 1)}>‹</button>
        {[...Array(totalPages)].map((_,i) => (
          <button key={i} className={currentPage===i+1 ? "active" : ""} onClick={() => setCurrentPage(i+1)}>{i+1}</button>
        ))}
        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>›</button>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="admin-user-modal-content"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>Agregar Usuario</h3>
              <div className="modal-inputs">
                {[{name: "nombre", type: "text"}, {name: "apellido", type: "text"}, {name: "email", type: "email"}, {name: "telefono", type: "text"}].map(field => (
                  <input
                    key={field.name}
                    type={field.type}
                    placeholder={field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                    value={newUser[field.name]}
                    onChange={e => setNewUser({...newUser,[field.name]:e.target.value})} />
                ))}
                <div className="admin-password-container">
                  <input
                    type={showNewUserPassword ? 'text' : 'password'}
                    placeholder="Contraseña"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                  />
                  <img src={showNewUserPassword ? '/assets/images/Contraseña/NoVisible.png' : '/assets/images/Contraseña/Visible.png'} alt="Toggle password visibility" className="admin-password-toggle-icon" onClick={() => setShowNewUserPassword(!showNewUserPassword)} />
                </div>

                <div className="custom-dropdown modal-dropdown" ref={modalDropdownRef}>
                  <button type="button" className="dropdown-trigger" onClick={() => setModalRoleDropdownOpen(prev => !prev)}>
                    {newUser.rol.charAt(0).toUpperCase() + newUser.rol.slice(1)}
                    <span className="dropdown-arrow">{modalRoleDropdownOpen ? '▲' : '▼'}</span>
                  </button>
                  <AnimatePresence>
                    {modalRoleDropdownOpen && (
                      <motion.div
                        className="dropdown-menu"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {roles.map(r => (
                          <div
                            key={r}
                            className={`dropdown-item ${newUser.rol === r ? 'active' : ''}`}
                            onClick={() => { setNewUser({...newUser, rol: r}); setModalRoleDropdownOpen(false); }}>{r.charAt(0).toUpperCase() + r.slice(1)}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="modal-buttons">
                <button className="btn-save" onClick={handleAddUser}>Agregar</button>
                <button className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteUserId !== null && (
          <motion.div className="modal-overlay" onClick={cancelDelete} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="admin-confirm-modal" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3>¿Eliminar usuario?</h3>
              <p>Esta acción no se puede deshacer.</p>
              <div className="modal-buttons">
                <button className="btn-delete" onClick={confirmDelete}>Eliminar</button>
                <button className="btn-modal-volver" onClick={cancelDelete}>Volver</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saveConfirmModal.visible && (
          <motion.div className="modal-overlay" onClick={cancelSave} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="admin-confirm-modal" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3>¿Guardar Cambios?</h3>
              <p>¿Estás seguro de que quieres guardar los cambios realizados en este usuario?</p>
              <div className="modal-buttons">
                <button className="btn-save" onClick={confirmSave}>Guardar</button>
                <button className="btn-cancel" onClick={cancelSave}>Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorModal.visible && (
          <motion.div className="modal-overlay" onClick={() => setErrorModal({ visible: false, message: '' })} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="admin-confirm-modal" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3>Error</h3>
              <p>{errorModal.message}</p>
              <div className="modal-buttons" style={{ justifyContent: 'center' }}>
                <button className="btn-save" onClick={() => setErrorModal({ visible: false, message: '' })}>Entendido</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
