'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionItem {
  id: number | string
  question: string
  answer: string
}

interface AccordionProps {
  items: AccordionItem[]
  className?: string
  allowMultiple?: boolean
}

function AccordionItemComponent({
  item,
  isOpen,
  onToggle,
}: {
  item: AccordionItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        'border border-gray-200 rounded-xl overflow-hidden transition-all duration-200',
        isOpen && 'border-gold/40 shadow-gold/5 shadow-sm'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-start justify-between gap-4 p-5 text-left',
          'transition-colors duration-200',
          isOpen ? 'bg-gold-50' : 'bg-white hover:bg-gray-50'
        )}
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            'text-base font-semibold leading-snug',
            isOpen ? 'text-navy' : 'text-gray-800'
          )}
        >
          {item.question}
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 flex-shrink-0 mt-0.5 transition-transform duration-300',
            isOpen ? 'rotate-180 text-gold' : 'text-gray-400'
          )}
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-5 pb-5 pt-1">
          <p className="text-gray-600 leading-relaxed text-sm md:text-base">{item.answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function Accordion({ items, className, allowMultiple = false }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<number | string>>(new Set())

  const toggle = (id: number | string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (!allowMultiple) next.clear()
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => (
        <AccordionItemComponent
          key={item.id}
          item={item}
          isOpen={openIds.has(item.id)}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </div>
  )
}
