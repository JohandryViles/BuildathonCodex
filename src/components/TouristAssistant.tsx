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

const QUICK_PREFERENCES = [
  { label: "Bajo presupuesto", query: "Tengo poco dinero y busco opciones económicas" },
  { label: "Familia con niños", query: "Viajo con mi familia y niños" },
  { label: "Playa tranquila", query: "Quiero una playa tranquila con poca gente" },
  { label: "Parques", query: "Quiero conocer parques y espacios verdes" },
  { label: "Accesible", query: "Necesito lugares accesibles para movilidad reducida" },
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
    <section className="tourist-assistant" aria-labelledby="assistant-title">
      <div className="assistant-title">
        <span aria-hidden="true">✦</span>
        <div>
          <strong id="assistant-title">¿Qué quieres hacer en Manta?</strong>
          <small>Describe tu presupuesto, compañía e intereses.</small>
        </div>
      </div>
      <div className="quick-preferences" aria-label="Preferencias rápidas">
        {QUICK_PREFERENCES.map((preference) => (
          <button type="button" key={preference.label} onClick={() => submit(preference.query)}>
            {preference.label}
          </button>
        ))}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); submit(request); }}>
        <label className="sr-only" htmlFor="tourist-request">Cuéntanos qué tipo de experiencia buscas</label>
        <textarea
          id="tourist-request"
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
          <div className="assistant-results-heading">
            <p>Estas opciones encajan mejor contigo:</p>
            <button type="button" onClick={() => { setQuery(""); setRequest(""); }}>Nueva búsqueda</button>
          </div>
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
