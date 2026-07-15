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
