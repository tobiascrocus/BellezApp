import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer footer-center">
      <p>
        Desarrollado por <span className="autor">Tobias Tinaro</span>,{" "}
        <span className="autor">Jeremías Vergara</span>,{" "}
        <span className="autor">Chiara Seco</span> |{" "}
        <span className="marca">© BellezApp</span>
      </p>
    </footer>
  );
};

export default Footer;