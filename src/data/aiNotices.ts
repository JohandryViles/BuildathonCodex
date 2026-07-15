import type { AiNotice, MarineAlert } from "../types/marine";

interface AiNoticesResponse {
  notices: AiNotice[];
  source: "mock" | "openai";
}

function safeMode(rawMode: string | undefined): "mock" | "openai" {
  return rawMode === "openai" ? "openai" : "mock";
}

export async function fetchAiNotices(
  selectedTime: string,
  alerts: MarineAlert[],
): Promise<AiNotice[]> {
  const mode = safeMode(import.meta.env.VITE_AI_MODE);
  const apiUrl =
    import.meta.env.VITE_AI_API_URL?.trim() || "http://localhost:8787";

  const response = await fetch(`${apiUrl}/api/ai/notices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selectedTime,
      alerts,
      mode,
    }),
  });

  if (!response.ok) {
    throw new Error(`IA notices respondio ${response.status}`);
  }

  const payload = (await response.json()) as AiNoticesResponse;
  if (!Array.isArray(payload.notices)) {
    throw new Error("Respuesta de IA invalida");
  }

  return payload.notices;
}
