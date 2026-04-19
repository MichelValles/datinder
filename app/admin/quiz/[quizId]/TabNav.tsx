'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = (quizId: string) => [
  { label: 'Ajustes',        href: `/admin/quiz/${quizId}` },
  { label: 'Preguntas',      href: `/admin/quiz/${quizId}/questions` },
  { label: 'Participantes',  href: `/admin/quiz/${quizId}/participants` },
  { label: 'Estadísticas',   href: `/admin/quiz/${quizId}/stats` },
]

export default function TabNav({ quizId }: { quizId: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1">
      {TABS(quizId).map((tab) => {
        const isActive =
          tab.href === `/admin/quiz/${quizId}`
            ? pathname === tab.href
            : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
              isActive
                ? 'text-[#163b4f] border-b-[#edbe00]'
                : 'text-[#163b4f]/45 border-b-transparent hover:text-[#163b4f] hover:border-b-[#163b4f]/20'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
