import { Hotspot } from '@/components/molecules/Hotspot';
import type { ManualSession } from '@/types';

interface TutorialSessionProps {
  session: ManualSession;
  stepIndex: number;
  accessibleMode: boolean;
}

export function TutorialSession({ session, stepIndex, accessibleMode }: TutorialSessionProps) {
  const step = session.steps[stepIndex];
  if (!step) return null;

  if (accessibleMode) {
    return (
      <div className="animate-step-enter" key={step.id}>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{step.title}</h2>
          <p className="text-muted-foreground leading-relaxed">{step.description}</p>
        </div>
        <dl className="space-y-4">
          {step.hotspots.map((h) => (
            <div
              key={h.id}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <dt className="font-semibold text-foreground mb-1">{h.title}</dt>
              <dd className="text-sm text-muted-foreground leading-relaxed">{h.description}</dd>
            </div>
          ))}
          {step.hotspots.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Este paso no tiene anotaciones interactivas.
            </p>
          )}
        </dl>
      </div>
    );
  }

  return (
    <div className="animate-step-enter" key={step.id}>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground mb-1">{step.title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">{step.description}</p>
      </div>

      <div className="relative inline-block w-full rounded-xl border border-border overflow-hidden bg-muted/30 shadow-soft">
        <img
          src={`/screenshots/${step.screenshot}`}
          alt={`Captura del paso: ${step.title}`}
          className="w-full h-auto block"
          loading="lazy"
        />

        {step.hotspots.map((h, i) => (
          <Hotspot key={h.id} hotspot={h} index={i} />
        ))}
      </div>
    </div>
  );
}
