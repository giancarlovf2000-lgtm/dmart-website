import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'
import { ACCREDITATIONS } from '@/lib/utils'

export default function AccreditationBar() {
  return (
    <section className="bg-white border-y border-gray-100 py-8">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* Label */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Acreditaciones
            </span>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-10 bg-gray-200" />

          {/* Accreditation list */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 flex-wrap justify-center md:justify-start">
            {ACCREDITATIONS.map((acc) => (
              <div key={acc.abbr} className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <Image
                    src={acc.logo}
                    alt={acc.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-navy leading-tight">{acc.name}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{acc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
