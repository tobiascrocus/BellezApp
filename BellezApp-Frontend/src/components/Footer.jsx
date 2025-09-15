import React from "react";
import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="text-white text-center py-4 mt-5"> 
      <p className="mb-0">
        © {new Date().getFullYear()} BellezApp. Todos los derechos reservados.
      </p>
    </footer>
  );
}
