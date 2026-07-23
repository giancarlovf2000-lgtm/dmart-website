# DMART Leads — Sistema de Diseño del Portal

Lenguaje visual del portal interno (`/portal/*` + login). Estilo **minimalista,
neumórfico (soft UI) tipo iOS**: casi monocromo (tinta/gris sobre lienzo gris claro)
con **rojo reservado exclusivamente para lo urgente/crítico/destructivo/error**.

> Solo aplica al portal. El sitio público, el arte exportable de PostStudio y los
> documentos HTML/PDF generados (contratos, reportes) conservan su propio estilo.

---

## 1. Tokens (fuente única)

Definidos en `tailwind.config.ts` y consumidos vía clases de Tailwind. **Nunca**
hardcodear hex ni usar `gray-*/slate-*/emerald-*/blue-*`… en el portal — usar tokens.

### Color
| Token | Valor | Uso |
|---|---|---|
| `ink` | `#1C1C1E` | Texto principal, títulos, botón primario, íconos neutros |
| `ink-muted` | `#6E727A` | Texto secundario, labels, subtítulos |
| `surface` | `#EEF0F3` | Lienzo de fondo, inputs (inset), chips |
| `surface-soft` | `#E4E7EC` | Tracks / relieve inset más profundo |
| `accent` | `#F5333F` | **Rojo iOS — SOLO urgente/crítico/destructivo/error** |
| `accent-hover` | `#DA1F2B` | Hover de botones rojos |
| `accent-soft` | `#FFE9EA` | Fondo pálido de alertas/badges urgentes |
| `accent-ring` | `rgba(245,51,63,.22)` | Anillo de foco de inputs |
| Tarjetas | `#FFFFFF` | Las tarjetas siempre son blancas puras |

**Regla de oro del color:** todo es neutro (tinta/gris) salvo lo urgente (rojo). Nunca
verde/azul/ámbar **decorativos**. La **única excepción sancionada** es el **estado del
lead**: los badges de estado y las tarjetas de conteo por estado del dashboard usan una
paleta de color con lógica de embudo (ver §5). Todo lo demás sigue monocromo.

### Sombras (neumorfismo dual)
| Token | Uso |
|---|---|
| `shadow-soft` | Tarjetas y botones en reposo (sombra oscura abajo-der + brillo claro arriba-izq) |
| `shadow-soft-lg` | Hover / elevación / modales |
| `shadow-neu-sm` | Chips e íconos pequeños en relieve |
| `shadow-neu-inset` | Inputs, campos y estado "pressed" (relieve hundido) |

### Radio
`rounded-xl2` (20px) · `rounded-neu` (24px, tarjetas) · `rounded-neu-lg` (28px, modales).
Los pills/botones usan `rounded-full`.

### Tipografía
Stack de sistema iOS (definido en `(portal)/layout.tsx`):
`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Inter, …`
Títulos: bold, negro (`text-ink font-display`). Subtítulos: `text-ink-muted`.
Métricas/números: grandes y bold.

### Espaciado
Contenedores `max-w-7xl mx-auto px-4 md:px-6`. Aire generoso; en desktop se aprovecha
el ancho (multicolumna), en móvil una sola columna apilada.

---

## 2. Clases centrales (`globals.css` → `@layer components`)

Consumir SIEMPRE estas clases en lugar de repetir utilidades inline.

### Superficies
- `.portal-card` — tarjeta blanca, `rounded-neu`, `shadow-soft`, sin borde. Añade tu `p-*`.
- `.portal-card-hover` — añade elevación al hover.
- `.portal-tile` — tarjeta de radio menor.
- `.portal-stat-card` (+`--active` fondo tinta) — tarjeta de métrica del dashboard.

### Íconos / chips
- `.portal-icon` — contenedor de ícono 44px en relieve soft (+`--sm`, +`--urgent` para rojo).
- `.portal-chip` — chip redondo 36px (avatar/ícono pequeño).

### Alertas
- `.portal-alert-card` (+`--urgent`) — alerta full-width: ícono + texto + chevron; el
  modificador `--urgent` añade halo rojo. **Solo para lo que de verdad es urgente.**

### Botones (icono interno `h-4 w-4`)
- `.portal-btn` — **primario neutro** (fondo tinta). Acción principal no destructiva.
- `.portal-btn-ghost` — secundario blanco soft (cancelar/cerrar).
- `.portal-btn-danger` / `.portal-btn-accent` — **rojo, solo destructivo/urgente** (eliminar).
- Todos incluyen padding, `rounded-full`, hover, `active:shadow-neu-inset` (pressed) y `disabled`.
- Spinner de carga dentro de un botón: `<span className="portal-spinner h-4 w-4 border-2 border-white/30 border-t-white" />`.

### Formularios
- `.portal-input` / `.portal-select` / `.portal-textarea` — full-width, inset soft, sin borde.
- `.portal-filter` — variante **compacta** para barras de filtros (no ocupa todo el ancho).
- `.portal-label` — label de campo.
- Íconos dentro de inputs: posición `absolute`, `text-ink-muted/60`, añadir `z-10`
  (el ícono va antes del input en el DOM); el input lleva `pl-10`.

### Navegación / estado
- `.portal-pill` (+`--active` tinta) — pills de filtro.
- `.portal-tabs` + `.portal-tab` (+`--active` blanco elevado) — segmented control.
- `.portal-badge` (+`--urgent` rojo) — badges/etiquetas de estado.

### Overlays y utilidades
- `.portal-modal-overlay` (`bg-ink/40 backdrop-blur-sm`) + `.portal-modal` (añade `max-w-*` y `p-*`).
- `.portal-empty` — estado vacío centrado.
- `.portal-spinner` — loader (añade `h-* w-*`).

---

## 3. Convenciones

- **¿Cuándo rojo?** Solo: estados críticos (Crítico, No Asistió, seguimiento vencido),
  duplicados, errores de validación/servidor, y acciones destructivas (eliminar, fusionar
  advertencia). Todo lo demás es neutro. El asterisco de "campo requerido" usa `text-accent`.
- **Botón primario = neutro** (`bg-ink`). El rojo NO se usa para "guardar/continuar".
- **Sin bordes duros.** La separación viene de la sombra y del contraste de superficie
  (`bg-white` sobre `bg-surface`). Divisores muy sutiles: `border-black/[0.05]`.
- **Estados de mapeo de color** (badges de estado de lead) viven en
  `src/components/portal/LeadStatusBadge.tsx` (`STATUS_CONFIG`) — fuente única.
- **Responsive:** conservar los breakpoints de grid/flex; móvil apila en una columna,
  desktop usa el ancho. No "estirar el móvil".

---

## 4. Cómo estilizar una pantalla nueva

1. Envolver el fondo en `bg-surface`; contenido en `max-w-7xl mx-auto px-4 md:px-6`.
2. Cada bloque → `.portal-card p-*`. Métricas → `.portal-stat-card`.
3. Formularios → `.portal-input`/`.portal-select`/`.portal-textarea` + `.portal-label`.
4. Botones → `.portal-btn` (primario) / `.portal-btn-ghost` (secundario) / `.portal-btn-danger`.
5. Modales → `.portal-modal-overlay` + `.portal-modal`.
6. Tabs → `.portal-tabs`; filtros → `.portal-filter` / `.portal-pill`; badges → `.portal-badge`.
7. Loader → `.portal-spinner`; vacío → `.portal-empty`.
8. Color: todo neutro; rojo (`accent`) solo si es urgente/destructivo/error. Única
   excepción: el estado del lead (§5).

---

## 5. Color de estados de lead (única capa con color)

Los **estados de lead** son el único elemento con color propio, porque el color aquí sí
comunica (leer el pipeline de un vistazo). Tinte **suave/pastel iOS** (fondo `-50/-100`
tenue + texto `-600/-700/-800` saturado), con lógica de embudo: frío → cálido →
verde = ganado / gris = perdido / rojo = urgente.

**Fuente única:** `src/components/portal/LeadStatusBadge.tsx` → `STATUS_CONFIG`
(`{ label, className, chipBg, icon }`, exportado). Lo consumen:
- `LeadStatusBadge` → badges en tabla de leads, detalle del lead y duplicados (`className`).
- `dashboard/page.tsx` → tarjetas de conteo por estado (`chipBg` fondo del chip + `icon` color del icono).

Para cambiar/añadir un color de estado, editar SOLO ese mapa (clases Tailwind **literales**,
para que el compilador las incluya).

| Estado | Tono | badge |
|---|---|---|
| Nuevo Lead | azul | `bg-blue-50 text-blue-700` |
| Contacto Inicial | sky | `bg-sky-50 text-sky-700` |
| Contacto Establecido | cyan | `bg-cyan-50 text-cyan-700` |
| Cita Programada | índigo | `bg-indigo-50 text-indigo-700` |
| Reagendado | violeta | `bg-violet-50 text-violet-700` |
| En Espera de Documentos | ámbar | `bg-amber-50 text-amber-700` |
| Orientado | teal | `bg-teal-50 text-teal-700` |
| Seguimiento a Futuro | slate | `bg-slate-100 text-slate-600` |
| Matriculado | verde | `bg-green-50 text-green-700` |
| Graduado | esmeralda | `bg-emerald-50 text-emerald-700` |
| Graduado con Reválida | esmeralda + | `bg-emerald-100 text-emerald-800` |
| No Asistió a la Cita | naranja | `bg-orange-50 text-orange-700` |
| Crítico | rojo (accent) | `bg-accent-soft text-accent` |
| Desinteresado / Rechazado | gris (perdido) | `bg-surface text-ink-muted/70` |
