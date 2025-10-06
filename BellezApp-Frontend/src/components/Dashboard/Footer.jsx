import '../../styles/footer.css';

const Footer = () => {
  return (
    <footer className="footer-main">
      <p>
        Desarrollado por <span className="footer-author">Tobias Tinaro</span>,{" "}
        <span className="footer-author">Jeremías Vergara</span>,{" "}
        <span className="footer-author">Chiara Seco</span> |{" "}
        <span className="footer-brand">© BellezApp</span>
      </p>
    </footer>
  );
};

export default Footer;