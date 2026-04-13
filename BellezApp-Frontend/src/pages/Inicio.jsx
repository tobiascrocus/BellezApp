// Inicio.jsx

import { useNavigate } from 'react-router-dom';
import "../styles/Inicio.css";

const promociones = [
  { id: 1, titulo: "Descuento Primera Visita", descripcion: "10% OFF en tu primer turno" },
  { id: 2, titulo: "Corte Clásico", descripcion: "10% OFF en cortes tradicionales" },
  { id: 3, titulo: "Descuento Estudiantes", descripcion: "Presentá tu credencial y obtené 15% OFF" },
];

const valores = [
  { id: 1, icono: "⭐", titulo: "Calidad", descripcion: "Cortes precisos y modernos" },
  { id: 2, icono: "💈", titulo: "Profesionales", descripcion: "Equipo capacitado y experimentado" },
  { id: 3, icono: "🎯", titulo: "Experiencia", descripcion: "Más de 10 años de trayectoria" },
  { id: 4, icono: "🪑", titulo: "Ambiente", descripcion: "Espacio cómodo y amigable" },
];

export default function Inicio() {
  const navigate = useNavigate();

  return (
    <section className="inicio">
      <div className="inicio-hero">
        <h1>Bienvenido a <span>BellezApp</span></h1>
        <p>
          Bienvenido a BellezApp, tu espacio de confianza para transformar tu estilo.
          Aquí podrás explorar nuestro catálogo de cortes y peinados, conocer a nuestros estilistas profesionales
          y reservar tu turno de manera rápida y sencilla.
        </p>
        <p>
          Cada visita está diseñada para ofrecerte comodidad, estilo y atención personalizada,
          asegurando que cada detalle de tu look refleje tu personalidad.
          Descubrí nuestros servicios, mantenete al día con nuestras novedades
          y dejá que nuestro equipo te acompañe en cada paso para que tu experiencia en BellezApp sea única.
        </p>
        <button onClick={() => navigate('/catalogo')}>Ver Catálogo</button>
      </div>
      <div className="inicio-promociones">
        <h2>¡Nuestras promociones!</h2>
        <div className="promos-grid">
          {promociones.map(p => (
            <div key={p.id} className="promo-card">
              <h3>{p.titulo}</h3>
              <p>{p.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="inicio-valores">
        <h2>¿Por Qué Elegirnos?</h2>
        <div className="valores-grid">
          {valores.map(v => (
            <div key={v.id} className="valor-card">
              <div className="valor-icon">{v.icono}</div>
              <h3>{v.titulo}</h3>
              <p>{v.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="inicio-rostro">
        <h2>Asesoramiento de Corte según tu Tipo de Rostro</h2>
        <p>Descubrí cuál estilo resalta mejor tus rasgos según la forma de tu cara.</p>
        <div className="rostro-img">
          <img
            src="/assets/images/Inicio/tipoRostro.jpg"
            alt="Cortes según tu rostro"
          />
        </div>
      </div>
      <div className="inicio-cta">
        <h2>¡Reservá tu turno ahora!</h2>
        <button onClick={() => navigate('/turnos')}>Reservar Turno</button>
      </div>
    </section>
  );
}