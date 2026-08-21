# 🐾 Sistema de Gestión - Veterinaria Kachorro's

Sistema web integral para la gestión de expedientes clínicos y pre-facturación digital, desarrollado para la materia de Diseño de Sistemas I (UES).

![Veterinaria Kachorro's](https://img.shields.io/badge/Veterinaria-Kachorro's-10b981?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000000?style=for-the-badge)

## 🛠️ Stack Tecnológico

- **Framework:** React 18 + Vite
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS 3.4
- **UI Components:** shadcn/ui + Radix UI
- **Enrutamiento:** React Router DOM
- **Base de Datos (futura):** Supabase (PostgreSQL)
- **Gestor de Paquetes:** npm/pnpm/yarn

## 🚀 Configuración y Despliegue Local

### 1. Clonar e Instalar

```bash
git clone <tu-repositorio>
cd veterinaria-kachorros
npm install
```

### 2. Ejecutar el Servidor de Desarrollo

```bash
npm run dev
```

Abre http://localhost:5173 en tu navegador para ver la aplicación.

### 3. Compilar para Producción

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`.

## 📁 Estructura del Proyecto

```
src/
├── app/                      # Páginas de la aplicación (estilo Next.js App Router)
│   ├── admin/
│   │   └── catalogo/         # (HU-06) Gestión de precios e inventario
│   ├── consulta/
│   │   └── nueva/            # (HU-02, HU-09) Formulario de consulta
│   ├── dashboard/            # (HU-05) Panel principal
│   ├── expedientes/          # (HU-01, HU-08) Buscador y detalle
│   ├── login/                # (HU-10) Autenticación
│   └── recepcion/            # (HU-07) Monitor de salida
├── components/
│   ├── ui/                   # Componentes shadcn/ui
│   └── Layout.tsx            # Layout principal con navegación
├── context/
│   └── AuthContext.tsx       # Manejo de autenticación
├── data/
│   └── mockData.ts           # Datos simulados para demo
├── hooks/
│   └── useConsultas.ts       # Hooks personalizados
├── types/
│   └── index.ts              # Tipos TypeScript
└── App.tsx                   # Configuración de rutas
```

## 👥 Usuarios de Demo

El sistema incluye datos simulados para probar todas las funcionalidades (usuarios del mock, no existen en la base local):

| Rol | Email | Contraseña |
|-----|-------|------------|
| Doctora | doctora@kachorros.com | 123456 |
| Recepción | recepcion@kachorros.com | 123456 |
| Admin | admin@kachorros.com | 123456 |

Con Supabase local (Docker), la migración inicial crea un administrador real para entrar a la app:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@kachorros.com | 12345678 |

## 🎨 Paleta de Colores

El sistema utiliza una paleta vibrante y amigable:

- **Púrpura** (`#a855f7`) - Color primario, creatividad y cuidado
- **Amber Gold** (`#ffbe0b`) - Acentos y alertas
- **Blaze Orange** (`#fb5607`) - Acciones importantes
- **Neon Pink** (`#ff006e`) - Badges y notificaciones
- **Blue Violet** (`#8338ec`) - Elementos administrativos
- **Azure Blue** (`#3a86ff`) - Links y navegación

## 📋 Funcionalidades

### Dashboard (HU-05)
- Resumen visual del día
- Pacientes atendidos y en espera
- Ingresos del día
- Próximas citas y alertas

### Expedientes (HU-01, HU-08)
- Búsqueda por nombre, raza, propietario o teléfono
- Filtros por especie
- Historial médico completo
- Galería de fotos de evolución
- Cartilla de vacunación

### Nueva Consulta (HU-02, HU-09)
- Formulario dinámico de consulta
- Selección de paciente
- Diagnóstico y tratamiento
- Agregado de servicios/productos
- Cálculo automático de total

### Monitor de Salida (HU-07)
- Lista en tiempo real de pacientes listos
- Detalle de receta-factura
- Botón "Terminado" para marcar salida
- Estados: Listo, Pagando, Entregado

### Gestión de Catálogo (HU-06)
- CRUD de productos y servicios
- Categorías: Servicios, Vacunas, Medicamentos, PetShop, Laboratorio
- Control de stock
- Activación/desactivación de productos

## 🗄️ Configuración de Supabase local

El desarrollo usa Supabase local en Docker. Consultá [`LOCAL-SUPABASE.md`](LOCAL-SUPABASE.md) para instalar los requisitos, levantar los contenedores, configurar `.env` y ejecutar las migraciones.

La migración inicial versionada está en `supabase/migrations/00000000000000_initial_schema.sql`. El archivo `supabase_schema.sql` se conserva como referencia del esquema completo.

### Tablas Principales

- `perfiles` - Usuarios del sistema
- `propietarios` - Dueños de mascotas
- `mascotas` - Pacientes
- `catalogo` - Productos y servicios
- `consultas` - Consultas médicas
- `detalles_consulta` - Items de cada consulta
- `vacunas` - Registro de vacunación
- `fotos_evolucion` - Fotos del paciente

## 🔒 Roles y Permisos

| Funcionalidad | Doctora | Recepción | Admin |
|--------------|---------|-----------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| Expedientes | ✅ | ❌ | ✅ |
| Nueva Consulta | ✅ | ❌ | ❌ |
| Monitor Salida | ❌ | ✅ | ✅ |
| Catálogo | ✅ | ❌ | ✅ |

## 📱 Responsive Design

El sistema está diseñado para funcionar en:
- 💻 Escritorio (1280px+)
- 📱 Tablet (768px+)
- 📱 Móvil (320px+)

## 🎯 Historias de Usuario Implementadas

- **HU-01:** Búsqueda de expedientes por nombre o teléfono
- **HU-02:** Formulario de nueva consulta con notas médicas
- **HU-05:** Dashboard con resumen del día
- **HU-06:** Gestión de catálogo de productos/servicios
- **HU-07:** Monitor de salida para recepción
- **HU-08:** Detalle de expediente con historial
- **HU-09:** Selección de productos del catálogo en consulta
- **HU-10:** Sistema de login por roles

## 📝 Licencia

Este proyecto fue desarrollado para fines educativos en la materia de Diseño de Sistemas I de la Universidad Evangelica de El Salvador (UES).

---

<p align="center">
  <strong>🐾 Veterinaria Kachorro's</strong><br>
  Cuidando con amor a tus mejores amigos
</p>
