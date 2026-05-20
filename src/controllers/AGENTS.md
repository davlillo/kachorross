# AGENTS.md - Controladores (`src/controllers/`)

## Propósito

Capa de acceso a datos y lógica de negocio. Cada controller es un **Singleton** (única instancia en memoria) que encapsula las operaciones CRUD de una entidad.

## Estructura

```
controllers/
├── auth.controller.ts       ← Autenticación (login/logout)
├── consulta.controller.ts   ← Consultas médicas (CRUD + monitor + totales)
├── catalogo.controller.ts   ← Catálogo de productos/servicios (CRUD + búsqueda)
├── mascota.controller.ts    ← Mascotas (CRUD + expedientes)
└── index.ts                 ← Barrel export
```

## Patrón Singleton

```typescript
let instance: MiController | null = null

export class MiController {
  static getInstance(): MiController {
    if (!instance) instance = new MiController()
    return instance
  }
}
```

Usar desde hooks o context:

```typescript
import { MiController } from '@/controllers/mi.controller'

const ctrl = MiController.getInstance()
ctrl.obtenerTodos()
ctrl.crear({ ... })
```

## Convenciones

- **Instancia única:** siempre usar `getInstance()`, nunca `new MiController()`
- **Sin estado React:** los controllers NO usan hooks, NO son componentes
- **Mock → Supabase:** la implementación actual usa `mockData.ts`. Cuando llegue Supabase, solo cambia el cuerpo de los métodos (la interfaz pública NO cambia)
- **Misma API que hooks:** los métodos se nombran igual que en los hooks para consistencia (`getAll`, `getById`, `crear`, `actualizar`, `eliminar`)
- **Síncrono hoy, async mañana:** los métodos mock son síncronos. Con Supabase serán async. Los hooks se adaptan con `useCallback`

## Responsabilidades

| Controller | Entidad | Métodos clave |
|---|---|---|
| `AuthController` | Perfil | `login(email, password)`, `logout()`, `getCurrentUser()` |
| `ConsultaController` | Consulta | `getAll()`, `getPendientes()`, `getByMascota()`, `crear()`, `finalizar()`, `calcularTotal()`, `getMonitorSalida()` |
| `CatalogoController` | Producto | `getAll()`, `getByCategoria()`, `buscar()`, `crear()`, `actualizar()`, `eliminar()` |
| `MascotaController` | Mascota, Expediente | `getAll()`, `getById()`, `buscar()`, `getExpedienteById()`, `buscarExpedientes()` |

## Migración a Supabase (futuro)

```typescript
// Antes (mock):
getAll(): Producto[] {
  return this.data
}

// Después (Supabase):
async getAll(): Promise<Producto[]> {
  const { data } = await supabase.from('catalogo').select('*')
  return data
}
```

Los hooks se adaptan con `useEffect` para llamadas async, pero la interfaz que ven las pages NO cambia.
