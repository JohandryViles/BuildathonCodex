import {
  beachFlagLabel,
  getBeachFlag,
  nearestSafeBeach,
} from "../domain/tourismAdvisories";
import type { MarineAlert } from "../types/marine";

interface BeachSafetyProps {
  alerts: MarineAlert[];
  selectedPointId: string | null;
  onSelectBeach: (pointId: string) => void;
}

const BEACH_STATION_IDS = new Set([
  "playa-murcielago",
  "san-mateo",
  "santa-marianita",
  "tarqui",
  "jaramijo",
]);

export function BeachSafety({ alerts, selectedPointId, onSelectBeach }: BeachSafetyProps) {
  const beaches = alerts.filter((alert) => BEACH_STATION_IDS.has(alert.pointId));

  return (
    <section className="beach-safety">
      <div className="beach-safety-heading">
        <div>
          <strong>Estado de playas</strong>
          <small>Actualizado con condiciones marítimas</small>
        </div>
        <span>{beaches.filter((beach) => getBeachFlag(beach) === "green").length} aptas</span>
      </div>
      <div className="beach-status-list">
        {beaches.map((beach) => {
          const flag = getBeachFlag(beach);
          const alternative = flag === "red" ? nearestSafeBeach(beach, beaches) : undefined;
          return (
            <button
              type="button"
              key={beach.pointId}
              className={selectedPointId === beach.pointId ? "selected" : ""}
              onClick={() => onSelectBeach(beach.pointId)}
            >
              <span className={`beach-flag ${flag}`} aria-hidden="true" />
              <div>
                <strong>{beach.stationName}</strong>
                <small>{beachFlagLabel(flag)}</small>
                {alternative && (
                  <em>
                    Alternativa: {alternative.candidate.stationName} a {alternative.distance.toFixed(1)} km
                  </em>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
