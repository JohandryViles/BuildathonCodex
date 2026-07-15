import type { MarineDataProvider } from "./provider";
import type { MarinePoint } from "../types/marine";
import { MARINE_STATIONS } from "./stations";

export class MockMarineDataProvider implements MarineDataProvider {
  async getMarinePoints(): Promise<MarinePoint[]> {
    const updatedAt = new Date().toISOString();

    return MARINE_STATIONS.map((station) => ({
      id: station.id,
      stationName: station.stationName,
      coordinates: station.coordinates,
      seaTemperatureC: station.fallbackTemperatureC,
      waveHeightM: station.fallbackWaveHeightM,
      updatedAt,
    }));
  }
}
