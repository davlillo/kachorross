# Kachorros — Sprint 3

## 1. Datos generales

| Campo | Información |
|---|---|
| Proyecto de Jira | DSI215-veterinaria (`DV`), tablero **DV board** |
| Sprint | Sprint 3 (`id: 3`) |
| Estado | Activo |
| Inicio registrado | 23 de septiembre de 2026 |
| Cierre programado | 24 de octubre de 2026 |
| Objetivo | Incorporar funcionalidades complementarias del sistema, habilitando la gestión de hospedaje, el mantenimiento avanzado del catálogo, la exportación de reportes e historiales en PDF y la presentación pública de la Landing Page. |
| Alcance | 9 historias de usuario, 47 puntos estimados |

> **Identificación:** Jira no tiene un proyecto llamado literalmente “Kachorros”; el tablero consultado es **DV board**, dentro del proyecto **DSI215-veterinaria**. Este documento corresponde a ese tablero y Sprint 3.

## 2. Estado del sprint al consultar Jira

| Indicador | Resultado |
|---|---:|
| Historias incluidas | 9 |
| Finalizadas | 3 (33 %) |
| En curso | 6 |
| Por hacer | 0 |
| Puntos estimados totales | 47 |
| Puntos de historias finalizadas | 15 |
| Puntos aún en curso | 32 |

Jira también marcó **5 historias en curso como “at risk” por falta de actualización reciente**: DV-12, DV-19, DV-20, DV-31 y DV-36. Es una señal automática de seguimiento, no una confirmación de bloqueo.

## 3. Historias incluidas

### 3.1 DV-10 — HU-07: Adjuntar fotografías al historial clínico

- **Estado:** Finalizada
- **Responsable:** Yajaira Nicole Argueta Sibrian
- **Épica:** Gestión Clínica (Expedientes)
- **Estimación:** 5 puntos
- **Historia:** Como veterinaria o veterinario, quiero adjuntar fotografías al expediente de una mascota para documentar visualmente heridas, tratamientos o evoluciones y dar seguimiento al paciente.

**Criterios de aceptación**

1. Aceptar imágenes JPG y PNG de hasta 5 MB por archivo.
2. Mostrar miniaturas en el historial cronológico y asociarlas a la consulta correspondiente.
3. Permitir agregar un pie de foto o una descripción breve a cada imagen.
4. Vincular cada fotografía con la consulta específica en la que fue cargada.

[Jira: DV-10](https://as22027.atlassian.net/browse/DV-10)

### 3.2 DV-12 — HU-09: Exportar historial clínico en PDF

- **Estado:** En curso
- **Responsable:** Ricardo David Salinas Barrientos
- **Épica:** Gestión Clínica (Expedientes)
- **Estimación:** 5 puntos
- **Historia:** Como veterinaria o veterinario, quiero exportar en PDF el historial clínico completo de una mascota para compartirlo con otros especialistas o entregarlo al dueño de forma rápida y profesional.

**Criterios de aceptación**

1. Incluir en el PDF los datos de la mascota, del dueño y el historial completo de consultas.
2. Incluir el logo y los datos de la clínica en el encabezado.
3. Permitir descargar el archivo directamente desde el expediente con un clic.
4. Generar el nombre del archivo con el formato `Expediente_[Nombre Mascota]_[Fecha].pdf`.

[Jira: DV-12](https://as22027.atlassian.net/browse/DV-12)

### 3.3 DV-19 — HU-16: Agregar y editar ítems del catálogo

- **Estado:** En curso
- **Responsable:** Karla Gissell Girón Martinez
- **Épica:** Pre-Facturación y Consulta
- **Estimación:** 5 puntos
- **Historia:** Como veterinaria, veterinario o administrador, quiero agregar servicios o medicamentos y editar los existentes para mantener actualizados los precios y descripciones del módulo de prefacturación.

**Criterios de aceptación**

1. Registrar nombre, categoría (servicio o medicamento), descripción opcional y precio unitario.
2. Reflejar de inmediato los cambios de nombre o precio en el catálogo, sin reiniciar sesión.
3. Solicitar confirmación antes de guardar cambios sobre un ítem existente.

[Jira: DV-19](https://as22027.atlassian.net/browse/DV-19)

### 3.4 DV-20 — HU-17: Dar de baja ítems del catálogo

- **Estado:** En curso
- **Responsable:** Sergio David Hernández García
- **Épica:** Pre-Facturación y Consulta
- **Estimación:** 3 puntos
- **Historia:** Como veterinaria, veterinario o administrador, quiero desactivar productos o servicios sin eliminarlos permanentemente para que no se usen en nuevas prefacturas y se conserve su historial para reportes.

**Criterios de aceptación**

1. Ofrecer una opción **Desactivar** para cada ítem en la pantalla de gestión del catálogo.
2. Excluir los ítems desactivados de la selección al crear una prefactura.
3. Permitir reactivar un ítem previamente desactivado.

[Jira: DV-20](https://as22027.atlassian.net/browse/DV-20)

### 3.5 DV-35 — HU-24: Landing Page informativa de la clínica

- **Estado:** Finalizada
- **Responsable:** Yajaira Nicole Argueta Sibrian
- **Épica:** Gestión Administrativa
- **Estimación:** 5 puntos
- **Historia:** Como administrador, quiero una página web informativa de la veterinaria accesible desde Internet para atraer clientes y presentar profesionalmente los servicios, el equipo médico y la reputación del negocio.

**Criterios de aceptación**

1. Incluir secciones de servicios, equipo médico, galería de fotos y contacto.
2. Mostrar de forma visible el teléfono y el enlace a la ubicación en Google Maps.
3. Adaptarse correctamente a dispositivos móviles y de escritorio.

[Jira: DV-35](https://as22027.atlassian.net/browse/DV-35)

### 3.6 DV-30 — HU-25: Registro del servicio de hospedaje de mascotas

- **Estado:** Finalizada
- **Responsable:** Ricardo David Salinas Barrientos
- **Épica:** Gestión Administrativa
- **Estimación:** 5 puntos
- **Historia:** Como veterinaria, veterinario o administrador, quiero registrar el ingreso y egreso de mascotas en hospedaje para controlar quiénes están alojados, durante cuánto tiempo y qué cuidados especiales necesitan.

**Criterios de aceptación**

1. Registrar mascota, dueño, fecha de ingreso, fecha estimada de salida y observaciones especiales de cuidado.
2. Mostrar las mascotas actualmente hospedadas y los días transcurridos desde su ingreso.
3. Documentar la salida del hospedaje en el historial clínico de la mascota.
4. Generar automáticamente el cargo por hospedaje en la prefactura al registrar la salida.

[Jira: DV-30](https://as22027.atlassian.net/browse/DV-30)

### 3.7 DV-31 — HU-26: Generación del cargo de hospedaje en prefactura

- **Estado:** En curso
- **Responsable:** Sergio David Hernández García
- **Épica:** Gestión Administrativa
- **Estimación:** 3 puntos
- **Historia:** Como administrador, quiero que al registrar la salida de una mascota se calcule automáticamente el cargo de hospedaje para agilizar el cobro y evitar errores de cálculo.

**Criterios de aceptación**

1. Calcular los días de hospedaje y multiplicarlos por la tarifa diaria configurada.
2. Incluir automáticamente el cargo en la prefactura enviada a recepción al registrar la salida.
3. Permitir ajustar manualmente el cargo antes de enviarlo a recepción cuando exista un descuento o excepción.

[Jira: DV-31](https://as22027.atlassian.net/browse/DV-31)

### 3.8 DV-36 — HU-30: Exportación de mascotas

- **Estado:** En curso
- **Responsable:** Karla Gissell Girón Martinez
- **Épica:** Gestión Clínica (Expedientes)
- **Estimación:** 8 puntos
- **Historia:** Como veterinaria o veterinario, quiero registrar y administrar trámites de exportación mediante plantillas regionales para controlar requisitos sanitarios, costos, fechas y documentos necesarios para el viaje de una mascota.

**Criterios de aceptación**

1. Iniciar el trámite desde el expediente de la mascota e indicar destino, fechas, veterinario responsable, observaciones y presupuesto; también consultar trámites previos o registrar uno nuevo.
2. Seleccionar una plantilla para Estados Unidos, Europa o Suramérica y mostrar cada paso sanitario como **Cumplido** o **Pendiente**.
3. Generar y descargar un certificado de salud PDF con logo y datos de la clínica, propietario, mascota, destino, requisitos sanitarios, observaciones y espacio para firma y sello del veterinario.

[Jira: DV-36](https://as22027.atlassian.net/browse/DV-36)

### 3.9 DV-37 — HU-31: Envío de documentación de exportación

- **Estado:** En curso
- **Responsable:** Yajaira Nicole Argueta Sibrian
- **Épica:** Gestión Clínica (Expedientes)
- **Estimación:** 8 puntos
- **Historia:** Como sistema o veterinaria, quiero enviar al dueño por correo electrónico la documentación generada para la exportación de su mascota para que reciba a tiempo los documentos requeridos y evite retrasos en su viaje.

**Criterios de aceptación**

1. Habilitar **Enviar documentación** únicamente cuando el trámite de exportación de HU-30 esté completo o aprobado.
2. Permitir elegir los documentos adjuntos: certificados de salud, cartilla de vacunación y resultados de laboratorio.
3. Registrar en el expediente la fecha, hora y dirección de correo a la que se enviaron los documentos.

[Jira: DV-37](https://as22027.atlassian.net/browse/DV-37)

## 4. Agrupación por línea de trabajo

| Línea | Historias | Estado observado |
|---|---|---|
| Expediente clínico y documentos | DV-10, DV-12 | Una finalizada y una en curso |
| Catálogo para prefacturación | DV-19, DV-20 | Ambas en curso |
| Hospedaje y cobro | DV-30, DV-31 | Una finalizada y una en curso |
| Sitio público | DV-35 | Finalizada |
| Exportación y comunicación de documentos | DV-36, DV-37 | Ambas en curso |

## 5. Dependencias funcionales que se desprenden de las historias

- **DV-31 se apoya en el registro de hospedaje y su salida definidos en DV-30** para calcular y enviar el cargo a prefactura.
- **DV-37 depende del estado del trámite de DV-36**: el envío se habilita solo cuando el trámite está completo o aprobado.

Estas relaciones se desprenden de los criterios de aceptación; no se verificaron como enlaces formales de dependencia en Jira.

## 6. Fuentes y alcance de la consulta

- Proyecto y tablero: `DSI215-veterinaria` (`DV`), **DV board**.
- Sprint consultado: `Sprint 3`, id `3`, estado activo.
- Consulta de historias: Jira JQL `project = DV AND sprint = 3 ORDER BY Rank ASC`.
- Se incluyeron las 9 historias devueltas por Jira, sus descripciones, criterios de aceptación, responsables, épicas, estimaciones y estado.
- El estado y la métrica de riesgo representan una captura al momento de consultar Jira; pueden cambiar cuando el equipo actualice el tablero.
