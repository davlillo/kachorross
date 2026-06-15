import {
  LayoutDashboard,
  Search,
  Stethoscope,
  ClipboardList,
  User,
  Shield,
  FileText,
  Package,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/atoms/ui/badge';
import type { ManualSession } from '@/types';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Search,
  Stethoscope,
  ClipboardList,
  User,
  Shield,
  FileText,
  Package,
  History,
};

interface SessionListProps {
  sessions: ManualSession[];
  activeId: string;
  completedMap: Record<string, string[]>;
  onSelect: (id: string) => void;
}

export function SessionList({ sessions, activeId, completedMap, onSelect }: SessionListProps) {
  return (
    <nav className="space-y-1">
      {sessions.map((s) => {
        const Icon = ICON_MAP[s.icon] ?? FileText;
        const completedSteps = completedMap[s.id] ?? [];
        const progress = completedSteps.length;
        const total = s.steps.length;
        const isActive = activeId === s.id;

        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              'w-full text-left px-3 py-3 rounded-lg transition-all duration-200 flex items-start gap-3',
              isActive
                ? 'bg-gradient-to-r from-brand-primary to-brand-primary text-white shadow-md'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5 mt-0.5 shrink-0',
                isActive ? 'text-white' : 'text-muted-foreground',
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{s.title}</div>
              <div className={cn(
                'text-xs mt-0.5 line-clamp-2',
                isActive ? 'text-white/80' : 'text-muted-foreground',
              )}>
                {s.description}
              </div>
              <div className="mt-1.5">
                {progress === total && total > 0 ? (
                  <Badge variant="outline" className={cn(
                    'text-xs border-green-300 text-green-700',
                    isActive && 'border-white/30 text-white',
                  )}>
                    {total}/{total} completados
                  </Badge>
                ) : (
                  <span className={cn(
                    'text-xs tabular-nums',
                    isActive ? 'text-white/70' : 'text-muted-foreground',
                  )}>
                    {progress} / {total} pasos
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
