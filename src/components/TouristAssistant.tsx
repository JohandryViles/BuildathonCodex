import { useState } from "react";
import { getPersonalizedRecommendations } from "../domain/touristAssistant";
import type { RouteRecommendation } from "../types/marine";

interface TouristAssistantProps {
  recommendations: RouteRecommendation[];
  onSelectRoute: (routeId: string) => void;
}

const EXAMPLES = [
  "Tengo poca plata y quiero una playa con poca gente",
  "Viajo con niños y queremos visitar parques",
];

export function TouristAssistant({ recommendations, onSelectRoute }: TouristAssistantProps) {
  const [request, setRequest] = useState("");
  const [query, setQuery] = useState("");
  const matches = query ? getPersonalizedRecommendations(query, recommendations) : [];

  function submit(value: string) {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    setRequest(cleanValue);
    setQuery(cleanValue);
  }

  return (
    <section className="tourist-assistant">
      <div className="assistant-title">
        <span aria-hidden="true">✦</span>
        <div>
          <strong>¿Qué quieres hacer en Manta?</strong>
          <small>Describe tu presupuesto, compañía e intereses.</small>
        </div>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); submit(request); }}>
        <textarea
          value={request}
          onChange={(event) => setRequest(event.target.value)}
          placeholder="Ej.: Tengo $10, viajo con niños y busco un lugar tranquilo..."
          rows={2}
        />
        <button type="submit">Recomendar</button>
      </form>
      {!query && (
        <div className="assistant-examples">
          {EXAMPLES.map((example) => (
            <button type="button" key={example} onClick={() => submit(example)}>{example}</button>
          ))}
        </div>
      )}
      {matches.length > 0 && (
        <div className="assistant-results" aria-live="polite">
          <p>Estas opciones encajan mejor contigo:</p>
          {matches.map(({ recommendation, explanation }, index) => (
            <button
              type="button"
              key={recommendation.route.id}
              onClick={() => onSelectRoute(recommendation.route.id)}
            >
              <span>{index + 1}</span>
              <div>
                <strong>{recommendation.route.name}</strong>
                <small>{explanation}.</small>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
