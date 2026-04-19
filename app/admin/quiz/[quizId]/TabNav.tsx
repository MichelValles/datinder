'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = (quizId: string) => [
  { label: 'Ajustes', href: `/admin/quiz/${quizId}` },
  { label: 'Preguntas', href: `/admin/quiz/${quizId}/questions` },
  { label: 'Participantes', href: `/admin/quiz/${quizId}/participants` },
]

export default function TabNav({ quizId }: { quizId: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 mt-4">
      {TABS(quizId).map((tab) => {
        const isActive =
          tab.href === `/admin/quiz/${quizId}`
            ? pathname === tab.href
            : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
