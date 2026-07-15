import type {
  MarineAlert,
  RecommendationStatus,
  RouteRecommendation,
  TourismRoute,
} from "../types/marine";

const STATUS_PRIORITY: Record<RecommendationStatus, number> = {
  recommended: 3,
  caution: 2,
  avoid: 1,
};

function accessibilityScore(route: TourismRoute) {
  if (route.accessibility === "high") return 28;
  if (route.accessibility === "medium") return 18;
  return 8;
}

function demandScore(route: TourismRoute) {
  if (route.demand === "low") return 28;
  if (route.demand === "medium") return 17;
  return 4;
}

function impactScore(route: TourismRoute) {
  if (route.demand === "low") return 18;
  if (route.experienceType === "cultural" || route.experienceType === "gastronomy") {
    return 16;
  }
  return 12;
}

function getMarineRisk(route: TourismRoute, alerts: MarineAlert[]) {
  const relatedAlerts = alerts.filter((alert) =>
    route.relatedStationIds.includes(alert.pointId),
  );
  const hasDanger = relatedAlerts.some((alert) => alert.level === "danger");
  const hasWarning = relatedAlerts.some((alert) => alert.level === "warning");
  const hasWatch = relatedAlerts.some((alert) => alert.level === "watch");
  const isCoastal =
    route.experienceType === "coastal" || route.experienceType === "nature";

  if (isCoastal && hasDanger) {
    return {
      status: "avoid" as const,
      relatedAlerts,
      penalty: 60,
      reason: "Oleaje peligroso cerca de la ruta. Mejor mover visitantes a una experiencia urbana o cultural.",
    };
  }

  if (isCoastal && hasWarning) {
    return {
      status: "caution" as const,
      relatedAlerts,
      penalty: 28,
      reason: "Condiciones marinas elevadas. Recomendable operar con guias y evitar actividades en agua.",
    };
  }

  if (isCoastal && hasWatch) {
    return {
      status: "caution" as const,
      relatedAlerts,
      penalty: 12,
      reason: "Hay vigilancia por oleaje. La ruta puede mantenerse con control y comunicacion preventiva.",
    };
  }

  if (!isCoastal && (hasDanger || hasWarning)) {
    return {
      status: "recommended" as const,
      relatedAlerts,
      penalty: 0,
      reason: "Buena alternativa para redistribuir visitantes cuando el frente costero tiene alertas.",
    };
  }

  return {
    status: "recommended" as const,
    relatedAlerts,
    penalty: 0,
    reason: "Condiciones adecuadas para operar y distribuir demanda local.",
  };
}

export function recommendTourismRoutes(
  routes: TourismRoute[],
  alerts: MarineAlert[],
): RouteRecommendation[] {
  return routes
    .map((route) => {
      const risk = getMarineRisk(route, alerts);
      const score =
        accessibilityScore(route) +
        demandScore(route) +
        impactScore(route) -
        risk.penalty;

      return {
        route,
        status: risk.status,
        score,
        reason: risk.reason,
        relatedAlerts: risk.relatedAlerts,
      };
    })
    .sort((a, b) => {
      const statusDiff = STATUS_PRIORITY[b.status] - STATUS_PRIORITY[a.status];
      return statusDiff || b.score - a.score;
    });
}
