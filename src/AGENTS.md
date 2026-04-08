# AGENTS.md - Código Fuente (src/)

## Estructura de Carpetas

```
src/
├── app/                    # Páginas (React Router)
│   ├── login/             # Login
│   ├── dashboard/         # Dashboard principal
│   ├── recepcion/         # Módulo de recepción
│   ├── expedientes/       # Expedientes clínicos
│   │   └── [id]/         # Detalle de expediente
│   ├── consulta/nueva/    # Nueva consulta
│   └── admin/catalogo/   # Catálogo de productos
├── components/
│   ├── ui/               # Componentes shadcn/ui (Radix)
│   └── Layout.tsx        # Layout principal con sidebar
├── context/
│   └── AuthContext.tsx   # Autenticación y autorización
├── hooks/
│   ├── useConsultas.ts   # Lógica de consultas y catálogo
│   └── use-mobile.ts     # Detección de móvil
├── types/
│   └── index.ts          # Tipos TypeScript del dominio
├── data/
│   └── mockData.ts       # Datos de demo (se reinician en reload)
└── lib/
    └── utils.ts          # Utilidades (cn, etc.)
```

## Convenciones de Código

### Types (`src/types/index.ts`)
- Interfaces para: Perfil, Mascota, Propietario, Expediente, Consulta, DetalleConsulta, Producto, FotoEvolucion, Vacuna, MonitorSalida, DashboardStats
- Roles: `'doctora' | 'recepcion' | 'admin'`
- Estados: `'pendiente' | 'finalizado'` para consultas

### Hooks Personalizados

**useConsultas** (`src/hooks/useConsultas.ts:5`)
- `consultas`: estado con todas las consultas
- `getConsultasPendientes()`: filtra consultas pendientes
- `getConsultasPorMascota(mascotaId)`: obtiene historial de una mascota
- `finalizarConsulta(consultaId)`: cambia estado a 'finalizado'
- `crearConsulta(data)`: crea nueva consulta

**useCatalogo** (`src/hooks/useConsultas.ts:62`)
- `productos`: catálogo de productos/servicios
- `getProductosPorCategoria(categoria)`: filtra por categoría
- `buscarProductos(query)`: búsqueda por nombre/código/descripción
- `actualizarProducto(id, data)`, `crearProducto(data)`, `eliminarProducto(id)`

### Componentes UI

Usar componentes de `src/components/ui/`:
- Button, Card, Input, Select, Dialog, Table, Tabs, etc.
- Todos basados en Radix UI con Tailwind

### Autenticación

- **Proveedor:** `AuthProvider` en `src/context/AuthContext.tsx`
- **Hook:** `useAuth()` para acceder a user, login, logout
- **Roles disponibles:** `'doctora' | 'recepcion' | 'admin'`
- **Rutas protegidas:** mediante componente `ProtectedRoute` en `App.tsx`

## Patrones de Desarrollo

### Crear nueva página
1. Crear en `src/app/<ruta>/page.tsx`
2. Exportar componente por defecto
3. Registrar ruta en `App.tsx`
4. Envolver en `<ProtectedRoute allowedRoles={[...]}>` si es necesario

### Agregar tipo nuevo
1. Añadir interfaz en `src/types/index.ts`
2. Exportar el tipo
3. Usar en componentes/hooks

### Usar catálogo de productos
```tsx
import { useCatalogo } from '@/hooks/useConsultas';

const { productos, buscarProductos } = useCatalogo();
```

### Mostrar expediente
```tsx
import { getExpedienteById } from '@/data/mockData';

const expediente = getExpedienteById(id);
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

1. Los datos en `mockData.ts` son de演示 - se reinician al recargar
2. Para producción: integrar Supabase (schema existente en raíz)
3. Password hardcodeada en AuthContext: solo para demo (`'123456'`)