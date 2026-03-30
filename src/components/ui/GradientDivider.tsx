import { cn } from '@/lib/utils'

export default function GradientDivider({ className }: { className?: string }) {
  return <div className={cn('gradient-divider my-4', className)} />
}
