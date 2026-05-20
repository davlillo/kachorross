import logo from '@/media/logo.png'

export function BrandPanel() {
  return (
    <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-purpura-700 to-purpura-500 p-12 md:p-12 flex-col justify-center items-start gap-8 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-white/0 pointer-events-none" aria-hidden="true" />
      <svg className="absolute -right-24 -bottom-24 opacity-20" width="420" height="420" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <circle cx="210" cy="210" r="200" fill="url(#g1)" />
      </svg>

      <div className="flex items-center gap-6">
        <div className="w-44 h-44 flex items-center justify-center">
          <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        </div>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">Veterinaria<br/>Kachorros</h2>
          <p className="text-sm opacity-90 mt-2">Sistema de Gestión Clínica</p>
        </div>
      </div>
    </div>
  )
}
