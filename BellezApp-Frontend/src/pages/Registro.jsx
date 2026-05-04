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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Función de validación consistente con Perfil.jsx y el backend
  const validateForm = () => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telRegex = /^\+?\d+$/;

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
    if (!emailRegex.test(email)) {
      return 'Email inválido.';
    }
    if (telefono && (!telRegex.test(telefono) || telefono.length < 7 || telefono.length > 15)) {
      return 'Teléfono inválido. Debe contener solo números y tener entre 7 y 15 dígitos.';
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
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <img
                src={showPassword ? '/assets/images/Contraseña/NoVisible.png' : '/assets/images/Contraseña/Visible.png'}
                alt={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <img
                src={showConfirmPassword ? '/assets/images/Contraseña/NoVisible.png' : '/assets/images/Contraseña/Visible.png'}
                alt={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="password-toggle-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>
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