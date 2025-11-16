import { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { http } from "../api/http";

export default function Home() {

  useEffect(() => {
    const probarApi = async () => {
      try {
        const res = await http.get("/miapp");
        console.log("Respuesta /miapp:", res.data);
      } catch (error) {
        console.error("Error llamando /miapp:", error);
      }
    };

    probarApi();

    
  }, []);
  return (
    <Layout>
      <section className="min-h-[72vh] grid place-items-center">
        <div className="w-full max-w-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 text-violet-700 px-3 py-1 text-xs font-medium">
            Bienvenido a BaristApp
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Encuentra talento <span className="text-violet-600">barista</span> o tu próximo trabajo
          </h1>

          <p className="text-gray-600 max-w-xl mx-auto">
            Plataforma para conectar baristas, cafeterías y academias. Simple, rápida y pensada para el día a día.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 shadow-soft"
            >
              Iniciar sesión
            </Link>

            <Link
              to="/app"
              className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Ir al dashboard
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
