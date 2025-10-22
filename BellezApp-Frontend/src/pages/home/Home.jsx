// src/pages/home/Home.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import ButtonCustom from "../../components/common/ButtonCustom";
import "../../styles/home/Home.css";

import iconTurnos from "../../assets/icons/icon-turnos.png";
import iconBarberia from "../../assets/icons/icon-barberia.png";
import iconPromo from "../../assets/icons/icon-promo.png";
import iconSeguro from "../../assets/icons/icon-seguro.png";

import carrusel1 from "../../assets/images/carrusel1.jpg";
import carrusel2 from "../../assets/images/carrusel2.jpg";
import carrusel3 from "../../assets/images/carrusel3.jpg";

export default function Home() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/login/usuarios"); // redirige a logincliente
  };

  return (
    <div className="home-container public-page"> {/* AÑADIR clase public-page */}
      {/* este div genera el espacio de separación */}
      <div className="navbar-separator"></div>

      {/* Banner */}
      <section className="banner d-flex align-items-center">
        <div className="container">
          <div className="row align-items-center">
            {/* Columna izquierda */}
            <div className="col-md-7">
              <h1 className="banner-text">
                Reservá turnos, organizá tu equipo y potenciá tu negocio desde un solo lugar
              </h1>
            </div>
            {/* Columna derecha */}
            <div className="col-md-5 text-center">
              <ButtonCustom variant="primary" onClick={handleLoginClick}>Iniciar sesión</ButtonCustom>
              <p className="banner-link">
                ¿No tenés una cuenta?{" "}
                <a href="/register" className="register-link">
                  Registrate aquí
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cuadrados con íconos */}
      <section className="container py-5">
        <div className="row g-4 text-center">
          <div className="col-6 col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <img src={iconTurnos} alt="turnos" className="mb-3" width="85" />
                <p className="card-description">Reservá turnos en segundos</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <img src={iconBarberia} alt="barberia" className="mb-3" width="85" />
                <p className="card-description">Gestioná tu barbería fácilmente</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <img src={iconPromo} alt="promo" className="mb-3" width="85" />
                <p className="card-description">Mostrá tus promociones</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card h-100">
              <div className="card-body">
                <img src={iconSeguro} alt="seguro" className="mb-3" width="85" />
                <p className="card-description">Seguro, confiable y eficiente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carrusel */}
      <section className="container py-2">
        <div id="mainCarousel" className="carousel slide" data-bs-ride="carousel">
          <div className="carousel-inner">
            <div className="carousel-item active">
              <img src={carrusel1} className="d-block w-100 rounded" alt="slide1" />
            </div>
            <div className="carousel-item">
              <img src={carrusel2} className="d-block w-100 rounded" alt="slide2" />
            </div>
            <div className="carousel-item">
              <img src={carrusel3} className="d-block w-100 rounded" alt="slide3" />
            </div>
          </div>
          {/* Controles */}
          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#mainCarousel"
            data-bs-slide="prev"
          >
            <span className="carousel-control-prev-icon"></span>
          </button>
          <button
            className="carousel-control-next"
            data-bs-target="#mainCarousel"
            data-bs-slide="next"
          >
            <span className="carousel-control-next-icon"></span>
          </button>
        </div>
      </section>

    </div>
  );
}