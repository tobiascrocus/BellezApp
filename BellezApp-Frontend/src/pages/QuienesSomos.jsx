// QuienesSomos.jsx
import "./QuienesSomos.css";

const equipo = [
  {
    id: 1,
    nombre: "Agustín",
    rol: "Fundador & Dueño",
    descripcion:
      "Desde chico supe que mi vocación estaba en transformar estilos y brindar un espacio donde cada persona se sienta cómoda. Con más de 10 años en el rubro, decidí abrir este lugar para combinar profesionalismo, calidez y estilo.",
    img: "/assets/images/QuienesSomos/agustin.jpg",
  },
  {
    id: 2,
    nombre: "Marcos",
    rol: "Barbero",
    descripcion:
      "Me dedico a la barbería clásica y moderna desde hace más de 10 años. Me apasionan los cortes masculinos, degradados y arreglos de barba.",
    img: "/assets/images/QuienesSomos/marcos.jpg",
  },
  {
    id: 3,
    nombre: "Sofía",
    rol: "Estilista",
    descripcion:
      "Estilista con más de 8 años de experiencia en coloración, cortes y peinados. Amo transformar looks y realzar la belleza natural de cada cliente.",
    img: "/assets/images/QuienesSomos/sofia.jpg",
  },
  {
    id: 4,
    nombre: "Mauricio",
    rol: "Barbero",
    descripcion:
      "Apasionado por los cortes prolijos, rápidos y con estilo. Me especializo en looks clásicos y modernos, siempre con buena onda y atención personalizada.",
    img: "/assets/images/QuienesSomos/mauricio.jpg",
  },
];

export default function QuienesSomos() {
  return (
    <section className="quienes-container">
      <h1 className="quienes-titulo">¿Quiénes Somos?</h1>
      <p className="quienes-subtitulo">
        Conocé a las personas detrás de <strong>BellezApp</strong>
      </p>

      <div className="quienes-grid">
        {equipo.map((persona) => (
          <article key={persona.id} className="quienes-card">
            <div className="quienes-card-img">
              <img src={persona.img} alt={persona.nombre} loading="lazy" />
            </div>
            <h2 className="quienes-card-nombre">{persona.nombre}</h2>
            <h3 className="quienes-card-rol">{persona.rol}</h3>
            <p className="quienes-card-desc">{persona.descripcion}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
