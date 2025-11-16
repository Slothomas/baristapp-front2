import AppLayout from "../../components/AppLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/auth";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "barista", // barista / cafe / academy
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!form.name.trim()) return setErr("Ingresa tu nombre");
    if (!form.email.trim()) return setErr("Ingresa tu correo");
    if (!form.password.trim()) return setErr("Ingresa una contraseña");

    setLoading(true);
    try {
      // payload mapeado al schema UserCreate del backend
      const payload = {
        user: form.name.trim(),                     // 👈 se llama "user" en el backend
        email: form.email.trim().toLowerCase(),
        password: form.password,
        clave: form.role,                           // 👈 guardamos el rol en "clave"
        is_active: 1,
      };

      console.log("Enviando registro al backend:", payload);
      const res = await registerUser(payload);
      console.log("Respuesta backend /users:", res);

      // si todo ok, lo mandamos a login o directo a la app
      // nav("/login");
      nav("/app");
    } catch (e: any) {
      console.error("Error al registrar usuario:", e);

      const msgBackend =
        e?.response?.data?.detail ||
        e?.message ||
        "No se pudo registrar";

      setErr(typeof msgBackend === "string" ? msgBackend : "No se pudo registrar");
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold mb-1">Crear cuenta</h1>
          <p className="text-sm text-gray-600 mb-4">
            Regístrate para usar BaristApp.
          </p>

          {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

          <form className="grid gap-3" onSubmit={onSubmit}>
            <Input
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Correo"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />

            <label className="block space-y-1">
              <span className="text-sm text-gray-700">Rol</span>
              <select
                className="w-full border rounded-lg p-2"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="barista">Barista</option>
                <option value="cafe">Cafetería</option>
                <option value="academy">Academia</option>
              </select>
            </label>

            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear cuenta"}
            </Button>
          </form>

          <div className="mt-3 text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="underline">
              Inicia sesión
            </Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
