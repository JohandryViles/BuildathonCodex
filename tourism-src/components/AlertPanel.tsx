import type { AlertFilter, MarineAlert } from "../types/marine";

interface AlertPanelProps {
  alerts: MarineAlert[];
  selectedPointId: string | null;
  filter: AlertFilter;
  onFilterChange: (filter: AlertFilter) => void;
  onSelectAlert: (pointId: string) => void;
}

const FILTER_OPTIONS: AlertFilter[] = ["all", "watch", "warning", "danger"];

function levelLabel(level: MarineAlert["level"]) {
  if (level === "danger") return "Peligro";
  if (level === "warning") return "Alerta";
  if (level === "watch") return "Vigilancia";
  return "Normal";
}

export function AlertPanel({
  alerts,
  selectedPointId,
  filter,
  onFilterChange,
  onSelectAlert,
}: AlertPanelProps) {
  return (
    <aside className="alert-panel">
      <header className="panel-header">
        <h2>Alertas marinas</h2>
        <p>{alerts.length} alertas activas</p>
      </header>

      <div className="panel-filters">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={filter === option ? "filter-btn active" : "filter-btn"}
            onClick={() => onFilterChange(option)}
          >
            {option === "all" ? "Todas" : option}
          </button>
        ))}
      </div>

      <div className="panel-list">
        {alerts.length === 0 ? (
          <p className="empty-state">No hay alertas activas con este filtro.</p>
        ) : (
          alerts.map((alert) => {
            const isSelected = selectedPointId === alert.pointId;

            return (
              <button
                type="button"
                key={alert.pointId}
                className={isSelected ? "alert-card selected" : "alert-card"}
                onClick={() => onSelectAlert(alert.pointId)}
              >
                <span className={`badge ${alert.level}`}>{levelLabel(alert.level)}</span>
                <strong>{alert.stationName}</strong>
                <span>{alert.message}</span>
                <small>
                  Temp {alert.seaTemperatureC.toFixed(1)} C | Oleaje {alert.waveHeightM.toFixed(1)} m
                </small>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
