export default function Card({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-gray-100 rounded-xl shadow-soft ${className}`}>{children}</div>;
}
