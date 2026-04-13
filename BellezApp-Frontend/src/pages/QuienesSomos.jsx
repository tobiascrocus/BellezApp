import "../styles/QuienesSomos.css";

const equipo = [
  {
    id: 1,
    nombre: "Damian",
    rol: "Fundador & Dueño",
    descripcion:
      "Hola, soy Damián. Soy quien fundó esta barbershop con la idea de que cada cliente se sienta cómodo y salga con un estilo que lo haga sentir seguro. Me encanta que este lugar sea más que cortes de cabello: un espacio para relajarse y disfrutar.",
    img: "/assets/images/QuienesSomos/Damian.png",
  },
  {
    id: 2,
    nombre: "Gustavo",
    rol: "Estilista",
    descripcion:
      "Soy Gustavo y me apasiona hacer cortes clásicos y cuidados al detalle. Me gusta que cada cliente salga con un look impecable y que la experiencia sea tan agradable como el corte mismo.",
    img: "/assets/images/QuienesSomos/Gustavo.png",
  },
  {
    id: 3,
    nombre: "Franco",
    rol: "Estilista",
    descripcion:
      "Hola, soy Franco. Me especializo en afeitados y cuidado de la barba, y disfruto que cada barba luzca perfecta y con estilo. Además, me encanta charlar y compartir algún consejo mientras trabajamos.",
    img: "/assets/images/QuienesSomos/Franco.png",
  },
  {
    id: 4,
    nombre: "Pedro",
    rol: "Estilista",
    descripcion:
      "Soy Pedro y mi fuerte son los estilos modernos y creativos. Me encanta experimentar con degradados y diseños personalizados, siempre asegurándome de que cada cliente se sienta cómodo y con un look único.",
    img: "/assets/images/QuienesSomos/Pedro.png",
  },
];

export default function QuienesSomos() {
  return (
    <section className="quienes-container">
      <h1 className="quienes-titulo">¿Quiénes Somos?</h1>
      <p className="quienes-subtitulo">
        Conocé a las personas detrás de <strong><span className="bellezapp-rojo">BellezApp</span></strong>
      </p>

      <div className="quienes-grid">
        {equipo.map((persona) => (
          <article key={persona.id} className="quienes-card">
            <div className="quienes-card-img">
              <img src={persona.img} alt={persona.nombre} loading="lazy" />
            </div>
            <h2 className="quienes-card-nombre">{persona.nombre}</h2>
            <div className="quienes-card-separator"></div>
            <h3 className="quienes-card-rol">{persona.rol}</h3>
            <p className="quienes-card-desc">{persona.descripcion}</p>
          </article>
        ))}
      </div>
    </section>
  );
}