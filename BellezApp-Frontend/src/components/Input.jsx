export default function Input({ label, name, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      {label && <label htmlFor={name} style={{ display: 'block', marginBottom: '0.2rem' }}>{label}</label>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ padding: '0.4rem', width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  );
}