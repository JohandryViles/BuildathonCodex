import { MockMarineDataProvider } from "./marineMock";
import { OpenMeteoMarineDataProvider } from "./openMeteo";
import type { MarineDataProvider } from "./provider";

export function createMarineDataProvider(): MarineDataProvider {
  // Fuente de datos reales (Open-Meteo Marine API, gratis y sin API key).
  // Para volver a datos simulados, retorna: new MockMarineDataProvider();
  return new OpenMeteoMarineDataProvider();
}

export { MockMarineDataProvider };
