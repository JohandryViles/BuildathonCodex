import { useState } from "react";
import type {
  AlertFilter,
  DemandLevel,
  MarineAlert,
  RecommendationStatus,
  RouteRecommendation,
} from "../types/marine";
import { tourismAdvice } from "../domain/tourismAdvisories";
import { BeachSafety } from "./BeachSafety";

interface TourismPanelProps {
  recommendations: RouteRecommendation[];
  alerts: MarineAlert[];
  allAlerts: MarineAlert[];
  selectedRouteId: string | null;
  selectedPointId: string | null;
  filter: AlertFilter;
  onFilterChange: (filter: AlertFilter) => void;
  onSelectRoute: (routeId: string) => void;
  onSelectAlert: (pointId: string) => void;
}

const FILTER_OPTIONS: AlertFilter[] = ["all", "watch", "warning", "danger"];

function statusLabel(status: RecommendationStatus) {
  if (status === "avoid") return "Redirigir";
  if (status === "caution") return "Precaucion";
  return "Recomendada";
}

function demandLabel(demand: DemandLevel) {
  if (demand === "low") return "Baja demanda";
  if (demand === "medium") return "Demanda media";
  return "Alta demanda";
}

function levelLabel(level: MarineAlert["level"]) {
  if (level === "danger") return "Peligro";
  if (level === "warning") return "Alerta";
  if (level === "watch") return "Vigilancia";
  return "Normal";
}

export function TourismPanel({
  recommendations,
  alerts,
  allAlerts,
  selectedRouteId,
  selectedPointId,
  filter,
  onFilterChange,
  onSelectRoute,
  onSelectAlert,
}: TourismPanelProps) {
  const mainRecommendation = recommendations[0];
  const [activeTab, setActiveTab] = useState<"routes" | "beaches" | "alerts">("routes");

  return (
    <aside className="tourism-panel results-panel">
      <header className="panel-header">
        <span className="eyebrow">Tu plan personalizado</span>
        <h2>Lo mejor para ti</h2>
        <p>{recommendations.length} opciones ordenadas según lo que nos contaste.</p>
      </header>

      <nav className="results-tabs" aria-label="Información del plan">
        <button type="button" className={activeTab === "routes" ? "active" : ""} onClick={() => setActiveTab("routes")}>Recomendaciones</button>
        <button type="button" className={activeTab === "beaches" ? "active" : ""} onClick={() => setActiveTab("beaches")}>Playas</button>
        <button type="button" className={activeTab === "alerts" ? "active" : ""} onClick={() => setActiveTab("alerts")}>Alertas</button>
      </nav>

      {activeTab === "routes" && (
        <section className="tab-content routes-tab" aria-label="Recomendaciones personalizadas">
          {mainRecommendation && (
            <button type="button" className="featured-route" onClick={() => onSelectRoute(mainRecommendation.route.id)}>
              <span className={`route-status ${mainRecommendation.status}`}>{statusLabel(mainRecommendation.status)}</span>
              <strong>{mainRecommendation.route.name}</strong>
              <span>{mainRecommendation.reason}</span>
              <small>Desde ${mainRecommendation.route.estimatedCostUsd} · {mainRecommendation.route.durationMinutes} min · {demandLabel(mainRecommendation.route.demand)}</small>
            </button>
          )}
          <div className="panel-list route-list">
            {recommendations.slice(1).map((recommendation) => (
              <button
                type="button"
                key={recommendation.route.id}
                className={selectedRouteId === recommendation.route.id ? "route-card selected" : "route-card"}
                onClick={() => onSelectRoute(recommendation.route.id)}
              >
                <span className={`route-status ${recommendation.status}`}>{statusLabel(recommendation.status)}</span>
                <strong>{recommendation.route.name}</strong>
                <span>{recommendation.route.description}</span>
                <small>Desde ${recommendation.route.estimatedCostUsd} · Accesibilidad {recommendation.route.accessibility}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeTab === "beaches" && (
        <section className="tab-content beaches-tab">
          <BeachSafety alerts={allAlerts} selectedPointId={selectedPointId} onSelectBeach={onSelectAlert} />
        </section>
      )}

      {activeTab === "alerts" && <section className="marine-compact tab-content">
        <div className="marine-header">
          <div>
            <h3>Alertas maritimas</h3>
            <p>{alerts.length} activas que afectan playas y actividades turísticas</p>
          </div>
        </div>

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

        <div className="marine-alert-list">
          {alerts.length === 0 ? (
            <p className="empty-state">No hay alertas activas con este filtro.</p>
          ) : (
            alerts.map((alert) => (
              <button
                type="button"
                key={alert.pointId}
                className={selectedPointId === alert.pointId ? "mini-alert selected" : "mini-alert"}
                onClick={() => onSelectAlert(alert.pointId)}
              >
                <span className={`badge ${alert.level}`}>{levelLabel(alert.level)}</span>
                <strong>{alert.stationName}</strong>
                <small>
                  Oleaje {alert.waveHeightM.toFixed(1)} m | Temp {alert.seaTemperatureC.toFixed(1)} C
                </small>
                <span className="audience-message">{tourismAdvice(alert, recommendations)}</span>
              </button>
            ))
          )}
        </div>
      </section>}
    </aside>
  );
}
