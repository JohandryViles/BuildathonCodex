interface AccessibilityToolbarProps {
  largeText: boolean;
  highContrast: boolean;
  onLargeTextChange: (enabled: boolean) => void;
  onHighContrastChange: (enabled: boolean) => void;
}

export function AccessibilityToolbar({
  largeText,
  highContrast,
  onLargeTextChange,
  onHighContrastChange,
}: AccessibilityToolbarProps) {
  return (
    <nav className="accessibility-toolbar" aria-label="Opciones de accesibilidad">
      <span>Accesibilidad</span>
      <button
        type="button"
        aria-pressed={largeText}
        onClick={() => onLargeTextChange(!largeText)}
      >
        <span aria-hidden="true">Aa</span>
        Texto grande
      </button>
      <button
        type="button"
        aria-pressed={highContrast}
        onClick={() => onHighContrastChange(!highContrast)}
      >
        <span aria-hidden="true">◐</span>
        Alto contraste
      </button>
    </nav>
  );
}
