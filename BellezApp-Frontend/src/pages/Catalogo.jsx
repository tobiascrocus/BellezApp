// Catalogo.jsx
import './Catalogo.css';

const cortes = [
  { id: 1, titulo: "Buzz Cut con detalles", img: "/assets/images/Catalogo/corte1.jpg", descripcion: "Corte ultra corto con líneas o patrones discretos." },
  { id: 2, titulo: "Crew Cut texturizado", img: "/assets/images/Catalogo/corte2.jpg", descripcion: "Parte superior texturizada y laterales uniformes." },
  { id: 3, titulo: "Permanente Zoomer", img: "/assets/images/Catalogo/corte3.jpg", descripcion: "Parte superior rizada con laterales cortos." },
  { id: 4, titulo: "Fade Mullet", img: "/assets/images/Catalogo/corte4.jpeg", descripcion: "Laterales desvanecidos con parte trasera larga." },
  { id: 5, titulo: "Pompadour", img: "/assets/images/Catalogo/corte5.jpg", descripcion: "Volumen peinado hacia atrás y laterales cortos." },
  { id: 6, titulo: "Shaggy", img: "/assets/images/Catalogo/corte6.jpg", descripcion: "Capas desordenadas para un efecto natural." },
  { id: 7, titulo: "Quiff", img: "/assets/images/Catalogo/corte7.jpg", descripcion: "Parte superior elevada con laterales cortos." },
  { id: 8, titulo: "Slicked Back", img: "/assets/images/Catalogo/corte8.jpg", descripcion: "Peinado hacia atrás con un look pulido." },
  { id: 9, titulo: "Caesar Cut", img: "/assets/images/Catalogo/corte9.jpg", descripcion: "Flequillo recto y laterales uniformes." },
  { id: 10, titulo: "Wolf Cut", img: "/assets/images/Catalogo/corte10.jpg", descripcion: "Capas con mezcla de longitudes y volumen." },
  { id: 11, titulo: "Undercut con textura", img: "/assets/images/Catalogo/corte11.jpg", descripcion: "Laterales muy cortos y parte superior texturizada." },
  { id: 12, titulo: "Low Fade con línea", img: "/assets/images/Catalogo/corte12.jpg", descripcion: "Degradado bajo con línea marcada." },
  { id: 13, titulo: "High Fade", img: "/assets/images/Catalogo/corte13.jpg", descripcion: "Laterales altos para un efecto marcado." },
  { id: 14, titulo: "Taper Fade", img: "/assets/images/Catalogo/corte14.jpg", descripcion: "Degradado gradual limpio y ordenado." },
  { id: 15, titulo: "Buzz Cut clásico", img: "/assets/images/Catalogo/corte15.jpg", descripcion: "Corte corto, uniforme y práctico." },
  { id: 16, titulo: "Flat Top", img: "/assets/images/Catalogo/corte16.jpg", descripcion: "Parte superior plana con laterales cortos." },
];

export default function Catalogo() {
  return (
    <section className="catalogo-container">
      <h1 className="catalogo-titulo">Catálogo de Cortes</h1>
      <div className="catalogo-grid">
        {cortes.map(corte => (
          <article key={corte.id} className="catalogo-card">
            <h2 className="catalogo-card-titulo">{corte.titulo}</h2>
            <div className="catalogo-card-img">
              <img src={corte.img} alt={corte.titulo} loading="lazy" />
            </div>
            <p className="catalogo-card-desc">{corte.descripcion}</p>
          </article>
        ))}
      </div>
    </section>
  );
}