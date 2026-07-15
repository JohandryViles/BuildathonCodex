# Manta Inteligente

App web con `React + Vite + TypeScript` para recomendar rutas turisticas
accesibles en Manta usando alertas maritimas como contexto de decision.

La V1 combina:

- Rutas culturales, costeras, gastronomicas, naturales y artesanales.
- Accesibilidad, demanda estimada e impacto local.
- Temperatura superficial del mar y altura de oleaje con Open-Meteo.
- Alertas utiles para turismo, pesca y lanchas costeras.

## Ejecutar

```bash
nvm use
npm install
npm run dev
```

Requiere Node.js 20.19 o superior. Para validar tipos sin generar el bundle:

```bash
npm run typecheck
```

La hoja de ruta, acuerdos tecnicos y tareas para el equipo estan en
[`PLAN_IMPLEMENTACION.md`](./PLAN_IMPLEMENTACION.md).

## Datos actuales

La app usa datos locales para rutas turisticas y puntos costeros de Manta.
Las condiciones maritimas vienen de Open-Meteo Marine API y tienen fallback
local si la API no responde.

- `src/data/provider.ts` define la interfaz `MarineDataProvider`
- `src/data/stations.ts` define estaciones costeras locales
- `src/data/tourismRoutes.ts` define rutas turisticas base
- `src/domain/alerts.ts` evalua riesgos maritimos
- `src/domain/recommendations.ts` prioriza rutas segun accesibilidad, demanda,
  impacto local y alertas del mar
