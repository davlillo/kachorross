import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { manualSessions } from '@/data/manual-content';
import { SessionList } from '@/components/molecules/SessionList';
import { TutorialSession } from '@/components/molecules/TutorialSession';
import { StepNavigator } from '@/components/molecules/StepNavigator';
import { Button } from '@/components/atoms/ui/button';
import { Eye, Monitor } from 'lucide-react';

const STORAGE_PREFIX = 'manual-completed-';

function loadCompletedMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const sessionId = key.slice(STORAGE_PREFIX.length);
      try {
        const raw = localStorage.getItem(key);
        if (raw) map[sessionId] = JSON.parse(raw) as string[];
      } catch {
        map[sessionId] = [];
      }
    }
  }
  return map;
}

function saveCompletedSteps(sessionId: string, stepIds: string[]) {
  localStorage.setItem(`${STORAGE_PREFIX}${sessionId}`, JSON.stringify(stepIds));
}

export default function ManualPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const filteredSessions = useMemo(() => {
    if (!user) return [];
    return manualSessions.filter((s) =>
      s.roles.includes(user.rol as 'doctora' | 'recepcion' | 'admin'),
    );
  }, [user]);

  const [completedMap, setCompletedMap] = useState<Record<string, string[]>>(() => loadCompletedMap());
  const [activeId, setActiveId] = useState<string>('');
  const [stepIndex, setStepIndex] = useState(0);
  const [accessibleMode, setAccessibleMode] = useState(false);

  // Set initial session on first load or when filtered sessions change
  useEffect(() => {
    if (filteredSessions.length > 0 && !activeId) {
      setActiveId(filteredSessions[0].id);
    }
  }, [filteredSessions, activeId]);

  const activeSession = useMemo(
    () => filteredSessions.find((s) => s.id === activeId),
    [filteredSessions, activeId],
  );

  const totalSteps = activeSession?.steps.length ?? 0;
  const currentStepId = activeSession?.steps[stepIndex]?.id ?? '';

  // Persist completed step when advancing
  const markStepComplete = useCallback(
    (sessionId: string, stepId: string) => {
      setCompletedMap((prev) => {
        const existing = prev[sessionId] ?? [];
        if (existing.includes(stepId)) return prev;
        const updated = [...existing, stepId];
        saveCompletedSteps(sessionId, updated);
        return { ...prev, [sessionId]: updated };
      });
    },
    [],
  );

  const completedForActive = completedMap[activeId] ?? [];
  const isSessionComplete = activeSession ? completedForActive.length >= activeSession.steps.length : false;

  const handleSelect = useCallback(
    (id: string) => {
      setActiveId(id);
      setStepIndex(0);
    },
    [],
  );

  const handlePrev = useCallback(() => {
    setStepIndex((p) => Math.max(0, p - 1));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStepId && activeId) {
      markStepComplete(activeId, currentStepId);
    }
    setStepIndex((p) => Math.min(totalSteps - 1, p + 1));
  }, [currentStepId, activeId, markStepComplete, totalSteps]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePrev, handleNext]);

  // Auto-enabled accessible mode on mobile
  useEffect(() => {
    if (isMobile) setAccessibleMode(true);
  }, [isMobile]);

  if (!user || filteredSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay sesiones disponibles para tu rol.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0">
      {/* Mobile banner */}
      {isMobile && (
        <div className="lg:hidden rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <Monitor className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Para mejor experiencia, usá una pantalla de escritorio.</p>
              <p className="mt-1 text-amber-700">
                Se muestra la vista de texto accesible en este dispositivo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="lg:w-72 shrink-0">
        <div className="sticky top-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Sesiones
          </h2>
          <SessionList
            sessions={filteredSessions}
            activeId={activeId}
            completedMap={completedMap}
            onSelect={handleSelect}
          />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {activeSession ? (
          <>
            {/* Header with toggle */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{activeSession.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{activeSession.description}</p>
              </div>
              {!isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAccessibleMode((m) => !m)}
                  className="gap-1.5 shrink-0"
                >
                  <Eye className="w-4 h-4" />
                  {accessibleMode ? 'Vista normal' : 'Vista accesible'}
                </Button>
              )}
            </div>

            <TutorialSession
              session={activeSession}
              stepIndex={stepIndex}
              accessibleMode={accessibleMode}
            />

            <div className="mt-6">
              <StepNavigator
                current={stepIndex}
                total={totalSteps}
                onPrev={handlePrev}
                onNext={handleNext}
                isComplete={isSessionComplete}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Seleccioná una sesión para comenzar.
          </div>
        )}
      </main>
    </div>
  );
}
