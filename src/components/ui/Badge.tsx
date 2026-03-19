import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'navy' | 'green' | 'violet' | 'gray' | 'white'
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles = {
  gold: 'bg-gold-100 text-gold-dark border border-gold/30',
  navy: 'bg-navy/10 text-navy border border-navy/20',
  green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  violet: 'bg-violet-50 text-violet-700 border border-violet-200',
  gray: 'bg-gray-100 text-gray-600 border border-gray-200',
  white: 'bg-white text-navy border border-gray-200',
}

const sizeStyles = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
}

export default function Badge({
  children,
  variant = 'gold',
  size = 'sm',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}
