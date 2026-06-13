import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/atoms/ui/button'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ElementType
  backHref?: string
  actions?: ReactNode
  badge?: ReactNode
}

export function PageHeader({ title, description, icon: Icon, backHref, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link to={backHref}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        )}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            {Icon && <Icon className="w-7 h-7 text-brand-primary" />}
            {title}
            {badge}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex gap-2">{actions}</div>
      )}
    </div>
  )
}
