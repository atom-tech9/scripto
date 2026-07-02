import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function Field({ label, hint, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center justify-between text-xs font-medium text-muted-foreground"
      >
        <span>{label}</span>
        {hint && <span className="font-normal tabular-nums text-muted-foreground/70">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'h-9 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputClass, className)} {...props} />
  },
)

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
          className,
        )}
        {...props}
      />
    )
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          inputClass,
          'cursor-pointer appearance-none bg-no-repeat pe-8',
          'bg-[position:right_0.6rem_center] rtl:bg-[position:left_0.6rem_center]',
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
    )
  },
)

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
  'aria-label'?: string
}

export function Switch({ checked, onChange, id, ...aria }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked ? 'bg-primary' : 'bg-muted-foreground/30',
      )}
      {...aria}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
          checked
            ? 'translate-x-[1.15rem] rtl:-translate-x-[1.15rem]'
            : 'translate-x-1 rtl:-translate-x-1',
        )}
      />
    </button>
  )
}

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  id?: string
  'aria-label'?: string
}

export function Slider({ value, min, max, step = 1, onChange, id, ...aria }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100
  return (
    <input
      id={id}
      type="range"
      dir="ltr"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-primary"
      style={{
        background: `linear-gradient(to right, hsl(var(--primary)) ${percent}%, hsl(var(--muted)) ${percent}%)`,
      }}
      {...aria}
    />
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: ReadonlyArray<{ value: T; label: ReactNode; title?: string }>
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  size = 'md',
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex rounded-lg bg-muted p-0.5', className)}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          title={opt.title}
          onClick={() => onChange(opt.value)}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all',
            size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
            value === opt.value
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
