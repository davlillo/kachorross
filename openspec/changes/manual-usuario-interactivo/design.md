# Design: Manual de Usuario Interactivo

## Technical Approach

CSS-only animations + static 1440×900 screenshots, zero new dependencies. Hotspots are positioned `<button>` overlays triggering existing Radix `Popover`. Content is a declarative `ManualSession[]` array, filtered at runtime by `useAuth().user.rol`. Completion state persists in `localStorage`.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| Animation engine | CSS `@keyframes` + `tailwindcss-animate` | anime.js (~17KB gzipped) | CSS runs on GPU compositor; anime.js imperative API fights React declarative model. Project already uses Tailwind transitions throughout. |
| Screenshots | Static PNG in `public/screenshots/` | Runtime Playwright capture | No build/runtime dependency. Version alongside code. Simpler CI. |
| Hotspot interaction | Radix `Popover` (click-to-open) | Radix `Tooltip` (hover-only) | Manual annotations are rich (title + paragraph), not one-liners. Popover stays open until dismissed — better for reading tutorials. |
| Content model | Single `src/data/manual-content.ts` | Per-page config files | MVP is 7 sessions. Single file is easier to scan, import, and type-check. Split later if >20 sessions. |
| Completion storage | `localStorage` keyed `manual-completed-{sessionId}` | Context + useState only | Survives page reloads (spec requirement). No backend needed. |

## Data Flow

```
manual-content.ts  →  ManualPage filters by user.rol
  ├─ SessionList  ←  sessions[] + completionMap (derived from localStorage)
  └─ TutorialSession  ←  active session + currentStepIndex (useState)
       ├─ <img src={step.screenshot}>  ←  public/screenshots/
       ├─ Hotspot[]  ←  step.hotspots, each wraps <Popover>
       └─ StepNavigator  ←  stepIndex, totalSteps, onPrev/onNext
```

State lives in `ManualPage` (the only page component):
- `activeSessionId: string` — `useState`, initialized to first filtered session
- `currentStepIndex: number` — `useState(0)`, reset on session change
- `completedSteps: Record<string, string[]>` — derived from `localStorage` on mount via `useMemo`, written on step advance

No URL params. Session selection is local UI state — the manual is self-contained.

## Component Signatures

### `src/app/manual/page.tsx` (default export)

```tsx
export default function ManualPage() {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string>("");
  // Filters sessions, manages step index, reads/writes localStorage
}
```

### `src/components/molecules/SessionList.tsx`

```tsx
interface SessionListProps {
  sessions: ManualSession[];
  activeId: string;
  completedMap: Record<string, string[]>;  // sessionId → completed step IDs
  onSelect: (id: string) => void;
}
export function SessionList({ sessions, activeId, completedMap, onSelect }: SessionListProps)
```

### `src/components/molecules/TutorialSession.tsx`

```tsx
interface TutorialSessionProps {
  session: ManualSession;
  stepIndex: number;
  accessibleMode: boolean;  // toggles screenshot vs text list
}
export function TutorialSession({ session, stepIndex, accessibleMode }: TutorialSessionProps)
```

### `src/components/molecules/Hotspot.tsx`

```tsx
interface HotspotProps {
  hotspot: HotspotDef;
  index: number;  // for staggered animation-delay
}
export function Hotspot({ hotspot, index }: HotspotProps) {
  // Renders positioned <Popover> trigger button
}
```

### `src/components/molecules/StepNavigator.tsx`

```tsx
interface StepNavigatorProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  isComplete: boolean;
}
export function StepNavigator({ current, total, onPrev, onNext, isComplete }: StepNavigatorProps)
```

## Types (`src/types/index.ts` additions)

```typescript
export interface HotspotDef {
  id: string;
  x: number;           // percentage 0–100 from left of screenshot
  y: number;           // percentage 0–100 from top
  width: number;       // percentage, hit area width
  height: number;      // percentage, hit area height
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  screenshot: string;  // path relative to /screenshots/, e.g. "dashboard.png"
  hotspots: HotspotDef[];
}

export interface ManualSession {
  id: string;
  title: string;
  description: string;
  icon: string;        // lucide-react icon name as string (rendered via dynamic import map)
  route: string;       // app route this session covers
  roles: ('doctora' | 'recepcion' | 'admin')[];
  steps: TutorialStep[];
}
```

## Route Registration (`src/App.tsx`)

Insert before the `path="*"` catch-all (line 287):

```tsx
import ManualPage from '@/app/manual/page';

// ... inside <Routes>:
<Route path="/manual" element={
  <ProtectedRoute allowedRoles={['doctora', 'recepcion', 'admin', 'super_admin']}>
    <Layout><ManualPage /></Layout>
  </ProtectedRoute>
} />
```

## Menu Integration (`src/components/organisms/Layout.tsx`)

Add to `navItems` array (line 45), and add `BookOpen` to the lucide-react import on line 16:

```typescript
// Import addition (line 16 area):
import { ..., BookOpen } from 'lucide-react';

// navItems addition:
{
  label: 'Manual de Usuario',
  href: '/manual',
  icon: BookOpen,
  roles: ['doctora', 'recepcion', 'admin'],
},
```

## Animation System

### `tailwind.config.js` — new keyframes

```javascript
keyframes: {
  // ... existing ...
  "hotspot-pop": {
    "0%":   { transform: "scale(0)", opacity: "0" },
    "60%":  { transform: "scale(1.3)" },
    "100%": { transform: "scale(1)", opacity: "1" },
  },
  "step-enter": {
    "0%":   { opacity: "0", transform: "translateY(8px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
},
animation: {
  // ... existing ...
  "hotspot-pop": "hotspot-pop 0.4s ease-out both",
  "step-enter":  "step-enter 0.3s ease-out",
},
```

### Hotspot staggered reveal (inline style on Hotspot component)

```tsx
style={{
  left: `${hotspot.x}%`,
  top: `${hotspot.y}%`,
  animationDelay: `${index * 120}ms`,
}}
className="absolute animate-hotspot-pop ..."
```

Step content swap uses `animate-step-enter` on the container `<div key={step.id}>` so React re-mount triggers the animation.

## Screenshot Capture Pipeline

One-time manual capture using the `webapp-testing` skill. Script structure:

```python
# scripts/capture_manual_screenshots.py
from playwright.sync_api import sync_playwright

SCREENSHOTS = [
    ("/dashboard",      "dashboard.png"),
    ("/expedientes",    "expedientes.png"),
    ("/recepcion",      "recepcion.png"),
    ("/consulta/nueva", "consulta-nueva.png"),
    ("/admin/catalogo", "catalogo.png"),
    ("/historial-ventas","historial-ventas.png"),
    ("/expedientes/1",  "expediente-detalle.png"),
]

VIEWPORT = {"width": 1440, "height": 900}

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport=VIEWPORT)
        # Login with test credentials
        page.goto("http://localhost:5173/login")
        page.fill('input[type="email"]', "admin@kachorros.com")
        page.fill('input[type="password"]', "123456")
        page.click('button[type="submit"]')
        page.wait_for_url("**/dashboard")
        
        for route, filename in SCREENSHOTS:
            page.goto(f"http://localhost:5173{route}")
            page.wait_for_load_state("networkidle")
            page.screenshot(path=f"public/screenshots/{filename}", full_page=False)
        
        browser.close()
```

Run via: `python scripts/with_server.py --server "npm run dev" --port 5173 -- python scripts/capture_manual_screenshots.py`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/manual/page.tsx` | Create | Outer shell: sidebar + content area, state management, localStorage |
| `src/components/molecules/SessionList.tsx` | Create | Sidebar listing filtered sessions with completion badges |
| `src/components/molecules/TutorialSession.tsx` | Create | Screenshot viewer + hotspot overlays + text-only view |
| `src/components/molecules/Hotspot.tsx` | Create | Positioned Popover trigger with staggered animation |
| `src/components/molecules/StepNavigator.tsx` | Create | Prev/Next buttons + "N / M" progress indicator |
| `src/components/molecules/index.ts` | Modify | Add 4 new barrel exports |
| `src/data/manual-content.ts` | Create | 7 sessions × ~6 steps × ~2 hotspots declarative content |
| `src/types/index.ts` | Modify | Add HotspotDef, TutorialStep, ManualSession interfaces |
| `src/App.tsx` | Modify | Add `/manual` route + import |
| `src/components/organisms/Layout.tsx` | Modify | Add `BookOpen` import + navItems entry |
| `tailwind.config.js` | Modify | Add `hotspot-pop` and `step-enter` keyframes + animations |
| `public/screenshots/*.png` | Create | 7 static screenshots (1440×900) |
| `scripts/capture_manual_screenshots.py` | Create | Playwright capture script (one-time, not runtime dep) |

## Accessibility

- **Keyboard**: Hotspot buttons are in DOM tab order. Left/Right arrow keys advance steps (via `useEffect` keydown listener in ManualPage). `Escape` closes Popover (Radix default).
- **Screen reader**: Hotspot buttons have `aria-label={hotspot.title}`. Popover content uses `role="dialog"` (Radix default).
- **Text-only view**: Toggle in session header switches `<TutorialSession>` from screenshot+hotspots to a semantic `<dl>` list. Toggle state stored in `useState` (not persisted).
- **Mobile**: `max-lg` banner: "Para mejor experiencia, usa una pantalla de escritorio" with a link to the text-only view. Screenshots hidden, text view shown by default.

## Migration / Rollout

No migration required. New static route, no data changes.
