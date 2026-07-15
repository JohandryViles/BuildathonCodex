import { useEffect, useRef, useState } from "react";

interface TimelineBarProps {
  times: string[];
  selectedHour: number;
  onSelectHour: (hour: number) => void;
}

function formatTick(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return date.toLocaleTimeString("es-CO", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFull(iso: string | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-CO", {
    hour12: false,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TimelineBar({
  times,
  selectedHour,
  onSelectHour,
}: TimelineBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const hasData = times.length > 1;
  const maxIndex = Math.max(0, times.length - 1);

  useEffect(() => {
    if (!isPlaying || !hasData) {
      return;
    }

    intervalRef.current = window.setInterval(() => {
      onSelectHour((selectedHour + 1) % times.length);
    }, 900);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, hasData, selectedHour, times.length]);

  if (!hasData) {
    return null;
  }

  return (
    <section className="timeline-bar" aria-label="Linea de tiempo de 24 horas">
      <button
        type="button"
        className="timeline-play"
        onClick={() => setIsPlaying((playing) => !playing)}
        aria-label={isPlaying ? "Pausar" : "Reproducir"}
      >
        {isPlaying ? "\u23F8" : "\u25B6"}
      </button>

      <div className="timeline-track">
        <input
          type="range"
          min={0}
          max={maxIndex}
          step={1}
          value={selectedHour}
          onChange={(event) => onSelectHour(Number(event.target.value))}
          aria-label="Seleccionar hora"
        />
        <div className="timeline-ticks">
          <span>{formatTick(times[0])}</span>
          <span>{formatTick(times[Math.floor(maxIndex / 2)])}</span>
          <span>{formatTick(times[maxIndex])}</span>
        </div>
      </div>

      <div className="timeline-current">{formatFull(times[selectedHour])}</div>
    </section>
  );
}
