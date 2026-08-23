# Delta for Manual de Usuario

## REMOVED Requirements

### Requirement: Menu Integration

The system SHALL render a "Manual de Usuario" entry in the sidebar navigation. The entry SHALL be visible to doctora, recepcion, admin, and super_admin roles. Clicking the entry MUST navigate to `/manual`.

(Reason: Manual de Usuario is unused dead code creating maintenance surface. No active users reference this feature.)
(Migration: None — feature is being deleted entirely, not replaced.)

#### Scenario: Authenticated user sees manual link in sidebar

- GIVEN a user authenticated as doctora, recepcion, or admin
- WHEN the sidebar renders
- THEN "Manual de Usuario" appears with a lucide-react icon
- AND the link targets `/manual`

#### Scenario: Super admin accesses manual directly

- GIVEN a user authenticated as super_admin
- WHEN navigating to `/manual`
- THEN the manual page renders without role rejection

### Requirement: Role-Scoped Session Filtering

The system SHALL filter available tutorial sessions by the authenticated user's role. Sessions tagged with a role the user does NOT hold MUST be hidden from the session sidebar.

(Reason: Manual de Usuario is unused dead code creating maintenance surface.)
(Migration: None)

#### Scenario: Doctora sees only her relevant sessions

- GIVEN a user with role `doctora`
- WHEN the session sidebar loads
- THEN only sessions whose `roles` array includes `doctora` are displayed

#### Scenario: Admin sees all non-super-admin sessions

- GIVEN a user with role `admin`
- WHEN the session sidebar loads
- THEN sessions tagged for doctora, recepcion, and admin are all visible

### Requirement: Session Navigation

The system SHALL render a sidebar listing filtered tutorial sessions with title, short description, and completion state. Selecting a session MUST load its first step. The active session SHALL be visually highlighted.

(Reason: Manual de Usuario is unused dead code creating maintenance surface.)
(Migration: None)

#### Scenario: User switches between tutorial sessions

- GIVEN the user is viewing the "Dashboard" session
- WHEN the user clicks "Expedientes" in the session sidebar
- THEN the Expedientes session loads at step 1
- AND "Expedientes" is highlighted as active in the sidebar

### Requirement: Step Navigation

The system SHALL provide Previous and Next controls within each tutorial session. A step indicator MUST display the current step number and total steps. Advancing steps SHALL animate the content swap via CSS opacity transition.

(Reason: Manual de Usuario is unused dead code creating maintenance surface.)
(Migration: None)

#### Scenario: User advances through steps

- GIVEN a session with 6 steps is open at step 3
- WHEN the user clicks "Next"
- THEN step 4 content replaces step 3 with a fade transition
- AND the indicator updates to "4 / 6"

#### Scenario: User is on the final step

- GIVEN the user is on the last step of a session
- WHEN the step renders
- THEN the "Next" control is hidden or disabled
- AND a completion indicator is shown

### Requirement: Interactive Hotspots

The system SHALL render positioned overlay buttons on the active screenshot. Each hotspot MUST open a Radix Popover containing its title and description on click or hover. Hotspots SHALL animate in sequence via staggered CSS `animation-delay`.

(Reason: Manual de Usuario is unused dead code creating maintenance surface.)
(Migration: None)

#### Scenario: User clicks a hotspot on a screenshot

- GIVEN a tutorial step with hotspots is visible
- WHEN the user clicks a hotspot button
- THEN a Popover opens displaying the hotspot title and description
- AND the hotspot button scales via CSS transition on hover

#### Scenario: Hotspot position accuracy

- GIVEN hotspot definitions with percentage-based coordinates (x, y)
- WHEN the screenshot renders inside its container
- THEN each hotspot overlay appears at the specified position relative to the screenshot

### Requirement: Progress Tracking

The system SHALL persist completed step IDs per session in browser `localStorage`. The session sidebar SHALL display progress as "N / M steps completed". Progress SHALL survive page reloads.

(Reason: Manual de Usuario is unused dead code creating maintenance surface.)
(Migration: None)

#### Scenario: Completed steps persist across reload

- GIVEN the user completed steps 1-3 of the Dashboard session
- WHEN the user reloads the manual page
- THEN the Dashboard session in the sidebar shows "3 / 6 completados"

### Requirement: Accessible Text-Only View

The system SHALL provide a toggle labeled "Vista accesible" that replaces the screenshot view with a semantic list of all hotspot titles and descriptions for the current step. The list MUST be navigable by keyboard and announced correctly by screen readers.

(Reason: Manual de Usuario is unused dead code creating maintenance surface.)
(Migration: None)

#### Scenario: Screen reader user enables text view

- GIVEN the manual is displaying a step with hotspots
- WHEN the user activates the "Vista accesible" toggle
- THEN the screenshot is replaced by a plain list of annotation texts
- AND each item receives sequential focus in tab order

### Requirement: Screenshot Asset Contract

Screenshots SHALL be static PNG files captured at 1440×900 viewport, stored in `public/screenshots/`, and named by route slug (e.g., `dashboard.png`). The content data file SHALL reference screenshots by relative path from `/screenshots/`. Screenshot filenames MUST NOT contain spaces or special characters beyond hyphens.

(Reason: Manual de Usuario is unused dead code creating maintenance surface.)
(Migration: None)

#### Scenario: Authoring a new session references valid screenshot

- GIVEN a new tutorial session is being authored
- WHEN the session object references a screenshot path
- THEN the file exists at `public/screenshots/{slug}.png` at 1440×900 resolution
- AND the session loads the screenshot without a 404
