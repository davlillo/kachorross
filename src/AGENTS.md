# AGENTS.md - Código Fuente (src/)

## Arquitectura (3 capas)

```
PAGES (UI)
  app/            ← React Router pages, solo composición
    ↓
HOOKS (Estado React)
  hooks/          ← useState + controllers
    ↓
CONTROLLERS (Lógica + Datos)
  controllers/    ← Singletons, mock ahora → Supabase después
    ↓
DATA
  data/mockData.ts  ← Seed data (solo los controllers lo tocan)
```

## Estructura de Carpetas

```
src/
├── app/                    # Páginas (React Router)
│   ├── login/             # /login
│   ├── dashboard/         # /dashboard
│   ├── recepcion/         # /recepcion
│   ├── expedientes/       # /expedientes
│   │   └── [id]/         # /expedientes/:id
│   ├── consulta/nueva/    # /consulta/nueva
│   └── admin/catalogo/   # /admin/catalogo
├── components/             # Atomic Design (ver components/AGENTS.md)
│   ├── atoms/
│   │   ├── ui/           # shadcn/ui (53 componentes)
│   │   └── custom/       # Átomos propios
│   ├── molecules/         # Agrupaciones de átomos
│   └── organisms/         # Secciones complejas
├── controllers/            # Singletons (ver controllers/AGENTS.md)
│   ├── auth.controller.ts
│   ├── consulta.controller.ts
│   ├── catalogo.controller.ts
│   └── mascota.controller.ts
├── context/               # Contextos React
│   └── AuthContext.tsx    # Autenticación (usa AuthController)
├── hooks/                 # Hooks personalizados (ver hooks/AGENTS.md)
│   ├── useConsultas.ts   # useConsultas + useCatalogo
│   └── use-mobile.ts     # Detección responsive
├── types/
│   └── index.ts          # Interfaces del dominio
├── data/
│   └── mockData.ts       # Datos demo (lo usan solo los controllers)
└── lib/
    └── utils.ts          # Utilidades (cn, etc.)
```

## Convenciones de Código

### Tipos (`src/types/index.ts`)
- Interfaces: Perfil, Mascota, Propietario, Expediente, Consulta, DetalleConsulta, Producto, FotoEvolucion, Vacuna, MonitorSalida, DashboardStats
- Roles: `'doctora' | 'recepcion' | 'admin'`
- Estados consulta: `'pendiente' | 'finalizado'`

### Autenticación
- **Proveedor:** `AuthProvider` en `src/context/AuthContext.tsx`
- **Hook:** `useAuth()` → `{ user, login, logout, isLoading, error }`
- **Rutas protegidas:** componente `ProtectedRoute` en `App.tsx`

### Hooks
| Hook | Controller que usa | Propósito |
|---|---|---|
| `useAuth` | `AuthController` | Login/logout + sesión |
| `useConsultas` | `ConsultaController` | CRUD consultas |
| `useCatalogo` | `CatalogoController` | CRUD catálogo |

### Componentes UI
- shadcn/ui en `atoms/ui/` (Button, Card, Input, Select, Dialog, Table, Tabs...)
- Moléculas en `molecules/` (PageHeader, StatsCard, SearchBar, EmptyState...)
- Organismos en `organisms/` (PatientInfoCard, MonitorCard, Layout...)

## Patrones de Desarrollo

### Crear nueva página
1. Crear `src/app/<ruta>/page.tsx`
2. Exportar componente por defecto
3. Usar hooks para datos, molecules/organisms para UI
4. Registrar ruta en `App.tsx` con `ProtectedRoute`

### Agregar controller nuevo
1. Crear `src/controllers/<entidad>.controller.ts`
2. Implementar Singleton con `getInstance()`
3. Usar mockData internamente (seed inicial)
4. Exportar desde `controllers/index.ts`
5. Crear hook que lo envuelva con useState

### Agregar tipo nuevo
1. Añadir interfaz en `src/types/index.ts`
2. Exportar el tipo
3. Usar en controllers (tipado fuerte)

### Migrar de mock a Supabase
Solo se modifica el controller — hooks y pages no se tocan.
```typescript
// controllers/mi.controller.ts
// Antes: return this.data.filter(...)
// Después: return supabase.from('tabla').select('*').eq('campo', valor)
```

## Dependencias Clave
- **React 19** - Framework
- **React Router 7** - Routing
- **Radix UI** - Componentes base (shadcn/ui)
- **Tailwind CSS** - Estilos
- **Zod** - Validación de formularios
- **date-fns** - Fechas
- **lucide-react** - Iconos
- **recharts** - Gráficos

## Notas Importantes
1. Los controllers usan `mockData.ts` como seed — datos se reinician al recargar
2. Para producción: integrar Supabase (schema en `supabase_schema.sql`)
3. Password demo: `123456` (solo para desarrollo)
