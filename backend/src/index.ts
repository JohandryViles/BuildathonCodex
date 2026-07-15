import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

dotenv.config();

type AlertLevel = "normal" | "watch" | "warning" | "danger";

interface MarineAlertInput {
  pointId: string;
  stationName: string;
  level: AlertLevel;
  message: string;
  seaTemperatureC: number;
  waveHeightM: number;
  updatedAt: string;
}

type AiNoticeKind = "daily" | "prevention";
type AiNoticeSeverity = "info" | "watch" | "warning" | "danger";
type NoticeSource = "mock" | "openai";

interface AiNotice {
  id: string;
  kind: AiNoticeKind;
  severity: AiNoticeSeverity;
  title: string;
  message: string;
  pointId?: string;
  stationName?: string;
  validFrom: string;
  validTo?: string;
  source: NoticeSource;
}

interface NoticesRequestBody {
  selectedTime?: string;
  alerts?: MarineAlertInput[];
  mode?: NoticeSource;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const port = Number(process.env.PORT || 8787);

function toSeverity(level: AlertLevel): AiNoticeSeverity {
  if (level === "danger") return "danger";
  if (level === "warning") return "warning";
  if (level === "watch") return "watch";
  return "info";
}

function addHours(iso: string, hours: number): string {
  const base = new Date(iso);
  if (Number.isNaN(base.getTime())) {
    return new Date().toISOString();
  }
  base.setHours(base.getHours() + hours);
  return base.toISOString();
}

function buildMockNotices(selectedTime: string, alerts: MarineAlertInput[]): AiNotice[] {
  const notices: AiNotice[] = [];
  const critical = alerts.filter((alert) => alert.level !== "normal").slice(0, 4);

  if (critical.length === 0) {
    notices.push({
      id: "daily-stable",
      kind: "daily",
      severity: "info",
      title: "Panorama marino estable",
      message:
        "No se detectan condiciones de riesgo alto en la hora seleccionada. Mantener monitoreo preventivo.",
      validFrom: selectedTime,
      validTo: addHours(selectedTime, 6),
      source: "mock",
    });
    return notices;
  }

  for (const alert of critical) {
    const prevention =
      alert.level === "danger"
        ? "Evitar salida de embarcaciones menores y reforzar protocolos de seguridad."
        : alert.level === "warning"
          ? "Reducir navegacion recreativa y extremar precauciones operativas."
          : "Mantener vigilancia activa de cambios de viento y altura de ola.";

    notices.push({
      id: `mock-${alert.pointId}-${alert.level}`,
      kind: "prevention",
      severity: toSeverity(alert.level),
      title: `Prevencion ${alert.level} en ${alert.stationName}`,
      message: `${alert.message}. ${prevention}`,
      pointId: alert.pointId,
      stationName: alert.stationName,
      validFrom: selectedTime,
      validTo: addHours(selectedTime, 4),
      source: "mock",
    });
  }

  notices.push({
    id: "daily-summary",
    kind: "daily",
    severity: notices.some((notice) => notice.severity === "danger")
      ? "danger"
      : notices.some((notice) => notice.severity === "warning")
        ? "warning"
        : "watch",
    title: "Resumen IA del dia",
    message:
      "Priorizar zonas con oleaje alto y temperatura anomala. Confirmar rutas seguras antes de operaciones marinas.",
    validFrom: selectedTime,
    validTo: addHours(selectedTime, 8),
    source: "mock",
  });

  return notices;
}

function sanitizeNotices(raw: unknown, selectedTime: string, source: NoticeSource): AiNotice[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const notices: AiNotice[] = [];

  for (const item of raw) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const candidate = item as Partial<AiNotice>;
    if (typeof candidate.title !== "string" || typeof candidate.message !== "string") {
      continue;
    }

    const severity: AiNoticeSeverity =
      candidate.severity === "danger" ||
      candidate.severity === "warning" ||
      candidate.severity === "watch"
        ? candidate.severity
        : "info";

    const kind: AiNoticeKind = candidate.kind === "prevention" ? "prevention" : "daily";

    notices.push({
      id:
        typeof candidate.id === "string"
          ? candidate.id
          : `openai-${Math.random().toString(36).slice(2, 10)}`,
      kind,
      severity,
      title: candidate.title,
      message: candidate.message,
      pointId: typeof candidate.pointId === "string" ? candidate.pointId : undefined,
      stationName:
        typeof candidate.stationName === "string" ? candidate.stationName : undefined,
      validFrom:
        typeof candidate.validFrom === "string" ? candidate.validFrom : selectedTime,
      validTo: typeof candidate.validTo === "string" ? candidate.validTo : undefined,
      source,
    });
  }

  return notices.slice(0, 6);
}

async function generateOpenAiNotices(
  selectedTime: string,
  alerts: MarineAlertInput[],
): Promise<AiNotice[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildMockNotices(selectedTime, alerts);
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const prompt = `Eres un asistente de alertas marinas.
Genera una respuesta en JSON con la forma:
{"notices":[{"id":"...","kind":"daily|prevention","severity":"info|watch|warning|danger","title":"...","message":"...","pointId":"ID exacto de la alerta","stationName":"...","validFrom":"ISO","validTo":"ISO"}]}

Reglas:
- Maximo 5 notificaciones.
- Espanol claro, accionable y breve.
- Basado en la hora seleccionada y alertas recibidas.
- Para cada prevencion conserva exactamente pointId y stationName de su alerta de origen.
- No inventar campos fuera del esquema.

Hora seleccionada: ${selectedTime}
Alertas: ${JSON.stringify(alerts).slice(0, 12000)}`;

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Devuelve solo JSON valido. No uses markdown ni texto fuera del objeto JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    return buildMockNotices(selectedTime, alerts);
  }

  const notices = sanitizeNotices(
    (parsed as { notices?: unknown }).notices,
    selectedTime,
    "openai",
  );

  if (notices.length === 0) {
    return buildMockNotices(selectedTime, alerts);
  }

  return notices;
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    mode: process.env.OPENAI_API_KEY ? "openai-enabled" : "mock-only",
  });
});

app.post("/api/ai/notices", async (req, res) => {
  const body = (req.body ?? {}) as NoticesRequestBody;
  const selectedTime = body.selectedTime || new Date().toISOString();
  const alerts = Array.isArray(body.alerts) ? body.alerts : [];
  const mode: NoticeSource = body.mode === "openai" ? "openai" : "mock";

  try {
    const notices =
      mode === "openai"
        ? await generateOpenAiNotices(selectedTime, alerts)
        : buildMockNotices(selectedTime, alerts);

    res.json({
      notices,
      source: notices[0]?.source ?? mode,
    });
  } catch (error) {
    console.error("Fallo generando notificaciones IA:", error);
    res.status(200).json({
      notices: buildMockNotices(selectedTime, alerts),
      source: "mock",
    });
  }
});

app.listen(port, () => {
  console.log(`Marine AI backend escuchando en http://localhost:${port}`);
});
