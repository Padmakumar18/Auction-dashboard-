const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  type = "button",
  ...props
}) => {
  const baseStyles =
    "font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300",
    secondary:
      "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300",
    outline:
      "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 focus:ring-gray-500 disabled:bg-gray-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${
        sizes[size]
      } ${className} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
