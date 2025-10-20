// ButtonCustom.jsx
import React from "react";
import "../../../styles/common/button/ButtonCustom.css"; 

export default function ButtonCustom({
  children,
  variant = "primary", // primary | dark
  onClick,
  type = "button",
  className = "",
  disabled = false,
}) {
  const variantClass =
    variant === "primary"
      ? "btn-primary custom"
      : "btn-dark custom";

  return (
    <button
      type={type}
      className={`${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}