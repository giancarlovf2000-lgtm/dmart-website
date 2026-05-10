import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx + tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
}

/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Category color mapping
 */
export const categoryColors: Record<string, { bg: string; text: string; border: string; light: string }> = {
  belleza: {
    bg: 'bg-gold',
    text: 'text-gold',
    border: 'border-gold',
    light: 'bg-gold-50',
  },
  salud: {
    bg: 'bg-emerald-600',
    text: 'text-emerald-600',
    border: 'border-emerald-600',
    light: 'bg-emerald-50',
  },
  comercial: {
    bg: 'bg-navy',
    text: 'text-navy',
    border: 'border-navy',
    light: 'bg-blue-50',
  },
  tecnico: {
    bg: 'bg-violet-600',
    text: 'text-violet-600',
    border: 'border-violet-600',
    light: 'bg-violet-50',
  },
}

/**
 * All programs list (static, used for dropdowns and lead forms)
 */
export const ALL_PROGRAMS = [
  'Cosmetología',
  'Barbería y Estilismo',
  'Técnica de Uñas',
  'Estética y Maquillaje',
  'Supermaster',
  'Enfermería Práctica',
  'Administración de Sistemas de Oficina',
  'Técnico de Electricidad con PLC y Energía Renovable',
  'Técnico de Mecánica Automotriz con Fuel Injection',
  'Técnico de Refrigeración con A/C, PLC y Energía Renovable',
  'Mercadeo Digital (Programa Privado Corto)',
  'Marketing de Influencers y Personal Branding (Programa Privado Corto)',
  'Diseño Gráfico Básico (Programa Privado Corto)',
  'Desarrollo de Páginas Web con WordPress (Programa Privado Corto)',
  'Producción de Videos y Podcasting (Programa Privado Corto)',
  'Creación de Contenido en Redes Sociales (Programa Privado Corto)',
  'Inteligencia Artificial Aplicada (Programa Privado Corto)',
  'Ciberseguridad Básica y Protección de Datos (Programa Privado Corto)',
  'No sé aún',
]

/**
 * Campus schedule hours
 */
export const CAMPUS_HOURS = [
  { label: 'Lunes – Jueves', hours: '8:00am – 10:00pm' },
  { label: 'Viernes', hours: '8:00am – 5:00pm' },
  { label: 'Sábado', hours: '8:00am – 12:00pm' },
]

/**
 * Accreditations
 */
export const ACCREDITATIONS = [
  {
    name: 'Junta de Instituciones Postsecundarias',
    abbr: 'JIP',
    description: 'Autorizada por la Junta de Instituciones Postsecundarias de Puerto Rico',
  },
  {
    name: 'ACCSC',
    abbr: 'ACCSC',
    description: 'Accrediting Commission of Career Schools and Colleges',
  },
  {
    name: 'Departamento de Educación Federal',
    abbr: 'U.S. ED',
    description: 'Autorizada por el Departamento de Educación Federal (U.S. Department of Education)',
  },
]

/**
 * Saturday private courses (Programas Privados Cortos)
 */
export const PRIVADOS_SABATINOS = [
  {
    id: 1,
    title: 'Maquillaje',
    description: 'Transforma rostros en lienzos de arte. Domina técnicas profesionales que convierten emociones en expresiones visuales inolvidables.',
    icon: 'Sparkles',
    tag: 'Belleza',
  },
  {
    id: 2,
    title: 'Técnica de Uñas',
    description: 'Esculpe elegancia en cada detalle. Convierte tus manos en herramientas de precisión que crean miniobras de arte.',
    icon: 'Hand',
    tag: 'Belleza',
  },
  {
    id: 3,
    title: 'Masaje Terapéutico',
    description: 'Tus manos como instrumento de sanación. Aprende el arte ancestral de aliviar tensiones y restaurar el equilibrio corporal.',
    icon: 'Heart',
    tag: 'Salud',
  },
  {
    id: 4,
    title: 'Facturación a Planes Médicos',
    description: 'El lenguaje oculto del sistema de salud. Domina los códigos y procesos que mantienen la industria médica en movimiento.',
    icon: 'FileText',
    tag: 'Salud',
  },
  {
    id: 5,
    title: 'Repostería',
    description: 'Donde la química se encuentra con la creatividad. Transforma ingredientes simples en experiencias sensoriales irresistibles.',
    icon: 'Coffee',
    tag: 'Gastronomía',
  },
  {
    id: 6,
    title: 'Corte y Estilo de Caballeros',
    description: 'Esculpe identidades con tijeras y navaja. El arte clásico de la barbería reinventado para la época moderna.',
    icon: 'Scissors',
    tag: 'Belleza',
  },
  {
    id: 7,
    title: 'Corte y Estilo de Damas',
    description: 'Arquitectura capilar femenina. Crea transformaciones que realzan la esencia única de cada mujer.',
    icon: 'Scissors',
    tag: 'Belleza',
  },
  {
    id: 8,
    title: 'Lenguaje de Señas',
    description: 'Rompe las barreras del silencio. Comunícate con un mundo entero que habla sin palabras.',
    icon: 'MessageCircle',
    tag: 'Comunicación',
  },
  {
    id: 9,
    title: 'Floristería',
    description: 'Diseña con pétalos y vida. Construye narrativas emocionales usando el lenguaje universal de las flores.',
    icon: 'Flower2',
    tag: 'Arte',
  },
]

/**
 * Student services
 */
export const STUDENT_SERVICES = [
  {
    id: 1,
    name: 'Centro de Recursos para el Aprendizaje',
    description: 'Accede a materiales educativos, computadoras, libros y recursos de apoyo académico para maximizar tu aprendizaje.',
    icon: 'BookOpen',
  },
  {
    id: 2,
    name: 'Oficina de Retención',
    description: 'Te ayudamos a superar los desafíos académicos y personales para que puedas completar tu programa exitosamente.',
    icon: 'Users',
  },
  {
    id: 3,
    name: 'Colocaciones (Job Placement)',
    description: 'Nuestro equipo te conecta con empleadores de la industria y te apoya en tu búsqueda de empleo al graduarte.',
    icon: 'Briefcase',
  },
  {
    id: 4,
    name: 'Registraduría',
    description: 'Gestiona tus trámites académicos: transcripciones, certificaciones, cambios de programa y documentación oficial.',
    icon: 'FileText',
  },
  {
    id: 5,
    name: 'Asistencia Económica',
    description: 'Explora opciones de ayuda económica federal y estatal para financiar tu educación, incluyendo PELL Grant y préstamos.',
    icon: 'DollarSign',
  },
  {
    id: 6,
    name: 'Tesorera',
    description: 'Gestiona tus pagos, planes de pago y asuntos financieros relacionados con tu matrícula y costos del programa.',
    icon: 'CreditCard',
  },
]

/**
 * Static campuses data
 */
export const STATIC_CAMPUSES = [
  {
    id: 'barranquitas',
    name: 'Barranquitas',
    slug: 'barranquitas',
    address: 'Urb. San Cristóbal #12 Calle B, Zona Industrial',
    city: 'Barranquitas',
    state: 'PR',
    zip: '00794',
    phone: '(787) 857-6929',
    email: 'barranquitas@dmartinstitute.edu',
    active: true,
  },
  {
    id: 'vega-alta',
    name: 'Vega Alta',
    slug: 'vega-alta',
    address: 'Centro Gran Caribe, Ave. Luis Meléndez Class',
    city: 'Vega Alta',
    state: 'PR',
    zip: '00692',
    phone: '(787) 883-8180',
    email: 'vegaalta@dmartinstitute.edu',
    active: true,
  },
]

/**
 * Static categories data
 */
export const STATIC_CATEGORIES = [
  {
    id: 'belleza',
    name: 'Belleza',
    slug: 'belleza',
    description: 'Cosmetología, Barbería y Estilismo, Técnica de Uñas, Estética y Maquillaje, Supermaster. Forma tu carrera en la industria de la belleza.',
    color: '#D40000',
    icon: 'Sparkles',
    sort_order: 1,
  },
  {
    id: 'salud',
    name: 'Salud',
    slug: 'salud',
    description: 'Enfermería Práctica. Programas de ciencias de la salud con enfoque práctico y certificaciones reconocidas.',
    color: '#0A7B6E',
    icon: 'Heart',
    sort_order: 2,
  },
  {
    id: 'comercial',
    name: 'Comercial',
    slug: 'comercial',
    description: 'Administración de Sistemas de Oficina. Programas administrativos y de negocios para desarrollar tu carrera en el mundo empresarial.',
    color: '#111111',
    icon: 'Briefcase',
    sort_order: 3,
  },
  {
    id: 'tecnico',
    name: 'Técnico',
    slug: 'tecnico',
    description: 'Técnico de Electricidad con PLC y Energía Renovable, Técnico de Mecánica Automotriz con Fuel Injection, Técnico de Refrigeración con A/C, PLC y Energía Renovable. Programas técnicos especializados.',
    color: '#7c3aed',
    icon: 'Wrench',
    sort_order: 4,
  },
]

/**
 * Static programs data — all 10 confirmed programs
 */
export const STATIC_PROGRAMS = [
  {
    id: 'cosmetologia',
    name: 'Cosmetología',
    slug: 'cosmetologia',
    category_id: 'belleza',
    description:
      'El programa de Cosmetología está diseñado para que el/la estudiante adquiera las destrezas en ciencias de la belleza. Graduados están preparados para trabajar como estilistas, coloristas, técnicos de relajación, maquillistas, manicuristas y pedicuristas.',
    duration_weeks: 44,
    credits: 39,
    hours: 1000,
    schedule_options: ['Diurno', 'Nocturno'],
    active: true,
    sort_order: 1,
    campus_ids: ['barranquitas', 'vega-alta'],
  },
  {
    id: 'barberia-y-estilismo',
    name: 'Barbería y Estilismo',
    slug: 'barberia-y-estilismo',
    category_id: 'belleza',
    description:
      'El programa de Barbería y Estilismo desarrolla destrezas en corte, diseño, colorimetría, tratamientos faciales y tendencias de moda masculina contemporánea. Graduados pueden trabajar como barberos, estilistas, coloristas y técnicos de corte y peinado.',
    duration_weeks: 48,
    credits: 44.5,
    hours: 1110,
    schedule_options: ['Diurno', 'Nocturno'],
    active: true,
    sort_order: 2,
    campus_ids: ['barranquitas', 'vega-alta'],
  },
  {
    id: 'tecnica-de-unas',
    name: 'Técnica de Uñas',
    slug: 'tecnica-de-unas',
    category_id: 'belleza',
    description:
      'El programa de Técnica de Uñas capacita a los estudiantes en técnicas profesionales de manicura, pedicura, uñas acrílicas, gel y nail art. Prepara para trabajar en salones de belleza, spas y establecimientos propios.',
    duration_weeks: 32,
    credits: 29,
    hours: 735,
    schedule_options: ['Diurno', 'Nocturno'],
    active: true,
    sort_order: 3,
    campus_ids: ['barranquitas', 'vega-alta'],
  },
  {
    id: 'estetica-y-maquillaje',
    name: 'Estética y Maquillaje',
    slug: 'estetica-y-maquillaje',
    category_id: 'belleza',
    description:
      'El programa de Estética y Maquillaje enseña a analizar, tratar y embellecer la piel usando técnicas modernas, cosméticos e innovadores métodos de estimulación. Graduados pueden trabajar como esteticistas, maquillistas, administradoras de salón y vendedoras de cosméticos.',
    duration_weeks: 32,
    credits: 29,
    hours: 735,
    schedule_options: ['Diurno', 'Nocturno'],
    active: true,
    sort_order: 4,
    campus_ids: ['barranquitas', 'vega-alta'],
  },
  {
    id: 'supermaster',
    name: 'Supermaster',
    slug: 'supermaster',
    category_id: 'belleza',
    description:
      'El programa Supermaster es un nivel avanzado de formación en la industria de la belleza, diseñado para profesionales que desean alcanzar el más alto nivel de especialización y prepararse para roles de liderazgo, enseñanza y dirección técnica.',
    duration_weeks: null,
    credits: null,
    hours: null,
    schedule_options: ['Diurno', 'Nocturno'],
    active: true,
    sort_order: 5,
    campus_ids: ['barranquitas', 'vega-alta'],
  },
  {
    id: 'enfermeria-practica',
    name: 'Enfermería Práctica',
    slug: 'enfermeria-practica',
    category_id: 'salud',
    description:
      'El programa de Enfermería Práctica prepara a los estudiantes para proveer atención de enfermería de calidad en colaboración con profesionales de la salud. Se adquieren conocimientos científicos en enfermería, ciencias naturales y educación general.',
    duration_weeks: 48,
    credits: 43.5,
    hours: 1155,
    schedule_options: ['Diurno', 'Nocturno'],
    active: true,
    sort_order: 1,
    campus_ids: ['barranquitas', 'vega-alta'],
  },
  {
    id: 'administracion-de-sistemas-de-oficina',
    name: 'Administración de Sistemas de Oficina',
    slug: 'administracion-de-sistemas-de-oficina',
    category_id: 'comercial',
    description:
      'Diseñado para que los estudiantes adquieran las destrezas necesarias para crear, revisar e imprimir documentos. El programa enfatiza competencias administrativas óptimas y el desarrollo profesional. Graduados se preparan para posiciones de nivel de entrada como secretarias, recepcionistas y especialistas en entrada de datos.',
    duration_weeks: 56,
    credits: 42,
    hours: 1350,
    schedule_options: ['Diurno', 'Nocturno'],
    active: true,
    sort_order: 1,
    campus_ids: ['barranquitas', 'vega-alta'],
  },
  {
    id: 'tecnico-de-electricidad',
    name: 'Técnico de Electricidad con PLC y Energía Renovable',
    slug: 'tecnico-de-electricidad',
    category_id: 'tecnico',
    description:
      'El programa prepara a los estudiantes para adquirir destrezas técnicas en instalaciones eléctricas, diagnóstico de fallas eléctricas, construcción de subestaciones eléctricas y exploración de alternativas de energía renovable, con énfasis en seguridad industrial.',
    duration_weeks: 56,
    credits: 42,
    hours: 1350,
    schedule_options: ['Diurno', 'Nocturno'],
    active: true,
    sort_order: 1,
    campus_ids: ['barranquitas', 'vega-alta'],
  },
  {
    id: 'tecnico-de-mecanica-automotriz',
    name: 'Técnico de Mecánica Automotriz con Fuel Injection',
    slug: 'tecnico-de-mecanica-automotriz',
    category_id: 'tecnico',
    description:
      'El programa equipa a los estudiantes con las destrezas técnicas necesarias para carreras de nivel de entrada en el campo automotriz, incluyendo mecánica, especialización en alineación, electromecánica y ventas de piezas de automóviles.',
    duration_weeks: 56,
    credits: 42,
    hours: 1350,
    schedule_options: ['Diurno', 'Nocturno'],
    active: true,
    sort_order: 2,
    campus_ids: ['barranquitas'], // Barranquitas ONLY
  },
  {
    id: 'tecnico-de-refrigeracion',
    name: 'Técnico de Refrigeración con A/C, PLC y Energía Renovable',
    slug: 'tecnico-de-refrigeracion',
    category_id: 'tecnico',
    description:
      'El programa de Técnico de Refrigeración y Aire Acondicionado prepara a los estudiantes para instalar, mantener y reparar sistemas de refrigeración y aire acondicionado residenciales, comerciales e industriales, incorporando tecnología PLC y energía renovable.',
    duration_weeks: null,
    credits: null,
    hours: null,
    schedule_options: ['Diurno', 'Nocturno'],
    active: true,
    sort_order: 3,
    campus_ids: ['barranquitas', 'vega-alta'],
  },
]

/**
 * Get category by slug from static data
 */
export function getCategoryBySlug(slug: string) {
  return STATIC_CATEGORIES.find((c) => c.slug === slug) ?? null
}

/**
 * Get programs by category slug from static data
 */
export function getProgramsByCategory(categorySlug: string) {
  return STATIC_PROGRAMS.filter((p) => p.category_id === categorySlug)
}

/**
 * Get program by slug from static data
 */
export function getProgramBySlug(slug: string) {
  const program = STATIC_PROGRAMS.find((p) => p.slug === slug)
  if (!program) return null
  const category = STATIC_CATEGORIES.find((c) => c.id === program.category_id) ?? null
  const campuses = STATIC_CAMPUSES.filter((c) => program.campus_ids.includes(c.id))
  return { ...program, category, campuses }
}

/**
 * FAQ data
 */
export const FAQ_DATA = [
  {
    id: 1,
    question: '¿Cuáles son los requisitos de admisión?',
    answer: 'Para admisión se requiere: diploma de escuela superior o GED, formulario de solicitud completado, entrevista con el representante de admisiones, y documentos de identificación. Los requisitos específicos pueden variar según el programa. Contáctanos para más información.',
  },
  {
    id: 2,
    question: '¿Ofrecen ayuda económica?',
    answer: 'Sí. D\'Mart Institute participa en programas de asistencia económica federal incluyendo el Pell Grant y préstamos estudiantiles. Nuestro equipo de Asistencia Económica te asistirá en todo el proceso de solicitud del FAFSA y otras ayudas disponibles.',
  },
  {
    id: 3,
    question: '¿Cuánto tiempo duran los programas?',
    answer: 'La mayoría de nuestros programas principales tienen una duración de 56 semanas (aproximadamente 14 meses). Los Privados Sabatinos son cursos cortos intensivos que se ofrecen los sábados con una duración variable según el curso.',
  },
  {
    id: 4,
    question: '¿En qué horarios puedo estudiar?',
    answer: 'Ofrecemos horarios diurnos y nocturnos para la mayoría de nuestros programas. El horario regular es de lunes a jueves de 8:00am a 10:00pm, viernes de 8:00am a 5:00pm, y sábados de 8:00am a 12:00pm para los Privados Sabatinos.',
  },
  {
    id: 5,
    question: '¿Qué acreditaciones tiene D\'Mart Institute?',
    answer: 'D\'Mart Institute está licenciada por el Departamento de Educación de Puerto Rico, acreditada por la ACCSC (Accrediting Commission of Career Schools and Colleges) y autorizada por la Junta de Instituciones Postsecundarias de Puerto Rico.',
  },
  {
    id: 6,
    question: '¿En cuáles recintos están disponibles los programas?',
    answer: 'Tenemos recintos en Barranquitas y Vega Alta. La mayoría de los programas están disponibles en ambos recintos. El programa de Técnico de Mecánica Automotriz está disponible únicamente en el recinto de Barranquitas.',
  },
  {
    id: 7,
    question: '¿Tienen servicio de colocación de empleo?',
    answer: 'Sí. Nuestra Oficina de Colocaciones trabaja activamente con empleadores de la industria para conectar a nuestros graduados con oportunidades de empleo relevantes en sus campos de estudio.',
  },
  {
    id: 8,
    question: '¿Cómo puedo comenzar el proceso de matrícula?',
    answer: 'El proceso es sencillo: (1) Completa el formulario de información en nuestra página web, (2) Un representante te contactará para programar una visita o entrevista, (3) Completa la solicitud de admisión y documentos requeridos, (4) Solicita tu ayuda económica, (5) ¡Comienza tus clases!',
  },
  {
    id: 9,
    question: '¿Cuál es la diferencia entre los Privados Sabatinos y los programas regulares?',
    answer: 'Los programas regulares son programas académicos completos de 56 semanas que llevan a una certificación o diploma vocacional. Los Privados Sabatinos son cursos cortos que se ofrecen los sábados, enfocados en habilidades específicas de tecnología y marketing digital, sin costo de matrícula anunciado públicamente.',
  },
  {
    id: 10,
    question: '¿Dónde están ubicados los recintos?',
    answer: 'Recinto Barranquitas: Urb. San Cristóbal #12 Calle B, Zona Industrial, Barranquitas, PR 00794. Teléfono: (787) 857-6929. Recinto Vega Alta: Centro Gran Caribe, Ave. Luis Meléndez Class, Vega Alta, PR 00692. Teléfono: (787) 883-8180.',
  },
]
