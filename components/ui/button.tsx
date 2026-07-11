import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
const variants=cva('inline-flex items-center justify-center gap-2 rounded-full font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mugla-cyan disabled:pointer-events-none disabled:opacity-50',{variants:{variant:{default:'bg-mugla-navy text-white hover:bg-mugla-blue',orange:'bg-mugla-orange text-white hover:bg-orange-600',outline:'border border-mugla-navy/20 bg-white hover:border-mugla-blue hover:text-mugla-blue',ghost:'hover:bg-mugla-navy/5'},size:{default:'h-11 px-5',sm:'h-9 px-4 text-sm',lg:'h-13 px-7'}},defaultVariants:{variant:'default',size:'default'}})
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof variants>{}
export const Button=React.forwardRef<HTMLButtonElement,ButtonProps>(({className,variant,size,...props},ref)=><button ref={ref} className={cn(variants({variant,size}),className)} {...props}/>)
Button.displayName='Button'
