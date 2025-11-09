import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { loginMock } from "../../api/auth";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const [email, setEmail] = useState("barista@demo.cl");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginMock(email, password);
      nav(loc?.state?.from || "/app", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 mx-auto">
        <h1 className="text-2xl font-semibold">Iniciar sesión (demo)</h1>

        <input
          className="w-full border rounded-lg p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <input
          className="w-full border rounded-lg p-2"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          className="px-4 py-2 rounded-xl border hover:bg-gray-100"
          disabled={loading}
          type="submit"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-xs text-gray-500 mt-1">
          Demo: <b>barista@demo.cl</b> / <b>123456</b> o <b>cafe@demo.cl</b> / <b>123456</b>
        </p>

        <div className="mt-3 text-sm text-center">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="underline text-blue-600 hover:text-blue-800">
            Crear cuenta
          </Link>
        </div>
      </form>
    </Layout>
  );
}
