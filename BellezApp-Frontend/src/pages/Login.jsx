import { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';

export default function Login() {
  const { setUser } = useContext(UserContext);
  const [formData, setFormData] = useState({ usuario: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setUser({ nombre: formData.usuario }); // simulación login
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Usuario:</label>
          <input
            type="text"
            name="usuario"
            value={formData.usuario}
            onChange={e => setFormData({ ...formData, usuario: e.target.value })}
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

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}