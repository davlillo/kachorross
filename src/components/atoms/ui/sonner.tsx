import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-brand-primary" />,
        info: <InfoIcon className="size-4 text-brand-secondary" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500 dark:text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-red-500 dark:text-red-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-brand-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast !bg-card !text-foreground !border !border-border !shadow-lg !rounded-xl',
          title: '!text-sm !font-semibold',
          description: '!text-xs !text-muted-foreground',
          success: '!border-brand-primary/30 dark:!border-brand-primary/20 !bg-brand-primary/10 dark:!bg-brand-primary/15',
          error: '!border-red-300 dark:!border-red-800 !bg-red-50 dark:!bg-red-950/60',
          warning: '!border-amber-300 dark:!border-amber-800 !bg-amber-50 dark:!bg-amber-950/60',
          info: '!border-blue-300 dark:!border-blue-800 !bg-blue-50 dark:!bg-blue-950/60',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
