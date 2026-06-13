# Delta for Clinic Theming

## ADDED Requirements

### Requirement: ThemeProvider Initialization
The system SHALL initialize a `ThemeProvider` wrapping the authenticated route tree, loading the clinic theme from `veterinarias.tema` via `useAuth()` context and falling back to Púrpura (preset ID `purpura`) when `tema` is null.

#### Scenario: Theme loads from clinic config
- **GIVEN** a user authenticated to clinic `v_abc` with `veterinarias.tema = { preset: "ocean", mode: "light" }`
- **WHEN** the app mounts
- **THEN** `ThemeProvider` injects Ocean palette tokens and renders in light mode

#### Scenario: Fallback to default when no tema set
- **GIVEN** a newly created clinic with `veterinarias.tema = NULL`
- **WHEN** the app mounts
- **THEN** `ThemeProvider` injects Púrpura palette tokens and renders in light mode

#### Scenario: Auth change clears theme cache
- **GIVEN** user A is logged in to clinic X with Ocean palette
- **WHEN** user A logs out and user B logs in to clinic Y with Midnight palette
- **THEN** `ThemeProvider` discards clinic X's tokens and injects clinic Y's tokens

---

### Requirement: CSS Variable Injection
The system SHALL set brand token CSS custom properties on `:root` (or `<html>` element style attribute) for `--color-primary`, `--color-secondary`, `--color-surface`, `--color-muted`, `--color-accent`, `--color-border` using HSL space values. Each token MUST have a light and dark variant that switches when `class="dark"` is toggled on `<html>`.

#### Scenario: Light mode tokens applied
- **GIVEN** `ThemeProvider` state is `{ preset: "forest", mode: "light" }`
- **WHEN** the provider renders
- **THEN** `--color-primary` equals Forest's light primary HSL, `--color-surface` equals Forest's light surface HSL, and `<html>` has no `dark` class

#### Scenario: Dark mode tokens applied
- **GIVEN** `ThemeProvider` state is `{ preset: "forest", mode: "dark" }`
- **WHEN** the provider renders
- **THEN** `--color-primary` equals Forest's dark primary HSL, `--color-surface` equals Forest's dark surface HSL, and `<html>` carries `class="dark"`

---

### Requirement: Palette Selection UI
Admin users SHALL be able to select a palette from 10 preset options in a new "Apariencia" section at `/configuracion`. The UI SHALL render a grid of palette cards showing color swatches. Hovering a card SHALL apply a live preview of the palette via `ThemeProvider`. Clicking "Guardar" SHALL persist the selection.

#### Scenario: Admin selects a palette with live preview
- **GIVEN** admin is on `/configuracion/apariencia` with Púrpura active
- **WHEN** admin hovers the Ocean palette card
- **THEN** the entire page re-renders with Ocean colors
- **AND** the Ocean card shows a selection indicator

#### Scenario: Admin saves palette selection
- **GIVEN** admin has previewed Ocean palette
- **WHEN** admin clicks "Guardar"
- **THEN** `VeterinariaController.actualizar(id, { tema: { preset: "ocean", mode: "light" } })` is called
- **AND** a success toast confirms the change
- **AND** Ocean remains active after page reload (persisted in DB)

#### Scenario: Non-admin users cannot access palette selector
- **GIVEN** a user with role `doctora` or `recepcion`
- **WHEN** navigating to `/configuracion/apariencia`
- **THEN** the palette grid is not rendered or the route is protected

---

### Requirement: Dark/Light Mode Toggle
Any authenticated user SHALL be able to toggle between dark and light mode via a control in the sidebar (desktop) or header (mobile). The preference SHALL persist in `localStorage` per session. The toggle SHALL use the current palette's dark/light variants.

#### Scenario: User toggles to dark mode
- **GIVEN** user is viewing Dashboard with Púrpura light mode
- **WHEN** user clicks the dark mode toggle in the sidebar
- **THEN** `<html>` receives `class="dark"`, all CSS variables switch to dark variants, `localStorage` stores `theme-mode: "dark"`, and UI renders with dark surface/text colors

#### Scenario: Dark mode survives page navigation
- **GIVEN** user has toggled dark mode on and navigates from Dashboard to Expedientes
- **WHEN** the new page mounts
- **THEN** dark mode remains active (read from `ThemeProvider` context, not reset)

#### Scenario: Mode toggle persists across sessions
- **GIVEN** user toggled dark mode in a previous session
- **WHEN** user returns and authenticates again
- **THEN** `localStorage` preference is restored and dark mode applies automatically

---

### Requirement: Palette Persistence
Selected palette SHALL be saved as `{ preset: string; mode: 'light' | 'dark' }` in the `veterinarias.tema` JSONB column via `VeterinariaController.actualizar()`. Every clinic's theme SHALL be scoped to its `veterinaria_id` — clinic A selecting Ocean SHALL NOT affect clinic B.

#### Scenario: Palette saved to database
- **GIVEN** admin selects Forest palette and clicks "Guardar"
- **WHEN** the save completes
- **THEN** `veterinarias` row for that clinic has `tema = { "preset": "forest", "mode": "light" }` in Supabase

#### Scenario: Cross-clinic isolation
- **GIVEN** clinic A has Ocean palette and clinic B has Midnight palette
- **WHEN** a user from clinic A and a user from clinic B each load their dashboards
- **THEN** clinic A sees Ocean colors and clinic B sees Midnight colors

---

### Requirement: Default Palette Backward Compatibility
New clinics with no `tema` set SHALL render with Púrpura (preset ID `purpura`, matching current hardcoded HSL values in `:root`) as the default. Existing clinics whose admin has NOT yet selected a theme SHALL see NO visual change — their appearance remains identical to pre-theming behavior.

#### Scenario: Existing clinic sees no change
- **GIVEN** an existing clinic with `veterinarias.tema = NULL` and no admin has visited `/configuracion/apariencia`
- **WHEN** any user from that clinic loads any page
- **THEN** all colors render identically to the pre-theming state (Púrpura palette values match current `:root` HSL tokens)

---

### Requirement: Sonner Integration
The `Toaster` component (sonner) SHALL respect the active theme mode using CSS variable references instead of hardcoded `theme="light"` and hardcoded color classes (`text-purpura-600`, `border-purpura-200`, `bg-purpura-50/80`).

#### Scenario: Toasts render in dark mode
- **GIVEN** user has dark mode active with Midnight palette
- **WHEN** a toast is triggered (e.g., save confirmation)
- **THEN** the toast background uses `--color-surface` dark variant, border uses `--color-border` dark variant, and the Sonner `theme` prop receives `"system"` or the computed mode

#### Scenario: Toast icon colors follow palette
- **GIVEN** clinic uses Ocean palette
- **WHEN** a success toast fires
- **THEN** the success icon colors reference `--color-primary` instead of hardcoded `text-purpura-600`

---

### Requirement: No Visual Regression with Default Palette
All existing pages (Dashboard, Consultas, Recepción, Expedientes, Catálogo, Historial, Configuración, Super-Admin) SHALL render with identical visual output when the Púrpura default palette is selected. No layout shifts, missing colors, broken gradients, or component clipping SHALL occur.

#### Scenario: Dashboard renders identically with default
- **GIVEN** clinic has Púrpura palette (default)
- **WHEN** Dashboard page renders
- **THEN** gradient backgrounds (`from-purpura-500 to-purpura-600`), stat card colors, calendar highlights, and greeting text colors match the pre-theming visual output

#### Scenario: All 10 presets pass smoke test
- **GIVEN** each of the 10 preset palettes is selected in turn
- **WHEN** a smoke test visits Dashboard, Expedientes, Recepción, and Catálogo pages
- **THEN** no page shows broken layouts, empty color regions, unreadable text, or console errors related to missing CSS variables
