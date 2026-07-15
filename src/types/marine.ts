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

export type AiNoticeKind = "daily" | "prevention";

export type AiNoticeSeverity = "info" | "watch" | "warning" | "danger";

export interface AiNotice {
  id: string;
  kind: AiNoticeKind;
  severity: AiNoticeSeverity;
  title: string;
  message: string;
  pointId?: string;
  stationName?: string;
  validFrom: string;
  validTo?: string;
  source: "mock" | "openai";
}
