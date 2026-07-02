import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:brightness-95',
  secondary: 'bg-muted text-foreground hover:bg-muted/70',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  outline: 'border border-border bg-surface text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground hover:brightness-110',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
  icon: 'h-9 w-9 p-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-lg font-medium',
        'transition-[transform,background-color,box-shadow,color,filter,opacity] duration-150 ease-out',
        'active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:transition-none',
        'disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
})
