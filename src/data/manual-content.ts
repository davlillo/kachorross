import type { ManualSession } from '@/types';

export const manualSessions: ManualSession[] = [
  // ------------------------------------------------------------------ 1. Dashboard
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Panel principal con metricas diarias, graficas, calendario y agenda.',
    icon: 'LayoutDashboard',
    route: '/dashboard',
    roles: ['doctora', 'admin'],
    steps: [
      {
        id: 'dash-stats',
        title: 'Metricas del dia',
        description: 'Cuatro tarjetas con los indicadores clave del dia.',
        screenshot: 'dashboard.png',
        hotspots: [
          { id: 'dh-cards', x: 22, y: 8, width: 74, height: 14, title: 'Tarjetas de metricas', description: 'Pacientes atendidos hoy, Pacientes en espera, Ingresos del dia y Consultas pendientes. Cada tarjeta tiene icono, numero grande y tendencia.' },
          { id: 'dh-charts', x: 22, y: 26, width: 74, height: 22, title: 'Graficas de actividad', description: 'Grafico de barras y area con consultas e ingresos. Botones Semana/Mes para cambiar el periodo. Datos en tiempo real.' },
        ],
      },
      {
        id: 'dash-calendar',
        title: 'Calendario y agenda',
        description: 'Calendario mensual con eventos y agenda del dia seleccionado.',
        screenshot: 'dashboard.png',
        hotspots: [
          { id: 'dh-cal', x: 22, y: 52, width: 44, height: 38, title: 'Calendario mensual', description: 'Navega entre meses con las flechas < >. Cada dia muestra puntitos de colores: celeste=control, verde=vacuna, naranja=desparasitante, rojo=urgencia. Click en un dia para ver su agenda.' },
          { id: 'dh-agenda', x: 68, y: 52, width: 28, height: 38, title: 'Agenda del dia', description: 'Eventos del dia seleccionado. Boton + para crear nuevo evento (control, vacuna, desparasitante o urgencia). Completa titulo, hora, mascota y notas.' },
          { id: 'dh-leyenda', x: 22, y: 48, width: 30, height: 4, title: 'Leyenda de colores', description: 'Cuatro tipos de eventos con su color: Control (celeste), Vacuna (verde), Desparasitante (naranja), Urgencia (rojo).' },
        ],
      },
      {
        id: 'dash-sidebar',
        title: 'Barra lateral',
        description: 'La navegacion principal de la aplicacion.',
        screenshot: 'dashboard.png',
        hotspots: [
          { id: 'dh-logo', x: 1, y: 2, width: 16, height: 12, title: 'Logo y nombre', description: 'Nombre de la veterinaria con logo (huella o imagen personalizada). El nombre cambia segun la clinica.' },
          { id: 'dh-nav', x: 1, y: 17, width: 16, height: 56, title: 'Menu de navegacion', description: 'Dashboard, Expedientes, Nueva Consulta, Recepcion, Catalogo, Usuarios y Manual. Cada rol ve solo sus opciones. El item activo se resalta con gradiente.' },
          { id: 'dh-user', x: 1, y: 86, width: 16, height: 14, title: 'Area de usuario', description: 'Tu avatar, nombre y rol. Boton de tema claro/oscuro (sol/luna). Click en tu nombre para ir a Perfil, Historial de Ventas, Configuracion o Cerrar Sesion.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ 2. Expedientes
  {
    id: 'expedientes',
    title: 'Expedientes',
    description: 'Listado completo de expedientes clinicos con busqueda y filtros.',
    icon: 'Search',
    route: '/expedientes',
    roles: ['doctora', 'admin'],
    steps: [
      {
        id: 'exp-header',
        title: 'Encabezado y boton Nuevo',
        description: 'La parte superior de la pagina de expedientes.',
        screenshot: 'expedientes.png',
        hotspots: [
          { id: 'el-title', x: 22, y: 5, width: 50, height: 7, title: 'Titulo y contador', description: 'Expedientes Clinicos con badge que muestra el total de pacientes registrados. Se actualiza al cargar.' },
          { id: 'el-new-btn', x: 88, y: 5, width: 10, height: 6, title: 'Nuevo Expediente', description: 'Boton con icono + para registrar una nueva mascota. Abre formulario con datos del paciente y propietario.' },
        ],
      },
      {
        id: 'exp-filters',
        title: 'Busqueda y filtros',
        description: 'Barra de busqueda y botones de filtro por especie.',
        screenshot: 'expedientes.png',
        hotspots: [
          { id: 'el-search', x: 22, y: 13, width: 48, height: 5, title: 'Barra de busqueda', description: 'Busca por nombre de mascota, propietario, raza o telefono. El filtro se aplica mientras escribis.' },
          { id: 'el-filters', x: 72, y: 13, width: 26, height: 5, title: 'Filtros por especie', description: 'Botones: Todos, Perros, Gatos. Cada boton se colorea al estar activo. Filtra la tabla instantaneamente.' },
        ],
      },
      {
        id: 'exp-table',
        title: 'Tabla de expedientes',
        description: 'Cada fila es un paciente con sus datos clave.',
        screenshot: 'expedientes.png',
        hotspots: [
          { id: 'el-table', x: 22, y: 22, width: 76, height: 72, title: 'Tabla completa', description: 'Columnas: Foto, Paciente, Especie, Propietario, Contacto, Consultas, Acciones. Click en cualquier fila para abrir el detalle completo.' },
          { id: 'el-especie-col', x: 40, y: 22, width: 8, height: 68, title: 'Columna Especie', description: 'Badge de color: azul=perro, rosa=gato, ambar=ave, verde=conejo, gris=otro. Identificacion visual rapida.' },
          { id: 'el-ver-btn', x: 94, y: 22, width: 4, height: 68, title: 'Boton Ver', description: 'Icono de flecha -> en cada fila. Te lleva al expediente completo con consultas, vacunas y fotos.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ 3. Expediente Detalle
  {
    id: 'expediente-detalle',
    title: 'Detalle de Expediente',
    description: 'Vista completa del paciente: datos, consultas, vacunas y desparasitaciones.',
    icon: 'FileText',
    route: '/expedientes/:id',
    roles: ['doctora', 'admin'],
    steps: [
      {
        id: 'ed-header',
        title: 'Datos del paciente y propietario',
        description: 'Las dos tarjetas superiores con la informacion esencial.',
        screenshot: 'expediente-detalle.png',
        hotspots: [
          { id: 'ed-back-btn', x: 22, y: 3, width: 10, height: 4, title: 'Volver', description: 'Flecha <- para regresar al listado de expedientes. Al lado muestra el nombre de la mascota.' },
          { id: 'ed-paciente-card', x: 22, y: 8, width: 34, height: 22, title: 'Ficha del paciente', description: 'Nombre, especie, raza, edad, peso y alergias. Boton de lapiz para editar. Foto de la mascota a la izquierda.' },
          { id: 'ed-propietario-card', x: 58, y: 8, width: 38, height: 22, title: 'Ficha del propietario', description: 'Nombre completo, telefono (click para llamar) y email. Boton de lapiz para editar. Validacion de formato en cada campo.' },
        ],
      },
      {
        id: 'ed-tabs',
        title: 'Pestanas de navegacion',
        description: 'El contenido se organiza en tres pestanas.',
        screenshot: 'expediente-detalle.png',
        hotspots: [
          { id: 'ed-tabs-bar', x: 22, y: 34, width: 74, height: 5, title: 'Selector de pestanas', description: 'Consultas | Vacunas y Desparasitaciones | Cartilla. Cada pestana muestra contenido diferente sin recargar. La pestana activa tiene un indicador visual.' },
        ],
      },
      {
        id: 'ed-consultas-tab',
        title: 'Pestana Consultas',
        description: 'Historial completo de consultas en linea de tiempo.',
        screenshot: 'expediente-detalle.png',
        hotspots: [
          { id: 'ed-timeline', x: 22, y: 42, width: 54, height: 52, title: 'Linea de consultas', description: 'Tarjetas apiladas con: fecha, motivo, diagnostico, tratamiento y total. La mas reciente arriba. Boton de ojo para ver detalle expandido de cada consulta.' },
          { id: 'ed-new-cons-btn', x: 78, y: 42, width: 18, height: 6, title: 'Nueva Consulta', description: 'Boton para crear una consulta para esta mascota. Te lleva al formulario con la mascota ya seleccionada.' },
        ],
      },
      {
        id: 'ed-vacunas-tab',
        title: 'Pestana Vacunas y Desparasitaciones',
        description: 'Registro de vacunas aplicadas y antiparasitarios.',
        screenshot: 'expediente-detalle.png',
        hotspots: [
          { id: 'ed-vac-list', x: 22, y: 42, width: 36, height: 48, title: 'Lista de vacunas', description: 'Cada vacuna muestra: nombre, lote, dosis, fecha de aplicacion y proxima dosis (en ambar). Boton + para agregar nueva vacuna con formulario.' },
          { id: 'ed-desp-list', x: 60, y: 42, width: 36, height: 48, title: 'Lista de desparasitaciones', description: 'Cada tratamiento muestra: tipo (interna/externa/mixta), via de administracion, fecha y proximo tratamiento. Boton + para agregar.' },
        ],
      },
      {
        id: 'ed-cartilla-tab',
        title: 'Pestana Cartilla Sanitaria',
        description: 'Vista imprimible tipo libreta con todo el historial.',
        screenshot: 'expediente-detalle.png',
        hotspots: [
          { id: 'ed-cartilla', x: 22, y: 42, width: 74, height: 52, title: 'Cartilla sanitaria', description: 'Formato libreta con slots numerados. Cada pagina muestra 12 vacunas + 6 desparasitaciones. Navega entre paginas con flechas. Los slots vacios dicen Disponible.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ 4. Nueva Consulta
  {
    id: 'nueva-consulta',
    title: 'Nueva Consulta',
    description: 'Registra una consulta clinica con diagnostico, productos y cuenta.',
    icon: 'Stethoscope',
    route: '/consulta/nueva',
    roles: ['doctora', 'admin'],
    steps: [
      {
        id: 'nc-select',
        title: 'Seleccionar paciente',
        description: 'Elegi la mascota que vas a atender.',
        screenshot: 'consulta-nueva.png',
        hotspots: [
          { id: 'nc-header-bar', x: 22, y: 4, width: 74, height: 5, title: 'Encabezado', description: 'Titulo Nueva Consulta. Si venis de un expediente, la mascota ya viene seleccionada.' },
          { id: 'nc-select-btn', x: 22, y: 10, width: 24, height: 5, title: 'Seleccionar Mascota', description: 'Boton que abre un dialogo con buscador. Escribi el nombre, elegi de la lista y confirma.' },
          { id: 'nc-paciente-card', x: 22, y: 16, width: 36, height: 14, title: 'Tarjeta del paciente', description: 'Una vez seleccionada: foto, nombre, especie, raza y propietario. Verifica que sea la mascota correcta antes de continuar.' },
        ],
      },
      {
        id: 'nc-form',
        title: 'Formulario clinico',
        description: 'Campos obligatorios para el diagnostico y tratamiento.',
        screenshot: 'consulta-nueva.png',
        hotspots: [
          { id: 'nc-motivo-field', x: 22, y: 32, width: 36, height: 5, title: 'Motivo de consulta', description: 'Campo de texto obligatorio. Ej: vomitos frecuentes, control general, vacunacion.' },
          { id: 'nc-sintomas-field', x: 22, y: 39, width: 36, height: 8, title: 'Sintomas', description: 'Area de texto multilinea. Detalla lo observado: frecuencia, intensidad, duracion.' },
          { id: 'nc-diag-field', x: 22, y: 49, width: 36, height: 8, title: 'Diagnostico', description: 'Tu conclusion clinica. Campo obligatorio. Queda en el historial permanente del paciente.' },
          { id: 'nc-trat-field', x: 22, y: 59, width: 36, height: 8, title: 'Tratamiento', description: 'Indica medicacion, dosis, cuidados. Se muestra en el historial y en la cartilla.' },
        ],
      },
      {
        id: 'nc-productos',
        title: 'Productos, servicios y total',
        description: 'Agrega productos del catalogo y mira la cuenta en tiempo real.',
        screenshot: 'consulta-nueva.png',
        hotspots: [
          { id: 'nc-add-btn', x: 60, y: 32, width: 36, height: 5, title: 'Agregar Producto', description: 'Boton que abre el catalogo completo. Busca por nombre o codigo. Selecciona productos o servicios: consulta, medicamentos, peluqueria, petshop.' },
          { id: 'nc-items-table', x: 60, y: 39, width: 36, height: 24, title: 'Detalle de cuenta', description: 'Tabla con productos agregados: cantidad (ajustable), precio unitario y subtotal. Boton X para quitar items. El total se recalcula automaticamente.' },
          { id: 'nc-total-display', x: 60, y: 65, width: 36, height: 5, title: 'Total', description: 'Suma de todos los productos y servicios. Se actualiza al instante cuando cambias cantidades o agregas/quitas productos.' },
        ],
      },
      {
        id: 'nc-guardar',
        title: 'Proxima cita y guardar',
        description: 'Programa un control futuro y registra la consulta.',
        screenshot: 'consulta-nueva.png',
        hotspots: [
          { id: 'nc-proxima-row', x: 22, y: 70, width: 36, height: 10, title: 'Proxima cita', description: 'Fecha y hora para el proximo control. Opcional. Usa el selector de fecha y el reloj para la hora. Si la completas, aparece en la agenda.' },
          { id: 'nc-notas-field', x: 22, y: 82, width: 36, height: 8, title: 'Notas adicionales', description: 'Campo opcional para notas internas que no aparecen en el historial del cliente.' },
          { id: 'nc-save-btn', x: 84, y: 88, width: 12, height: 6, title: 'Guardar Consulta', description: 'Boton principal. Requiere motivo, diagnostico y al menos un producto. Al guardar, la mascota se envia al Monitor de Salida de Recepcion.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ 5. Recepcion
  {
    id: 'recepcion',
    title: 'Recepcion',
    description: 'Monitor de salida: pacientes listos, cobro y entrega.',
    icon: 'ClipboardList',
    route: '/recepcion',
    roles: ['recepcion', 'admin'],
    steps: [
      {
        id: 'rec-header',
        title: 'Vista general del monitor',
        description: 'Encabezado con contadores de estado.',
        screenshot: 'recepcion.png',
        hotspots: [
          { id: 'rc-title', x: 22, y: 5, width: 50, height: 6, title: 'Monitor de Salida', description: 'Titulo de la seccion con badges: Listos (verde) y Pagando (ambar). Numeros en tiempo real.' },
          { id: 'rc-tabs', x: 22, y: 13, width: 74, height: 5, title: 'Pestanas', description: 'Pacientes Activos: los que estan en espera o listos. Consultas del Dia: historial de consultas finalizadas hoy.' },
        ],
      },
      {
        id: 'rec-activos',
        title: 'Pacientes activos',
        description: 'Tarjetas de cada mascota en el monitor.',
        screenshot: 'recepcion.png',
        hotspots: [
          { id: 'rc-cards', x: 22, y: 22, width: 74, height: 55, title: 'Tarjetas de pacientes', description: 'Cada tarjeta muestra: foto, nombre de mascota, propietario, total a pagar y estado (listo/pagando/entregado). Las tarjetas se organizan en grid responsive.' },
          { id: 'rc-status-badge', x: 50, y: 22, width: 10, height: 50, title: 'Indicador de estado', description: 'Badge coloreado en cada tarjeta: verde=listo para entregar, ambar=pagando, gris=entregado. Cambia de estado con los botones de accion.' },
          { id: 'rc-actions', x: 88, y: 22, width: 8, height: 50, title: 'Botones de accion', description: 'Ver detalle (ojo), Marcar como pagando, Confirmar entrega. Cada boton actualiza el estado de la mascota en el monitor.' },
        ],
      },
      {
        id: 'rec-detalle',
        title: 'Detalle de factura',
        description: 'Dialogo con el desglose completo de la cuenta.',
        screenshot: 'recepcion.png',
        hotspots: [
          { id: 'rc-dialog', x: 35, y: 25, width: 30, height: 40, title: 'Ventana de detalle', description: 'Al hacer click en Ver detalle se abre un dialogo con: datos de la mascota y propietario, tabla de productos con precios, subtotales y total. Boton Marcar como Pagado.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ 6. Catalogo
  {
    id: 'catalogo',
    title: 'Catalogo',
    description: 'Administra el inventario de productos, servicios y precios.',
    icon: 'Package',
    route: '/admin/catalogo',
    roles: ['doctora', 'admin'],
    steps: [
      {
        id: 'cat-header',
        title: 'Encabezado y nuevo producto',
        description: 'Barra superior con titulo y boton de creacion.',
        screenshot: 'catalogo.png',
        hotspots: [
          { id: 'cl-title', x: 22, y: 5, width: 50, height: 6, title: 'Gestion de Catalogo', description: 'Titulo de la seccion. Administra servicios, productos y precios del sistema.' },
          { id: 'cl-new-btn', x: 86, y: 5, width: 12, height: 6, title: 'Nuevo Producto', description: 'Boton + para crear un producto o servicio. Abre formulario con: codigo, nombre, descripcion, categoria, precio.' },
        ],
      },
      {
        id: 'cat-filters',
        title: 'Busqueda y categorias',
        description: 'Filtra el catalogo por categoria o busqueda de texto.',
        screenshot: 'catalogo.png',
        hotspots: [
          { id: 'cl-search', x: 22, y: 13, width: 40, height: 5, title: 'Barra de busqueda', description: 'Busca por nombre o codigo de producto. Resultados instantaneos.' },
          { id: 'cl-cats', x: 64, y: 13, width: 34, height: 5, title: 'Filtros por categoria', description: 'Botones: Todos, Consultas (azul), Farmacia (ambar), Peluqueria (verde), Petshop (rosa). Cada uno con su color distintivo.' },
        ],
      },
      {
        id: 'cat-table',
        title: 'Tabla de productos',
        description: 'Listado completo con codigos, nombres, precios y stock.',
        screenshot: 'catalogo.png',
        hotspots: [
          { id: 'cl-table', x: 22, y: 22, width: 76, height: 72, title: 'Tabla de productos', description: 'Columnas: Codigo, Nombre, Categoria (badge coloreado), Precio y Stock. Los productos se ordenan por codigo.' },
          { id: 'cl-precio-col', x: 56, y: 22, width: 10, height: 68, title: 'Columna Precio', description: 'Precio de venta de cada producto. Se usa para calcular totales en consultas.' },
          { id: 'cl-stock-col', x: 68, y: 22, width: 8, height: 68, title: 'Columna Stock', description: 'Cantidad disponible en inventario. Productos con stock bajo o agotado se marcan para reposicion.' },
          { id: 'cl-actions-col', x: 88, y: 22, width: 10, height: 68, title: 'Acciones', description: 'Botones para Editar (lapiz) o Desactivar (tacho) cada producto. Al editar se abre el mismo formulario prefilled. Los cambios aplican a todas las consultas nuevas.' },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ 7. Historial de Ventas
  {
    id: 'historial-ventas',
    title: 'Historial de Ventas',
    description: 'Registro completo de consultas facturadas con totales y desgloses.',
    icon: 'History',
    route: '/historial-ventas',
    roles: ['recepcion', 'admin', 'doctora'],
    steps: [
      {
        id: 'hv-header',
        title: 'Resumen de ventas',
        description: 'Tres tarjetas con totales del periodo.',
        screenshot: 'historial-ventas.png',
        hotspots: [
          { id: 'hl-title-bar', x: 22, y: 5, width: 50, height: 6, title: 'Encabezado', description: 'Titulo Historial de Ventas con badge que muestra la cantidad de registros.' },
          { id: 'hl-total-card', x: 22, y: 13, width: 24, height: 12, title: 'Total Facturado', description: 'Tarjeta con gradiente. Muestra la suma de todas las ventas del periodo en pesos.' },
          { id: 'hl-count-card', x: 48, y: 13, width: 24, height: 12, title: 'Total de Consultas', description: 'Tarjeta con gradiente. Cantidad de consultas facturadas en el periodo.' },
          { id: 'hl-avg-card', x: 74, y: 13, width: 24, height: 12, title: 'Promedio por Consulta', description: 'Tarjeta con gradiente. Promedio de ingreso por consulta facturada.' },
        ],
      },
      {
        id: 'hv-list',
        title: 'Listado de facturas',
        description: 'Todas las consultas facturadas, ordenadas por fecha.',
        screenshot: 'historial-ventas.png',
        hotspots: [
          { id: 'hl-search', x: 22, y: 28, width: 40, height: 5, title: 'Busqueda', description: 'Filtra por nombre de mascota, propietario, motivo o codigo de producto.' },
          { id: 'hl-cards', x: 22, y: 36, width: 76, height: 58, title: 'Tarjetas de factura', description: 'Cada tarjeta muestra: fecha, nombre de mascota, propietario, total y metodo de pago. Click en una tarjeta para expandir y ver el desglose de productos.' },
          { id: 'hl-expand', x: 22, y: 38, width: 76, height: 56, title: 'Desglose expandible', description: 'Al hacer click la tarjeta se expande mostrando: tabla de productos con cantidades y precios individuales, subtotales por item y total general.' },
        ],
      },
    ],
  },
];
