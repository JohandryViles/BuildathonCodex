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

export async function fetchMarineConditions(
  lng: number,
  lat: number,
): Promise<MarineConditions> {
  const nowIso = new Date().toISOString();
  const url =
    `${MARINE_API_URL}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&current=wave_height,sea_surface_temperature,wave_period,wave_direction`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo respondio ${response.status}`);
  }

  const payload = (await response.json()) as { current?: OpenMeteoPointCurrent };
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
