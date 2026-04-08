# AGENTS.md - Proyecto Kachorros (Raíz)

## Descripción del Proyecto

Aplicación web para gestión de clínica veterinaria "Kachorros". Sistema de historial clínico, gestión de pacientes, inventario y agenda.

**Stack:** React 19 + Vite + TypeScript + Tailwind CSS + Radix UI + React Router 7

## Estado del Código

### ✅ Fortalezas
- Arquitectura limpia con routing y autenticación basada en roles
- Types bien definidos en `src/types/index.ts`
- Hooks personalizados para lógica de negocio (`useConsultas`, `useCatalogo`)
- Componentes UI de Radix ya instalados y configurados
- Layout con sidebar integrado

### ⚠️ Áreas de Atención

1. **Seguridad (Desarrollo)**
   - `AuthContext.tsx:30` - Password hardcodeada '123456' (solo demo)
   - Mensaje de error expone credenciales: línea 35
   - Sin validación real de email/password

2. **Datos (Demo)**
   - `mockData.ts` inicializa datos cada vez que se recarga - cambios no persisten
   - La integración con Supabase está planeada (existe `supabase_schema.sql`) pero no implementada
   - Hook `useConsultas` copia arrays de datos iniciales - puede causar inconsistencias si se modifica el array original

3. **Rutas**
   - `App.tsx` - Todas las rutas definidas manualmente
   - Falta implementar protección robusta en cliente (soloredirect)

4. **UI**
   - Componentes shadcn/ui completos en `src/components/ui/`
   - Algunos archivos duplicados en `src/app/login/page.tsx` (fuera de estándar)

## Convenciones

- **Componentes:** PascalCase (ej: `DashboardPage`, `ExpedienteCard`)
- **Hooks:** camelCase con prefijo `use` (ej: `useConsultas`)
- **Types:** en `src/types/index.ts`
- **Mock data:** en `src/data/mockData.ts`
- **Alias:** `@/` = `src/`

## Scripts Disponibles

```bash
npm run dev      # Desarrollo
npm run build    # Producción
npm run lint     # ESLint
npm run preview  # Preview build
```

## Notas para Desarrollo Futuro

1. Reemplazar autenticación mock por Supabase Auth
2. Implementar persistencia de datos con Supabase
3. Agregar validación de formularios con Zod
4. Mejorar manejo de errores global