# Plan de implementacion - Turismo Manta Inteligente

## 1. Objetivo

Construir una plataforma web que recomiende experiencias turisticas de Manta,
distribuya visitantes hacia economias locales y use condiciones maritimas para
reducir riesgos en rutas costeras.

Este documento es el acuerdo de trabajo del equipo. Toda funcionalidad nueva
debe vincularse con una fase, tener criterios de aceptacion y entrar mediante
una rama corta creada desde `Rama-Turismo---Manta-Inteligente`.

## 2. Alcance del MVP

- Mapa centrado en Manta con rutas y estaciones costeras.
- Catalogo inicial de rutas culturales, costeras, gastronomicas, naturales y
  artesanales.
- Recomendaciones ordenadas por accesibilidad, demanda, impacto local y riesgo.
- Condiciones maritimas desde Open-Meteo, con datos locales de respaldo.
- Alertas por temperatura superficial y altura del oleaje.
- Seleccion sincronizada entre panel y mapa.
- Interfaz adaptable a escritorio, tableta y movil.
- Documentacion de ejecucion y validacion tecnica.

Fuera del MVP: pagos, reservas, chat, IA generativa, panel administrativo,
cuentas de operadores y aplicacion movil nativa.

## 3. Estado actual

### Implementado

- [x] Base React, TypeScript y Vite.
- [x] Mapa interactivo con MapLibre.
- [x] Estaciones marinas del area de Manta.
- [x] Integracion con Open-Meteo Marine API sin clave.
- [x] Fallback local cuando la API marina no responde.
- [x] Motor inicial de alertas marinas.
- [x] Catalogo local de siete rutas turisticas.
- [x] Motor inicial de recomendaciones y redireccion por riesgo.
- [x] Panel de rutas, indicadores de impacto y filtros de alertas.
- [x] Diseno responsive basico.
- [x] Comando de comprobacion de tipos y version minima de Node documentada.

### Pendiente antes de considerar listo el MVP

- [ ] Confirmar en campo coordenadas, duraciones y accesibilidad de cada ruta.
- [ ] Sustituir cada punto por un trazado GeoJSON real de la ruta.
- [ ] Agregar buscador y filtros por duracion, tipo y accesibilidad.
- [ ] Mostrar claramente si los datos marinos son reales o de respaldo.
- [ ] Manejar estados de error, vacio y reintento desde la interfaz.
- [ ] Incorporar pruebas unitarias para alertas y recomendaciones.
- [ ] Incorporar pruebas de componentes y una prueba E2E del flujo principal.
- [ ] Revisar accesibilidad WCAG: teclado, foco, contraste y lector de pantalla.
- [ ] Configurar CI para ejecutar tipos, pruebas y build en cada pull request.
- [ ] Definir analitica respetuosa de privacidad y metricas de impacto.

## 4. Arquitectura acordada

```text
src/
  components/   UI y adaptadores de MapLibre
  data/         fuentes externas, fallback y catalogos temporales
  domain/       reglas puras de alertas y recomendaciones
  types/        contratos compartidos
  styles/       estilos globales
```

Reglas:

1. `domain` no depende de React, MapLibre ni APIs remotas.
2. Los componentes no llaman directamente a servicios salvo integraciones
   propias del mapa; las nuevas fuentes deben vivir en `data`.
3. Las reglas no se duplican en la interfaz.
4. Los contratos compartidos se tipan; no se introduce `any`.
5. Los secretos nunca se versionan. Toda variable futura se documenta en
   `.env.example`.
6. El fallback debe conservar la experiencia principal sin ocultar que los
   datos pueden no estar actualizados.

## 5. Fases de escalamiento

### Fase 1 - Base confiable

- Validar el inventario turístico con actores locales.
- Añadir filtros, estados de carga/error y trazados reales.
- Instalar Vitest y Testing Library.
- Configurar ESLint, Prettier y GitHub Actions.
- Criterio de salida: flujo mapa-panel usable en movil, build y pruebas verdes.

### Fase 2 - Datos persistentes

- Diseñar entidades: lugares, rutas, segmentos, operadores, horarios,
  accesibilidad, condiciones y eventos.
- Crear API con validacion, paginacion y cache.
- Migrar el catalogo local sin acoplar el frontend al proveedor de base de datos.
- Criterio de salida: catalogo editable y versionado, con fallback verificable.

### Fase 3 - Personalizacion y operacion

- Preferencias del visitante: tiempo, movilidad, intereses y presupuesto.
- Favoritos e itinerario, inicialmente sin exigir cuenta.
- Portal moderado para operadores y gestores municipales.
- Notificaciones de cambios relevantes y reglas auditables.
- Criterio de salida: recomendaciones explicables y operacion con roles.

### Fase 4 - Escala y medicion

- Observabilidad: errores, latencia, disponibilidad y frescura de datos.
- Cache geoespacial, limites de consumo y estrategia offline/PWA.
- Metricas: derivacion a zonas de baja demanda, negocios beneficiados,
  accesibilidad cubierta y respuesta ante alertas.
- Pruebas de carga, seguridad, respaldo y recuperacion.
- Criterio de salida: objetivos de servicio medidos y plan de incidentes probado.

## 6. Backlog inicial priorizado

| Prioridad | Tarea | Criterio de aceptacion |
| --- | --- | --- |
| P0 | Verificar datos de rutas | Fuente y fecha registradas por cada dato |
| P0 | Trazados GeoJSON | El mapa muestra inicio, recorrido y fin |
| P0 | Estado de fuente marina | El usuario distingue API, fallback y antiguedad |
| P0 | Pruebas de dominio | Umbrales y orden de rutas cubiertos |
| P1 | Filtros turisticos | URL o estado conserva tipo, tiempo y accesibilidad |
| P1 | Accesibilidad UI | Navegacion completa con teclado y foco visible |
| P1 | CI | Pull requests bloqueados si falla tipo, prueba o build |
| P2 | API de catalogo | Contrato documentado, validado y paginado |
| P2 | Analitica | Eventos anonimos y consentimiento documentados |

## 7. Flujo de trabajo para dos personas

- Actualizar la rama compartida antes de crear una rama de tarea.
- Usar nombres como `feature/filtros-rutas` o `test/recomendaciones`.
- Evitar que dos personas editen simultaneamente `App.tsx` o `app.css`.
- Mantener commits pequenos con una sola intencion.
- En cada pull request indicar: problema, solucion, capturas, pruebas realizadas y
  tarea del backlog.
- Requerir revision del companero antes de integrar cambios importantes.

Reparto inicial sugerido:

- Persona A: datos de rutas, GeoJSON, API y reglas de dominio.
- Persona B: componentes, accesibilidad, responsive y pruebas de interfaz.
- Compartido: contratos de tipos, criterios de aceptacion y revision final.

## 8. Definicion de terminado

Una tarea esta terminada cuando:

- cumple su criterio de aceptacion;
- incluye estados de carga, error y vacio cuando aplican;
- conserva navegacion por teclado y comportamiento responsive;
- agrega o actualiza pruebas para reglas relevantes;
- pasa `npm run typecheck`, pruebas y `npm run build`;
- actualiza este documento o el README si cambia el uso o la arquitectura;
- no contiene claves, datos personales ni dependencias sin justificar.

## 9. Decisiones que el equipo debe cerrar

- Fuente oficial y responsable de mantener el catalogo turistico.
- Proveedor de persistencia y hosting.
- Frecuencia de actualizacion de condiciones y politica de cache.
- Metodo verificable para calificar accesibilidad y demanda.
- Idiomas del producto y estrategia de contenido.
- Roles autorizados para publicar alertas o modificar rutas.
