import type { RouteRecommendation, TourismTag } from "../types/marine";

export interface AssistantMatch {
  recommendation: RouteRecommendation;
  matchScore: number;
  explanation: string;
}

interface TouristIntent {
  tags: TourismTag[];
  maxBudget?: number;
}

const intentPatterns: { tag: TourismTag; words: string[] }[] = [
  { tag: "budget", words: ["poca plata", "poco dinero", "barato", "economico", "presupuesto", "gratis"] },
  { tag: "family", words: ["familia", "familiar"] },
  { tag: "children", words: ["ninos", "ninas", "hijos", "pequenos"] },
  { tag: "quiet", words: ["poca gente", "tranquilo", "sin mucha gente", "no este lleno", "relajado"] },
  { tag: "beach", words: ["playa", "mar", "arena", "banarme"] },
  { tag: "park", words: ["parque", "juegos", "espacio verde"] },
  { tag: "culture", words: ["cultura", "museo", "historia", "artesania"] },
  { tag: "food", words: ["comer", "comida", "gastronomia", "restaurante"] },
  { tag: "shopping", words: ["mall", "shopping", "compras", "tiendas", "centro comercial"] },
  { tag: "nightlife", words: ["tomar", "bares", "bar", "coctel", "vida nocturna", "noche"] },
  { tag: "nature", words: ["naturaleza", "bosque", "sendero"] },
  { tag: "accessible", words: ["accesible", "silla de ruedas", "movilidad", "adulto mayor"] },
];

const EXPERIENCE_TAGS = new Set<TourismTag>([
  "beach",
  "park",
  "food",
  "shopping",
  "nightlife",
  "culture",
  "nature",
]);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function understandTouristRequest(request: string): TouristIntent {
  const normalized = normalize(request);
  const tags = intentPatterns
    .filter(({ words }) => words.some((word) => normalized.includes(word)))
    .map(({ tag }) => tag);
  const budgetMatch = normalized.match(/(?:\$|usd\s*)?(\d{1,3})(?:\s*(?:dolares|usd))?/);
  const maxBudget = budgetMatch ? Number(budgetMatch[1]) : undefined;

  if (tags.includes("budget") && !tags.includes("free")) tags.push("free");
  return { tags: [...new Set(tags)], maxBudget };
}

export function getPersonalizedRecommendations(
  request: string,
  recommendations: RouteRecommendation[],
): AssistantMatch[] {
  const intent = understandTouristRequest(request);

  return recommendations
    .filter(({ status }) => status !== "avoid")
    .map((recommendation) => {
      const { route } = recommendation;
      const matchedTags = intent.tags.filter((tag) => route.tags.includes(tag));
      const requestedExperiences = intent.tags.filter((tag) => EXPERIENCE_TAGS.has(tag));
      const matchedExperiences = requestedExperiences.filter((tag) => route.tags.includes(tag));
      const overBudget = intent.maxBudget !== undefined && route.estimatedCostUsd > intent.maxBudget;
      const affordable = route.estimatedCostUsd <= (intent.maxBudget ?? 12);
      const matchScore =
        matchedTags.length * 25 +
        matchedExperiences.length * 55 +
        (requestedExperiences.length > 0 && matchedExperiences.length === 0 ? -45 : 0) +
        (affordable ? 15 : -35) +
        (route.demand === "low" && intent.tags.includes("quiet") ? 24 : 0) +
        (recommendation.status === "recommended" ? 18 : -8) +
        recommendation.score / 10;
      const reasons = [
        matchedTags.length > 0 ? `coincide con ${matchedTags.length} de tus preferencias` : "es una alternativa disponible",
        route.demand === "low" ? "suele distribuir visitantes hacia una zona menos concurrida" : "tiene demanda moderada o alta",
        `costo referencial desde $${route.estimatedCostUsd}`,
        recommendation.status === "caution" ? "requiere precaución por condiciones marítimas" : "las condiciones actuales permiten recomendarla",
      ];

      return {
        recommendation,
        matchScore: overBudget ? matchScore - 40 : matchScore,
        explanation: reasons.join(", "),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}
