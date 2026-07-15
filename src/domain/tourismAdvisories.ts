import type { MarineAlert, RouteRecommendation } from "../types/marine";

export function tourismAdvice(
  alert: MarineAlert,
  recommendations: RouteRecommendation[],
) {
  const alternative = recommendations.find(
    ({ route, status }) => status === "recommended" && route.experienceType !== "coastal",
  );

  if (alert.level === "danger" || alert.level === "warning") {
    return `Condiciones no recomendadas para actividades de playa en ${alert.stationName}. ${
      alternative ? `Alternativa sugerida: ${alternative.route.name}.` : "Prefiera una experiencia cultural o gastronómica."
    }`;
  }

  if (alert.level === "watch") {
    return `Actividad de playa con precaución en ${alert.stationName}. Consulte señalización y prefiera zonas vigiladas.`;
  }

  return `Condiciones favorables para visitar ${alert.stationName}. Manténgase atento a cambios en el mar.`;
}
