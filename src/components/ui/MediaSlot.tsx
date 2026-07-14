import Image from 'next/image'
import { GraduationCap, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaSlotProps {
  /** Imagen (ruta en /public/media o URL de Supabase). Si falta, se muestra el placeholder de marca. */
  src?: string
  /** Video (mp4/webm). Se reproduce en loop, mudo. Tiene prioridad sobre `src`. */
  video?: string
  poster?: string
  alt?: string
  /** Icono lucide para el placeholder cuando no hay media aún. */
  icon?: LucideIcon
  /** Texto opcional bajo el icono del placeholder. */
  label?: string
  /** Clases del contenedor (controlan tamaño/aspecto/redondeo). */
  className?: string
  /** Overlay oscuro encima (para legibilidad de texto sobre la media). */
  overlay?: boolean
  sizes?: string
  priority?: boolean
}

/**
 * Marco de media reutilizable. Muestra imagen o video reales cuando se pasan;
 * si no, un placeholder de marca (fondo oscuro + glow rojo + rejilla + icono) que
 * se ve intencional. Para activar: sube el archivo a /public/media y pasa `src`/`video`.
 */
export default function MediaSlot({
  src, video, poster, alt = '', icon: Icon = GraduationCap, label,
  className, overlay = false, sizes = '100vw', priority = false,
}: MediaSlotProps) {
  const hasMedia = Boolean(video || src)
  return (
    <div className={cn('relative overflow-hidden bg-navy', className)}>
      {/* Placeholder de marca (siempre detrás; visible si no hay media) */}
      {!hasMedia && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy to-black" />
          <div className="absolute inset-0 bg-grid-dark opacity-60" />
          <div className="absolute -inset-10 glow-red opacity-40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <Icon className="h-10 w-10 text-gold" strokeWidth={1.8} />
            </div>
            {label && <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{label}</span>}
          </div>
        </div>
      )}

      {video ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay muted loop playsInline poster={poster}
        >
          <source src={video} />
        </video>
      ) : src ? (
        <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} priority={priority} />
      ) : null}

      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
      )}
    </div>
  )
}
