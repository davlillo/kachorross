export function AuthBackground() {
  return (
    <>
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 bg-brand-primary/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 w-96 h-96 bg-brand-secondary/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -top-40 left-10 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(124,58,237,0.06), transparent 30%)', filter: 'blur(48px)' }} />
      <div className="pointer-events-none absolute -bottom-40 right-8 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle at 70% 70%, rgba(58,134,255,0.04), transparent 25%)', filter: 'blur(56px)' }} />
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: 'radial-gradient(circle at 50% 10%, rgba(2,6,23,0.02), transparent 25%), radial-gradient(ellipse at center, rgba(255,255,255,0.0), transparent 60%)' }} />
    </>
  )
}
