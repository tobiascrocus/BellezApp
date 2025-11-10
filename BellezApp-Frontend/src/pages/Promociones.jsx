import { useState } from "react";
import "../styles/Promociones.css";

const Promociones = ({ promos, onSave }) => {
  // Usamos un estado local para editar, que se convierte en un string separado por saltos de línea.
  const [textoPromos, setTextoPromos] = useState(promos.join("\n"));
  // 2. Añadir estado para controlar el modal
  const [modalVisible, setModalVisible] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    // Convertimos el string de vuelta a un array, filtrando líneas vacías.
    const nuevasPromos = textoPromos.split("\n").filter((p) => p.trim() !== "");
    onSave(nuevasPromos);
    setModalVisible(true); // 3. Mostrar el modal en lugar del alert
  };

  return (
    <section className="promos-admin-container">
      <h1 className="promos-admin-titulo">Editar Promociones</h1>
      <p className="promos-admin-subtitulo">
        Modificá el texto de las promociones que se muestran en la página de
        inicio. Cada línea en el campo de texto será una promoción separada.
      </p>

      <form onSubmit={handleSave} className="promos-admin-form">
        <textarea
          className="promos-admin-textarea"
          value={textoPromos}
          onChange={(e) => setTextoPromos(e.target.value)}
          rows="6"
          placeholder="Escribe cada promoción en una nueva línea..."
        />
        <button type="submit" className="promos-admin-button">
          Guardar Cambios
        </button>
      </form>

      {/* Modal integrado directamente en el componente */}
      {modalVisible && (
        <div
          className="promos-admin-modal-overlay"
          onClick={() => setModalVisible(false)}
        >
          <div className="promos-admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="promos-admin-modal-close" onClick={() => setModalVisible(false)}>✕</button>
            <p>¡Promociones guardadas con éxito! ✅</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default Promociones;