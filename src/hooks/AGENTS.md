# AGENTS.md - Hooks (`src/hooks/`)

## Propósito

Puente entre los controllers (datos) y las pages (UI). Los hooks envuelven controllers Singleton con estado React para que las pages tengan datos reactivos.

## Estructura

```
hooks/
├── useConsultas.ts   ← useConsultas() + useCatalogo()
└── use-mobile.ts     ← Detección de responsive
```

## Convenciones

- **Prefijo `use`:** todo hook personalizado empieza con `use`
- **Un archivo por dominio:** `useConsultas` exporta 2 hooks del mismo archivo
- **Siempre usan controllers:** ningún hook debe importar `mockData` directamente
- **Misma interfaz que los controllers:** los hooks exponen la misma API que el controller subyacente

## Hooks actuales

### `useConsultas()`
Envuelve `ConsultaController`. Retorna:
```
{ consultas, getConsultasPendientes, getConsultasPorMascota, finalizarConsulta, crearConsulta, calcularTotal }
```

### `useCatalogo()`
Envuelve `CatalogoController`. Retorna:
```
{ productos, getProductosPorCategoria, buscarProductos, actualizarProducto, crearProducto, eliminarProducto }
```

## Patrón típico de hook

```typescript
import { useState, useCallback } from 'react'
import { MiController } from '@/controllers/mi.controller'

const ctrl = MiController.getInstance()

export function useMiHook() {
  const [data, setData] = useState(() => ctrl.getAll())

  const actualizar = useCallback((id: string, cambios: Partial<Tipo>) => {
    ctrl.actualizar(id, cambios)
    setData(ctrl.getAll())  // refresh desde el singleton
  }, [])

  return { data, actualizar }
}
```

## Reglas

1. Los hooks NO contienen lógica de negocio — delegan a controllers
2. Los hooks SOLO gestionan estado React y sincronización
3. Si un hook necesita estado de otro hook (ej: useAuth + useConsultas), se usa desde la page, no se anidan hooks
4. Los hooks deben retornar siempre la misma interfaz (estable para los consumers)
