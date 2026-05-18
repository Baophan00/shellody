import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-sans font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 uppercase tracking-widest min-h-[44px]",
  {
    variants: {
      variant: {
        default: 'bg-[#111111] text-[#F9F9F7] border border-transparent hover:bg-white hover:text-[#111111] hover:border-[#111111]',
        destructive:
          'bg-[#CC0000] text-white hover:bg-[#111111]',
        outline:
          'border border-[#111111] bg-transparent hover:bg-[#111111] hover:text-[#F9F9F7]',
        secondary:
          'bg-[#E5E5E0] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]',
        ghost:
          'hover:bg-[#E5E5E0] hover:text-[#111111]',
        link: 'text-[#111111] underline-offset-4 decoration-2 decoration-[#CC0000] hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2 has-[>svg]:px-3',
        sm: 'h-9 px-4 has-[>svg]:px-2.5',
        lg: 'h-12 px-8 has-[>svg]:px-4',
        icon: 'h-11 w-11',
        'icon-sm': 'h-9 w-9',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
