import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/atoms/ui/popover';
import type { HotspotDef } from '@/types';

interface HotspotProps {
  hotspot: HotspotDef;
  index: number;
}

export function Hotspot({ hotspot, index }: HotspotProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="absolute animate-hotspot-pop rounded-full bg-brand-primary/80 hover:bg-brand-primary 
                     ring-2 ring-white/60 hover:ring-white shadow-lg transition-all duration-200
                     hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          style={{
            left: `${hotspot.x}%`,
            top: `${hotspot.y}%`,
            width: `${hotspot.width}%`,
            height: `${hotspot.height}%`,
            animationDelay: `${index * 120}ms`,
          }}
          aria-label={hotspot.title}
        >
          <span className="sr-only">{hotspot.title}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={hotspot.placement ?? 'right'}
        className="w-72 p-4 text-sm shadow-xl border border-border"
        sideOffset={8}
      >
        <h4 className="font-semibold text-foreground mb-1">{hotspot.title}</h4>
        <p className="text-muted-foreground leading-relaxed">{hotspot.description}</p>
      </PopoverContent>
    </Popover>
  );
}
