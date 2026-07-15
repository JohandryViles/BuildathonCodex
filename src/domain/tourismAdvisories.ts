import type { MarineAlert, RouteRecommendation } from "../types/marine";

export type BeachFlag = "green" | "yellow" | "red";

export function getBeachFlag(alert: MarineAlert): BeachFlag {
  if (alert.level === "danger" || alert.level === "warning") return "red";
  if (alert.level === "watch") return "yellow";
  return "green";
}

export function beachFlagLabel(flag: BeachFlag) {
  if (flag === "red") return "Bandera roja · No bañarse";
  if (flag === "yellow") return "Bandera amarilla · Precaución";
  return "Bandera verde · Condiciones favorables";
}

function distanceKm(a: MarineAlert, b: MarineAlert) {
  const [lngA, latA] = a.coordinates;
  const [lngB, latB] = b.coordinates;
  const radians = (value: number) => (value * Math.PI) / 180;
  const latDistance = radians(latB - latA);
  const lngDistance = radians(lngB - lngA);
  const value =
    Math.sin(latDistance / 2) ** 2 +
    Math.cos(radians(latA)) * Math.cos(radians(latB)) * Math.sin(lngDistance / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function nearestSafeBeach(current: MarineAlert, beachAlerts: MarineAlert[]) {
  return beachAlerts
    .filter((candidate) => candidate.pointId !== current.pointId && getBeachFlag(candidate) === "green")
    .map((candidate) => ({ candidate, distance: distanceKm(current, candidate) }))
    .sort((a, b) => a.distance - b.distance)[0];
}

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
