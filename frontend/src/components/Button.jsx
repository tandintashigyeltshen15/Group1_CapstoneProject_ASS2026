export default function Button({ children, variant = "primary", onClick, type = "button" }) {
  const base = "px-5 py-2 rounded-lg font-medium transition-colors";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-700",
    secondary: "border border-primary text-primary hover:bg-blue-50",
    danger: "bg-danger text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}