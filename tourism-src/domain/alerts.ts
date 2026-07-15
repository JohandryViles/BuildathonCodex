import type { MarineAlert, MarinePoint } from "../types/marine";

export const TEMPERATURE_THRESHOLDS = {
  lowWarning: 22,
  highWarning: 30,
  highDanger: 32,
};

export const WAVE_THRESHOLDS = {
  watch: 1.8,
  warning: 2.8,
  danger: 4,
};

export function evaluateMarinePoint(point: MarinePoint): MarineAlert {
  const wave = point.waveHeightM;
  const temp = point.seaTemperatureC;

  let level: MarineAlert["level"] = "normal";
  const reasons: string[] = [];

  if (wave >= WAVE_THRESHOLDS.danger) {
    level = "danger";
    reasons.push(`oleaje extremo (${wave.toFixed(1)} m)`);
  } else if (wave >= WAVE_THRESHOLDS.warning) {
    level = "warning";
    reasons.push(`oleaje fuerte (${wave.toFixed(1)} m)`);
  } else if (wave >= WAVE_THRESHOLDS.watch) {
    level = "watch";
    reasons.push(`oleaje moderado (${wave.toFixed(1)} m)`);
  }

  if (temp >= TEMPERATURE_THRESHOLDS.highDanger) {
    level = "danger";
    reasons.push(`temperatura anomala alta (${temp.toFixed(1)} C)`);
  } else if (temp >= TEMPERATURE_THRESHOLDS.highWarning) {
    level = level === "danger" ? "danger" : "warning";
    reasons.push(`temperatura alta (${temp.toFixed(1)} C)`);
  } else if (temp <= TEMPERATURE_THRESHOLDS.lowWarning) {
    level = level === "danger" || level === "warning" ? level : "watch";
    reasons.push(`temperatura baja (${temp.toFixed(1)} C)`);
  }

  return {
    pointId: point.id,
    stationName: point.stationName,
    level,
    message:
      reasons.length > 0 ? reasons.join(" + ") : "Condiciones marinas estables",
    seaTemperatureC: point.seaTemperatureC,
    waveHeightM: point.waveHeightM,
    coordinates: point.coordinates,
    updatedAt: point.updatedAt,
  };
}

const LEVEL_PRIORITY: Record<MarineAlert["level"], number> = {
  danger: 4,
  warning: 3,
  watch: 2,
  normal: 1,
};

export function evaluateAlerts(points: MarinePoint[]): MarineAlert[] {
  return points
    .map(evaluateMarinePoint)
    .sort((a, b) => LEVEL_PRIORITY[b.level] - LEVEL_PRIORITY[a.level]);
}
