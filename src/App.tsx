import { useEffect, useMemo, useState } from "react";
import { MapView } from "./components/MapView";
import { TourismPanel } from "./components/TourismPanel";
import { AccessibilityToolbar } from "./components/AccessibilityToolbar";
import { createMarineDataProvider } from "./data/createProvider";
import { TOURISM_ROUTES } from "./data/tourismRoutes";
import { evaluateAlerts } from "./domain/alerts";
import { recommendTourismRoutes } from "./domain/recommendations";
import type { AlertFilter, MarinePoint } from "./types/marine";

const provider = createMarineDataProvider();

function lastUpdateLabel(points: MarinePoint[]) {
  if (points.length === 0) return "Sin actualizacion";
  const date = new Date(points[0].updatedAt);
  return date.toLocaleString("es-CO", { hour12: false });
}

export default function App() {
  const [points, setPoints] = useState<MarinePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [largeText, setLargeText] = useState(
    () => window.localStorage.getItem("manta-large-text") === "true",
  );
  const [highContrast, setHighContrast] = useState(
    () => window.localStorage.getItem("manta-high-contrast") === "true",
  );

  useEffect(() => {
    window.localStorage.setItem("manta-large-text", String(largeText));
  }, [largeText]);

  useEffect(() => {
    window.localStorage.setItem("manta-high-contrast", String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    let isMounted = true;

    provider
      .getMarinePoints()
      .then((response) => {
        if (!isMounted) {
          return;
        }
        setPoints(response);
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

  const recommendations = useMemo(
    () => recommendTourismRoutes(TOURISM_ROUTES, alerts),
    [alerts],
  );

  const lowDemandRoutes = useMemo(
    () => recommendations.filter((item) => item.route.demand === "low").length,
    [recommendations],
  );

  const localImpactZones = useMemo(
    () =>
      new Set(
        recommendations
          .filter((item) => item.status === "recommended")
          .map((item) => item.route.experienceType),
      ).size,
    [recommendations],
  );

  useEffect(() => {
    if (filteredAlerts.length === 0) {
      setSelectedPointId(null);
      return;
    }

    const selectedIsVisible = filteredAlerts.some(
      (alert) => alert.pointId === selectedPointId,
    );
    if (!selectedIsVisible) {
      setSelectedPointId(filteredAlerts[0].pointId);
    }
  }, [filteredAlerts, selectedPointId]);

  useEffect(() => {
    if (recommendations.length === 0) {
      setSelectedRouteId(null);
      return;
    }

    const selectedIsVisible = recommendations.some(
      (recommendation) => recommendation.route.id === selectedRouteId,
    );
    if (!selectedIsVisible) {
      setSelectedRouteId(recommendations[0].route.id);
    }
  }, [recommendations, selectedRouteId]);

  const accessibilityClasses = [largeText ? "large-text" : "", highContrast ? "high-contrast" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={accessibilityClasses}>
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <AccessibilityToolbar
        largeText={largeText}
        highContrast={highContrast}
        onLargeTextChange={setLargeText}
        onHighContrastChange={setHighContrast}
      />
      <main className="app-shell" id="main-content" tabIndex={-1}>
      <section className="app-header" aria-labelledby="page-title">
        <div>
          <span className="eyebrow">Manta, Manabí · Ecuador</span>
          <h1 id="page-title">Manta Inteligente</h1>
          <p>
            Descubre rutas accesibles, cultura local y playas seguras con información marítima actualizada.
          </p>
        </div>
        <div className="status-box" role="status" aria-live="polite">
          <strong>{recommendations.length} rutas activas</strong>
          <span>{activeAlerts.length} alertas marítimas activas</span>
          <span>{lowDemandRoutes} rutas ayudan a distribuir demanda local</span>
          <span>Última actualización: {lastUpdateLabel(points)}</span>
          <span>{isLoading ? "Cargando datos..." : "Datos reales: Open-Meteo Marine API"}</span>
        </div>
      </section>

      <section className="impact-strip" aria-label="Indicadores de impacto local">
        <div>
          <strong>{recommendations.filter((item) => item.status === "recommended").length}</strong>
          <span>rutas recomendadas hoy</span>
        </div>
        <div>
          <strong>{lowDemandRoutes}</strong>
          <span>zonas con baja demanda</span>
        </div>
        <div>
          <strong>{localImpactZones}</strong>
          <span>tipos de economia local activados</span>
        </div>
        <div>
          <strong>{activeAlerts.length}</strong>
          <span>alertas que afectan experiencias turisticas</span>
        </div>
      </section>

      <section className="content-layout" aria-label="Planificador turístico y mapa de Manta">
        <TourismPanel
          recommendations={recommendations}
          alerts={filteredAlerts}
          allAlerts={alerts}
          selectedRouteId={selectedRouteId}
          selectedPointId={selectedPointId}
          filter={filter}
          onFilterChange={setFilter}
          onSelectRoute={setSelectedRouteId}
          onSelectAlert={setSelectedPointId}
        />
        <MapView
          alerts={alerts}
          recommendations={recommendations}
          selectedRouteId={selectedRouteId}
          selectedPointId={selectedPointId}
          filter={filter}
          onRouteSelect={setSelectedRouteId}
          onPointSelect={setSelectedPointId}
        />
      </section>
      </main>
    </div>
  );
}
