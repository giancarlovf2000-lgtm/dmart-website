import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'
import { ACCREDITATIONS } from '@/lib/utils'

export default function AccreditationBar() {
  return (
    <section className="border-y border-white/5 bg-navy py-8">
      <div className="container-custom">
        <div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
          <div className="flex flex-shrink-0 items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <span className="whitespace-nowrap text-sm font-bold uppercase tracking-wider text-gray-400">
              Acreditaciones
            </span>
          </div>

          <div className="hidden h-10 w-px bg-white/10 md:block" />

          <div className="flex flex-col flex-wrap items-center justify-center gap-6 sm:flex-row sm:gap-8 md:justify-start">
            {ACCREDITATIONS.map((acc) => (
              <div key={acc.abbr} className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5">
                  <Image src={acc.logo} alt={acc.name} width={48} height={48} className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight text-white">{acc.name}</p>
                  <p className="text-[10px] leading-tight text-gray-400">{acc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
