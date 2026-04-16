import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import "../styles/Registro.css";

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Función de validación consistente con Perfil.jsx y el backend
  const validateForm = () => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

    if (nombre.length < 3 || nombre.length > 15) {
      return 'El nombre debe tener entre 3 y 15 caracteres.';
    }
    if (!nameRegex.test(nombre)) {
      return 'El nombre contiene caracteres inválidos.';
    }
    if (apellido.length < 3 || apellido.length > 15) {
      return 'El apellido debe tener entre 3 y 15 caracteres.';
    }
    if (!nameRegex.test(apellido)) {
      return 'El apellido contiene caracteres inválidos.';
    }
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    return null; // Sin errores
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiamos el error anterior
    setSuccess('');
    setIsLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.registerUser({ nombre, apellido, email, telefono, password });

      if (!data.ok) {
        throw new Error(data.message || 'Error al registrar el usuario.');
      }

      setSuccess(data.message || '¡Usuario registrado correctamente!');
      // Limpiamos el formulario
      setNombre(''); setApellido(''); setEmail(''); setTelefono(''); setPassword(''); setConfirmPassword('');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registro-wrapper">
      <div className="registro-left">
        <h1>
          <span className="dorado">BellezApp</span>
          <span className="rojo">Barbershop</span>
        </h1>
      </div>
      <div className="registro-right">
        <div className="registro-card">
          <h2>Crear Cuenta</h2>
          <form onSubmit={handleSubmit}>
            <div className="nombre-apellido">
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Apellido"
                value={apellido}
                onChange={e => setApellido(e.target.value)}
                required
              />
            </div>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Teléfono (Opcional)"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <div className="error-container">
              {error && <p className="registro-error">{error}</p>}
              {success && <p className="registro-success">{success}</p>}
            </div>
            <button type="submit" disabled={isLoading}>{isLoading ? 'Registrando...' : 'Registrarse'}</button>
          </form>
          <div className="login-link">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login">Iniciar sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}