export default function Boton({ children, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#111',
        color: '#fff',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}