# Mapa de Tablas → Historias de Usuario por Sprint

## Sprint 1 — Núcleo del Sistema (37 pts)

### Seguridad

| HU | Descripción | Tablas usadas | Detalle |
|---|---|---|---|
| **HU-27** | Autenticación con login seguro | `auth.users`, `perfiles` | `auth.users` (Supabase Auth) maneja el login. El trigger `on_auth_user_created` crea automáticamente el perfil en `perfiles` al registrarse. |
| **HU-28** | Gestión de roles y permisos | `perfiles`, RLS policies | `perfiles.rol` almacena el rol (`doctora`, `recepcion`, `admin`). Las RLS policies de cada tabla restringen acceso según `auth.uid()` y el rol. |
| **HU-29** | Registro y administración de usuarios | `auth.users`, `perfiles` | Admin crea usuarios desde Supabase Auth. `perfiles.activo` permite desactivar cuentas sin eliminar. |

### Gestión Clínica

| HU | Descripción | Tablas usadas | Detalle |
|---|---|---|---|
| **HU-01** | Registro de expediente de mascota | `propietarios`, `mascotas` | Se inserta en `propietarios` primero (si no existe), luego en `mascotas` con `propietario_id`. `ON DELETE RESTRICT` evita borrar dueño con mascotas activas. |
| **HU-02** | Búsqueda y filtrado de expedientes | `mascotas`, `propietarios`, función `buscar_expedientes()` | Función SQL que busca por nombre de mascota, dueño o teléfono con `ILIKE`. Filtra solo `mascotas.activo = true`. |

### Pre-Facturación

| HU | Descripción | Tablas usadas | Detalle |
|---|---|---|---|
| **HU-10** | Selección de servicios y productos del catálogo | `catalogo` | `catalogo.activo = true` muestra solo items disponibles. Las categorías (`servicio`, `vacuna`, `medicamento`, `petshop`, `laboratorio`, `peluqueria`) permiten filtrar. |
| **HU-11** | Generación de receta-factura digital | `consultas`, `detalles_consulta` | Se crea `consultas` con `estado = 'pendiente'` y los items en `detalles_consulta`. El trigger `update_consulta_total_trigger` calcula el total automáticamente. |
| **HU-13** | Envío en tiempo real de pre-factura a recepción | `consultas`, `detalles_consulta`, Realtime | `consultas.estado` cambia a `'en_recepcion'`. `supabase_realtime` publica los cambios para que la secretaria los vea en vivo. |
| **HU-14** | Visualización de cobros pendientes | `consultas`, `detalles_consulta` | Se filtran `consultas` donde `estado IN ('pendiente', 'en_recepcion')`. La actualización automática viene vía Realtime. |

---

## Sprint 2 — Historial Clínico y Notificaciones (37 pts)

### Gestión Clínica

| HU | Descripción | Tablas usadas | Detalle |
|---|---|---|---|
| **HU-03** | Historial cronológico de consultas | `consultas`, `vacunas`, `desparasitaciones` | Se consultan las 3 tablas por `mascota_id` ordenadas por fecha descendente. Cada tipo tiene indicador visual diferente. |
| **HU-04** | Registro de vacunas en el expediente | `vacunas`, `consultas` | Se inserta en `vacunas` con `mascota_id`, `fecha_aplicacion`, `fecha_proxima_dosis`. Opcionalmente vinculado a una `consulta_id`. |
| **HU-05** | Registro de desparasitaciones | `desparasitaciones`, `consultas` | Tabla separada de vacunas con campos específicos: `tipo`, `via_administracion`, `fecha_proximo_tratamiento`. |
| **HU-06** | Perfil del dueño con listado de mascotas | `propietarios`, `mascotas` | JOIN de `propietarios` → `mascotas` donde `propietario_id`. Editar `propietarios` no afecta `mascotas`. |
| **HU-08** | Ver detalle de una consulta anterior | `consultas`, `detalles_consulta`, `fotos_evolucion` | JOIN de las 3 tablas por `consulta_id`. Vista de solo lectura. |

### Pre-Facturación

| HU | Descripción | Tablas usadas | Detalle |
|---|---|---|---|
| **HU-12** | Inserción manual de productos no catalogados | `detalles_consulta` | `producto_id` es nullable y `nombre_personalizado` permite agregar items sin estar en `catalogo`. |
| **HU-15** | Marcar pre-factura como procesada | `consultas` | `consultas.estado` cambia de `'en_recepcion'` a `'pagada'` cuando la secretaria cobra. |
| **HU-18** | Registro de cita de seguimiento post-consulta | `consultas` | `consultas.proxima_cita` (TIMESTAMP) almacena la fecha y hora de la próxima cita. |

### Notificaciones

| HU | Descripción | Tablas usadas | Detalle |
|---|---|---|---|
| **HU-19** | Envío automático de recordatorios por correo | `consultas`, `mascotas`, `propietarios`, `notificaciones` | Un cron job consulta `consultas` con `proxima_cita` próxima a 24h, obtiene el email del dueño vía `mascotas → propietarios`, envía con Resend y registra en `notificaciones`. |
| **HU-20** | Registro del estado de entrega de notificaciones | `notificaciones` | Cada envío se registra con: `destinatario_email`, `tipo_notificacion`, `fecha_envio`, `estado` (enviado/entregado/fallido/pendiente), `codigo_error`. |
| **HU-21** | Confirmación de cita por correo al cliente | `notificaciones`, `consultas`, `propietarios` | Al crear/actualizar `consultas.proxima_cita`, se envía email de confirmación y se registra en `notificaciones` con `tipo_notificacion = 'confirmacion'`. |

### Dashboard

| HU | Descripción | Tablas usadas | Detalle |
|---|---|---|---|
| **HU-22** | Dashboard de actividades diarias | función `get_dashboard_stats()`, función `get_citas_dia()` | `get_dashboard_stats` cuenta pacientes/ingresos del día. `get_citas_dia` lista las citas programadas con hora, mascota y propietario. |

---

## Sprint 3 — Complementos y Cierre (36 pts)

### Gestión Clínica

| HU | Descripción | Tablas usadas | Detalle |
|---|---|---|---|
| **HU-07** | Adjuntar fotografías al historial clínico | `fotos_evolucion` | Cada foto se vincula a `mascota_id` y `consulta_id`. Almacena URL, fecha y descripción. |
| **HU-09** | Exportar historial clínico en PDF | función `get_historial_completo()` | Función que retorna datos de mascota + dueño + vacunas + desparasitaciones en JSON para armar el PDF desde la app. |

### Pre-Facturación

| HU | Descripción | Tablas usadas | Detalle |
|---|---|---|---|
| **HU-16** | Agregar y editar ítems del catálogo | `catalogo` | CRUD completo sobre `catalogo`. Los cambios se reflejan inmediatamente en prefacturación. |
| **HU-17** | Dar de baja ítems del catálogo | `catalogo` | Soft-delete: `catalogo.activo = false`. Los items desactivados no aparecen en nuevas consultas pero el historial se conserva. |

### Gestión Administrativa

| HU | Descripción | Tablas usadas | Detalle |
|---|---|---|---|
| **HU-23** | Reporte de atenciones del día exportable PDF | función `get_reporte_atenciones()` | Función que agrupa `consultas` por fecha con conteo de atenciones e ingresos totales en un rango. |
| **HU-24** | Landing Page informativa de la clínica | No usa BD | Página web estática (HTML/CSS). No requiere tabla. |
| **HU-25** | Registro de servicio de hospedaje | `hospedajes`, `mascotas` | Se inserta en `hospedajes` con `mascota_id`, fechas, tarifa diaria. `estado = 'activo'` mientras la mascota está alojada. |
| **HU-26** | Generación de cargo de hospedaje en pre-factura | `hospedajes` (trigger), `consultas` | Al finalizar el hospedaje (`estado = 'finalizado'`), el trigger `update_hospedaje_cargo_trigger` calcula `total_cargo = días × tarifa_diaria`. Se vincula a la consulta de salida. |

---

## Resumen Visual

```
┌──────────────────────────────────────────────────────────┐
│                     auth.users (Supabase)                 │
│                          │                                │
│                      perfiles                             │
│                     (roles + RLS)                         │
└──────────────────────────────────────────────────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│  propietarios │  │   catalogo   │  │   hospedajes     │
│       │       │  │  (6 cats)    │  │ (HU-25, HU-26)   │
│       ▼       │  └──────────────┘  └──────────────────┘
│   mascotas    │         │
│ (HU-01, HU-02)│         ▼
│       │       │  ┌──────────────┐
│       ├───────┼──┤  consultas   │
│       │       │  │ (HU-11,13,   │
│       ▼       │  │  14,15,18)   │
│  vacunas      │  │       │      │
│ (HU-04)       │  │       ▼      │
│               │  │detalles_cons.│
│  desparasit.  │  │ (HU-11,12)   │
│ (HU-05)       │  └──────────────┘
│               │         │
│  fotos_evol.  │  ┌──────────────┐
│ (HU-07)       │  │notificaciones│
└──────────────┘  │ (HU-19,20,21) │
                  └──────────────┘
```

**Funciones auxiliares:**
- `buscar_expedientes()` → HU-02
- `get_dashboard_stats()` → HU-22
- `get_citas_dia()` → HU-22
- `get_historial_completo()` → HU-09
- `get_reporte_atenciones()` → HU-23

**Triggers:**
- `update_consulta_total_trigger` → HU-11
- `update_hospedaje_cargo_trigger` → HU-26
- `on_auth_user_created` → HU-27
