import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, user, API_URL } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Si el usuario ya está logueado, lo redirigimos a la página de inicio
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!data.ok) {
        // Si el código es 429, es por el límite de intentos.
        if (response.status === 429) {
          // El mensaje ya viene formateado desde el backend.
          throw new Error(data.message);
        }
        throw new Error(data.message || 'Error al iniciar sesión.');
      }

      // Guardamos el token en el contexto, que se encargará de obtener los datos del usuario
      await login(data.data.token, rememberMe);

      // Redirección basada en el rol
      if (data.data.rol === 'admin') navigate('/administrador');
      else if (data.data.rol === 'peluquero') navigate('/administrador-peluquero');
      else navigate('/turnos');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <h1>
          <span className="dorado">BellezApp</span>
          <span className="rojo">Barbershop</span>
        </h1>
        <p>
          Los mejores estilistas a tu alcance{'\n'}
          Reservá tu turno en un click y dejá que nuestro equipo{'\n'}
          transforme tu estilo con cortes y cuidados profesionales
        </p>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2>Iniciar Sesión</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {/* Volvemos a agrupar el input y el ícono en su propio contenedor */}
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
            <div className="form-group-remember">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
              </div>
              <label htmlFor="rememberMe" className="remember-label">Mantener sesión iniciada</label>
            </div>
            <div className="error-container">
              {error && <p className="login-error">{error}</p>}
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
            <div className="forgot-password-link">
              <a href="#" onClick={(e) => { e.preventDefault(); setModalVisible(true); }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
          <div className="register-link">
            ¿No tenés cuenta?{' '}
            <Link to="/registro">Registrate</Link>
          </div>
        </div>
      </div>
      {modalVisible && (
        <div className="login-modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Recupera tu cuenta</h3>
            <p className="modal-text">
              Si olvidaste tu Email o contraseña, contactate al siguiente correo electrónico: <br />
              <span className="modal-email">Ejemplo@hotmail.com</span>
            </p>
            <button className="btn-modal-entendido" onClick={() => setModalVisible(false)}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}