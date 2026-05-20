import { Button } from '@/components/atoms/ui/button'

interface EmptyStateProps {
  icon: React.ElementType
  title?: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      {title && <h3 className="text-xl font-semibold">{title}</h3>}
      <p className="text-muted-foreground">{message}</p>
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
