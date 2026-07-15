import { useEffect, useMemo, useState } from "react";
import { MapView } from "./components/MapView";
import { TourismPanel } from "./components/TourismPanel";
import { AccessibilityToolbar } from "./components/AccessibilityToolbar";
import { LandingPage } from "./components/LandingPage";
import { TouristAssistant } from "./components/TouristAssistant";
import { createMarineDataProvider } from "./data/createProvider";
import { TOURISM_ROUTES } from "./data/tourismRoutes";
import { evaluateAlerts } from "./domain/alerts";
import { recommendTourismRoutes } from "./domain/recommendations";
import { getPersonalizedRecommendations } from "./domain/touristAssistant";
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
  const [showExplorer, setShowExplorer] = useState(
    () => new URLSearchParams(window.location.search).get("view") === "map",
  );
  const [entryRequest, setEntryRequest] = useState(
    () => new URLSearchParams(window.location.search).get("q") ?? "",
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

  const personalizedRecommendations = useMemo(() => {
    if (!entryRequest.trim()) return [];
    return getPersonalizedRecommendations(entryRequest, recommendations).map(
      (match) => match.recommendation,
    );
  }, [entryRequest, recommendations]);

  const displayedRecommendations =
    personalizedRecommendations.length > 0 ? personalizedRecommendations : recommendations;
  const hasPlan = entryRequest.trim().length > 0;

  const lowDemandRoutes = useMemo(
    () => recommendations.filter((item) => item.route.demand === "low").length,
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
    if (displayedRecommendations.length === 0) {
      setSelectedRouteId(null);
      return;
    }

    const selectedIsVisible = displayedRecommendations.some(
      (recommendation) => recommendation.route.id === selectedRouteId,
    );
    if (!selectedIsVisible) {
      setSelectedRouteId(displayedRecommendations[0].route.id);
    }
  }, [displayedRecommendations, selectedRouteId]);

  const accessibilityClasses = [largeText ? "large-text" : "", highContrast ? "high-contrast" : ""]
    .filter(Boolean)
    .join(" ");

  function openExplorer(request: string) {
    setEntryRequest(request);
    setShowExplorer(true);
    const params = new URLSearchParams({ view: "map" });
    if (request) params.set("q", request);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updatePlanRequest(request: string) {
    setEntryRequest(request);
    const params = new URLSearchParams({ view: "map" });
    if (request) params.set("q", request);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  return (
    <div className={accessibilityClasses}>
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <AccessibilityToolbar
        largeText={largeText}
        highContrast={highContrast}
        onLargeTextChange={setLargeText}
        onHighContrastChange={setHighContrast}
      />
      {!showExplorer ? (
        <LandingPage onExplore={openExplorer} />
      ) : (
      <main className="app-shell" id="main-content" tabIndex={-1}>
      <button className="back-to-landing" type="button" onClick={() => {
        setShowExplorer(false);
        window.history.replaceState(null, "", window.location.pathname);
      }}>
        <span aria-hidden="true">←</span> Volver a explorar Manta
      </button>
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

      <section className={hasPlan ? "planner-conversation compact" : "planner-conversation welcome"} aria-label="Asistente turístico inteligente">
        {!hasPlan && (
          <div className="planner-intro">
            <span>Planifica con inteligencia</span>
            <h2>Primero, cuéntanos qué necesitas</h2>
            <p>No mostraremos cientos de lugares sin contexto. Dinos con quién viajas, cuánto quieres gastar o qué te gustaría hacer.</p>
          </div>
        )}
        <TouristAssistant
          recommendations={recommendations}
          onSelectRoute={setSelectedRouteId}
          initialRequest={entryRequest}
          onRequestChange={updatePlanRequest}
          showResults={false}
        />
      </section>

      {hasPlan && (
      <>
      <section className="plan-summary" aria-live="polite">
        <div><span>Tu búsqueda</span><strong>“{entryRequest}”</strong></div>
        <p>Encontramos {displayedRecommendations.length} opciones que encajan mejor contigo. Selecciona una para verla en el mapa.</p>
      </section>
      <section className="content-layout planned" aria-label="Recomendaciones personalizadas y mapa de Manta">
        <TourismPanel
          recommendations={displayedRecommendations}
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
          recommendations={displayedRecommendations}
          selectedRouteId={selectedRouteId}
          selectedPointId={selectedPointId}
          filter={filter}
          onRouteSelect={setSelectedRouteId}
          onPointSelect={setSelectedPointId}
        />
      </section>
      </>
      )}
      </main>
      )}
    </div>
  );
}
