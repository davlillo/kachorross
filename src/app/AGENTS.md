# AGENTS.md - Pages (`src/app/`)

## Propósito

Cada subcarpeta representa una ruta de la aplicación. Contiene un `page.tsx` que exporta el componente por defecto de esa ruta.

## Estructura

```
app/
├── login/                 # /login — formulario de inicio de sesión
│   └── page.tsx
├── registro/              # /registro — formulario de registro
│   └── page.tsx
├── dashboard/             # /dashboard — panel principal con stats
│   └── page.tsx
├── expedientes/           # /expedientes — listado de expedientes
│   ├── page.tsx
│   └── [id]/              # /expedientes/:id — detalle de expediente
│       └── page.tsx
├── consulta/
│   └── nueva/             # /consulta/nueva — crear consulta
│       └── page.tsx
├── recepcion/             # /recepcion — monitor de salida
│   └── page.tsx
└── admin/
    └── catalogo/          # /admin/catalogo — gestión de productos
        └── page.tsx
```

## Convenciones

- **Un archivo por ruta:** `page.tsx` con `export default function`
- **Sin lógica de datos:** las pages NO importan `mockData` ni llaman a Supabase directamente
- **Solo composición:** las pages importan hooks (`useAuth`, `useConsultas`) + componentes (`atoms/`, `molecules/`, `organisms/`)
- **Estado local OK:** `useState` para UI state (búsquedas, filtros, dialogs)
- **Todo JSX inline** que pueda reutilizarse debe extraerse a `molecules/` u `organisms/`

## Patrón típico

```tsx
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConsultas } from '@/hooks/useConsultas';
import { PageHeader } from '@/components/molecules/PageHeader';
import { StatsCard } from '@/components/molecules/StatsCard';

export default function MiPagina() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('todos');

  return <div>...</div>;
}
```

## Registro de rutas

Toda ruta nueva debe registrarse en `src/App.tsx` con su `ProtectedRoute` correspondiente.
