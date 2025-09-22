import { useState } from 'react';

export default function Registro() {
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registrando usuario', formData);
  };

  return (
    <div>
      <h1>Registro</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
          />
        </div>

        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}