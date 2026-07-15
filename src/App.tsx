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

export default function App() {
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
