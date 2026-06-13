# Exploration: Customizable Clinic Color Palettes

**Status**: success — full codebase audit completed  
**Date**: 2026-06-13  
**Change**: clinic-theming  
**Artifact store**: both (Engram + OpenSpec)

---

## Executive Summary

El sistema usa shadcn/ui new-york con CSS variables HSL para _tokens de UI_, pero los colores de marca están **hardcodeados** en 100+ ubicaciones como `text-purpura-500`, `bg-purpura-600`, `border-amber-200`, etc. La tabla `veterinarias` no tiene columna de tema. No hay dark mode implementado (solo infraestructura `darkMode: "class"` en Tailwind). La migración a paletas por clínica requiere: (1) tokenizar todos los colores en variables CSS semánticas, (2) añadir columna `tema` JSONB en `veterinarias`, (3) crear un ThemeProvider que inyecte CSS vars desde la DB, y (4) definir 10 paletas preestablecidas con modos claro/oscuro.

---

## Current State — Cómo funciona el theming hoy

### 1. Configuración base (shadcn/ui new-york)

**`components.json`**:
```json
{
  "style": "new-york",
  "tailwind": {
    "config": "postcss.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  }
}
```

### 2. Variables CSS — `src/index.css`

Todas las variables están en `:root` (solo modo claro). Usan formato **HSL sin comas** (compatible con Tailwind):

```css
:root {
  --primary: 270 75% 42%;       /* Púrpura */
  --primary-foreground: 0 0% 100%;
  --secondary: 45 100% 52%;     /* Ámbar dorado */
  --secondary-foreground: 270 20% 15%;
  --muted: 270 20% 95%;
  --accent: 45 100% 52%;
  --background: 270 25% 98%;
  /* ... sidebar, card, popover, border, input, ring, radius ... */

  /* Colores de marca personalizados */
  --amber-gold: 45 100% 52%;
  --blaze-orange: 19 97% 50%;
  --neon-pink: 336 100% 50%;
  --blue-violet: 262 82% 58%;
  --azure-blue: 217 100% 61%;
  --sky-light: 195 71% 77%;
}
```

**NO existe bloque `.dark`** — el dark mode no está implementado.

### 3. Tailwind Config — `tailwind.config.js`

```js
darkMode: ["class"],  // ← infraestructura lista, tokens ausentes
theme: {
  extend: {
    colors: {
      primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
      secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
      // destructive, muted, accent, popover, card, sidebar...
      'amber-gold': '#ffbe0b',
      'blaze-orange': '#fb5607',
      'neon-pink': '#ff006e',
      'blue-violet': '#8338ec',
      'azure-blue': '#3a86ff',
      'sky-light': '#87CEEB',
      'purpura': { 50: '#faf5ff', 100: '#f3e8ff', ..., 900: '#581c87' },
    }
  }
}
```

**Problema**: Los 6 colores de marca están como **hex hardcodeados en Tailwind config** (no variables CSS), y `purpura` es una escala fija de 50-900.

### 4. Uso de colores en componentes — MASSIVAMENTE hardcodeado

Auditoría con grep encontró **~150+ ocurrencias** de clases de color directas:

| Clase | Ocurrencias | Significado semántico |
|-------|-------------|----------------------|
| `text-purpura-500` / `text-purpura-600` | 40+ | Color primario en iconos, títulos, links |
| `bg-purpura-500` / `bg-purpura-600` | 30+ | Botones primarios, badges activos, sidebar active |
| `from-purpura-500 to-purpura-600` | 10+ | Gradientes en botones, sidebar nav |
| `bg-purpura-100` / `bg-purpura-50` | 15+ | Fondos suaves, cards, hover states |
| `border-purpura-200` / `border-purpura-300` | 10+ | Bordes de campos, cards |
| `text-amber-*` / `bg-amber-*` | 20+ | Warnings, admin role badges, alertas |
| `bg-neon-pink` | 3 | Badges de notificación |
| `text-blue-violet` | 3 | Nombre de clínica en sidebar |
| `text-azure-blue` | 1 | Sonner info icon |

**Archivos más afectados**:
- `src/components/organisms/Layout.tsx` — sidebar, nav, avatar
- `src/components/molecules/PageHeader.tsx` — icono de título
- `src/components/molecules/AuthBackground.tsx` — blobs decorativos
- `src/components/molecules/SearchBar.tsx` — filtros activos
- `src/app/dashboard/page.tsx` — stats cards, calendario, botones
- `src/app/consulta/nueva/page.tsx` — formulario completo
- `src/app/recepcion/page.tsx` — monitor cards
- `src/app/expedientes/page.tsx` — listas, badges
- `src/app/configuracion/page.tsx` — formularios
- `src/app/admin/catalogo/page.tsx` — tabs de categoría
- `src/components/atoms/ui/sonner.tsx` — toasts
- `src/components/organisms/PatientInfoCard.tsx` — sidebar paciente
- `src/components/organisms/MonitorCard.tsx` — estados
- `src/components/organisms/DetailRecepcionDialog.tsx` — totales, warnings
- `src/components/organisms/VerConsultaDialog.tsx` — totales
- `src/components/organisms/ConfirmSalidaDialog.tsx` — icono check

### 5. Multi-tenancy — Cómo se asocia clínica y usuario

**Tablas** (`supabase_schema.sql`):
```sql
CREATE TABLE veterinarias (
    id UUID PRIMARY KEY,
    nombre VARCHAR(100),
    direccion TEXT, telefono VARCHAR(20), email VARCHAR(100),
    logo_url TEXT,
    estado VARCHAR(20) CHECK (activo, suspendido),
    -- NO hay columna de tema/color
);

CREATE TABLE perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    veterinaria_id UUID REFERENCES veterinarias(id),
    nombre, email, rol, avatar, ...
);
```

**AuthContext** (`src/context/AuthContext.tsx`):
- Expone `veterinaria: Veterinaria | null` desde `useAuth()`
- Se carga al iniciar sesión vía `loadVeterinaria(user.veterinariaId)`
- `refreshVeterinaria()` actualiza los datos

**VeterinariaController** (`src/controllers/veterinaria.controller.ts`):
- `getById(id)` — obtiene una veterinaria
- `actualizar(id, partial)` — actualiza campos (nombre, direccion, telefono, email, logoUrl, estado)
- `subirLogo(id, file)` — upload a Supabase Storage
- **No maneja campo `tema`** — habría que agregarlo al mapper y al método `actualizar()`

**Data isolation**: Todas las queries en controllers filtran por `veterinaria_id`:
```typescript
// auth.controller.ts
query = query.eq('veterinaria_id', currentUser?.veterinariaId)
```

### 6. Settings/Config page — `/configuracion`

**Archivo**: `src/app/configuracion/page.tsx`

Actualmente configura:
- Logo upload (imagen)
- Nombre, email, teléfono, dirección
- Configuración SMTP (Gmail app password)

**No tiene**:
- Selector de tema/color
- Preview de paleta
- Toggle dark/light mode

### 7. Light/Dark mode

**Lo que existe**:
- `tailwind.config.js`: `darkMode: ["class"]` — class-based switching
- Componentes shadcn/ui: incluyen variantes `dark:` en sus estilos (e.g., `dark:bg-input/30`, `dark:hover:bg-accent/50`)
- `src/components/atoms/ui/chart.tsx`: exporta `THEMES = { light: "", dark: ".dark" }`

**Lo que falta**:
- Bloque `.dark` en `src/index.css` con todas las variables CSS
- Toggle de dark mode en la UI
- Persistencia de preferencia (localStorage/cookie/DB)
- Sonner: hardcodeado a `theme="light"`

### 8. Database schema — sin columna de tema

La tabla `veterinarias` actual:
```sql
CREATE TABLE veterinarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    logo_url TEXT,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Gaps — Lo que falta para per-clinic theming

| # | Gap | Impacto | Bloquea |
|---|-----|---------|---------|
| 1 | **100+ hardcodeos de color** en JSX | ALTO | Cualquier approach |
| 2 | **Sin columna de tema en DB** | ALTO | Persistencia |
| 3 | **Sin ThemeProvider/Context** | ALTO | Runtime injection |
| 4 | **Sin dark mode implementado** | MEDIO | Feature completa |
| 5 | **Sin presets de paleta** | MEDIO | UX de selección |
| 6 | **Sonner hardcodeado** | BAJO | Consistencia visual |
| 7 | **Sin sección UI en Config page** | BAJO | Admin UX |
| 8 | **VeterinariaController ignora tema** | MEDIO | Guardado |

---

## Approaches

### Approach A: CSS Custom Properties + ThemeProvider ✅ RECOMMENDED

**Estrategia**: Reemplazar TODOS los colores hardcodeados con variables CSS semánticas. Un `ThemeProvider` React lee el tema desde la DB y setea las variables en `<html>`.

**Arquitectura**:
```
┌─────────────────────────────────────────────┐
│  Database: veterinarias.tema (JSONB)         │
│  { "paletteId": "ocean", "mode": "light" }   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  ThemeProvider                               │
│  - Lee veterinaria.tema al cargar            │
│  - Setea CSS vars en document.documentElement│
│  - Expone: paletteId, mode, setPalette,      │
│    toggleDarkMode                            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  CSS Custom Properties en <html>             │
│  style="--brand: 200 80% 50%;                │
│         --brand-foreground: 0 0% 100%; ..."  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Tailwind + Componentes                      │
│  className="bg-brand text-brand-foreground"  │
│  (nunca más bg-purpura-500)                  │
└─────────────────────────────────────────────┘
```

**Plan de implementación**:
1. **DB**: `ALTER TABLE veterinarias ADD COLUMN tema JSONB DEFAULT '{"paletteId":"purpura","mode":"light"}'`
2. **Presets**: Definir 10 paletas como objetos TypeScript con estructura `{ id, name, light: { brand, brandForeground, accent, ... }, dark: { ... } }`
3. **CSS**: Agregar bloque `.dark` en `index.css`, definir variables de marca (`--brand`, `--brand-foreground`, `--brand-muted`, `--brand-border`, `--accent-warning`, `--accent-info`, `--accent-success`)
4. **Tailwind**: Extender `colors` con `brand`, `brand-foreground`, `brand-muted`, `brand-border`, etc. mapeados a CSS vars
5. **ThemeProvider**: Nuevo `src/context/ThemeContext.tsx`:
   - Lee `veterinaria.tema` del AuthContext
   - Aplica CSS vars en `useEffect`
   - Expone `setPalette(id)` y `toggleDarkMode()`
6. **Migración de clases**: Reemplazar sistemáticamente:
   - `text-purpura-500` → `text-brand`
   - `bg-purpura-500/600` → `bg-brand`
   - `from-purpura-500 to-purpura-600` → `from-brand to-brand-accent` (gradiente custom)
   - `bg-purpura-100/50` → `bg-brand-muted`
   - `border-purpura-200` → `border-brand-border`
   - `text-amber-600` → `text-warning`
   - `bg-amber-50` → `bg-warning-muted`
   - `bg-neon-pink` → `bg-notification`
   - `text-blue-violet` → `text-brand-strong`
7. **Config page**: Agregar sección "Apariencia" con:
   - Grid de 10 preset cards con preview visual
   - Indicador de selección activa
   - Toggle dark/light mode
   - Botón guardar (llama a `vetCtrl.actualizar(id, { tema })`)
8. **Sonner**: Usar CSS vars del tema en lugar de colores hardcodeados
9. **VeterinariaController**: Agregar `tema` al mapper y a `actualizar()`

**Pros**: Nativo CSS (sin re-renders), performante, compatible con Tailwind, dark mode incluido, escalable a temas custom, 10 presets fáciles de definir, migración gradual posible (por archivo)
**Cons**: Mayor refactor inicial (~150 archivos), requiere disciplina de equipo, riesgo de regresión visual
**Complexity**: Medium-High  
**Estimated LOC**: ~1200-1500
- 800: migración de clases hardcodeadas (~150 archivos, ~5 cambios por archivo avg)
- 200: ThemeContext + ThemeProvider + hooks
- 200: Config page UI (selector de paletas, preview, toggle)
- 150: Definición de 10 presets (objetos TS con light/dark)
- 100: Tailwind config + CSS vars + actualización index.css
- 50: VeterinariaController + tipo Veterinaria actualizado

---

### Approach B: CSS Variable Injection sin Nuevas Clases Tailwind

**Estrategia**: Reutilizar SOLO las variables shadcn/ui existentes (`--primary`, `--secondary`, `--accent`) y cambiar sus valores en runtime. Los colores de marca se derivan de estas mismas variables.

**Arquitectura**: ThemeProvider setea `--primary`, `--secondary`, `--accent`, `--muted` con los valores del preset. No se crean nuevas clases Tailwind.

**Ventaja principal**: Menos refactor — solo hay que cambiar los valores de 6-8 variables CSS.
**Desventaja principal**: Pérdida de distinción semántica. Warnings y brand color usan las mismas variables, lo que limita la expresividad visual. No hay separación entre "color primario de UI" y "color de marca".

**Pros**: Simpler, compatible con shadcn idioms, ~30% menos código que Approach A
**Cons**: Pérdida de granularidad (warnings, brand, accent comparten tokens), diseños menos distintivos por clínica
**Complexity**: Medium  
**Estimated LOC**: ~800-1000

---

### Approach C: Tailwind Plugin + Build-time Themes (NO RECOMMENDED)

**Estrategia**: Cada tema es una variante de Tailwind (`theme-ocean:`, `theme-forest:`). El HTML tiene clase `theme-{id}` y Tailwind genera todas las combinaciones en build time.

**Pros**: Type-safe, sin JS runtime, Tailwind-idiomático
**Cons**: CSS crece 10x (~50KB+ por tema), no escala a custom themes, dark mode duplica, requiere rebuild para nuevos temas, el HTML generado es enorme
**Complexity**: Medium  
**Estimated LOC**: ~600-800

---

## Recommendation: Approach A

**CSS Custom Properties + ThemeProvider** es el camino correcto porque:
1. **Escala**: Funciona con 10 presets hoy y temas custom ilimitados mañana
2. **Dark mode**: Viene incluido naturalmente (cada preset tiene `light` y `dark`)
3. **Performance**: CSS nativo, cero re-renders de React
4. **Mantenibilidad**: Una vez tokenizado, agregar un preset es solo un objeto JS
5. **Ecosistema**: Compatible con shadcn/ui, Tailwind, y cualquier librería CSS

La inversión en refactor (~800 LOC de migración de clases) es un one-time cost que elimina deuda técnica de color para siempre.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Regresión visual** por migración masiva de clases | HIGH | Migrar por fases (core tokens → atoms → molecules → pages), PR review visual, screenshots antes/después |
| **Tailwind purge** de clases dinámicas | MEDIUM | Safelist en tailwind.config.js para clases `bg-brand-*`, `text-brand-*`, o usar `style` attribute en ThemeProvider |
| **DB query extra** en cada carga | LOW | El `veterinaria` object ya se carga en AuthContext; el `tema` viene incluido sin query adicional |
| **Schema migration** en producción | LOW | Columna nullable con default (fallback a preset "purpura"), zero-downtime |
| **Sonner rompe** visualmente | LOW | Reemplazar colores hardcodeados con CSS vars del tema |
| **Falta de `tema` en VeterinariaController.actualizar()** | MEDIUM | Agregar al mapper y al método; el payload actual solo mapea campos conocidos |
| **Equipo reintroduce hardcodeos** | MEDIUM | ESLint rule custom que prohíba `purpura-`, `amber-`, etc. en className; documentar en AGENTS.md |

---

## Next Recommended Phase

**`sdd-propose`** — el camino está claro. La propuesta debe cubrir:

1. **Schema migration**: `ALTER TABLE veterinarias ADD COLUMN tema JSONB`
2. **10 preset palettes**: Definición completa con nombres, colores HSL, y variantes light/dark
3. **ThemeProvider architecture**: Context, hooks, flujo de datos
4. **CSS token model**: Lista exhaustiva de variables semánticas y su mapeo Tailwind
5. **Migration strategy**: Orden de archivos a migrar, criterios de aceptación
6. **Config page UX**: Wireframe del selector de paletas con preview
7. **Dark mode toggle**: Dónde ubicarlo, cómo persiste
8. **Rollback plan**: Cómo revertir si algo sale mal

---

## Skill Resolution

**paths-injected** — 2 skills loaded via orchestrator injection:
- `ui-ux-pro-max`: Used for theming best practices (CSS variable patterns, dark mode guidelines §6, color token semantics, accessible contrast pairs §1)
- `frontend-design`: Used for design aesthetics direction on preset palette creation and config page visual design
