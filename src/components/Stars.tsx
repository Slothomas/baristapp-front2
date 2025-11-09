import { useState } from "react";

export default function Stars({
  value,
  onChange,
  size = 22
}: { value: number; onChange?: (n: number) => void; size?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const v = hover ?? value;

  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange?.(n)}
          aria-label={`${n} estrellas`}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" className={n <= v ? "fill-yellow-400" : "fill-gray-300"}>
            <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.401 8.168L12 18.896l-7.335 3.868 1.401-8.168L.132 9.21l8.2-1.192z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}
