'use client'

export default function LocalDate({ iso, format = 'datetime' }: { iso: string; format?: 'datetime' | 'date' }) {
  const d = new Date(iso)
  if (format === 'date') {
    return <>{d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</>
  }
  return <>{d.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
}
