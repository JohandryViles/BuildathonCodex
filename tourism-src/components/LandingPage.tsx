type CategoryId = "food" | "parks" | "beaches" | "shopping" | "drinks" | "culture";

interface LandingPageProps {
  onExplore: (request: string) => void;
}

const CATEGORIES: { id: CategoryId; title: string; subtitle: string; query: string }[] = [
  { id: "food", title: "Comer rico", subtitle: "Sabores manabitas y gastronomía local", query: "Quiero conocer lugares para comer y probar gastronomía local" },
  { id: "parks", title: "Parques", subtitle: "Espacios verdes para compartir", query: "Quiero visitar parques y espacios verdes" },
  { id: "beaches", title: "Playas", subtitle: "Opciones seguras según el mar", query: "Quiero conocer playas bonitas y seguras" },
  { id: "shopping", title: "Shopping", subtitle: "Mall, tiendas y paseo urbano", query: "Quiero ir de compras al mall o conocer tiendas" },
  { id: "drinks", title: "Tomar algo", subtitle: "Cafés, cocteles y vida nocturna", query: "Quiero lugares para tomar algo y disfrutar la noche" },
  { id: "culture", title: "Cultura", subtitle: "Historia, artesanía y tradición", query: "Quiero conocer la cultura, historia y artesanía de Manta" },
];

function CategoryIcon({ id }: { id: CategoryId }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (id === "food") return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...common} d="M7 5v9a4 4 0 0 0 4 4V27M11 5v9M15 5v9a4 4 0 0 1-4 4M23 5v22M23 5c4 3 4 10 0 13" /></svg>;
  if (id === "parks") return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...common} d="M16 27v-9M16 21l-5-4M16 19l5-5M8 18a7 7 0 1 1 3-13 8 8 0 0 1 14 5 6 6 0 0 1-4 11M5 27h22" /></svg>;
  if (id === "beaches") return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...common} d="M4 21c4-3 7 3 11 0s7 3 13 0M4 26c4-3 7 3 11 0s7 3 13 0M22 7a5 5 0 1 1-5 5M5 16h10l-5-5z" /></svg>;
  if (id === "shopping") return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...common} d="M7 11h18l-1 16H8zM12 13V9a4 4 0 0 1 8 0v4" /></svg>;
  if (id === "drinks") return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...common} d="M7 6h18l-9 10zM16 16v10M11 27h10M11 10h10M22 5l3-3" /></svg>;
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path {...common} d="M5 27h22M7 24h18M9 12v12M15 12v12M21 12v12M5 10l11-6 11 6z" /></svg>;
}

export function LandingPage({ onExplore }: LandingPageProps) {
  return (
    <main className="landing-page" id="main-content" tabIndex={-1}>
      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="Manta Inteligente, inicio">
          <span aria-hidden="true">M</span>
          <div><strong>Manta</strong><small>Inteligente</small></div>
        </a>
        <div className="landing-nav-actions">
          <span>Turismo accesible</span>
          <button type="button" onClick={() => onExplore("")}>Abrir mapa turístico</button>
        </div>
      </header>

      <section className="landing-hero" id="top" aria-labelledby="landing-question">
        <img src="/images/manta-hero.png" alt="Paseo costero accesible frente a una playa de Manta" />
        <div className="landing-hero-shade" />
        <div className="landing-hero-content">
          <span className="landing-kicker">Tu próxima experiencia comienza aquí</span>
          <h1 id="landing-question">¿Qué quieres visitar de nuestra ciudad, Manta?</h1>
          <p>Elige una experiencia y te ayudaremos a encontrar lugares que combinen contigo, tu presupuesto y las condiciones del día.</p>
        </div>
      </section>

      <section className="category-section" aria-labelledby="category-title">
        <div className="category-heading">
          <div><span>Explora a tu manera</span><h2 id="category-title">¿Qué te provoca hacer hoy?</h2></div>
          <p>Recomendaciones sencillas, accesibles y pensadas para disfrutar Manta con tranquilidad.</p>
        </div>
        <div className="landing-categories">
          {CATEGORIES.map((category) => (
            <button type="button" key={category.id} onClick={() => onExplore(category.query)}>
              <span className={`category-icon ${category.id}`}><CategoryIcon id={category.id} /></span>
              <strong>{category.title}</strong>
              <small>{category.subtitle}</small>
              <em aria-hidden="true">→</em>
            </button>
          ))}
        </div>
      </section>

      <section className="landing-trust" aria-label="Beneficios del planificador">
        <div><strong>Playas más seguras</strong><span>Información marítima traducida para turistas.</span></div>
        <div><strong>Planes para todos</strong><span>Presupuesto, familia y accesibilidad.</span></div>
        <div><strong>Economía local</strong><span>Experiencias que conectan con Manta.</span></div>
      </section>
    </main>
  );
}
