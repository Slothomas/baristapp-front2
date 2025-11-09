export default function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-brand-100 text-brand-700">{children}</span>;
}
