import React from "react";
import "../../../styles/common/Input/InputField.css";  

export default function InputField({
  type = "text",
  placeholder = "",
  value,
  onChange,
  name,
  ariaLabel,
  className = "",
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel || placeholder}
      className={`input ${className}`}
    />
  );
}
