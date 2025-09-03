import { useContext } from 'react';
import { UserContext } from '../context/UserContext';

export default function Perfil() {
  const { user } = useContext(UserContext);

  return (
    <div>
      <h1>Perfil</h1>
      <p>Nombre de usuario: {user?.nombre || 'Invitado'}</p>
      <p>Desde aquí podrás editar tu perfil y ver tus turnos.</p>
    </div>
  );
}