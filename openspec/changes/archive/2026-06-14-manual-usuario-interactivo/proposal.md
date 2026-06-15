# Proposal: Manual de Usuario Interactivo

## Intent

Add an interactive user manual accessible from the sidebar that teaches each app page through annotated screenshots with hover-activated hotspots, step-by-step navigation, and role-scoped tutorial sessions. Users need on-demand, in-app guidance without leaving the application.

## Scope

### In Scope (MVP — 7 pages)
- Dashboard, Expedientes (list+detail), Nueva Consulta, Recepción, Catálogo, Historial Ventas
- Intro/bienvenida session shown to all roles
- Role-filtered session sidebar (doctora sees doctora sessions, recepción sees recepción, admin sees all)
- Static PNG screenshots captured once via Playwright at 1440×900
- CSS-only animations: staggered hotspot reveal, step transitions, progress bar (zero new deps)
- Hotspots via existing Radix Popover/Tooltip (keyboard-accessible)
- Text-only accessible view toggle for screen readers
- New `/manual` route with ProtectedRoute (all roles including super_admin)

### Phase 2 (8 pages)
Login, Perfil, Configuración, Usuarios, Super Admin, Nuevo Expediente, Establecer Contraseña, Registro

### Out of Scope
- anime.js animation library
- Dynamic/runtime screenshot capture
- Mobile-optimized manual (desktop-only; mobile shows text-only fallback)
- Voiceover / text-to-speech

## Capabilities

### New Capabilities
- `manual-usuario`: Interactive tutorial system with screenshot viewer, hotspots, role-scoped sessions, and step navigation. Provides in-app guided tours for veterinary staff learning the platform.

### Modified Capabilities
None — no existing spec requirements change.

## Approach

**Technology: CSS-only animations + static screenshots.** Uses existing `tailwindcss-animate` and custom `@keyframes` for all motion (staggered hotspot-pop, fade-slide page entry, step transitions). Hotspots are positioned `<button>` overlays triggering Radix `Popover` for annotations. Screenshots captured once via Playwright, stored in `public/screenshots/`, versioned alongside code.

**Why not anime.js**: The same visual effects (staggered reveals, pulse, scale-on-hover) are achievable with CSS animation-delay + Tailwind utilities. CSS runs on the GPU compositor thread vs anime.js on the main JS thread, avoiding imperative `useRef`/`useEffect` management that fights React's declarative model. Zero new dependencies (anime.js adds ~17KB gzipped). If CSS later proves insufficient for complex sequenced effects, anime.js remains a Phase 2 enhancement.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/organisms/Layout.tsx` | Modified | Add "Manual" navItem with `BookOpen` icon |
| `src/App.tsx` | Modified | New `/manual` route with ProtectedRoute |
| `src/app/manual/page.tsx` | **New** | Outer shell: session sidebar + content area |
| `src/components/molecules/` | **New** | TutorialSession, Hotspot, StepNavigator, SessionList |
| `src/types/index.ts` | Modified | Add ManualSession, TutorialStep, HotspotDef interfaces |
| `src/data/manual-content.ts` | **New** | Declarative session/step/hotspot definitions |
| `public/screenshots/` | **New** | 7 static PNG captures (1440×900) |
| `tailwind.config.js` | Modified | Add custom hotspot-pop keyframes |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Screenshots stale after UI changes | Medium | Version tag in manual-content.ts; document re-capture script |
| Content authoring (est. 80 hotspots) | Medium | MVP scope limits to 7 pages; batch writing |
| Hotspot positioning fragile on re-capture | Low | Standardized viewport 1440×900; documented in capture script |
| Mobile users get degraded experience | Low | Show "Desktop recommended" banner + text-only fallback |

## Rollback Plan

1. Remove `<Route path="/manual">` from App.tsx
2. Remove `navItems` entry from Layout.tsx
3. Delete `src/app/manual/`, new molecules, `src/data/manual-content.ts`, `public/screenshots/`
4. Remove custom keyframes from tailwind.config.js
5. Types can remain (backward-compatible interfaces)

## Dependencies

- Existing: `tailwindcss-animate`, `tw-animate-css`, Radix Popover/Tooltip, lucide-react (BookOpen icon)
- One-time: webapp-testing skill (Playwright) for screenshot capture

## Success Criteria

- [ ] `/manual` renders session sidebar filtered by user role
- [ ] Each session shows screenshot with positioned hotspots that open Popover on click/hover
- [ ] Step navigator advances through tutorial steps with CSS transitions
- [ ] All 7 MVP pages have at least 5 annotated hotspots each
- [ ] Accessible text-only view renders all hotspot descriptions as plain list
- [ ] Manual menu item visible in sidebar for all configured roles
- [ ] Zero new npm dependencies
