# Alertas Marinas (MapLibre)

App web con `React + Vite + TypeScript` para visualizar alertas marinas de:

- Temperatura superficial del mar
- Altura de oleaje

## Ejecutar

```bash
npm install
npm run dev
```

## Datos marinos

La app usa proveedor real con Open-Meteo Marine API:

- `src/data/provider.ts` define la interfaz `MarineDataProvider`
- `src/data/openMeteo.ts` implementa datos reales
- `src/data/marineMock.ts` implementa datos simulados
- `src/data/createProvider.ts` decide que proveedor se usa

## Notificaciones IA (mock y OpenAI)

La app consume el backend en `backend/` para generar notificaciones IA sin exponer API key en frontend.

1. Configura frontend:
   - Copia `.env.example` a `.env.local`.
   - Ajusta:
     - `VITE_AI_MODE=mock` para simuladas.
     - `VITE_AI_MODE=openai` para usar OpenAI real.
2. Levanta backend:
   - `cd backend`
   - `npm install`
   - Copia `.env.example` a `.env`
   - Configura `OPENAI_API_KEY` si usaras modo real.
   - `npm run dev`
3. Levanta frontend:
   - `npm run dev`

Si el backend no tiene API key o falla OpenAI, responde automaticamente con notificaciones simuladas.
