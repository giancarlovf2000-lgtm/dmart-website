-- ============================================================
-- D'Mart Institute — Seed Data
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- CAMPUSES
-- ============================================================
insert into campuses (name, slug, address, city, state, zip, phone, email) values
  (
    'Barranquitas',
    'barranquitas',
    'Urb. San Cristóbal #12 Calle B, Zona Industrial',
    'Barranquitas',
    'PR',
    '00794',
    '(787) 857-6929',
    'barranquitas@dmartinstitute.edu'
  ),
  (
    'Vega Alta',
    'vega-alta',
    'Centro Gran Caribe, Ave. Luis Meléndez Class',
    'Vega Alta',
    'PR',
    '00692',
    '(787) 883-8180',
    'vegaalta@dmartinstitute.edu'
  )
on conflict (slug) do nothing;

-- ============================================================
-- CATEGORIES
-- ============================================================
insert into categories (name, slug, description, color, icon, sort_order) values
  (
    'Belleza',
    'belleza',
    'Programas de cosmetología, barbería, uñas, estética y más. Forma tu carrera en la industria de la belleza.',
    '#C9A84C',
    'Sparkles',
    1
  ),
  (
    'Salud',
    'salud',
    'Programas de ciencias de la salud con enfoque práctico y certificaciones reconocidas.',
    '#0A7B6E',
    'Heart',
    2
  ),
  (
    'Comercial',
    'comercial',
    'Programas administrativos y de negocios para desarrollar tu carrera en el mundo empresarial.',
    '#163066',
    'Briefcase',
    3
  ),
  (
    'Técnico',
    'tecnico',
    'Programas técnicos en electricidad, mecánica y refrigeración con tecnología de vanguardia.',
    '#7C3AED',
    'Wrench',
    4
  )
on conflict (slug) do nothing;

-- ============================================================
-- PROGRAMS
-- ============================================================

-- Belleza programs
with cat as (select id from categories where slug = 'belleza')
insert into programs (category_id, name, slug, description, duration_weeks, credits, hours, schedule_options, sort_order)
select
  cat.id,
  prog.name,
  prog.slug,
  prog.description,
  prog.duration_weeks,
  prog.credits,
  prog.hours,
  prog.schedule_options,
  prog.sort_order
from cat, (values
  (
    'Cosmetología',
    'cosmetologia',
    'El programa de Cosmetología prepara a los estudiantes en todas las áreas del cuidado y embellecimiento del cabello, piel y uñas. Aprende técnicas modernas de corte, color, tratamientos capilares y más.',
    56,
    42.5,
    1350,
    array['Diurno','Nocturno'],
    1
  ),
  (
    'Barbería y Estilismo',
    'barberia-y-estilismo',
    'Domina el arte de la barbería contemporánea. El programa combina técnicas tradicionales con tendencias modernas en cortes masculinos, afeitado y cuidado del cabello.',
    null,
    null,
    null,
    array['Diurno','Nocturno'],
    2
  ),
  (
    'Técnica de Uñas',
    'tecnica-de-unas',
    'Especialízate en el cuidado y decoración de uñas. Aprende técnicas de manicura, pedicura, uñas acrílicas, gel y las últimas tendencias en nail art.',
    null,
    null,
    null,
    array['Diurno','Nocturno'],
    3
  ),
  (
    'Estética y Maquillaje',
    'estetica-y-maquillaje',
    'Conviértete en experta en el cuidado de la piel y el maquillaje artístico. Aprende tratamientos faciales, depilación, maquillaje social y artístico.',
    null,
    null,
    null,
    array['Diurno','Nocturno'],
    4
  ),
  (
    'Supermaster',
    'supermaster',
    'El programa Supermaster es un curso avanzado de especialización para profesionales de la belleza que desean llevar sus habilidades al siguiente nivel.',
    null,
    null,
    null,
    array['Diurno','Nocturno'],
    5
  )
) as prog(name, slug, description, duration_weeks, credits, hours, schedule_options, sort_order)
on conflict (slug) do nothing;

-- Salud programs
with cat as (select id from categories where slug = 'salud')
insert into programs (category_id, name, slug, description, duration_weeks, credits, hours, schedule_options, sort_order)
select
  cat.id,
  prog.name,
  prog.slug,
  prog.description,
  prog.duration_weeks,
  prog.credits,
  prog.hours,
  prog.schedule_options,
  prog.sort_order
from cat, (values
  (
    'Enfermería Práctica',
    'enfermeria-practica',
    'El programa de Enfermería Práctica prepara a los estudiantes para brindar cuidado directo al paciente bajo la supervisión de un enfermero registrado o médico. Incluye práctica clínica.',
    56,
    42,
    1350,
    array['Diurno','Nocturno'],
    1
  )
) as prog(name, slug, description, duration_weeks, credits, hours, schedule_options, sort_order)
on conflict (slug) do nothing;

-- Comercial programs
with cat as (select id from categories where slug = 'comercial')
insert into programs (category_id, name, slug, description, duration_weeks, credits, hours, schedule_options, sort_order)
select
  cat.id,
  prog.name,
  prog.slug,
  prog.description,
  prog.duration_weeks,
  prog.credits,
  prog.hours,
  prog.schedule_options,
  prog.sort_order
from cat, (values
  (
    'Administración de Sistemas de Oficina',
    'administracion-de-sistemas-de-oficina',
    'Prepárate para el mundo empresarial moderno. El programa incluye manejo de herramientas de oficina, software administrativo, comunicación empresarial y gestión de documentos.',
    56,
    42,
    1350,
    array['Diurno','Nocturno'],
    1
  )
) as prog(name, slug, description, duration_weeks, credits, hours, schedule_options, sort_order)
on conflict (slug) do nothing;

-- Técnico programs
with cat as (select id from categories where slug = 'tecnico')
insert into programs (category_id, name, slug, description, duration_weeks, credits, hours, schedule_options, sort_order)
select
  cat.id,
  prog.name,
  prog.slug,
  prog.description,
  prog.duration_weeks,
  prog.credits,
  prog.hours,
  prog.schedule_options,
  prog.sort_order
from cat, (values
  (
    'Técnico de Electricidad con PLC y Energía Renovable',
    'tecnico-de-electricidad',
    'Aprende instalación y mantenimiento de sistemas eléctricos residenciales y comerciales, incluyendo controladores lógicos programables (PLC) y sistemas de energía renovable como paneles solares.',
    56,
    42,
    1350,
    array['Diurno','Nocturno'],
    1
  ),
  (
    'Técnico de Mecánica Automotriz',
    'tecnico-de-mecanica-automotriz',
    'Domina el diagnóstico y reparación de vehículos modernos. El programa cubre sistemas de motor, transmisión, frenos, suspensión y tecnología automotriz computarizada.',
    56,
    42,
    1350,
    array['Diurno','Nocturno'],
    2
  ),
  (
    'Técnico de Refrigeración y Aire Acondicionado con PLC y Energía Renovable',
    'tecnico-de-refrigeracion',
    'Especialízate en instalación, mantenimiento y reparación de sistemas de refrigeración y aire acondicionado. Incluye tecnología PLC y sistemas de energía renovable.',
    56,
    42,
    1350,
    array['Diurno','Nocturno'],
    3
  )
) as prog(name, slug, description, duration_weeks, credits, hours, schedule_options, sort_order)
on conflict (slug) do nothing;

-- ============================================================
-- PROGRAM_CAMPUSES (junction table)
-- ============================================================

-- All programs at Barranquitas
insert into program_campuses (program_id, campus_id)
select p.id, c.id
from programs p, campuses c
where c.slug = 'barranquitas'
on conflict (program_id, campus_id) do nothing;

-- All programs EXCEPT Mecánica Automotriz at Vega Alta
insert into program_campuses (program_id, campus_id)
select p.id, c.id
from programs p, campuses c
where c.slug = 'vega-alta'
  and p.slug != 'tecnico-de-mecanica-automotriz'
on conflict (program_id, campus_id) do nothing;

-- ============================================================
-- SITE SETTINGS
-- ============================================================
insert into site_settings (key, value, description) values
  ('site_name', 'D''Mart Institute', 'Official school name'),
  ('tagline', 'Tu Carrera. Tu Futuro. Empieza Aquí.', 'Main tagline'),
  ('meta_description', 'D''Mart Institute es una institución postsecundaria acreditada en Puerto Rico con recintos en Barranquitas y Vega Alta. Ofrecemos programas vocacionales en Belleza, Salud, Comercial y Técnico.', 'Default meta description'),
  ('facebook_url', 'https://facebook.com/dmartinstitute', 'Facebook page URL'),
  ('instagram_url', 'https://instagram.com/dmartinstitute', 'Instagram profile URL'),
  ('youtube_url', '', 'YouTube channel URL'),
  ('hours_weekday', 'Lunes a Jueves: 8:00am – 10:00pm', 'Weekday hours display'),
  ('hours_friday', 'Viernes: 8:00am – 5:00pm', 'Friday hours display'),
  ('hours_saturday', 'Sábado: 8:00am – 12:00pm', 'Saturday hours display')
on conflict (key) do nothing;
