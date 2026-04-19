import Link from 'next/link'
import AdminLinkedInBadge from '@/components/AdminLinkedInBadge'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#e8edf1]">
      <header className="bg-[#163b4f] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <img
              src="/images/logo-yellow.svg"
              alt="DaTinder"
              className="h-8 w-auto"
            />
            <span className="text-white font-bold text-lg tracking-tight">datinder</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white text-xs font-semibold tracking-wide transition-colors"
            >
              Ver sitio público ↗
            </Link>
            <span className="text-white/20 select-none">|</span>
            <span className="text-white/40 text-xs font-semibold tracking-[0.2em] uppercase select-none">
              Admin
            </span>
            <AdminLinkedInBadge />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
