# Tasks: Manual de Usuario Interactivo

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~530 logic + ~500 declarative content |
| 800-line budget risk | Medium (logic only: ~530; content is data, not code) |
| Chained PRs recommended | No |
| Suggested split | Single PR — cohesive feature, linear deps |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
800-line budget risk: Medium

## Phase 1: Foundation

- [x] T-001 Add `HotspotDef`, `TutorialStep`, `ManualSession` to `src/types/index.ts`. **Files:** `src/types/index.ts` (modify). **Vfy:** `npm run build`. **~25L.**
- [x] T-002 Create `src/data/manual-content.ts` with `manualSessions: ManualSession[]` — 7 sessions, ~5 steps each, ~2 hotspots avg. **Files:** `src/data/manual-content.ts` (new). **Vfy:** build passes; array typed as `ManualSession[]`. **~500L.**

## Phase 2: Molecules

- [ ] T-003 Create `Hotspot.tsx` — positioned `<Popover>` trigger, staggered `animationDelay: index * 120ms`, `animate-hotspot-pop`. **Files:** `src/components/molecules/Hotspot.tsx` (new). **Depends:** T-001. **Vfy:** renders with test props. **~55L.**
- [ ] T-004 Create `StepNavigator.tsx` — Prev/Next + "N/M" indicator, hides Next on last step, completion badge. **Files:** `src/components/molecules/StepNavigator.tsx` (new). **Depends:** none. **Vfy:** `onPrev`/`onNext` fire; last step hides Next. **~45L.**
- [ ] T-005 Create `TutorialSession.tsx` — screenshot `<img>` + `<Hotspot>` overlays + step title/desc + text-only `<dl>` fallback via `accessibleMode` prop. **Files:** `src/components/molecules/TutorialSession.tsx` (new). **Depends:** T-001, T-003. **Vfy:** screenshot renders; hotspots overlay correctly. **~90L.**
- [ ] T-006 Create `SessionList.tsx` — filtered sidebar with title, description, progress (N/M from localStorage), active highlight. **Files:** `src/components/molecules/SessionList.tsx` (new). **Depends:** T-001. **Vfy:** click fires `onSelect`; active session highlighted. **~60L.**
- [ ] T-007 Add barrel exports for Hotspot, TutorialSession, StepNavigator, SessionList. **Files:** `src/components/molecules/index.ts` (modify). **Depends:** T-003–T-006. **Vfy:** build passes. **~4L.**

## Phase 3: Integration

- [ ] T-008 Create `ManualPage` — state: `activeSessionId`, `stepIndex`, `completedSteps` (localStorage), `accessibleMode`. Filters by `useAuth().user.rol`. Arrow-key step nav. Mobile banner. Register `/manual` route in `App.tsx` (`ProtectedRoute` all roles). Add `BookOpen` navItem in `Layout.tsx`. **Files:** `src/app/manual/page.tsx` (new), `src/App.tsx` (modify), `src/components/organisms/Layout.tsx` (modify). **Depends:** T-002, T-004, T-005, T-006, T-007. **Vfy:** full nav flow; role filtering correct. **~150L.**

## Phase 4: Animations

- [ ] T-009 Add `hotspot-pop` and `step-enter` keyframes + animation utilities to `tailwind.config.js`. **Files:** `tailwind.config.js` (modify). **Depends:** T-003, T-005, T-008. **Vfy:** `npm run build`; hotspots stagger-animate at runtime. **~14L.**

## Phase 5: Screenshots

- [ ] T-010 Create `scripts/capture_manual_screenshots.py` — Playwright login as admin, navigate 7 routes, capture 1440×900 PNGs. **Files:** `scripts/capture_manual_screenshots.py` (new). **Depends:** none. **Vfy:** script runs without error; PNGs exist in `public/screenshots/`. **~35L.**
- [ ] T-011 Capture 7 screenshots: `dashboard.png`, `expedientes.png`, `expediente-detalle.png`, `consulta-nueva.png`, `recepcion.png`, `catalogo.png`, `historial-ventas.png`. **Files:** `public/screenshots/*.png` (new). **Depends:** T-010. **Vfy:** each 1440×900; paths match manual-content.ts references. **0L (binary).**

## Phase 6: Polish

- [ ] T-012 Text-only accessible view toggle (semantic `<dl>`), mobile "Desktop recommended" banner, keyboard Tab through hotspot list. **Files:** `src/components/molecules/TutorialSession.tsx` (modify), `src/app/manual/page.tsx` (modify). **Depends:** T-005, T-008. **Vfy:** toggle switches view; Tab navigates hotspots; mobile shows text-only + banner. **~40L.**
