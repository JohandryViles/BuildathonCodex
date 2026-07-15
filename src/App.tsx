import { useEffect, useMemo, useState } from "react";
import { MapView } from "./components/MapView";
import { TimelineBar } from "./components/TimelineBar";
import { fetchAiNotices } from "./data/aiNotices";
import { createMarineDataProvider } from "./data/createProvider";
import { fetchMarineTimeline } from "./data/openMeteo";
import { evaluateAlerts } from "./domain/alerts";
import type { AiNotice, MarineAlert, MarinePoint } from "./types/marine";

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

function resolveNoticePointId(
  notice: AiNotice,
  alerts: MarineAlert[],
): string | undefined {
  if (
    notice.pointId &&
    alerts.some((alert) => alert.pointId === notice.pointId)
  ) {
    return notice.pointId;
  }

  const stationName = notice.stationName?.trim().toLowerCase();
  return stationName
    ? alerts.find(
        (alert) => alert.stationName.trim().toLowerCase() === stationName,
      )?.pointId
    : undefined;
}

export default function App() {
  const [frames, setFrames] = useState<MarinePoint[][]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [selectedHour, setSelectedHour] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiNotices, setAiNotices] = useState<AiNotice[]>([]);
  const [selectedAiNoticeId, setSelectedAiNoticeId] = useState<string | null>(null);
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
  const aiPreventionPointIds = useMemo(
    () =>
      Array.from(
        new Set(
          aiNotices
            .map((notice) => resolveNoticePointId(notice, alerts))
            .filter((pointId): pointId is string => Boolean(pointId)),
        ),
      ),
    [aiNotices, alerts],
  );

  useEffect(() => {
    if (
      selectedPointId !== null &&
      alerts.length > 0 &&
      !alerts.some((alert) => alert.pointId === selectedPointId)
    ) {
      setSelectedPointId(null);
    }
  }, [alerts, selectedPointId]);

  useEffect(() => {
    const selectedTime = times[selectedHour];
    if (!selectedTime) {
      return;
    }

    let isMounted = true;
    setIsAiLoading(true);

    fetchAiNotices(selectedTime, activeAlerts)
      .then((notices) => {
        if (!isMounted) {
          return;
        }
        setAiNotices(notices);
        setSelectedAiNoticeId((selectedId) =>
          notices.some((notice) => notice.id === selectedId) ? selectedId : null,
        );
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setAiNotices([]);
        setSelectedAiNoticeId(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsAiLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [times, selectedHour, activeAlerts]);

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
          <span>
            IA:{" "}
            {isAiLoading
              ? "generando recomendaciones..."
              : `${aiNotices.length} notificaciones`}
          </span>
        </div>
      </section>

      <section className="content-layout">
        <MapView
          alerts={alerts}
          selectedPointId={selectedPointId}
          filter="all"
          onPointSelect={setSelectedPointId}
          fieldTimeMs={fieldTimeMs}
          preventionPointIds={aiPreventionPointIds}
        />
        <aside className="ai-notices-panel" aria-label="Prevenciones de IA">
          <header className="ai-notices-header">
            <strong>Prevenciones IA</strong>
            <small>{isAiLoading ? "Analizando..." : `${aiNotices.length} avisos`}</small>
          </header>

          <div className="ai-notices-list">
            {isAiLoading && (
              <span className="ai-notice-empty">Analizando condiciones del mar...</span>
            )}
            {!isAiLoading && aiNotices.length === 0 && (
              <span className="ai-notice-empty">
                Sin prevenciones para la hora seleccionada.
              </span>
            )}
            {!isAiLoading &&
              aiNotices.map((notice) => (
                <button
                  key={notice.id}
                  type="button"
                  className={`ai-notice-card severity-${notice.severity}${
                    selectedAiNoticeId === notice.id ? " selected" : ""
                  }`}
                  aria-pressed={selectedAiNoticeId === notice.id}
                  onClick={() => {
                    setSelectedAiNoticeId(notice.id);

                    const pointId = resolveNoticePointId(notice, alerts);
                    if (pointId) {
                      setSelectedPointId(pointId);
                    }
                  }}
                >
                  <strong>{notice.title}</strong>
                  <span className="ai-notice-message">{notice.message}</span>
                  <small>
                    {notice.stationName ? `${notice.stationName} - ` : ""}
                    {new Date(notice.validFrom).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </small>
                </button>
              ))}
          </div>
        </aside>
      </section>

      <TimelineBar
        times={times}
        selectedHour={selectedHour}
        onSelectHour={setSelectedHour}
      />
    </main>
  );
}
