export default function FormularioTurno({ onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <label>Día:</label>
      <select name="dia">
        <option>Lunes</option>
        <option>Martes</option>
        <option>Miércoles</option>
        <option>Jueves</option>
        <option>Viernes</option>
      </select>

      <label>Tipo de corte:</label>
      <select name="tipo">
        <option>Corte</option>
        <option>Corte y barba</option>
      </select>

      <label>Peluquero:</label>
      <select name="peluquero">
        <option>Jeremias</option>
        <option>Chiara</option>
      </select>

      <button type="submit">Reservar turno</button>
    </form>
  );
}