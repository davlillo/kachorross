import type { ManualSession } from '@/types';

export const manualSessions: ManualSession[] = [
  // ─── 1. Dashboard ───
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Panel principal con métricas diarias y pacientes en espera.',
    icon: 'LayoutDashboard',
    route: '/dashboard',
    roles: ['doctora', 'admin'],
    steps: [
      {
        id: 'dash-overview',
        title: 'Vista general',
        description: 'El dashboard te muestra de un vistazo las métricas más importantes del día.',
        screenshot: 'dashboard.png',
        hotspots: [
          { id: 'dh-stats', x: 8, y: 22, width: 42, height: 22, title: 'Métricas del día', description: 'Pacientes atendidos hoy, en espera, ingresos y consultas pendientes. Cada tarjeta se actualiza en tiempo real.' },
          { id: 'dh-monitor', x: 55, y: 22, width: 38, height: 40, title: 'Monitor de salida', description: 'Mascotas listas para entregar. Podés marcar el estado de cada paciente: listo, pagando o entregado.' },
        ],
      },
      {
        id: 'dash-filters',
        title: 'Filtros y búsqueda',
        description: 'Usá los filtros para encontrar rápidamente lo que necesitás.',
        screenshot: 'dashboard.png',
        hotspots: [
          { id: 'dh-search', x: 8, y: 48, width: 30, height: 10, title: 'Barra de búsqueda', description: 'Escribí el nombre de una mascota o propietario para filtrar resultados al instante.' },
          { id: 'dh-status', x: 42, y: 48, width: 20, height: 10, title: 'Filtro por estado', description: 'Filtrá consultas por pendiente o finalizado. Ideal para ver solo lo que falta atender.' },
        ],
      },
      {
        id: 'dash-nav',
        title: 'Navegación rápida',
        description: 'Desde la barra lateral accedés a todas las secciones en un clic.',
        screenshot: 'dashboard.png',
        hotspots: [
          { id: 'dh-sidebar', x: 0, y: 20, width: 18, height: 72, title: 'Menú lateral', description: 'Dashboard, Expedientes, Nueva Consulta, Recepción, Catálogo. Cada rol ve solo sus opciones.' },
          { id: 'dh-user', x: 0, y: 88, width: 18, height: 12, title: 'Perfil de usuario', description: 'Tu avatar, nombre y rol. Clic para acceder a tu perfil, cambiar tema o cerrar sesión.' },
        ],
      },
      {
        id: 'dash-mobile',
        title: 'Versión móvil',
        description: 'En pantallas chicas, el menú se colapsa en un botón hamburguesa.',
        screenshot: 'dashboard.png',
        hotspots: [
          { id: 'dh-hamburger', x: 88, y: 3, width: 8, height: 8, title: 'Menú móvil', description: 'Tocá el ícono de las tres rayas para desplegar la navegación completa.' },
        ],
      },
    ],
  },

  // ─── 2. Expedientes (lista) ───
  {
    id: 'expedientes',
    title: 'Expedientes',
    description: 'Listado completo de expedientes clínicos con búsqueda y filtros.',
    icon: 'Search',
    route: '/expedientes',
    roles: ['doctora', 'admin'],
    steps: [
      {
        id: 'exp-list',
        title: 'Listado de expedientes',
        description: 'Acá ves todos los expedientes registrados en tu clínica.',
        screenshot: 'expedientes.png',
        hotspots: [
          { id: 'el-table', x: 4, y: 22, width: 92, height: 50, title: 'Tabla de expedientes', description: 'Cada fila muestra mascota, propietario, especie y cantidad de consultas. Clic en cualquier fila para ver el detalle completo.' },
          { id: 'el-new', x: 80, y: 8, width: 16, height: 8, title: 'Nuevo expediente', description: 'Botón para registrar una nueva mascota con sus datos y propietario.' },
        ],
      },
      {
        id: 'exp-search',
        title: 'Búsqueda y filtros',
        description: 'Encontrá cualquier expediente en segundos.',
        screenshot: 'expedientes.png',
        hotspots: [
          { id: 'el-searchbar', x: 4, y: 14, width: 40, height: 8, title: 'Buscador', description: 'Escribí el nombre de la mascota o propietario. El filtro es instantáneo.' },
          { id: 'el-filter', x: 48, y: 14, width: 16, height: 8, title: 'Filtro por especie', description: 'Filtrá por perro, gato, ave, conejo u otros.' },
        ],
      },
      {
        id: 'exp-detail-link',
        title: 'Acceso al detalle',
        description: 'Cada expediente te lleva a una vista completa.',
        screenshot: 'expedientes.png',
        hotspots: [
          { id: 'el-click', x: 20, y: 35, width: 25, height: 8, title: 'Ver detalle', description: 'Hacé clic en cualquier fila para abrir el expediente completo con consultas, vacunas y fotos.' },
        ],
      },
    ],
  },

  // ─── 3. Expediente detalle ───
  {
    id: 'expediente-detalle',
    title: 'Detalle de Expediente',
    description: 'Vista completa de un expediente: datos, consultas, vacunas y evolución.',
    icon: 'FileText',
    route: '/expedientes/:id',
    roles: ['doctora', 'admin'],
    steps: [
      {
        id: 'ed-header',
        title: 'Encabezado del expediente',
        description: 'Datos principales de la mascota y su propietario.',
        screenshot: 'expediente-detalle.png',
        hotspots: [
          { id: 'ed-mascota', x: 4, y: 15, width: 30, height: 25, title: 'Info de la mascota', description: 'Nombre, especie, raza, edad, peso, alergias. Todo lo esencial en un solo lugar.' },
          { id: 'ed-propietario', x: 38, y: 15, width: 30, height: 25, title: 'Datos del propietario', description: 'Nombre, teléfono y email del dueño. Podés contactarlo directamente desde acá.' },
        ],
      },
      {
        id: 'ed-consultas',
        title: 'Historial de consultas',
        description: 'Línea de tiempo con todas las consultas registradas.',
        screenshot: 'expediente-detalle.png',
        hotspots: [
          { id: 'ed-timeline', x: 4, y: 42, width: 65, height: 30, title: 'Línea de consultas', description: 'Cada consulta muestra fecha, motivo, diagnóstico y tratamiento. La más reciente aparece primero.' },
          { id: 'ed-nueva-consulta', x: 72, y: 42, width: 24, height: 8, title: 'Nueva consulta', description: 'Botón rápido para iniciar una consulta para esta mascota.' },
        ],
      },
      {
        id: 'ed-vacunas',
        title: 'Vacunas y desparasitaciones',
        description: 'Registro completo de vacunas y tratamientos antiparasitarios.',
        screenshot: 'expediente-detalle.png',
        hotspots: [
          { id: 'ed-vac', x: 4, y: 55, width: 45, height: 20, title: 'Calendario de vacunas', description: 'Vacunas aplicadas con fechas, dosis y próximas aplicaciones.' },
          { id: 'ed-desp', x: 52, y: 55, width: 45, height: 20, title: 'Desparasitaciones', description: 'Registro de cada tratamiento con tipo, vía y fecha de administración.' },
        ],
      },
      {
        id: 'ed-fotos',
        title: 'Fotos de evolución',
        description: 'Seguimiento visual del paciente a lo largo del tiempo.',
        screenshot: 'expediente-detalle.png',
        hotspots: [
          { id: 'ed-galeria', x: 4, y: 78, width: 50, height: 18, title: 'Galería de evolución', description: 'Subí fotos para documentar la evolución de heridas, pelaje o condición general.' },
        ],
      },
      {
        id: 'ed-navigation',
        title: 'Navegación entre secciones',
        description: 'El detalle está organizado en pestañas para acceso rápido.',
        screenshot: 'expediente-detalle.png',
        hotspots: [
          { id: 'ed-tabs', x: 4, y: 38, width: 70, height: 6, title: 'Pestañas de navegación', description: 'Consultas, Vacunas, Fotos. Cambiá de sección sin perder el contexto del paciente.' },
          { id: 'ed-back', x: 4, y: 5, width: 10, height: 6, title: 'Volver a la lista', description: 'Botón para regresar al listado completo de expedientes.' },
        ],
      },
    ],
  },

  // ─── 4. Nueva Consulta ───
  {
    id: 'nueva-consulta',
    title: 'Nueva Consulta',
    description: 'Registrá una consulta clínica con diagnóstico, tratamiento y productos.',
    icon: 'Stethoscope',
    route: '/consulta/nueva',
    roles: ['doctora', 'admin'],
    steps: [
      {
        id: 'nc-paciente',
        title: 'Selección de paciente',
        description: 'Elegí la mascota que vas a atender.',
        screenshot: 'consulta-nueva.png',
        hotspots: [
          { id: 'nc-select', x: 4, y: 18, width: 40, height: 12, title: 'Selector de paciente', description: 'Buscá por nombre de mascota o propietario. Si no existe, podés crear un nuevo expediente.' },
        ],
      },
      {
        id: 'nc-diagnostico',
        title: 'Motivo y diagnóstico',
        description: 'Registrá el motivo de consulta, síntomas y diagnóstico.',
        screenshot: 'consulta-nueva.png',
        hotspots: [
          { id: 'nc-motivo', x: 4, y: 34, width: 45, height: 8, title: 'Motivo de consulta', description: 'Describí brevemente por qué traen a la mascota.' },
          { id: 'nc-sintomas', x: 4, y: 44, width: 45, height: 8, title: 'Síntomas', description: 'Listá los síntomas observados. Sé específico para un mejor historial.' },
          { id: 'nc-diag', x: 4, y: 54, width: 45, height: 8, title: 'Diagnóstico', description: 'Tu conclusión clínica. Este campo aparece en el historial del paciente.' },
        ],
      },
      {
        id: 'nc-tratamiento',
        title: 'Tratamiento y productos',
        description: 'Agregá productos y servicios aplicados durante la consulta.',
        screenshot: 'consulta-nueva.png',
        hotspots: [
          { id: 'nc-trat', x: 4, y: 64, width: 45, height: 12, title: 'Tratamiento', description: 'Indicá el tratamiento, medicación o procedimiento realizado.' },
          { id: 'nc-addprod', x: 52, y: 44, width: 44, height: 12, title: 'Agregar producto', description: 'Seleccioná productos del catálogo (medicamentos, alimentos, accesorios). Se calcula el subtotal automáticamente.' },
        ],
      },
      {
        id: 'nc-total',
        title: 'Resumen y total',
        description: 'Revisá el total antes de finalizar la consulta.',
        screenshot: 'consulta-nueva.png',
        hotspots: [
          { id: 'nc-summary', x: 52, y: 64, width: 44, height: 20, title: 'Resumen de cuenta', description: 'Lista de productos con precios. El total se actualiza automáticamente.' },
          { id: 'nc-proxima', x: 4, y: 80, width: 40, height: 8, title: 'Próxima cita', description: 'Programá un control futuro. La fecha queda registrada en el expediente.' },
        ],
      },
      {
        id: 'nc-finalizar',
        title: 'Finalizar consulta',
        description: 'Guardá la consulta y actualizá el estado.',
        screenshot: 'consulta-nueva.png',
        hotspots: [
          { id: 'nc-save', x: 80, y: 88, width: 16, height: 8, title: 'Guardar consulta', description: 'Botón para registrar la consulta. La mascota aparece en el monitor de salida si corresponde.' },
        ],
      },
    ],
  },

  // ─── 5. Recepción ───
  {
    id: 'recepcion',
    title: 'Recepción',
    description: 'Gestión de pacientes en sala de espera y cobro de consultas.',
    icon: 'ClipboardList',
    route: '/recepcion',
    roles: ['recepcion', 'admin'],
    steps: [
      {
        id: 'rec-monitor',
        title: 'Monitor de pacientes',
        description: 'Vista en tiempo real de las mascotas en espera y listas para entregar.',
        screenshot: 'recepcion.png',
        hotspots: [
          { id: 'rc-pending', x: 4, y: 22, width: 30, height: 30, title: 'En espera', description: 'Pacientes que están siendo atendidos o aguardando consulta.' },
          { id: 'rc-ready', x: 38, y: 22, width: 30, height: 30, title: 'Listos para entregar', description: 'Mascotas cuyo tratamiento finalizó. Avisá al propietario que puede pasar a retirar.' },
          { id: 'rc-delivered', x: 72, y: 22, width: 24, height: 30, title: 'Entregados', description: 'Pacientes que ya fueron retirados. El registro queda para facturación.' },
        ],
      },
      {
        id: 'rec-cobro',
        title: 'Cobro de consulta',
        description: 'Procesá el pago y generá el comprobante.',
        screenshot: 'recepcion.png',
        hotspots: [
          { id: 'rc-bill', x: 38, y: 58, width: 30, height: 18, title: 'Detalle de factura', description: 'Resumen de productos y servicios con total. Confirmá el cobro y marcá como pagado.' },
          { id: 'rc-confirm', x: 72, y: 58, width: 24, height: 12, title: 'Confirmar entrega', description: 'Marcá como entregado cuando el propietario retire a la mascota.' },
        ],
      },
      {
        id: 'rec-historial',
        title: 'Historial de ventas',
        description: 'Consultá ventas anteriores desde Recepción.',
        screenshot: 'recepcion.png',
        hotspots: [
          { id: 'rc-history', x: 4, y: 85, width: 20, height: 8, title: 'Acceso a historial', description: 'Link rápido al historial completo de ventas y cobros.' },
        ],
      },
    ],
  },

  // ─── 6. Catálogo ───
  {
    id: 'catalogo',
    title: 'Catálogo de Productos',
    description: 'Administrá el inventario de productos, servicios y precios.',
    icon: 'Package',
    route: '/admin/catalogo',
    roles: ['doctora', 'admin'],
    steps: [
      {
        id: 'cat-list',
        title: 'Listado de productos',
        description: 'Vista completa del catálogo con categorías y precios.',
        screenshot: 'catalogo.png',
        hotspots: [
          { id: 'cl-table', x: 4, y: 20, width: 92, height: 48, title: 'Tabla de productos', description: 'Cada producto muestra código, nombre, categoría, precio y stock. Usá los filtros para navegar.' },
          { id: 'cl-new', x: 80, y: 8, width: 16, height: 8, title: 'Nuevo producto', description: 'Agregá un producto o servicio al catálogo. Completá nombre, precio y categoría.' },
        ],
      },
      {
        id: 'cat-categories',
        title: 'Categorías',
        description: 'Los productos se organizan en cuatro categorías.',
        screenshot: 'catalogo.png',
        hotspots: [
          { id: 'cl-cats', x: 4, y: 12, width: 55, height: 8, title: 'Filtro por categoría', description: 'Consultas, Farmacia, Peluquería, Petshop. Cada una con sus productos específicos.' },
        ],
      },
      {
        id: 'cat-edit',
        title: 'Editar producto',
        description: 'Modificá precios, stock o información de cualquier producto.',
        screenshot: 'catalogo.png',
        hotspots: [
          { id: 'cl-actions', x: 82, y: 26, width: 14, height: 8, title: 'Acciones', description: 'Botones para editar o desactivar un producto. Los cambios se reflejan en todas las consultas nuevas.' },
        ],
      },
      {
        id: 'cat-stock',
        title: 'Control de stock',
        description: 'Mantené el inventario actualizado.',
        screenshot: 'catalogo.png',
        hotspots: [
          { id: 'cl-stock', x: 60, y: 26, width: 14, height: 8, title: 'Columna de stock', description: 'Cantidad disponible. Productos sin stock se marcan para que sepas cuándo reponer.' },
        ],
      },
    ],
  },

  // ─── 7. Historial de Ventas ───
  {
    id: 'historial-ventas',
    title: 'Historial de Ventas',
    description: 'Registro completo de todas las transacciones y cobros.',
    icon: 'History',
    route: '/historial-ventas',
    roles: ['recepcion', 'admin', 'doctora'],
    steps: [
      {
        id: 'hv-list',
        title: 'Listado de ventas',
        description: 'Todas las transacciones registradas, ordenadas por fecha.',
        screenshot: 'historial-ventas.png',
        hotspots: [
          { id: 'hl-table', x: 4, y: 22, width: 92, height: 50, title: 'Tabla de ventas', description: 'Cada fila muestra fecha, mascota, total y estado de pago. La más reciente aparece primero.' },
        ],
      },
      {
        id: 'hv-filters',
        title: 'Filtros y búsqueda',
        description: 'Acotá el historial por fecha, mascota o estado.',
        screenshot: 'historial-ventas.png',
        hotspots: [
          { id: 'hl-date', x: 4, y: 14, width: 25, height: 8, title: 'Filtro por fecha', description: 'Seleccioná un rango de fechas para ver las ventas de un período específico.' },
          { id: 'hl-search', x: 34, y: 14, width: 30, height: 8, title: 'Búsqueda', description: 'Buscá por nombre de mascota o propietario.' },
        ],
      },
      {
        id: 'hv-detail',
        title: 'Detalle de venta',
        description: 'Consultá el desglose completo de cualquier transacción.',
        screenshot: 'historial-ventas.png',
        hotspots: [
          { id: 'hl-click', x: 20, y: 32, width: 25, height: 8, title: 'Ver detalle', description: 'Hacé clic en cualquier fila para ver el detalle completo: productos, precios y método de pago.' },
          { id: 'hl-total', x: 80, y: 32, width: 16, height: 8, title: 'Columna total', description: 'Monto final de la venta incluyendo todos los productos y servicios.' },
        ],
      },
    ],
  },
];
