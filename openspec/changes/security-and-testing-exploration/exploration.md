# Exploration: Security Audit & Testing Infrastructure

**Date**: 2026-06-05
**Project**: kachorross
**Topics**: Security Audit, Testing Infrastructure

---

## TOPIC 1: Security Audit

### Current State

The auth system has been recently hardened (+45 lines in `AuthContext.tsx`). The old hardcoded `'123456'` password is GONE. Auth now uses Supabase `signInWithPassword` with proper session management, inactivity auto-logout (30 min), token refresh handling, and veterinarian suspension checks. Route protection is role-based with `ProtectedRoute` wrapping all routes except `/login` and `/establecer-contrasena`. All data queries go through Supabase SDK (parameterized, no raw SQL injection risk). RLS is enabled on all 13 tables with 49 policies.

### Affected Areas

- `src/context/AuthContext.tsx` — Migrated from mock to Supabase Auth; session lifecycle, inactivity logout
- `src/controllers/auth.controller.ts` — login/register/logout, perfil creation/update/delete via Supabase
- `src/App.tsx` — ProtectedRoute, PublicRoute, role-based guards, route definitions
- `src/lib/auth-routes.ts` — Role-to-homepage mapping
- `src/controllers/veterinaria.controller.ts:25-33` — `getAll()` returns ALL veterinarias (no RLS filter, exposes data cross-tenant)
- `supabase/functions/send-reminders/index.ts:109-121` — Skips auth if no Authorization header (cron mode)
- `supabase/setup_storage.sql` — Storage bucket RLS lacks `veterinaria_id` scoping for INSERT/UPDATE/DELETE
- `supabase/functions/admin-create-user/index.ts` — Admin user creation edge function
- `supabase/functions/send-email/index.ts` — Email sending with SMTP config

### Security Findings (ranked by severity)

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| 1 | **HIGH** | Storage bucket RLS: authenticated users from ANY vet can INSERT/UPDATE/DELETE in `mascotas` and `fotos_evolucion` buckets. No `veterinaria_id` scoping on write operations. | `supabase/setup_storage.sql:33-59` |
| 2 | **MEDIUM** | `VeterinariaController.getAll()` returns ALL clinics (names, emails, phones) to any authenticated user. The RLS policy on `veterinarias` allows all authenticated SELECT. | `src/controllers/veterinaria.controller.ts:25-33` |
| 3 | **MEDIUM** | `send-reminders` edge function allows unauthenticated access when no `Authorization` header present. Should require a cron secret or internal-only auth. | `supabase/functions/send-reminders/index.ts:109-121` |
| 4 | **LOW** | `.env.example` comment references `SUPABASE_SERVICE_ROLE_KEY` — name hints at privileged key mechanism. Template value only — not a leak. | `.env.example:8` |

### What Was Fixed (vs. AGENTS.md warnings)

- ✅ Hardcoded `'123456'` password — REMOVED
- ✅ Exposed credential error message (old line 35) — REMOVED, now shows generic `'Credenciales incorrectas.'`
- ✅ Proper Supabase Auth with session management, token refresh, inactivity auto-logout
- ✅ Veterinaria suspension check at login time

### Approaches for Fixing Remaining Issues

1. **Tighten Storage RLS** — Add `veterinaria_id` column to storage object metadata, or create per-vet folder paths and enforce via policy.
   - Pros: True multi-tenant isolation. Prevents cross-vet data tampering.
   - Cons: Requires schema change, may break existing upload paths.
   - Effort: Medium

2. **Scope VeterinariaController.getAll()** — Either add RLS policy that limits to super_admin only, or add client-side filtering.
   - Pros: Simple SQL change. Prevents info disclosure.
   - Cons: Client-side filter is not real security (RLS is the real guard).
   - Effort: Low

3. **Secure send-reminders** — Require a shared secret (`CRON_SECRET` env var) or internal auth header.
   - Pros: Prevents unauthorized mass email triggering.
   - Cons: Requires env var setup in Supabase dashboard.
   - Effort: Low

### Recommendation

Fix findings #1, #2, and #3 before production deployment. All three are actionable in under 2 hours combined. Priority: #1 (storage RLS) → #2 (vet info disclosure) → #3 (cron auth). #4 is informational only.

### Risks
- Storage RLS gap could allow malicious cross-vet data destruction
- Unauthenticated `send-reminders` endpoint could be abused for spam if URL is discovered
- Public vet listing exposes business intelligence to competitors

### Ready for Proposal
Yes for each finding as a separate, small change. The fixes are well-scoped and low-risk.

---

## TOPIC 2: Testing Infrastructure

### Current State

There is **zero test infrastructure**. No test runner, no test files, no test config, no test-related dependencies in `package.json`. ESLint 9 and TypeScript 5.9 strict mode are the only quality gates. `openspec/config.yaml` confirms: `runner: none`, `strict_tdd: false`, all testing layers marked as `available: false`.

### Affected Areas

- `package.json` — Needs devDependencies: vitest, @testing-library/react, @testing-library/jest-dom, jsdom, @testing-library/user-event
- `vitest.config.ts` (new) — Root-level config with jsdom environment, React plugin, path aliases
- `src/test/setup.ts` (new) — Global mocks for Supabase, ResizeObserver, matchMedia
- `tsconfig.app.json` — May need `vitest/globals` types
- `src/controllers/` — First test targets (controllers are pure logic + Supabase queries, no DOM)
- `src/lib/` — Utility pure functions, easiest to test
- `src/hooks/` — Need `renderHook` from testing-library
- `src/components/` — Need jsdom + Radix UI mocking

### What's Needed

#### Dependencies to install
```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

#### vitest.config.ts (root level)
```ts
/// <reference types="vitest/config" />
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
```

#### src/test/setup.ts
```ts
import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('@/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    })),
    functions: { invoke: vi.fn() },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })),
      })),
    },
  },
}))

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })),
})
```

#### package.json scripts to add
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### Test Strategy

**Layer priority** (test first → last):
1. **Lib functions** (`src/lib/`) — Pure functions, zero setup, instant value
2. **Controllers** — Mock `supabase.from()`, test CRUD + error paths
3. **Hooks** — `renderHook` from testing-library
4. **Atoms/UI components** — jsdom rendering, snapshot or behavior tests
5. **Pages/Organisms** — Complex, high effort, later priority

**Mocking strategy**:
- Centralized Supabase mock in `src/test/setup.ts`
- Per-test overrides: `vi.mocked(supabase.from).mockReturnValue({...})`
- Controller tests mock `AuthController.resolveUser()` to return a test user
- Component tests wrap in `TestAuthProvider` or mock `useAuth()`

**Radix UI considerations**:
- Dialogs/Selects render into portals → query within portal container
- `ResizeObserver` + `matchMedia` mocks in setup cover most issues
- `@radix-ui/react-slot` merges props → avoid testing DOM structure directly

### Quick Wins (5 tests to write immediately)

| # | Test | File | Why |
|---|------|------|-----|
| 1 | `getHomeRouteForRole()` — 4 cases | `src/lib/__tests__/auth-routes.test.ts` | Pure function, zero deps |
| 2 | `AuthController.login()` — success, fail, suspended | `src/controllers/__tests__/auth.controller.test.ts` | Core auth logic |
| 3 | `ConsultaController.calcularTotal()` — subtotal sum | `src/controllers/__tests__/consulta.controller.test.ts` | Pure method, no async |
| 4 | `CatalogoController.getAll()` — filter, empty, error | `src/controllers/__tests__/catalogo.controller.test.ts` | Common CRUD pattern |
| 5 | `VacunaController.crearVacuna()` — vet injection, error | `src/controllers/__tests__/vacuna.controller.test.ts` | Tests data isolation |

### Recommendation

Install Vitest + testing-library, create the 3 config files, write the 5 quick-win tests. This establishes the testing pattern and gives immediate coverage on core business logic. Estimated effort: 2-3 hours.

### Risks
- None. Testing infrastructure is additive — zero risk to production code.
- The Supabase mock must be maintained as the client SDK evolves.
- `erasableSyntaxOnly` in tsconfig (line 29) may conflict with test decorators — test early.

### Ready for Proposal
Yes. This is a clear, bounded infrastructure change: add test runner + config + 5 initial tests.
