import { useState } from 'react';
import Input from '../components/Input';
import Boton from '../components/Boton';

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
        <Input label="Nombre" name="nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
        <Input label="Email" name="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        <Input label="Contraseña" type="password" name="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        <Boton type="submit">Registrar</Boton>
      </form>
    </div>
  );
}