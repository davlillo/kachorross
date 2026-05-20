import { Card, CardContent } from '@/components/atoms/ui/card'
import { Input } from '@/components/atoms/ui/input'
import { Button } from '@/components/atoms/ui/button'
import { Search } from 'lucide-react'

interface FilterOption {
  label: string
  value: string
  active?: boolean
  activeClass?: string
}

interface SearchBarProps {
  placeholder: string
  value: string
  onChange: (v: string) => void
  filters?: FilterOption[]
  currentFilter?: string
  onFilterChange?: (v: string) => void
}

export function SearchBar({ placeholder, value, onChange, filters, currentFilter, onFilterChange }: SearchBarProps) {
  return (
    <Card className="border-0 shadow-soft">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          {filters && onFilterChange && (
            <div className="flex gap-2 flex-wrap">
              {filters.map((f) => (
                <Button
                  key={f.value}
                  variant={currentFilter === f.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange(f.value)}
                  className={currentFilter === f.value ? (f.activeClass || 'bg-purpura-500') : ''}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
