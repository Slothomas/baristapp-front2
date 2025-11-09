type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };
export default function Input({ label, error, ...rest }: Props) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-sm text-gray-700">{label}</span>}
      <input
        {...rest}
        className={
          "w-full border rounded-lg p-2 " +
          (error ? "border-red-400 focus:outline-red-500" : "focus:outline-gray-400")
        }
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
