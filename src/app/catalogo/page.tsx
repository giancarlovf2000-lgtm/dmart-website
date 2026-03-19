import type { Metadata } from 'next'
import { FileText, Download, BookOpen, ExternalLink } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import CTABanner from '@/components/sections/CTABanner'

export const metadata: Metadata = {
  title: 'Catálogo y Documentos',
  description:
    "Descarga el catálogo institucional de D'Mart Institute, folletos de programas y formularios de admisión. Toda la información que necesitas para comenzar.",
}

const documentCategories = {
  catalogo: { label: 'Catálogo Institucional', icon: BookOpen, color: 'text-navy bg-navy/10' },
  folleto: { label: 'Folletos de Programas', icon: FileText, color: 'text-gold-dark bg-gold/10' },
  formulario: { label: 'Formularios', icon: Download, color: 'text-emerald-700 bg-emerald-100' },
}

type DisplayDoc = {
  id: string
  title: string
  description: string
  category: string | null
  language: string
  sort_order: number
  file_url?: string | null
  active?: boolean
  created_at?: string
}

// Placeholder documents for when DB is empty
const placeholderDocs: DisplayDoc[] = [
  {
    id: '1',
    title: "Catálogo Institucional D'Mart Institute",
    description: 'Catálogo completo con información sobre todos los programas, políticas institucionales, costos y ayuda económica.',
    category: 'catalogo',
    language: 'es',
    sort_order: 1,
  },
  {
    id: '2',
    title: 'Folleto de Programas de Belleza',
    description: 'Información detallada sobre los programas de Cosmetología, Barbería, Técnica de Uñas, Estética y Maquillaje.',
    category: 'folleto',
    language: 'es',
    sort_order: 2,
  },
  {
    id: '3',
    title: 'Folleto de Programas Técnicos',
    description: 'Información sobre los programas de Electricidad, Mecánica Automotriz y Refrigeración y Aire Acondicionado.',
    category: 'folleto',
    language: 'es',
    sort_order: 3,
  },
  {
    id: '4',
    title: 'Folleto de Enfermería Práctica',
    description: 'Información detallada sobre el programa de Enfermería Práctica, requisitos y oportunidades de carrera.',
    category: 'folleto',
    language: 'es',
    sort_order: 4,
  },
  {
    id: '5',
    title: 'Solicitud de Admisión',
    description: 'Formulario oficial de solicitud de admisión para todos los programas de D\'Mart Institute.',
    category: 'formulario',
    language: 'es',
    sort_order: 5,
  },
]

export default async function CatalogoPage() {
  const displayDocs: DisplayDoc[] = placeholderDocs

  const grouped = displayDocs.reduce(
    (acc, doc) => {
      const cat = doc.category ?? 'folleto'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(doc)
      return acc
    },
    {} as Record<string, DisplayDoc[]>
  )

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-navy py-20 md:py-28">
        <div className="container-custom">
          <div className="max-w-3xl">
            <Badge variant="gold" size="md" className="mb-4">Recursos</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-5">
              Catálogo y Documentos
            </h1>
            <p className="text-gray-300 text-xl leading-relaxed">
              Accede a nuestro catálogo institucional, folletos de programas y formularios
              de admisión. Toda la información que necesitas en un solo lugar.
            </p>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="section-padding">
        <div className="container-custom">
          {Object.keys(documentCategories).map((catKey) => {
            const docs = grouped[catKey]
            if (!docs || docs.length === 0) return null
            const catInfo = documentCategories[catKey as keyof typeof documentCategories]
            const CatIcon = catInfo.icon

            return (
              <div key={catKey} className="mb-14">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${catInfo.color}`}>
                    <CatIcon className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-black text-navy">{catInfo.label}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Doc header */}
                      <div className={`p-5 flex items-center gap-3 border-b border-gray-100`}>
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                            {catInfo.label}
                          </p>
                          <p className="text-xs text-gray-400">{doc.language === 'es' ? 'Español' : 'English'}</p>
                        </div>
                      </div>

                      {/* Doc content */}
                      <div className="p-5">
                        <h3 className="font-bold text-navy mb-2 text-base leading-snug">{doc.title}</h3>
                        {doc.description && (
                          <p className="text-sm text-gray-500 leading-relaxed mb-4">{doc.description}</p>
                        )}

                        {/* Download button — only shown if file_url is present */}
                        {'file_url' in doc && doc.file_url ? (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-dark transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Descargar PDF
                          </a>
                        ) : (
                          <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400">
                            <ExternalLink className="h-4 w-4" />
                            Disponible próximamente
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Request catalog */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="bg-gradient-navy rounded-3xl p-8 md:p-12 text-center">
            <BookOpen className="h-12 w-12 text-gold mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-4">
              ¿Necesitas el Catálogo Físico?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Contáctanos y con gusto te enviamos una copia física del catálogo institucional
              o programa las información que necesitas directamente con un consejero.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:7878576929"
                className="flex items-center justify-center gap-2 bg-gold text-navy font-bold px-8 py-3 rounded-xl hover:bg-gold-dark transition-colors"
              >
                Barranquitas: (787) 857-6929
              </a>
              <a
                href="tel:7878838180"
                className="flex items-center justify-center gap-2 border-2 border-white/30 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Vega Alta: (787) 883-8180
              </a>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
