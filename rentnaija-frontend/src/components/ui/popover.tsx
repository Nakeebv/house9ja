import * as React from 'react'
import { cn } from '@/lib/utils'

type PopoverContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

function usePopoverContext() {
  const context = React.useContext(PopoverContext)

  if (!context) {
    throw new Error('Popover components must be used within <Popover>.')
  }

  return context
}

function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, type = 'button', ...props }, ref) => {
  const { open, setOpen } = usePopoverContext()

  return (
    <button
      ref={ref}
      type={type}
      className={className}
      aria-expanded={open}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          setOpen(current => !current)
        }
      }}
      {...props}
    />
  )
})
PopoverTrigger.displayName = 'PopoverTrigger'

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
  }
>(({ className, align = 'center', sideOffset = 4, style, ...props }, ref) => {
  const { open } = usePopoverContext()

  if (!open) {
    return null
  }

  const alignment =
    align === 'start'
      ? 'left-0'
      : align === 'end'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2'

  return (
    <div
      ref={ref}
      className={cn(
        'absolute top-full z-50 mt-1 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
        alignment,
        className,
      )}
      style={{ marginTop: sideOffset, ...style }}
      {...props}
    />
  )
})
PopoverContent.displayName = 'PopoverContent'

export { Popover, PopoverTrigger, PopoverContent }
