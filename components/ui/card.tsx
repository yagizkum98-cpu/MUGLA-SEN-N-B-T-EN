import * as React from 'react';import {cn} from '@/lib/utils'
export function Card({className,...p}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn('rounded-3xl border border-mugla-navy/10 bg-white shadow-soft',className)} {...p}/>}
export function CardHeader({className,...p}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn('p-6 pb-3',className)} {...p}/>}
export function CardContent({className,...p}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn('p-6 pt-3',className)} {...p}/>}
