import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-b-2 border-[#111111] bg-transparent px-3 py-2 font-mono text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#A3A3A3] focus-visible:bg-[#F0F0F0] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
