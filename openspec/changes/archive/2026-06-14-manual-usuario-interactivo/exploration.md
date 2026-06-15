# Exploration: Manual de Usuario Interactivo

**Date**: 2026-06-14
**Project**: kachorross
**Change**: manual-usuario-interactivo

---

## Current State

### Sidebar Navigation (`src/components/organisms/Layout.tsx`)
- `navItems: NavItem[]` array (lines 45-82) with 6 entries: Dashboard, Expedientes, Nueva Consulta, Recepción, Catálogo, Usuarios
- Each item has: `label`, `href`, `icon` (lucide-react), `roles` array, optional `badge`
- Filtered at runtime by `user.rol` (line 95-97)
- Both desktop sidebar (lg breakpoint) and mobile menu render from same `filteredNavItems`
- Uses `location.pathname` for active state detection — `startsWith` prefix matching for nested routes

### Routing (`src/App.tsx`)
- 15 protected routes, each wrapped in `<Layout>` + `<ProtectedRoute allowedRoles={[...]}>`
- Pattern: `<Route path="/..." element={<ProtectedRoute allowedRoles={[...]}><Layout><PageComponent /></Layout></ProtectedRoute>} />`
- Routes without Layout: `/login`, `/establecer-contrasena` (public)

### 15 App Pages (in `src/app/`)
| Page | Route | Roles | Component Path |
|------|-------|-------|----------------|
| Login | `/login` | public | `app/login/page.tsx` |
| Dashboard | `/dashboard` | doctora, admin | `app/dashboard/page.tsx` (794 lines — most complex) |
| Expedientes (list) | `/expedientes` | doctora, admin | `app/expedientes/page.tsx` |
| Nuevo Expediente | `/expedientes/nuevo` | doctora, admin | `app/expedientes/nuevo/page.tsx` |
| Expediente Detail | `/expedientes/:id` | doctora, admin | `app/expedientes/[id]/page.tsx` |
| Nueva Consulta | `/consulta/nueva` | doctora, admin | `app/consulta/nueva/page.tsx` |
| Recepción | `/recepcion` | recepcion, admin | `app/recepcion/page.tsx` |
| Catálogo | `/admin/catalogo` | doctora, admin | `app/admin/catalogo/page.tsx` |
| Historial Ventas | `/historial-ventas` | all roles except super_admin | `app/historial-ventas/page.tsx` |
| Configuración | `/configuracion` | admin | `app/configuracion/page.tsx` |
| Usuarios (Seguridad) | `/admin/seguridad/usuarios` | admin | `app/admin/seguridad/usuarios/page.tsx` |
| Establecer Contraseña | `/establecer-contrasena` | public | `app/establecer-contrasena/page.tsx` |
| Super Admin | `/super-admin` | super_admin | `app/super-admin/page.tsx` |
| Perfil | `/perfil` | all roles except super_admin | `app/perfil/page.tsx` |

### Existing Animation Capabilities
- `tailwindcss-animate` (v1.0.7) + `tw-animate-css` (v1.4.0) in devDependencies
- `tailwind.config.js` has custom `keyframes` (accordion-down, accordion-up, caret-blink) and `animation` utilities
- `animate-spin` used on loader (`Loader2` in App.tsx:57)
- Transition classes used throughout: `transition-all duration-200` on sidebar links, `transition-colors` on buttons
- **No anime.js** installed — would need `npm install animejs @types/animejs`

### Available shadcn/ui Components (relevant to manual)
- **Tooltip** — Radix-based, supports hover/click, delayDuration, customizable (ideal for hotspots)
- **Dialog** — Modal overlays (could host tutorial walkthroughs)
- **Tabs** — Content switching (session navigation)
- **Accordion** — Expandable sections (FAQ-style or session breakdown)
- **ScrollArea** — Scrollable containers with custom scrollbar
- **Card** — Container with header/content/footer
- **Badge** — Status indicators
- **Popover** — Floating content (alternative to Tooltip for richer hotspots)

### Screenshot Capability
- **webapp-testing skill** (`~/.opencode/skills/webapp-testing/`) provides Playwright via Python scripts
- Uses `with_server.py` to manage Vite dev server lifecycle
- Playwright can capture full-page screenshots: `page.screenshot(path='...', full_page=True)`
- Requires the dev server running (`npm run dev` on port 5173)
- **No Playwright in project devDependencies** — screenshots are a one-time capture, not a runtime dependency

### Component Architecture (Atomic Design)
- `atoms/ui/` — 54 shadcn/ui components (barrel exported)
- `atoms/custom/` — Project-specific atoms (EspecieBadge, StatusBadge)
- `molecules/` — Compound components (PageHeader, StatsCard, SearchBar, EmptyState, etc.)
- `organisms/` — Complex sections (Layout, PatientInfoCard, MonitorCard, etc.)
- Pattern: pages import hooks + molecules/organisms, never raw data

---

## Affected Areas

| File | Change | Impact |
|------|--------|--------|
| `src/components/organisms/Layout.tsx` | Add "Manual de Usuario" to `navItems` array; choose icon from lucide-react (e.g., `BookOpen`, `HelpCircle`, `GraduationCap`) | Low — one new entry, no logic change |
| `src/App.tsx` | Add `<Route path="/manual">` wrapping a new `ManualPage` inside `<ProtectedRoute>` and `<Layout>` | Low — one new route, consistent pattern |
| `src/app/manual/page.tsx` (NEW) | Main manual page component — session sidebar, screenshot viewer, step navigation | **High** — this is the core deliverable |
| `src/components/molecules/` (NEW) | New molecules: `TutorialStep`, `ScreenshotHotspot`, `SessionProgress` | Medium — reusable components |
| `src/types/index.ts` | New types: `ManualSession`, `TutorialStep`, `Hotspot` | Low — interfaces only |
| `public/screenshots/` (NEW) | 15+ static PNG screenshots for each page | Low — static assets, one-time capture |
| `src/data/manual-content.ts` (NEW) | Tutorial content definitions (sessions, steps, hotspot positions, descriptions) | Medium — content authoring, must stay maintainable |
| `package.json` | Add `animejs` + `@types/animejs` if choosing Approach B (anime.js) | Negligible |
| `tailwind.config.js` | Add custom animation keyframes if CSS-only approach chosen | Negligible |

---

## Approaches

### Approach A: CSS-Only Animations + Static Screenshots (RECOMMENDED)

Use existing `tailwindcss-animate` + custom Tailwind keyframes for transitions. Screenshots captured once via Playwright, bundled as static PNGs in `public/screenshots/`. Hotspots use existing Radix `Tooltip`/`Popover` components.

**Architecture**:
```
src/app/manual/page.tsx          ← Outer shell: session sidebar + content area
src/components/molecules/
  ├── TutorialSession.tsx        ← Renders one tutorial (screenshot + hotspots)
  ├── Hotspot.tsx                ← Positioned overlay triggering Tooltip/Popover
  ├── StepNavigator.tsx          ← Prev/Next + progress dots
  └── SessionList.tsx            ← Sidebar with session titles + completion state
src/data/manual-content.ts       ← All session/step/hotspot definitions
public/screenshots/*.png         ← Static captures
```

**Animations**: CSS `@keyframes` for:
- Page entry: fade + slide-up (reuse existing transition patterns)
- Hotspot reveal: scale + opacity on `in-view` (tailwind `group-hover`/`peer-` patterns)
- Step transitions: `transition-all` on content swap
- Scroll-triggered: `IntersectionObserver` + class toggle (or native `animation-timeline: view()`)

**Pros**:
- Zero new dependencies — uses what's already installed
- Bundle stays small (anime.js is ~17KB gzipped)
- CSS animations are GPU-accelerated, performant on low-end devices
- Consistent with existing pattern (project already uses Tailwind transitions throughout)
- Hotspots reuse Radix Tooltip — already imported, accessible (keyboard, screen readers)
- Screenshots are static assets — no runtime Playwright dependency, no server needed
- Maintainable: adding a new tutorial = one new object in `manual-content.ts` + one screenshot

**Cons**:
- Complex sequenced animations (staggered reveals, multi-step timelines) are harder in CSS-only
- Cannot easily animate SVG paths or create elaborate motion designs
- Screenshots become stale if UI changes — need re-capture (mitigated: manual is versioned alongside code)
- Manual content.ts is a single large file — needs discipline to keep organized

**Effort**: Medium (15-20 hours)
- 2h: Types + data structure
- 3h: Screenshot capture (15 pages × ~10 min each with setup/auth/navigation)
- 4h: Core molecules (Hotspot, TutorialSession, StepNavigator, SessionList)
- 4h: ManualPage wrapper + routing + sidebar integration
- 3h: CSS animations (keyframes, transitions, scroll triggers)
- 3h: Content authoring (15 sessions, ~5-8 steps each, ~75-100 hotspots total)
- 1h: Polish + responsive testing

### Approach B: anime.js Animations + Dynamic Screenshots

Install anime.js for rich timeline-based animations. Screenshots captured dynamically at build time or on-demand.

**Pros**:
- anime.js excels at sequenced, staggered, timeline-based animations
- Can animate SVG overlays, numbered circles, connecting lines between hotspots
- Easier to create "wow-factor" reveals (staggered hotspot appearance, morphing highlights)
- Dynamic screenshots could auto-update on UI changes

**Cons**:
- New dependency: animejs (~17KB gzipped) + @types/animejs
- Mixing anime.js imperative API with React's declarative model requires careful `useRef` + `useEffect` management
- Dynamic screenshots require Playwright at build time or runtime — adds complexity and CI dependency
- Dynamic capture is fragile: needs auth state, seeded data, consistent viewport
- More code to maintain: anime.js timelines, cleanup on unmount, ref management
- Performance: JS-driven animations on main thread vs CSS GPU-accelerated
- Overkill for the actual need — hotspots + step navigation don't require complex motion design

**Effort**: High (25-35 hours)
- Additional 5-7h for anime.js integration + timeline programming
- Additional 3-5h for dynamic screenshot pipeline

---

## Detailed Architecture: Approach A (Recommended)

### Type Definitions (`src/types/index.ts` additions)

```typescript
interface HotspotDef {
  id: string;
  x: number;          // percentage (0-100) from left
  y: number;          // percentage (0-100) from top
  width: number;      // percentage
  height: number;     // percentage
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  screenshot: string;  // path relative to /screenshots/
  hotspots: HotspotDef[];
  voiceover?: string;  // future: text-to-speech script
}

interface ManualSession {
  id: string;
  title: string;
  description: string;
  icon: string;        // lucide-react icon name
  route: string;       // the actual app route this session covers
  roles: ('doctora' | 'recepcion' | 'admin' | 'super_admin')[];
  steps: TutorialStep[];
}
```

### Menu Integration

Add to `navItems` in `Layout.tsx`:
```typescript
{
  label: 'Manual de Usuario',
  href: '/manual',
  icon: BookOpen,       // or HelpCircle / GraduationCap
  roles: ['doctora', 'recepcion', 'admin'],  // all non-super_admin roles
},
```

The manual route will also be accessible to `super_admin` but from their panel's context. Since `super_admin` already has its own dedicated Layout path structure, and the Layout.tsx navItems are filtered by role, super_admin can still access `/manual` directly if the route allows it.

### Route Registration (`App.tsx`)

```typescript
// Import
import ManualPage from '@/app/manual/page';

// Route (placed before catch-all)
<Route path="/manual" element={
  <ProtectedRoute allowedRoles={['doctora', 'recepcion', 'admin', 'super_admin']}>
    <Layout><ManualPage /></Layout>
  </ProtectedRoute>
} />
```

### Core Component: Hotspot

Uses existing `Tooltip` + `Popover` from shadcn/ui:
```tsx
function Hotspot({ hotspot, isActive, onActivate }: HotspotProps) {
  return (
    <Popover open={isActive} onOpenChange={onActivate}>
      <PopoverTrigger asChild>
        <button
          className="absolute rounded-full w-6 h-6 bg-brand-primary/80 border-2 border-white 
                     shadow-glow animate-pulse hover:scale-125 transition-transform"
          style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
          aria-label={hotspot.title}
        />
      </PopoverTrigger>
      <PopoverContent side={hotspot.placement || 'top'} className="w-72">
        <h4 className="font-medium">{hotspot.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{hotspot.description}</p>
      </PopoverContent>
    </Popover>
  );
}
```

### Screenshot Strategy

- Capture via `webapp-testing` skill (Playwright Python script)
- One-time manual capture during development: `python scripts/with_server.py --server "npm run dev" --port 5173 -- python capture_screenshots.py`
- Store in `public/screenshots/` as `.png` (Git-tracked, versioned alongside code)
- Naming convention: `{route-slug}.png` (e.g., `dashboard.png`, `expedientes-list.png`, `consulta-nueva.png`)
- Viewport: 1440×900 (most common desktop) — one breakpoint is sufficient for a desktop-first manual
- Auth state: use a test user seed with known credentials
- Screenshots are part of the deliverable — they don't auto-update; manual.md docs should note the screenshot version

### Content Authoring (`src/data/manual-content.ts`)

Structure it by role-grouped sessions:
```typescript
export const manualSessions: ManualSession[] = [
  // ── Sesiones comunes (todos los roles) ──
  { id: 'intro', title: 'Bienvenida', ... steps: [intro steps] },
  { id: 'perfil', title: 'Tu Perfil', route: '/perfil', roles: ['doctora','recepcion','admin'], steps: [...] },
  
  // ── Doctora / Admin ──
  { id: 'dashboard', title: 'Dashboard', route: '/dashboard', roles: ['doctora','admin'], steps: [...] },
  { id: 'expedientes', title: 'Expedientes', route: '/expedientes', roles: ['doctora','admin'], steps: [...] },
  // ... etc
  
  // ── Recepción ──
  { id: 'recepcion', title: 'Recepción', route: '/recepcion', roles: ['recepcion','admin'], steps: [...] },
  
  // ── Solo Admin ──
  { id: 'configuracion', title: 'Configuración', route: '/configuracion', roles: ['admin'], steps: [...] },
];
```

The ManualPage filters sessions by `user.rol`, showing only relevant tutorials.

### Animation Strategy (CSS-only)

1. **Page entry**: ManualPage wrapper uses `animate-in fade-in slide-in-from-bottom-4 duration-500`
2. **Session sidebar hover**: `transition-all duration-200` (same pattern as existing navItems)
3. **Hotspot reveal**: Staggered CSS animation via `animation-delay`:
   ```css
   @keyframes hotspot-pop {
     0% { transform: scale(0); opacity: 0; }
     60% { transform: scale(1.2); }
     100% { transform: scale(1); opacity: 1; }
   }
   .hotspot { animation: hotspot-pop 0.4s ease-out both; }
   .hotspot:nth-child(1) { animation-delay: 0.1s; }
   .hotspot:nth-child(2) { animation-delay: 0.3s; }
   /* ... */
   ```
4. **Step transitions**: `transition-opacity duration-300` on step content swap
5. **Progress bar**: `transition-width duration-500 ease-out` on the progress indicator

---

## Recommendations

### Approach: CSS-Only Animations + Static Screenshots (Approach A)

**Why**:
1. **Zero new dependencies** — the project already has `tailwindcss-animate`, `tw-animate-css`, and extensive Radix UI components. anime.js adds 17KB of JS and an imperative API that fights React's declarative model.
2. **Consistent with existing codebase** — the entire app uses Tailwind transitions. Introducing a separate animation library creates a split-brain pattern.
3. **Hotspots via existing Tooltip/Popover** — Radix Tooltip already handles hover, focus, keyboard, and screen reader accessibility. No need to build from scratch.
4. **Maintainable content model** — `manual-content.ts` is a single source of truth. Adding a new tutorial = one object + one screenshot. The data structure is declarative, not imperative.
5. **Static screenshots are simpler** — dynamic capture requires Playwright at build/runtime, auth state management, and seed data consistency. For a manual that changes only when the UI changes significantly, static captures are sufficient and version-controlled.
6. **Performance** — CSS animations run on the compositor thread, not the main JS thread. anime.js animations block the main thread during JS execution.

### Session Organization

Organize tutorials by **role** first, then by **workflow**:
- Each role sees only their relevant sessions (via `roles` filter in `ManualSession`)
- Sessions follow the natural workflow order (Dashboard → Expedientes → Consulta, or Recepción → Catálogo)
- An intro/welcome session is shown to all roles

---

## Risks

1. **Screenshot staleness**: If UI changes, screenshots become outdated. Mitigation: include a version tag in `manual-content.ts` (`screenshotVersion: '2026-06-14'`) and document the re-capture process.
2. **Content authoring burden**: 15 sessions × ~6 steps × ~2 hotspots = ~180 pieces of content to write. Mitigation: batch the work; start with the 6 sidebar-linked pages for MVP, add remaining 9 in follow-up.
3. **Hotspot positioning fragility**: Percentage-based positioning on screenshots breaks if screenshots are re-captured at different viewport sizes. Mitigation: standardize viewport (1440×900), document it in screenshot capture script.
4. **Mobile responsiveness**: The manual is inherently a desktop experience (screenshots + hotspots). Mobile users get a degraded experience. Mitigation: show a "View on desktop recommended" banner on mobile; render a simplified text-only version.
5. **Accessibility**: Tooltip-only hotspots exclude keyboard-only and screen reader users. Mitigation: Radix Tooltip handles keyboard focus; provide a text-only "accessible view" toggle that renders all hotspot descriptions as a plain list.
6. **Bundle size**: 15 PNG screenshots at 1440×900 could be ~200-400KB each = 3-6MB total. Mitigation: compress with PNG quantization (`pngquant`), lazy-load screenshots per session, or use WebP format.

---

## Ready for Proposal

**Yes**. The architecture is clear, the existing patterns are well-understood, and the recommendation has a concrete path. The proposal should scope the MVP to the 7 most-used pages (Dashboard, Expedientes list+detail, Nueva Consulta, Recepción, Catálogo, Historial Ventas) to manage content authoring effort. The remaining 8 pages (login, perfil, config, usuarios, super-admin, registro, establecer-contrasena, nuevo-expediente) can be Phase 2.
