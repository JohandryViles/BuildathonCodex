import type { MarineDataProvider } from "./provider";
import type { MarinePoint } from "../types/marine";
import { MARINE_STATIONS } from "./stations";

const MARINE_API_URL = "https://marine-api.open-meteo.com/v1/marine";

interface OpenMeteoCurrent {
  time?: string;
  wave_height?: number | null;
  sea_surface_temperature?: number | null;
}

interface OpenMeteoLocation {
  current?: OpenMeteoCurrent;
}

function parseApiTime(time: string | undefined, fallbackIso: string): string {
  if (!time) {
    return fallbackIso;
  }

  const normalized = time.length === 16 ? `${time}:00Z` : `${time}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? fallbackIso : parsed.toISOString();
}

export interface MarineTimeline {
  times: string[];
  frames: MarinePoint[][];
}

interface OpenMeteoHourly {
  time?: string[];
  wave_height?: (number | null)[];
  sea_surface_temperature?: (number | null)[];
}

interface OpenMeteoLocationHourly {
  hourly?: OpenMeteoHourly;
}

const TIMELINE_WINDOW = 24;

export async function fetchMarineTimeline(): Promise<MarineTimeline> {
  const nowIso = new Date().toISOString();
  const latitudes = MARINE_STATIONS.map((s) => s.coordinates[1]).join(",");
  const longitudes = MARINE_STATIONS.map((s) => s.coordinates[0]).join(",");
  const url =
    `${MARINE_API_URL}?latitude=${latitudes}&longitude=${longitudes}` +
    `&hourly=wave_height,sea_surface_temperature&past_days=1&forecast_days=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo respondio ${response.status}`);
  }

  const payload = (await response.json()) as
    | OpenMeteoLocationHourly
    | OpenMeteoLocationHourly[];
  const locations = Array.isArray(payload) ? payload : [payload];

  const referenceTimes = locations[0]?.hourly?.time;
  if (!referenceTimes || referenceTimes.length === 0) {
    throw new Error("Open-Meteo no devolvio serie horaria");
  }

  const nowMs = Date.now();
  let nowIndex = 0;
  let bestDelta = Infinity;
  referenceTimes.forEach((time, index) => {
    const ms = new Date(parseApiTime(time, nowIso)).getTime();
    const delta = Math.abs(ms - nowMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      nowIndex = index;
    }
  });

  const end = Math.min(referenceTimes.length - 1, nowIndex);
  const start = Math.max(0, end - (TIMELINE_WINDOW - 1));

  const times: string[] = [];
  const frames: MarinePoint[][] = [];

  for (let index = start; index <= end; index += 1) {
    const frameIso = parseApiTime(referenceTimes[index], nowIso);
    times.push(frameIso);

    frames.push(
      MARINE_STATIONS.map((station, stationIndex) => {
        const hourly = locations[stationIndex]?.hourly;
        const seaTemperatureC =
          hourly?.sea_surface_temperature?.[index] ?? station.fallbackTemperatureC;
        const waveHeightM =
          hourly?.wave_height?.[index] ?? station.fallbackWaveHeightM;

        return {
          id: station.id,
          stationName: station.stationName,
          coordinates: station.coordinates,
          seaTemperatureC,
          waveHeightM,
          updatedAt: frameIso,
        };
      }),
    );
  }

  return { times, frames };
}

export interface MarineConditions {
  seaTemperatureC: number | null;
  waveHeightM: number | null;
  wavePeriodS: number | null;
  waveDirectionDeg: number | null;
  updatedAt: string;
}

interface OpenMeteoPointCurrent extends OpenMeteoCurrent {
  wave_period?: number | null;
  wave_direction?: number | null;
}

interface OpenMeteoPointHourly {
  time?: string[];
  wave_height?: (number | null)[];
  sea_surface_temperature?: (number | null)[];
  wave_period?: (number | null)[];
  wave_direction?: (number | null)[];
}

export async function fetchMarineConditions(
  lng: number,
  lat: number,
  targetTimeMs?: number,
): Promise<MarineConditions> {
  const nowIso = new Date().toISOString();
  const targetMs = targetTimeMs ?? Date.now();
  const url =
    `${MARINE_API_URL}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&hourly=wave_height,sea_surface_temperature,wave_period,wave_direction` +
    `&past_days=1&forecast_days=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo respondio ${response.status}`);
  }

  const payload = (await response.json()) as {
    hourly?: OpenMeteoPointHourly;
    current?: OpenMeteoPointCurrent;
  };
  const hourly = payload.hourly;
  const times = hourly?.time ?? [];

  if (times.length > 0) {
    let selectedIndex = 0;
    let bestDelta = Number.POSITIVE_INFINITY;

    times.forEach((time, index) => {
      const ms = new Date(parseApiTime(time, nowIso)).getTime();
      const delta = Math.abs(ms - targetMs);
      if (delta < bestDelta) {
        bestDelta = delta;
        selectedIndex = index;
      }
    });

    return {
      seaTemperatureC: hourly?.sea_surface_temperature?.[selectedIndex] ?? null,
      waveHeightM: hourly?.wave_height?.[selectedIndex] ?? null,
      wavePeriodS: hourly?.wave_period?.[selectedIndex] ?? null,
      waveDirectionDeg: hourly?.wave_direction?.[selectedIndex] ?? null,
      updatedAt: parseApiTime(times[selectedIndex], nowIso),
    };
  }

  const current = payload.current;

  return {
    seaTemperatureC: current?.sea_surface_temperature ?? null,
    waveHeightM: current?.wave_height ?? null,
    wavePeriodS: current?.wave_period ?? null,
    waveDirectionDeg: current?.wave_direction ?? null,
    updatedAt: parseApiTime(current?.time, nowIso),
  };
}

function buildFallbackPoints(updatedAt: string): MarinePoint[] {
  return MARINE_STATIONS.map((station) => ({
    id: station.id,
    stationName: station.stationName,
    coordinates: station.coordinates,
    seaTemperatureC: station.fallbackTemperatureC,
    waveHeightM: station.fallbackWaveHeightM,
    updatedAt,
  }));
}

export class OpenMeteoMarineDataProvider implements MarineDataProvider {
  async getMarinePoints(): Promise<MarinePoint[]> {
    const nowIso = new Date().toISOString();
    const latitudes = MARINE_STATIONS.map((s) => s.coordinates[1]).join(",");
    const longitudes = MARINE_STATIONS.map((s) => s.coordinates[0]).join(",");
    const url =
      `${MARINE_API_URL}?latitude=${latitudes}&longitude=${longitudes}` +
      `&current=wave_height,sea_surface_temperature`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo respondio ${response.status}`);
      }

      const payload = (await response.json()) as
        | OpenMeteoLocation
        | OpenMeteoLocation[];
      const locations = Array.isArray(payload) ? payload : [payload];

      return MARINE_STATIONS.map((station, index) => {
        const current = locations[index]?.current;
        const seaTemperatureC =
          current?.sea_surface_temperature ?? station.fallbackTemperatureC;
        const waveHeightM = current?.wave_height ?? station.fallbackWaveHeightM;

        return {
          id: station.id,
          stationName: station.stationName,
          coordinates: station.coordinates,
          seaTemperatureC,
          waveHeightM,
          updatedAt: parseApiTime(current?.time, nowIso),
        };
      });
    } catch (error) {
      console.error("Fallo la carga de datos marinos reales, usando fallback:", error);
      return buildFallbackPoints(nowIso);
    }
  }
}
