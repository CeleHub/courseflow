import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface LoadingProps {
  message?: string
  className?: string
}

export function Loading({ message = 'Loading...', className = '' }: LoadingProps) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export function LoadingCard({ message = 'Loading...', className = '' }: LoadingProps) {
  return (
    <Card className={className}>
      <CardContent>
        <Loading message={message} />
      </CardContent>
    </Card>
  )
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}
