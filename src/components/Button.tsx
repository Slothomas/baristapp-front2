type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

export default function Button({ variant="primary", loading, className="", children, ...rest }: Props) {
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition";
  const styles = {
    primary:  "bg-violet-600 text-white hover:bg-violet-700 shadow-soft",
    secondary:"border border-gray-200 bg-white hover:bg-gray-50",
    ghost:    "hover:bg-gray-100",
  } as const;

  return (
    <button
      className={`${base} ${styles[variant]} ${loading ? "opacity-60 cursor-wait" : ""} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? "Cargando..." : children}
    </button>
  );
}
