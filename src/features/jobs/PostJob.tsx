import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { getUserMock } from "../../api/auth";
import { useToast } from "../../components/Toast";
import {
  createJobOffer,
  getJobOfferById,
  updateJobOffer,
} from "../../api/jobOffer";
import type {
  JobType,
  UrgencyType,
  JobOfferStatus,
  JobOffer,
} from "../../api/jobOffer";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/Card";

import {
  getMyBusinesses,
  getLocationsByBusiness,
  type Business,
  type BusinessLocation,
} from "../../api/business";

import { validateProfile } from "../../lib/validateProfile";
import { normalizeRole } from "../../lib/roles";

type CreateJobOfferPayload = {
  title: string;
  company: string;
  location: string;
  job_type: JobType;
  description: string;

  salary_range?: number | null;
  requirements?: string | null;
  required_skills?: string | null;
  urgency?: UrgencyType;
  region?: string | null;
  comuna?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  status?: JobOfferStatus;
  is_active?: number;
  vacancies_total?: number;

  business_id?: number | null;
  location_id?: number | null;
};

// ==============================
// Región Metropolitana fija
// ==============================
const REGION_RM_LABEL = "Región Metropolitana";
const REGION_RM_VALUE = "RM";

// Lista real de comunas RM (orden alfabético)
const COMUNAS_RM = [
  "Alhué","Buin","Calera de Tango","Cerrillos","Cerro Navia","Colina","Conchalí",
  "Curacaví","El Bosque","El Monte","Estación Central","Huechuraba","Independencia",
  "Isla de Maipo","La Cisterna","La Florida","La Granja","La Pintana","La Reina",
  "Lampa","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú",
  "María Pinto","Melipilla","Ñuñoa","Padre Hurtado","Paine","Pedro Aguirre Cerda",
  "Peñaflor","Peñalolén","Pirque","Providencia","Pudahuel","Puente Alto","Quilicura",
  "Quinta Normal","Recoleta","Renca","San Bernardo","San Joaquín","San José de Maipo",
  "San Miguel","San Pedro","San Ramón","Santiago","Talagante","Tiltil","Vitacura",
];

export default function PostJob() {
  const u = getUserMock();
  const toast = useToast();
  const nav = useNavigate();
  const { jobId } = useParams();
  const isEdit = !!jobId;

  // Campos base
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<JobType>("FULL_TIME");

  const [salaryRange, setSalaryRange] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  const [requiredSkills, setRequiredSkills] = useState("");
  const [urgency, setUrgency] = useState<UrgencyType>("NORMAL");
  const [vacanciesTotal, setVacanciesTotal] = useState<number>(1);

  // Región fija RM
  const [region, setRegion] = useState(REGION_RM_VALUE);
  const [comuna, setComuna] = useState("");

  const [startISO, setStartISO] = useState("");
  const [endISO, setEndISO] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(false);

  // ==================================================
  // ==================================================
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [locationsByBiz, setLocationsByBiz] = useState<BusinessLocation[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | "">("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | "">("");
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const multiLocalEnabled = businesses.length > 0;

  const comunaEsValida = !comuna || COMUNAS_RM.includes(comuna);

  // ==================================================
  // ==================================================
  useEffect(() => {
    const loadBusinesses = async () => {
      if (!u) return;
      if (u.role !== "cafe" && u.role !== "academy") return;

      setLoadingBusinesses(true);
      try {
        const biz = await getMyBusinesses(Number(u.id));
        setBusinesses(biz || []);
      } catch (e) {
        console.error(e);
        setBusinesses([]); // fallback legacy
      } finally {
        setLoadingBusinesses(false);
      }
    };

    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [u?.id, u?.role]);

  // ==================================================
  // Cargar sedes al elegir negocio
  // ==================================================
  useEffect(() => {
    const loadLocations = async () => {
      if (!selectedBusinessId) {
        setLocationsByBiz([]);
        setSelectedLocationId("");
        return;
      }

      setLoadingLocations(true);
      try {
        const locs = await getLocationsByBusiness(Number(selectedBusinessId));
        setLocationsByBiz(locs || []);
      } catch (e) {
        console.error(e);
        setLocationsByBiz([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    loadLocations();
  }, [selectedBusinessId]);

  // ==================================================
  // Autopoblar campos legacy al elegir sede
  // ==================================================
  useEffect(() => {
    if (!selectedLocationId) return;

    const loc = locationsByBiz.find(l => l.id === Number(selectedLocationId));
    const biz = businesses.find(b => b.id === Number(selectedBusinessId));
    if (!loc || !biz) return;

    setCompany(biz.name || "");
    setLocation(loc.name || loc.address || "");
    setComuna(loc.comuna || "");
    setRegion(REGION_RM_VALUE);
  }, [selectedLocationId, locationsByBiz, businesses, selectedBusinessId]);

  // ==========================
  // Cargar datos si es edición
  // ==========================
  useEffect(() => {
    const loadJob = async () => {
      if (!isEdit || !jobId) return;
      setIsLoadingJob(true);
      try {
        const job: JobOffer = await getJobOfferById(jobId);

        setTitle(job.title ?? "");
        setCompany(job.company ?? "");
        setLocation(job.location ?? "");
        setJobType(job.job_type ?? "FULL_TIME");

        setSalaryRange(
          job.salary_range != null ? String(job.salary_range) : ""
        );
        setDescription(job.description ?? "");
        setRequirements(job.requirements ?? "");

        setRequiredSkills(job.required_skills ?? "");
        setUrgency(job.urgency ?? "NORMAL");
        setVacanciesTotal(Number(job.vacancies_total ?? 1));

        setRegion(REGION_RM_VALUE);
        setComuna(job.comuna ?? "");

        setStartISO(job.date_start ?? "");
        setEndISO(job.date_end ?? "");

        if (job.business_id) setSelectedBusinessId(job.business_id);
        if (job.location_id) setSelectedLocationId(job.location_id);

      } catch (e) {
        console.error(e);
        toast.push("No se pudo cargar la oferta para editar");
        nav("/app/jobs/manage");
      } finally {
        setIsLoadingJob(false);
      }
    };

    loadJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, jobId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!u) return toast.push("Debes iniciar sesión");
    const role = normalizeRole(u) as any;
    const v = validateProfile(u, role);

    if (!v.ok) {
      toast.push("Debes completar tu perfil antes de publicar.");
      nav("/app/profile");
      return;
    }

    if (u.role !== "cafe" && u.role !== "academy") {
      return toast.push("Solo cafeterías o academias pueden publicar");
    }

    if (!title || !company || !location || !jobType || !description) {
      return toast.push("Completa los campos obligatorios (*)");
    }

    if (multiLocalEnabled) {
      if (!selectedBusinessId) return toast.push("Selecciona un negocio");
      if (!selectedLocationId) return toast.push("Selecciona una sucursal");
    }

    if (!comuna) {
      return toast.push("Selecciona una comuna (RM)");
    }
    if (!comunaEsValida) {
      return toast.push("La comuna seleccionada no es válida");
    }

    if (startISO && endISO) {
      const s = new Date(startISO).getTime();
      const en = new Date(endISO).getTime();
      if (en < s)
        return toast.push("La fecha fin no puede ser menor que la de inicio");
    }

    if (!vacanciesTotal || vacanciesTotal < 1) {
      return toast.push("Las vacantes deben ser al menos 1");
    }

    const salaryRangeInt: number | null =
      salaryRange.trim() === ""
        ? null
        : (() => {
            const clean = salaryRange.replace(/[^0-9]/g, "");
            const n = Number.parseInt(clean, 10);
            return Number.isNaN(n) ? null : n;
          })();

    setIsSending(true);

    try {
      const payload: CreateJobOfferPayload = {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        job_type: jobType,
        description: description.trim(),

        salary_range: salaryRangeInt,
        requirements: requirements.trim() || null,
        required_skills: requiredSkills.trim() || null,

        urgency,

        region: REGION_RM_VALUE,
        comuna: comuna.trim(),

        date_start: startISO || null,
        date_end: endISO || null,

        vacancies_total: vacanciesTotal,

        business_id: selectedBusinessId ? Number(selectedBusinessId) : null,
        location_id: selectedLocationId ? Number(selectedLocationId) : null,
      };

      if (isEdit && jobId) {
        await updateJobOffer(jobId, { ...payload });
        toast.push("Oferta actualizada ✅");
        nav("/app/jobs/manage");
      } else {
        await createJobOffer(
          {
            ...payload,
            status: "PUBLICADO",
          },
          Number(u.id)
        );

        toast.push("Vacante publicada exitosamente ✅");
        nav("/app/jobs");
      }
    } catch (err: any) {
      console.log("BACKEND ERROR RAW:", err);
      toast.push(
        err?.response?.data?.detail?.[0]?.msg ||
          err?.response?.data?.message ||
          err.message ||
          "No se pudo guardar la vacante."
      );
    } finally {
      setIsSending(false);
    }
  }

  const inputsDisabledByMultiLocal = multiLocalEnabled && !!selectedLocationId;

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">
        {isEdit ? "Editar vacante" : "Publicar vacante"}
      </h1>

      {isLoadingJob ? (
        <Card className="p-4 text-sm">Cargando oferta...</Card>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3 max-w-2xl">
          {/* MULTI-LOCAL */}
          {loadingBusinesses ? (
            <Card className="p-3 text-sm">Cargando negocios...</Card>
          ) : multiLocalEnabled ? (
            <div className="grid gap-3 p-3 border rounded-xl bg-gray-50">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Negocio*</span>
                <select
                  className="w-full border rounded-lg p-2"
                  value={selectedBusinessId}
                  onChange={(e) =>
                    setSelectedBusinessId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  required
                >
                  <option value="">Selecciona negocio</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">Sucursal / Local*</span>
                <select
                  className="w-full border rounded-lg p-2"
                  value={selectedLocationId}
                  onChange={(e) =>
                    setSelectedLocationId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  required
                  disabled={!selectedBusinessId || loadingLocations}
                >
                  <option value="">
                    {loadingLocations
                      ? "Cargando sedes..."
                      : "Selecciona sucursal"}
                  </option>
                  {locationsByBiz.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.comuna ? `(${l.comuna})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <p className="text-xs text-gray-500">
                Al elegir una sucursal, se autocompletan los datos de empresa y
                ubicación.
              </p>
            </div>
          ) : null}

          <Input
            label="Título*"
            placeholder="Barista turno mañana"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Nombre de la Cafetería/Restaurante*"
            placeholder="Café Demo"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            disabled={inputsDisabledByMultiLocal}
          />

          <Input
            label="Ubicación*"
            placeholder="Providencia"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            disabled={inputsDisabledByMultiLocal}
          />

          {/* Región/Comuna RM */}
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm">Región*</span>
              <select
                className="w-full border rounded-lg p-2 bg-gray-50"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled
              >
                <option value={REGION_RM_VALUE}>{REGION_RM_LABEL}</option>
              </select>
              <p className="text-xs text-gray-500">
                Por ahora solo trabajamos con RM 😊
              </p>
            </label>

            <label className="block space-y-1">
              <span className="text-sm">Comuna*</span>
              <select
                className={`w-full border rounded-lg p-2 ${
                  !comunaEsValida ? "border-red-400" : ""
                }`}
                value={comuna}
                onChange={(e) => setComuna(e.target.value)}
                required
                disabled={inputsDisabledByMultiLocal}
              >
                {comuna && !comunaEsValida && (
                  <option value={comuna}>{comuna} (Comuna no válida)</option>
                )}

                <option value="">Selecciona comuna</option>
                {COMUNAS_RM.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm">Tipo de Trabajo*</span>
            <select
              className="w-full border rounded-lg p-2"
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobType)}
              required
            >
              <option value="FULL_TIME">Tiempo Completo</option>
              <option value="PART_TIME">Medio Tiempo</option>
              <option value="REPLACEMENT">Reemplazo</option>
              <option value="URGENT">Urgente</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm">Urgencia</span>
            <select
              className="w-full border rounded-lg p-2"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as UrgencyType)}
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgente</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm">Vacantes disponibles*</span>
            <input
              type="number"
              min={1}
              max={100}
              className="w-full border rounded-lg p-2"
              value={vacanciesTotal}
              onChange={(e) => setVacanciesTotal(Number(e.target.value))}
              required
            />
          </label>

          <div className="flex gap-2">
            <label className="block space-y-1">
              <span className="text-sm">Inicio (Opcional)</span>
              <input
                type="date"
                className="w-full border rounded-lg p-2"
                value={startISO}
                onChange={(e) => setStartISO(e.target.value)}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm">Fin (Opcional)</span>
              <input
                type="date"
                className="w-full border rounded-lg p-2"
                value={endISO}
                onChange={(e) => setEndISO(e.target.value)}
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm">Skills requeridas</span>
            <input
              className="w-full border rounded-lg p-2"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder="espresso, latte art, caja"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm">Rango Salarial</span>
            <input
              className="w-full border rounded-lg p-2"
              value={salaryRange}
              onChange={(e) => {
                const raw = e.target.value;
                const onlyNums = raw.replace(/[^0-9]/g, ""); // deja solo números
                setSalaryRange(onlyNums);
              }}
              placeholder="Ej: 25000"
              inputMode="numeric"
            />
            <p className="text-xs text-gray-500">
              Solo números (se guarda como valor numérico).
            </p>
          </label>

          <label className="block space-y-1">
            <span className="text-sm">Descripción*</span>
            <textarea
              rows={4}
              className="w-full border rounded-lg p-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm">Requisitos</span>
            <textarea
              rows={3}
              className="w-full border rounded-lg p-2"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </label>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSending}>
              {isSending
                ? isEdit
                  ? "Guardando..."
                  : "Publicando..."
                : isEdit
                ? "Guardar cambios"
                : "Publicar"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => nav(-1)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </AppLayout>
  );
}
