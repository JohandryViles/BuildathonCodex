import { useEffect, useMemo, useState } from "react";
import { AlertPanel } from "./components/AlertPanel";
import { MapView } from "./components/MapView";
import { TimelineBar } from "./components/TimelineBar";
import { createMarineDataProvider } from "./data/createProvider";
import { fetchMarineTimeline } from "./data/openMeteo";
import { evaluateAlerts } from "./domain/alerts";
import type { AlertFilter, MarinePoint } from "./types/marine";

const provider = createMarineDataProvider();

function formatHourLabel(iso: string | undefined) {
  if (!iso) return "Sin actualizacion";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Sin actualizacion";
  return date.toLocaleString("es-CO", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Route = "/" | "/monitoreo" | "/turismo";

function navigate(path: Route) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function LandingPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Navegación principal">
        <button className="landing-brand" onClick={() => navigate("/")}>
          <BrandMark />
          <span>MarIA</span>
        </button>
        <div className="nav-links">
          <a href="#soluciones">Soluciones</a>
          <a href="#como-funciona">Cómo funciona</a>
        </div>
        <button className="nav-access" onClick={() => navigate("/monitoreo")}>
          Acceder al mapa <span>→</span>
        </button>
      </nav>

      <section className="landing-hero">
        <div className="hero-intro">
          <p className="eyebrow">INTELIGENCIA PARA EL OCÉANO</p>
          <h1>El mar cambia.<br />Tus decisiones, no.</h1>
          <p>Datos marinos claros para navegar, pescar y descubrir con mayor seguridad.</p>
        </div>

        <div className="experience-card">
          <BrandMark />
          <p className="eyebrow">SELECCIONA TU EXPERIENCIA</p>
          <h2>Una misma costa,<br />dos formas de vivirla.</h2>
          <span>Información precisa para cada travesía.</span>
        </div>

        <article className="experience-tile work-tile">
          <div className="tile-content">
            <span className="tile-kicker">DATOS EN TIEMPO REAL</span>
            <h2>Profesional<br />&amp; Pesca</h2>
            <p>Corrientes, mareas, oleaje y alertas para tomar decisiones con confianza.</p>
            <button onClick={() => navigate("/monitoreo")}>Ver monitoreo <span>↗</span></button>
          </div>
        </article>

        <article className="experience-tile leisure-tile">
          <div className="tile-content">
            <span className="tile-kicker">PRÓXIMAMENTE</span>
            <h2>Turismo<br />&amp; Ocio</h2>
            <p>Planifica experiencias inolvidables junto al mar.</p>
            <button onClick={() => navigate("/turismo")}>Descubrir <span>↗</span></button>
          </div>
        </article>
      </section>

      <section className="solutions-section" id="soluciones">
        <div className="section-heading">
          <p className="eyebrow">SOLUCIONES</p>
          <h2>Una plataforma para<br />trabajar y disfrutar el mar.</h2>
          <p>MarIA conecta informaci&oacute;n marina &uacute;til con experiencias pensadas para quienes viven del mar y quienes quieren descubrirlo.</p>
        </div>
        <div className="solution-grid">
          <article>
            <span className="solution-number">01</span>
            <h3>Profesional &amp; Pesca</h3>
            <p>Consulta corrientes, mareas, oleaje, temperatura y alertas para planificar cada jornada con mayor seguridad.</p>
          </article>
          <article>
            <span className="solution-number">02 &middot; PR&Oacute;XIMAMENTE</span>
            <h3>Turismo &amp; Ocio</h3>
            <p>Encuentra mejores momentos y lugares para disfrutar la costa, planificar recorridos y vivir el mar con confianza.</p>
          </article>
          <article>
            <span className="solution-number">03</span>
            <h3>Una sola vista</h3>
            <p>La misma informaci&oacute;n marina se traduce en decisiones operativas y experiencias costeras m&aacute;s informadas.</p>
          </article>
        </div>
      </section>

      <section className="how-it-works-section" id="como-funciona">
        <div className="section-heading">
          <p className="eyebrow">C&Oacute;MO FUNCIONA</p>
          <h2>El mar a tu medida,<br />en tres pasos.</h2>
        </div>
        <ol className="steps-list">
          <li>
            <span>1</span>
            <div><h3>Elige tu experiencia</h3><p>Accede a Profesional &amp; Pesca para operar con datos o a Turismo &amp; Ocio para descubrir la costa.</p></div>
          </li>
          <li>
            <span>2</span>
            <div><h3>Consulta la informaci&oacute;n</h3><p>Revisa las condiciones del mar, alertas y variables relevantes para el plan que tienes.</p></div>
          </li>
          <li>
            <span>3</span>
            <div><h3>Planifica con confianza</h3><p>Prepara tu ruta, faena, paseo o salida al mar con informaci&oacute;n clara y oportuna.</p></div>
          </li>
        </ol>
        <button className="how-it-works-cta" onClick={() => navigate("/monitoreo")}>Explorar Profesional &amp; Pesca <span>&rarr;</span></button>
      </section>

      <section className="landing-footer">
        <div>
          <div className="footer-brand"><BrandMark /> MarIA</div>
          <p>Inteligencia marina para una relación más segura, consciente y sostenible con el océano.</p>
        </div>
        <div>
          <strong>PLATAFORMA</strong>
          <a href="#soluciones">Monitoreo marítimo</a>
          <a href="#soluciones">Información costera</a>
        </div>
        <div>
          <strong>CONTACTO</strong>
          <a href="mailto:mareaia@gmail.com">hola@mareaia.com</a>
          <span>© 2026 MarIA</span>
        </div>
      </section>
    </main>
  );
}

function ComingSoonPage() {
  return (
    <main className="coming-soon-page">
      <button className="back-home" onClick={() => navigate("/")}>← Volver a MarIA</button>
      <section className="coming-soon-card">
        <BrandMark />
        <p className="eyebrow">TURISMO &amp; OCIO</p>
        <h1>Muy pronto.</h1>
        <p>Estamos preparando la mejor forma de descubrir y planificar tus experiencias en la costa.</p>
        <button onClick={() => navigate("/")}>Conocer el monitoreo</button>
      </section>
    </main>
  );
}

function MarineDashboard() {
  const [frames, setFrames] = useState<MarinePoint[][]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [selectedHour, setSelectedHour] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchMarineTimeline()
      .then((timeline) => {
        if (!isMounted) {
          return;
        }
        if (timeline.frames.length === 0) {
          throw new Error("Timeline vacio");
        }
        setFrames(timeline.frames);
        setTimes(timeline.times);
        setSelectedHour(timeline.frames.length - 1);
      })
      .catch(async () => {
        const fallback = await provider.getMarinePoints();
        if (!isMounted) {
          return;
        }
        setFrames([fallback]);
        setTimes([fallback[0]?.updatedAt ?? new Date().toISOString()]);
        setSelectedHour(0);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const points = useMemo(
    () => frames[selectedHour] ?? [],
    [frames, selectedHour],
  );

  const fieldTimeMs = useMemo(() => {
    const iso = times[selectedHour];
    const parsed = iso ? new Date(iso).getTime() : Number.NaN;
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }, [times, selectedHour]);

  const alerts = useMemo(() => evaluateAlerts(points), [points]);
  const activeAlerts = useMemo(
    () => alerts.filter((alert) => alert.level !== "normal"),
    [alerts],
  );

  const filteredAlerts = useMemo(() => {
    if (filter === "all") {
      return activeAlerts;
    }
    return activeAlerts.filter((alert) => alert.level === filter);
  }, [activeAlerts, filter]);

  useEffect(() => {
    if (
      selectedPointId !== null &&
      alerts.length > 0 &&
      !alerts.some((alert) => alert.pointId === selectedPointId)
    ) {
      setSelectedPointId(null);
    }
  }, [alerts, selectedPointId]);

  return (
    <main className="app-shell">
      <section className="app-header">
        <div>
          <button className="dashboard-back" onClick={() => navigate("/")}>← MarIA</button>
          <h1>Centro de Alertas Marinas</h1>
          <p>Monitoreo de temperatura superficial del mar y oleaje por estaciones costeras.</p>
        </div>
        <div className="status-box">
          <strong>{activeAlerts.length} alertas activas</strong>
          <span>Hora mostrada: {formatHourLabel(times[selectedHour])}</span>
          <span>{isLoading ? "Cargando datos..." : "Datos reales: Open-Meteo Marine API"}</span>
        </div>
      </section>

      <section className="content-layout">
        <AlertPanel
          alerts={filteredAlerts}
          selectedPointId={selectedPointId}
          filter={filter}
          onFilterChange={setFilter}
          onSelectAlert={setSelectedPointId}
        />
        <MapView
          alerts={alerts}
          selectedPointId={selectedPointId}
          filter={filter}
          onPointSelect={setSelectedPointId}
          fieldTimeMs={fieldTimeMs}
        />
      </section>

      <TimelineBar
        times={times}
        selectedHour={selectedHour}
        onSelectHour={setSelectedHour}
      />
    </main>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => {
    const path = window.location.pathname as Route;
    return ["/", "/monitoreo", "/turismo"].includes(path) ? path : "/";
  });

  useEffect(() => {
    const updateRoute = () => {
      const path = window.location.pathname as Route;
      setRoute(["/", "/monitoreo", "/turismo"].includes(path) ? path : "/");
    };
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  if (route === "/monitoreo") return <MarineDashboard />;
  if (route === "/turismo") return <ComingSoonPage />;
  return <LandingPage />;
}
