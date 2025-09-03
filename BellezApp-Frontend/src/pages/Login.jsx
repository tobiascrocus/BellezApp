import { useState, useContext } from 'react';
import Input from '../components/Input';
import Boton from '../components/Boton';
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
        <Input label="Usuario" name="usuario" value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} />
        <Input label="Contraseña" type="password" name="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        <Boton type="submit">Entrar</Boton>
      </form>
    </div>
  );
}