export type AlertLevel = "normal" | "watch" | "warning" | "danger";

export interface MarinePoint {
  id: string;
  stationName: string;
  coordinates: [number, number];
  seaTemperatureC: number;
  waveHeightM: number;
  updatedAt: string;
}

export interface MarineAlert {
  pointId: string;
  stationName: string;
  level: AlertLevel;
  message: string;
  seaTemperatureC: number;
  waveHeightM: number;
  coordinates: [number, number];
  updatedAt: string;
}

export type AlertFilter = "all" | Exclude<AlertLevel, "normal">;

export type AccessibilityLevel = "high" | "medium" | "low";
export type DemandLevel = "low" | "medium" | "high";
export type RecommendationStatus = "recommended" | "caution" | "avoid";

export interface TourismRoute {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number];
  durationMinutes: number;
  accessibility: AccessibilityLevel;
  demand: DemandLevel;
  experienceType: "cultural" | "coastal" | "gastronomy" | "nature" | "artisan";
  localImpact: string;
  relatedStationIds: string[];
}

export interface RouteRecommendation {
  route: TourismRoute;
  status: RecommendationStatus;
  score: number;
  reason: string;
  relatedAlerts: MarineAlert[];
}
