import type { 
  Perfil, 
  Mascota, 
  Propietario, 
  Consulta, 
  Producto, 
  Expediente,
  MonitorSalida,
  DashboardStats 
} from '@/types';

// Perfiles de usuario
export const perfiles: Perfil[] = [
  {
    id: '1',
    nombre: 'Dra. Maritza López',
    email: 'doctora@kachorros.com',
    rol: 'doctora',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maritza'
  },
  {
    id: '2',
    nombre: 'Ana García',
    email: 'recepcion@kachorros.com',
    rol: 'recepcion',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana'
  },
  {
    id: '3',
    nombre: 'Admin Sistema',
    email: 'admin@kachorros.com',
    rol: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
  }
];

// Propietarios
export const propietarios: Propietario[] = [
  {
    id: 'p1',
    nombre: 'Carlos Mendoza',
    telefono: '7777-1111',
    email: 'carlos@email.com',
    direccion: 'Colonia Escalón, San Salvador'
  },
  {
    id: 'p2',
    nombre: 'María Fernández',
    telefono: '7777-2222',
    email: 'maria@email.com',
    direccion: 'Santa Elena, Antiguo Cuscatlán'
  },
  {
    id: 'p3',
    nombre: 'José Ramírez',
    telefono: '7777-3333',
    email: 'jose@email.com',
    direccion: 'Colonia San Benito, San Salvador'
  },
  {
    id: 'p4',
    nombre: 'Laura Torres',
    telefono: '7777-4444',
    email: 'laura@email.com',
    direccion: 'Colonia Maquilishuat, San Salvador'
  },
  {
    id: 'p5',
    nombre: 'Pedro Castillo',
    telefono: '7777-5555',
    email: 'pedro@email.com',
    direccion: 'Santa Tecla, La Libertad'
  }
];

// Mascotas
export const mascotas: Mascota[] = [
  {
    id: 'm1',
    nombre: 'Max',
    especie: 'perro',
    raza: 'Golden Retriever',
    fechaNacimiento: '2020-03-15',
    sexo: 'macho',
    color: 'Dorado',
    peso: 28.5,
    foto: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
    propietario: propietarios[0],
    alergias: ['Pollo', 'Gluten'],
    notasEspeciales: 'Necesita sedación para procedimientos',
    fechaRegistro: '2021-01-10'
  },
  {
    id: 'm2',
    nombre: 'Luna',
    especie: 'gato',
    raza: 'Siamés',
    fechaNacimiento: '2019-07-22',
    sexo: 'hembra',
    color: 'Cream con puntos marrones',
    peso: 4.2,
    foto: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=400',
    propietario: propietarios[1],
    alergias: [],
    notasEspeciales: 'Muy nerviosa en consulta',
    fechaRegistro: '2020-02-15'
  },
  {
    id: 'm3',
    nombre: 'Rocky',
    especie: 'perro',
    raza: 'Bulldog Francés',
    fechaNacimiento: '2021-11-08',
    sexo: 'macho',
    color: 'Atigrado',
    peso: 12.3,
    foto: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
    propietario: propietarios[2],
    alergias: ['Ácaros'],
    notasEspeciales: 'Problemas respiratorios leves',
    fechaRegistro: '2022-01-20'
  },
  {
    id: 'm4',
    nombre: 'Coco',
    especie: 'perro',
    raza: 'Poodle Toy',
    fechaNacimiento: '2022-01-10',
    sexo: 'hembra',
    color: 'Blanco',
    peso: 3.8,
    foto: 'https://images.unsplash.com/photo-1591769225440-811ad7d6eca6?w=400',
    propietario: propietarios[3],
    alergias: [],
    notasEspeciales: 'Muy juguetona y amigable',
    fechaRegistro: '2022-03-05'
  },
  {
    id: 'm5',
    nombre: 'Toby',
    especie: 'perro',
    raza: 'Beagle',
    fechaNacimiento: '2018-05-20',
    sexo: 'macho',
    color: 'Tricolor',
    peso: 15.7,
    foto: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400',
    propietario: propietarios[4],
    alergias: ['Ciertos antibióticos'],
    notasEspeciales: 'Sobrepeso - necesita dieta',
    fechaRegistro: '2019-06-12'
  },
  {
    id: 'm6',
    nombre: 'Michi',
    especie: 'gato',
    raza: 'Persa',
    fechaNacimiento: '2020-09-14',
    sexo: 'macho',
    color: 'Gris',
    peso: 5.5,
    foto: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400',
    propietario: propietarios[0],
    alergias: [],
    notasEspeciales: 'Requiere cepillado frecuente',
    fechaRegistro: '2021-02-28'
  },
  {
    id: 'm7',
    nombre: 'Bella',
    especie: 'perro',
    raza: 'Labrador',
    fechaNacimiento: '2021-04-05',
    sexo: 'hembra',
    color: 'Chocolate',
    peso: 25.0,
    foto: 'https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=400',
    propietario: propietarios[1],
    alergias: ['Maíz'],
    notasEspeciales: 'Muy activa, necesita ejercicio',
    fechaRegistro: '2021-08-15'
  },
  {
    id: 'm8',
    nombre: 'Pelusa',
    especie: 'conejo',
    raza: 'Holland Lop',
    fechaNacimiento: '2023-02-18',
    sexo: 'hembra',
    color: 'Blanco y café',
    peso: 1.8,
    foto: 'https://images.unsplash.com/photo-1585110396063-8355845b3761?w=400',
    propietario: propietarios[2],
    alergias: [],
    notasEspeciales: 'Come heno de timothy',
    fechaRegistro: '2023-04-10'
  }
];

// Catálogo de productos y servicios
export const catalogo: Producto[] = [
  // Servicios
  {
    id: 'prod1',
    codigo: 'CONS-GEN',
    nombre: 'Consulta General',
    descripcion: 'Evaluación médica completa del paciente',
    categoria: 'servicio',
    precio: 25.00,
    activo: true
  },
  {
    id: 'prod2',
    codigo: 'CONS-ESP',
    nombre: 'Consulta Especializada',
    descripcion: 'Consulta con especialista',
    categoria: 'servicio',
    precio: 45.00,
    activo: true
  },
  {
    id: 'prod3',
    codigo: 'DESP',
    nombre: 'Desparasitación',
    descripcion: 'Aplicación de antiparasitario',
    categoria: 'servicio',
    precio: 15.00,
    activo: true
  },
  {
    id: 'prod4',
    codigo: 'CORT-UNI',
    nombre: 'Corte de Uñas',
    descripcion: 'Corte y limado de uñas',
    categoria: 'servicio',
    precio: 8.00,
    activo: true
  },
  {
    id: 'prod5',
    codigo: 'LIMP-ODO',
    nombre: 'Limpieza de Oídos',
    descripcion: 'Limpieza profunda de conducto auditivo',
    categoria: 'servicio',
    precio: 12.00,
    activo: true
  },
  // Vacunas
  {
    id: 'prod6',
    codigo: 'VAC-PENT',
    nombre: 'Vacuna Pentavalente',
    descripcion: 'Protección contra 5 enfermedades',
    categoria: 'vacuna',
    precio: 35.00,
    stock: 50,
    activo: true
  },
  {
    id: 'prod7',
    codigo: 'VAC-RABI',
    nombre: 'Vacuna Antirrábica',
    descripcion: 'Protección contra rabia',
    categoria: 'vacuna',
    precio: 20.00,
    stock: 40,
    activo: true
  },
  {
    id: 'prod8',
    codigo: 'VAC-BORD',
    nombre: 'Vacuna Bordetella',
    descripcion: 'Protección contra tos de las perreras',
    categoria: 'vacuna',
    precio: 28.00,
    stock: 25,
    activo: true
  },
  {
    id: 'prod9',
    codigo: 'VAC-TRIP',
    nombre: 'Vacuna Triple Felina',
    descripcion: 'Protección para gatos',
    categoria: 'vacuna',
    precio: 30.00,
    stock: 30,
    activo: true
  },
  // Medicamentos
  {
    id: 'prod10',
    codigo: 'MED-AMOX',
    nombre: 'Amoxicilina 250mg',
    descripcion: 'Antibiótico de amplio espectro',
    categoria: 'medicamento',
    precio: 18.50,
    stock: 100,
    activo: true
  },
  {
    id: 'prod11',
    codigo: 'MED-METO',
    nombre: 'Metronidazol 500mg',
    descripcion: 'Antiprotozoario y antibacteriano',
    categoria: 'medicamento',
    precio: 22.00,
    stock: 80,
    activo: true
  },
  {
    id: 'prod12',
    codigo: 'MED-DEXA',
    nombre: 'Dexametasona',
    descripcion: 'Antiinflamatorio esteroideo',
    categoria: 'medicamento',
    precio: 15.00,
    stock: 60,
    activo: true
  },
  {
    id: 'prod13',
    codigo: 'MED-IVER',
    nombre: 'Ivermectina',
    descripcion: 'Antiparasitario interno y externo',
    categoria: 'medicamento',
    precio: 12.00,
    stock: 75,
    activo: true
  },
  // PetShop
  {
    id: 'prod14',
    codigo: 'PS-ALIM-AD',
    nombre: 'Alimento Adulto Premium 4kg',
    descripcion: 'Alimento balanceado para perros adultos',
    categoria: 'petshop',
    precio: 45.00,
    stock: 30,
    activo: true
  },
  {
    id: 'prod15',
    codigo: 'PS-ALIM-CT',
    nombre: 'Alimento Gato Premium 3kg',
    descripcion: 'Alimento balanceado para gatos',
    categoria: 'petshop',
    precio: 38.00,
    stock: 25,
    activo: true
  },
  {
    id: 'prod16',
    codigo: 'PS-SHAM',
    nombre: 'Shampoo Medicado',
    descripcion: 'Shampoo para pieles sensibles',
    categoria: 'petshop',
    precio: 16.00,
    stock: 40,
    activo: true
  },
  {
    id: 'prod17',
    codigo: 'PS-COLL',
    nombre: 'Collar Antipulgas',
    descripcion: 'Protección de 8 meses',
    categoria: 'petshop',
    precio: 28.00,
    stock: 35,
    activo: true
  },
  // Laboratorio
  {
    id: 'prod18',
    codigo: 'LAB-HEMO',
    nombre: 'Hemograma Completo',
    descripcion: 'Análisis de sangre completo',
    categoria: 'laboratorio',
    precio: 55.00,
    activo: true
  },
  {
    id: 'prod19',
    codigo: 'LAB-PERF',
    nombre: 'Perfil Bioquímico',
    descripcion: 'Evaluación de órganos y sistemas',
    categoria: 'laboratorio',
    precio: 85.00,
    activo: true
  },
  {
    id: 'prod20',
    codigo: 'LAB-ORIN',
    nombre: 'Uroanálisis',
    descripcion: 'Análisis de orina completo',
    categoria: 'laboratorio',
    precio: 35.00,
    activo: true
  }
];

// Consultas históricas
export const consultasHistoricas: Consulta[] = [
  {
    id: 'c1',
    mascotaId: 'm1',
    fecha: '2024-01-15T10:30:00',
    motivo: 'Vacunación anual',
    sintomas: 'Sin síntomas, control preventivo',
    diagnostico: 'Paciente sano, en excelentes condiciones',
    tratamiento: 'Vacuna pentavalente aplicada',
    notas: 'Propietario educado sobre desparasitación',
    doctora: 'Dra. Maritza López',
    estado: 'finalizado',
    total: 55.00,
    detalles: [
      {
        id: 'd1',
        consultaId: 'c1',
        productoId: 'prod1',
        producto: catalogo[0],
        cantidad: 1,
        precioAplicado: 25.00,
        subtotal: 25.00
      },
      {
        id: 'd2',
        consultaId: 'c1',
        productoId: 'prod6',
        producto: catalogo[5],
        cantidad: 1,
        precioAplicado: 30.00,
        subtotal: 30.00
      }
    ],
    proximaCita: '2025-01-15'
  },
  {
    id: 'c2',
    mascotaId: 'm2',
    fecha: '2024-02-20T14:00:00',
    motivo: 'Vómitos y decaimiento',
    sintomas: 'Vómitos frecuentes, falta de apetito, letargo',
    diagnostico: 'Gastroenteritis aguda',
    tratamiento: 'Metronidazol 5mg/kg cada 12h por 7 días, dieta blanda',
    notas: 'Mejora notable después de 3 días de tratamiento',
    doctora: 'Dra. Maritza López',
    estado: 'finalizado',
    total: 67.00,
    detalles: [
      {
        id: 'd3',
        consultaId: 'c2',
        productoId: 'prod1',
        producto: catalogo[0],
        cantidad: 1,
        precioAplicado: 25.00,
        subtotal: 25.00
      },
      {
        id: 'd4',
        consultaId: 'c2',
        productoId: 'prod11',
        producto: catalogo[10],
        cantidad: 1,
        precioAplicado: 22.00,
        subtotal: 22.00
      },
      {
        id: 'd5',
        consultaId: 'c2',
        productoId: 'prod18',
        producto: catalogo[17],
        cantidad: 1,
        precioAplicado: 20.00,
        subtotal: 20.00
      }
    ]
  },
  {
    id: 'c3',
    mascotaId: 'm3',
    fecha: '2024-03-10T11:00:00',
    motivo: 'Problemas de piel',
    sintomas: 'Comezón intensa, enrojecimiento, pérdida de pelo en patas',
    diagnostico: 'Dermatitis alérgica a ácaros',
    tratamiento: 'Ivermectina subcutánea, shampoo medicado 2x semana',
    notas: 'Mejorar higiene del ambiente, lavar camas frecuentemente',
    doctora: 'Dra. Maritza López',
    estado: 'finalizado',
    total: 58.00,
    detalles: [
      {
        id: 'd6',
        consultaId: 'c3',
        productoId: 'prod1',
        producto: catalogo[0],
        cantidad: 1,
        precioAplicado: 25.00,
        subtotal: 25.00
      },
      {
        id: 'd7',
        consultaId: 'c3',
        productoId: 'prod13',
        producto: catalogo[12],
        cantidad: 1,
        precioAplicado: 12.00,
        subtotal: 12.00
      },
      {
        id: 'd8',
        consultaId: 'c3',
        productoId: 'prod16',
        producto: catalogo[15],
        cantidad: 1,
        precioAplicado: 16.00,
        subtotal: 16.00
      },
      {
        id: 'd9',
        consultaId: 'c3',
        productoId: 'prod5',
        producto: catalogo[4],
        cantidad: 1,
        precioAplicado: 5.00,
        subtotal: 5.00
      }
    ]
  },
  {
    id: 'c4',
    mascotaId: 'm4',
    fecha: '2024-04-05T09:30:00',
    motivo: 'Control de crecimiento',
    sintomas: 'Desarrollo normal, buen apetito',
    diagnostico: 'Cachorra sana, crecimiento adecuado',
    tratamiento: 'Continuar con alimento de calidad, desparasitación',
    notas: 'Próxima vacuna en 3 semanas',
    doctora: 'Dra. Maritza López',
    estado: 'finalizado',
    total: 40.00,
    detalles: [
      {
        id: 'd10',
        consultaId: 'c4',
        productoId: 'prod1',
        producto: catalogo[0],
        cantidad: 1,
        precioAplicado: 25.00,
        subtotal: 25.00
      },
      {
        id: 'd11',
        consultaId: 'c4',
        productoId: 'prod3',
        producto: catalogo[2],
        cantidad: 1,
        precioAplicado: 15.00,
        subtotal: 15.00
      }
    ]
  },
  {
    id: 'c5',
    mascotaId: 'm5',
    fecha: '2024-04-08T16:00:00',
    motivo: 'Control de peso',
    sintomas: 'Sobrepeso, poco ejercicio',
    diagnostico: 'Obesidad grado 1',
    tratamiento: 'Plan de alimentación, aumentar ejercicio gradualmente',
    notas: 'Perdió 0.5kg desde la última visita, buen progreso',
    doctora: 'Dra. Maritza López',
    estado: 'finalizado',
    total: 25.00,
    detalles: [
      {
        id: 'd12',
        consultaId: 'c5',
        productoId: 'prod1',
        producto: catalogo[0],
        cantidad: 1,
        precioAplicado: 25.00,
        subtotal: 25.00
      }
    ]
  }
];

// Consultas pendientes (para monitor de salida)
export const consultasPendientes: Consulta[] = [
  {
    id: 'c6',
    mascotaId: 'm1',
    fecha: new Date().toISOString(),
    motivo: 'Revisión de piel',
    sintomas: 'Comezón en orejas, rascado frecuente',
    diagnostico: 'Otitis externa leve',
    tratamiento: 'Gotas óticas antibióticas cada 12h por 10 días',
    notas: 'Revisar en 1 semana',
    doctora: 'Dra. Maritza López',
    estado: 'pendiente',
    total: 52.00,
    detalles: [
      {
        id: 'd13',
        consultaId: 'c6',
        productoId: 'prod1',
        producto: catalogo[0],
        cantidad: 1,
        precioAplicado: 25.00,
        subtotal: 25.00
      },
      {
        id: 'd14',
        consultaId: 'c6',
        productoId: 'prod5',
        producto: catalogo[4],
        cantidad: 1,
        precioAplicado: 12.00,
        subtotal: 12.00
      },
      {
        id: 'd15',
        consultaId: 'c6',
        productoId: 'prod10',
        producto: catalogo[9],
        cantidad: 1,
        precioAplicado: 15.00,
        subtotal: 15.00
      }
    ]
  },
  {
    id: 'c7',
    mascotaId: 'm3',
    fecha: new Date().toISOString(),
    motivo: 'Vacunación',
    sintomas: 'Sin síntomas',
    diagnostico: 'Paciente sano para vacunación',
    tratamiento: 'Vacuna antirrábica anual aplicada',
    notas: 'Recordar desparasitación en 15 días',
    doctora: 'Dra. Maritza López',
    estado: 'pendiente',
    total: 45.00,
    detalles: [
      {
        id: 'd16',
        consultaId: 'c7',
        productoId: 'prod1',
        producto: catalogo[0],
        cantidad: 1,
        precioAplicado: 25.00,
        subtotal: 25.00
      },
      {
        id: 'd17',
        consultaId: 'c7',
        productoId: 'prod7',
        producto: catalogo[6],
        cantidad: 1,
        precioAplicado: 20.00,
        subtotal: 20.00
      }
    ]
  },
  {
    id: 'c8',
    mascotaId: 'm6',
    fecha: new Date().toISOString(),
    motivo: 'Esterilización - revisión post-operatoria',
    sintomas: 'Cicatrización normal, buen comportamiento',
    diagnostico: 'Recuperación satisfactoria',
    tratamiento: 'Retirar puntos, continuar con medicación',
    notas: 'Paciente recuperándose muy bien',
    doctora: 'Dra. Maritza López',
    estado: 'pendiente',
    total: 30.00,
    detalles: [
      {
        id: 'd18',
        consultaId: 'c8',
        productoId: 'prod1',
        producto: catalogo[0],
        cantidad: 1,
        precioAplicado: 25.00,
        subtotal: 25.00
      },
      {
        id: 'd19',
        consultaId: 'c8',
        productoId: 'prod4',
        producto: catalogo[3],
        cantidad: 1,
        precioAplicado: 5.00,
        subtotal: 5.00
      }
    ]
  }
];

// Expedientes
export const expedientes: Expediente[] = mascotas.map(mascota => ({
  id: `exp-${mascota.id}`,
  mascotaId: mascota.id,
  mascota: mascota,
  consultas: [
    ...consultasHistoricas.filter(c => c.mascotaId === mascota.id),
    ...consultasPendientes.filter(c => c.mascotaId === mascota.id)
  ],
  fotosEvolucion: [
    {
      id: `foto1-${mascota.id}`,
      expedienteId: `exp-${mascota.id}`,
      url: mascota.foto || '',
      fecha: mascota.fechaRegistro,
      descripcion: 'Foto de registro inicial'
    }
  ],
  vacunas: mascota.id === 'm1' ? [
    {
      id: 'v1',
      expedienteId: `exp-${mascota.id}`,
      nombre: 'Pentavalente',
      fechaAplicacion: '2024-01-15',
      proximaDosis: '2025-01-15',
      lote: 'LOT-2024-001'
    },
    {
      id: 'v2',
      expedienteId: `exp-${mascota.id}`,
      nombre: 'Antirrábica',
      fechaAplicacion: '2023-01-10',
      proximaDosis: '2024-01-10',
      lote: 'LOT-2023-045'
    }
  ] : []
}));

// Monitor de salida
export const monitorSalida: MonitorSalida[] = [
  {
    consultaId: 'c6',
    mascota: mascotas.find(m => m.id === 'm1')!,
    horaTermino: new Date(Date.now() - 15 * 60000).toISOString(),
    total: 52.00,
    estado: 'listo'
  },
  {
    consultaId: 'c7',
    mascota: mascotas.find(m => m.id === 'm3')!,
    horaTermino: new Date(Date.now() - 5 * 60000).toISOString(),
    total: 45.00,
    estado: 'listo'
  },
  {
    consultaId: 'c8',
    mascota: mascotas.find(m => m.id === 'm6')!,
    horaTermino: new Date(Date.now() - 30 * 60000).toISOString(),
    total: 30.00,
    estado: 'pagando'
  }
];

// Estadísticas del dashboard
export const dashboardStats: DashboardStats = {
  pacientesHoy: 8,
  pacientesEspera: 3,
  ingresosHoy: 385.00,
  consultasPendientes: 3
};

// Funciones de utilidad para filtrar datos
export const getExpedienteById = (id: string): Expediente | undefined => {
  return expedientes.find(exp => exp.id === id || exp.mascotaId === id);
};

export const getConsultaById = (id: string): Consulta | undefined => {
  return [...consultasHistoricas, ...consultasPendientes].find(c => c.id === id);
};

export const getMascotaById = (id: string): Mascota | undefined => {
  return mascotas.find(m => m.id === id);
};

export const buscarExpedientes = (query: string): Expediente[] => {
  const lowerQuery = query.toLowerCase();
  return expedientes.filter(exp => 
    exp.mascota.nombre.toLowerCase().includes(lowerQuery) ||
    exp.mascota.propietario.nombre.toLowerCase().includes(lowerQuery) ||
    exp.mascota.propietario.telefono.includes(lowerQuery) ||
    exp.mascota.raza.toLowerCase().includes(lowerQuery)
  );
};

export const getProductosPorCategoria = (categoria: Producto['categoria']): Producto[] => {
  return catalogo.filter(p => p.categoria === categoria && p.activo);
};
