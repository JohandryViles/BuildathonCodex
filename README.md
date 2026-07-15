# Alertas Marinas (MapLibre)

App web con `React + Vite + TypeScript` para visualizar alertas marinas de:

- Temperatura superficial del mar
- Altura de oleaje

## Ejecutar

```bash
npm install
npm run dev
```

## Datos actuales

La app usa un proveedor mock:

- `src/data/provider.ts` define la interfaz `MarineDataProvider`
- `src/data/marineMock.ts` implementa datos simulados
- `src/data/createProvider.ts` decide que proveedor se usa

## Cambiar a API real

1. Crear `ApiMarineDataProvider` que implemente `MarineDataProvider`.
2. Transformar la respuesta de API al tipo `MarinePoint`.
3. En `src/data/createProvider.ts`, devolver el proveedor real en lugar del mock.
