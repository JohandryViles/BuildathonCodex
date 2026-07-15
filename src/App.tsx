import { useEffect, useMemo, useState } from "react";
import { AlertPanel } from "./components/AlertPanel";
import { MapView } from "./components/MapView";
import { createMarineDataProvider } from "./data/createProvider";
import { evaluateAlerts } from "./domain/alerts";
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

  return (
    <main className="app-shell">
      <section className="app-header">
        <div>
          <h1>Centro de Alertas Marinas</h1>
          <p>Monitoreo de temperatura superficial del mar y oleaje por estaciones costeras.</p>
        </div>
        <div className="status-box">
          <strong>{activeAlerts.length} alertas activas</strong>
          <span>Ultima actualizacion: {lastUpdateLabel(points)}</span>
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
        />
      </section>
    </main>
  );
}
