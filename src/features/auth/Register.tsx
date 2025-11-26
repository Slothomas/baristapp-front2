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
    rut: "",
    phone: "", // ✅ NUEVO
    email: "",
    password: "",
    role: "barista", // barista / cafe / academy
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateRut(rutRaw: string): boolean {
    if (!rutRaw) return false;
    const clean = rutRaw.replace(/\./g, "").replace(/-/g, "").toUpperCase();
    if (!/^[0-9]+[0-9K]$/.test(clean)) return false;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
      sum += multiplier * Number(body[i]);
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expected = 11 - (sum % 11);
    let dvCalc = "";

    if (expected === 11) dvCalc = "0";
    else if (expected === 10) dvCalc = "K";
    else dvCalc = expected.toString();

    return dv === dvCalc;
  }

  function validatePhone(phoneRaw: string): boolean {
    const clean = (phoneRaw ?? "").replace(/[^0-9+]/g, "");
    // regla ultra simple para demo:
    // >= 8 dígitos contando sin símbolos
    const digitsOnly = clean.replace(/\D/g, "");
    return digitsOnly.length >= 8;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!form.name.trim()) return setErr("Ingresa tu nombre");
    if (!form.rut.trim()) return setErr("Ingresa tu RUT");
    if (!validateRut(form.rut.trim()))
      return setErr("RUT inválido. Revísalo.");

    // ✅ Phone
    if (!form.phone.trim()) return setErr("Ingresa tu número de contacto");
    if (!validatePhone(form.phone.trim()))
      return setErr("Número de contacto inválido.");

    if (!form.email.trim()) return setErr("Ingresa tu correo");
    if (!form.password.trim()) return setErr("Ingresa una contraseña");

    setLoading(true);
    try {
      const payload = {
        user: form.name.trim(),
        rut: form.rut.trim(),
        phone: form.phone.trim(), // ✅ NUEVO
        email: form.email.trim().toLowerCase(),
        password: form.password,
        user_type: form.role, // coincide con backend
        is_active: 1,
      };

      console.log("Enviando registro al backend:", payload);
      const res = await registerUser(payload);
      console.log("Respuesta backend:", res);

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
              label="RUT (Formato: 12.345.678-9)"
              value={form.rut}
              onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))}
              required
            />

            {/* ✅ NUEVO TELÉFONO */}
            <Input
              label="Número de contacto"
              placeholder="+56912345678"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  phone: e.target.value.replace(/[^0-9+]/g, ""),
                }))
              }
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
