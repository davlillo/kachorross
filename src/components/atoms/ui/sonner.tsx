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
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-purpura-600" />,
        info: <InfoIcon className="size-4 text-azure-blue" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-600" />,
        error: <OctagonXIcon className="size-4 text-red-600" />,
        loading: <Loader2Icon className="size-4 animate-spin text-purpura-500" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast !bg-white !text-foreground !border !border-border !shadow-lg !rounded-xl',
          title: '!text-sm !font-semibold',
          description: '!text-xs !text-muted-foreground',
          success: '!border-purpura-200 !bg-purpura-50/80',
          error: '!border-red-200 !bg-red-50/80',
          warning: '!border-amber-200 !bg-amber-50/80',
          info: '!border-blue-200 !bg-blue-50/80',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
