import type { MarinePoint } from "../types/marine";

export interface MarineDataProvider {
  getMarinePoints(): Promise<MarinePoint[]>;
}
