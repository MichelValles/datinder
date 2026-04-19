import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#e8edf1]">
      <header className="bg-[#163b4f] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/admin">
            <img
              src="https://i.ibb.co/8gNrP0q6/Chat-GPT-Image-May-29-2025-08-27-01-PM.png"
              alt="DaTinder"
              className="h-9 w-auto object-contain"
            />
          </Link>
          <span className="text-white/40 text-xs font-semibold tracking-[0.2em] uppercase select-none">
            Admin
          </span>
        </div>
      </header>
      {children}
    </div>
  )
}
