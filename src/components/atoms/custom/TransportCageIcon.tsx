/**
 * Icono de jaula transportadora de mascotas.
 *
 * Lucide no trae este icono y los que se le parecen (`Luggage`, `Briefcase`,
 * `Package`) no dicen "mascota": parecen valija o paquete. Como el módulo de
 * hospedaje ya tenía su propio color y su propio vocabulario visual, un ícono
 * propio cierra esa separación en lugar de reusar `BedDouble`, que además ya
 * significaba cama en el historial.
 *
 * Se dibuja con la misma convención de Lucide: caja de 24, `stroke` sin relleno,
 * hereda `currentColor` y toma el color del `className` del consumidor.
 */

interface TransportCageIconProps {
  className?: string
  strokeWidth?: number
}

export function TransportCageIcon({ className, strokeWidth = 2 }: TransportCageIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Asa de transporte */}
      <path d="M9.5 6.5V4.75A1.75 1.75 0 0 1 11.25 3h1.5a1.75 1.75 0 0 1 1.75 1.75V6.5" />
      {/* Cuerpo de la jaula */}
      <path d="M4.5 6.5h15A1.5 1.5 0 0 1 21 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V8a1.5 1.5 0 0 1 1.5-1.5Z" />
      {/* Puerta con barrotes */}
      <path d="M8.25 9.5h7.5a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75v-6.5a.75.75 0 0 1 .75-.75Z" />
      <path d="M10.75 9.5v8M13.25 9.5v8" />
      {/* Pata */}
      <path d="M16.5 12h.01" />
    </svg>
  )
}