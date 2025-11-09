import NavBar from "./NavBar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <NavBar />
      <main className="max-w-6xl mx-auto p-4">{children}</main>
    </div>
  );
}
