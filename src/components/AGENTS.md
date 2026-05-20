# AGENTS.md - Componentes (`src/components/`)

## Propósito

Componentes UI organizados por Atomic Design. Prohibido importar hooks o context desde aquí (excepto Layout/organisms que sí pueden).

## Estructura

```
components/
├── atoms/               ← Componentes atómicos (una sola responsabilidad)
│   ├── ui/              ← shadcn/ui (52 componentes base: Button, Card, Input, etc.)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── index.ts    ← barrel export (export * from cada uno)
│   └── custom/          ← Átomos propios del proyecto
│       ├── EspecieBadge.tsx   ← Badge con icono de especie (🐕🐱)
│       ├── StatusBadge.tsx    ← Badge para estados (pendiente, finalizado, etc.)
│       └── index.ts
├── molecules/           ← Combinación de 2-5 átomos
│   ├── PageHeader.tsx   ← Título + descripción + acciones (usado en TODAS las pages)
│   ├── StatsCard.tsx    ← Card con icono + valor + trend
│   ├── SearchBar.tsx    ← Input de búsqueda + botones de filtro
│   ├── EmptyState.tsx   ← Icono + mensaje + acción opcional
│   ├── AuthBackground.tsx ← Fondo decorativo con blobs
│   ├── BrandPanel.tsx   ← Panel de branding (login/registro)
│   └── index.ts
├── organisms/           ← Secciones complejas con lógica propia
│   ├── Layout.tsx       ← Layout principal con sidebar + header + main
│   ├── PatientInfoCard.tsx    ← Sidebar de info de paciente
│   ├── MonitorCard.tsx         ← Card de monitor de salida
│   ├── DetailRecepcionDialog.tsx ← Diálogo de detalle de factura
│   ├── ConfirmSalidaDialog.tsx   ← Diálogo de confirmación
│   ├── ProductSelectorDialog.tsx ← Selector de productos en consulta
│   ├── ProductFormDialog.tsx     ← Formulario crear/editar producto
│   ├── ProductTable.tsx          ← Tabla de productos
│   └── index.ts
└── ui/                  ← ELIMINADO (migrado a atoms/ui/)
```

## Convenciones

| Capa | Importa desde | Puede tener estado |
|------|--------------|-------------------|
| `atoms/` | Solo React + shadcn/ui | No |
| `molecules/` | atoms/ + React | Mínimo (UI state) |
| `organisms/` | atoms/ + molecules/ + hooks | Sí, lógica de negocio |
| `pages/` | Todo lo anterior | Sí, estado de página |

- **Nombres:** PascalCase (`StatsCard`, `PageHeader`)
- **Imports:** usar `@/components/atoms/ui/button` (path completo)
- **Tipado:** interface de props siempre exportada (para re-uso)
- **Sin hooks de datos:** átomos y moléculas NO importan `useAuth`, `useConsultas` ni ningún controller

## Regla de extracción

Si ves JSX repetido en 2+ pages → extraer a molecules/
Si ves JSX complejo (>50 líneas) en una page → extraer a organisms/
