import React from "react";

const Card = ({ children, className = "", hover = false, onClick }) => {
  const hoverStyles = hover
    ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer"
    : "";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 transition-all duration-200 ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
