import { PRESETS } from './presets';
import { useTheme } from './ThemeContext';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaletteSelectorProps {
  className?: string;
}

function SwatchRow({ id }: { id: string }) {
  const palette = PRESETS.find((p) => p.id === id);
  if (!palette) return null;
  const c = palette.colors.light;
  const swatches = [
    c.primary,
    c.secondary,
    c.surface,
    c.accent,
    c.text,
    c.muted,
  ];
  return (
    <div className="flex gap-0.5 mt-2">
      {swatches.map((hsl, i) => (
        <div
          key={i}
          className="flex-1 h-2.5 rounded-sm first:rounded-l last:rounded-r"
          style={{ backgroundColor: `hsl(${hsl})` }}
        />
      ))}
    </div>
  );
}

export function PaletteSelector({ className }: PaletteSelectorProps) {
  const { paletteId, setPalette } = useTheme();

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3', className)}>
      {PRESETS.map((palette) => {
        const isSelected = paletteId === palette.id;
        const primary = palette.colors.light.primary;
        return (
          <button
            key={palette.id}
            type="button"
            onClick={() => setPalette(palette.id)}
            className={cn(
              'relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200',
              'hover:shadow-md hover:scale-[1.02]',
              isSelected
                ? 'border-brand-primary shadow-md ring-1 ring-brand-primary/20'
                : 'border-border hover:border-brand-primary/30',
            )}
          >
            {isSelected && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center shadow-sm">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className="w-12 h-12 rounded-xl shadow-sm mb-2"
              style={{ backgroundColor: `hsl(${primary})` }}
            />
            <span className="text-xs font-semibold text-center leading-tight">
              {palette.name}
            </span>
            <SwatchRow id={palette.id} />
          </button>
        );
      })}
    </div>
  );
}
