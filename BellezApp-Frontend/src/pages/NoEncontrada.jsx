import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '3rem', color: 'var(--color-accent)' }}>404</h1>
      <h2>Página no encontrada</h2>
      <p>Lo sentimos, la página que buscas no existe.</p>
      <Link to="/" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 'bold' }}>
        Volver al inicio
      </Link>
    </div>
  );
}