import { Card, CardContent } from '@/components/atoms/ui/card'
import { Input } from '@/components/atoms/ui/input'
import { Button } from '@/components/atoms/ui/button'
import { ChevronDown, Search } from 'lucide-react'

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
  filterVariant?: 'buttons' | 'select'
}

export function SearchBar({ placeholder, value, onChange, filters, currentFilter, onFilterChange, filterVariant = 'buttons' }: SearchBarProps) {
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
            filterVariant === 'select' ? (
              <div className="relative min-w-[180px]">
                <select
                  aria-label="Filtrar por especie"
                  value={currentFilter}
                  onChange={(e) => onFilterChange(e.target.value)}
                  className="h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm font-medium leading-none text-foreground outline-none transition-colors hover:bg-muted/40 focus:ring-2 focus:ring-ring"
                >
                  {filters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {filters.map((f) => (
                  <Button
                    key={f.value}
                    variant={currentFilter === f.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onFilterChange(f.value)}
                    className={currentFilter === f.value ? (f.activeClass || 'bg-brand-primary') : ''}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  )
}
