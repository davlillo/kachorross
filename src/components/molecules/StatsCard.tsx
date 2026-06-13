import { Card, CardContent } from '@/components/atoms/ui/card'
import { TrendingUp } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  gradient: string
  trend?: string
  trendColor?: string
}

export function StatsCard({ label, value, icon: Icon, gradient, trend, trendColor = 'text-brand-primary' }: StatsCardProps) {
  return (
    <Card className="border-0 shadow-soft hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {trend && (
              <p className={`text-xs mt-1 ${trendColor} font-medium`}>
                <TrendingUp className="w-3 h-3 inline mr-1" />
                {trend}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
