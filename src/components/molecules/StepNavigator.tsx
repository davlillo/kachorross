import { Button } from '@/components/atoms/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface StepNavigatorProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  isComplete: boolean;
}

export function StepNavigator({ current, total, onPrev, onNext, isComplete }: StepNavigatorProps) {
  const isFirst = current === 0;
  const isLast = current === total - 1;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={isFirst}
        className="gap-1.5"
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </Button>

      <div className="flex items-center gap-2 text-sm">
        {isComplete ? (
          <span className="flex items-center gap-1.5 text-green-600 font-medium">
            <CheckCircle className="w-4 h-4" />
            Completado
          </span>
        ) : (
          <span className="text-muted-foreground font-medium tabular-nums">
            {current + 1} / {total}
          </span>
        )}
      </div>

      {!isLast && (
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          className="gap-1.5"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
      {isLast && <div className="w-[97px]" />}
    </div>
  );
}
