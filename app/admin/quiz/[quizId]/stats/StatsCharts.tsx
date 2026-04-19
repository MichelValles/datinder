'use client'

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type Summary = {
  totalParticipants: number
  withLinkedIn: number
  completionRate: number
  totalResponses: number
}

type QuestionStat = {
  label: string
  optionA: string
  optionB: string
  votesA: number
  votesB: number
  pctA: number
  pctB: number
}

type DayStat = { date: string; count: number }
type CompanyStat = { name: string; count: number }

export default function StatsCharts({
  summary,
  questionStats,
  participationByDay,
  topCompanies,
}: {
  summary: Summary
  questionStats: QuestionStat[]
  participationByDay: DayStat[]
  topCompanies: CompanyStat[]
}) {
  const hasData = summary.totalParticipants > 0

  return (
    <div className="flex flex-col gap-6">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Participantes" value={summary.totalParticipants} />
        <StatCard label="Respuestas" value={summary.totalResponses} />
        <StatCard label="Completitud" value={`${summary.completionRate}%`} />
        <StatCard
          label="Con LinkedIn"
          value={summary.totalParticipants > 0
            ? `${Math.round((summary.withLinkedIn / summary.totalParticipants) * 100)}%`
            : '—'}
          sub={`${summary.withLinkedIn} usuarios`}
        />
      </div>

      {!hasData && (
        <div className="bg-white border border-[#d0d8e0] rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-[#163b4f]/50 text-sm">Aún no hay participantes en este quiz.</p>
        </div>
      )}

      {hasData && participationByDay.length > 1 && (
        <ChartCard title="Participación por día">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={participationByDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#163b4f" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#163b4f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf1" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8fa3b0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8fa3b0' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #d0d8e0', fontSize: 12 }}
                labelStyle={{ fontWeight: 700, color: '#021f35' }}
              />
              <Area type="monotone" dataKey="count" name="Participantes" stroke="#163b4f" strokeWidth={2} fill="url(#gradBlue)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {hasData && (
        <ChartCard title="Distribución de respuestas por pregunta">
          <div className="flex flex-col gap-2 mt-1">
            {questionStats.map((q, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-[#163b4f]/40 font-bold w-5 shrink-0 text-right">{i + 1}</span>
                <span className="text-[#021f35] w-40 shrink-0 truncate" title={q.label}>{q.label}</span>
                <div className="flex-1 flex h-5 rounded-full overflow-hidden gap-px">
                  {q.pctA > 0 && (
                    <div
                      className="bg-[#163b4f] flex items-center justify-center text-white font-bold transition-all"
                      style={{ width: `${q.pctA}%` }}
                      title={`${q.optionA}: ${q.votesA} (${q.pctA}%)`}
                    >
                      {q.pctA >= 15 && `${q.pctA}%`}
                    </div>
                  )}
                  {q.pctB > 0 && (
                    <div
                      className="bg-[#edbe00] flex items-center justify-center text-[#021f35] font-bold transition-all"
                      style={{ width: `${q.pctB}%` }}
                      title={`${q.optionB}: ${q.votesB} (${q.pctB}%)`}
                    >
                      {q.pctB >= 15 && `${q.pctB}%`}
                    </div>
                  )}
                  {q.pctA === 0 && q.pctB === 0 && (
                    <div className="flex-1 bg-[#e8edf1] rounded-full" />
                  )}
                </div>
                <div className="flex gap-3 shrink-0 text-[10px] text-[#163b4f]/50">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#163b4f] inline-block" />
                    {q.votesA}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#edbe00] inline-block" />
                    {q.votesB}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-[#163b4f]/50">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#163b4f] inline-block" /> Opción A</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#edbe00] inline-block" /> Opción B</span>
          </div>
        </ChartCard>
      )}

      {hasData && topCompanies.length > 0 && (
        <ChartCard title="Empresas">
          <ResponsiveContainer width="100%" height={Math.max(160, topCompanies.length * 36)}>
            <BarChart
              data={topCompanies}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf1" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#8fa3b0' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#021f35' }} tickLine={false} axisLine={false} width={120} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #d0d8e0', fontSize: 12 }}
                cursor={{ fill: '#f4f7f9' }}
              />
              <Bar dataKey="count" name="Participantes" radius={[0, 6, 6, 0]}>
                {topCompanies.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#163b4f' : i === 1 ? '#1e4d67' : '#8fa3b0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-[#d0d8e0] rounded-2xl p-4">
      <p className="text-[#163b4f]/50 text-xs font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#021f35]">{value}</p>
      {sub && <p className="text-[#163b4f]/40 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#d0d8e0] rounded-2xl p-5">
      <h3 className="text-xs font-bold text-[#163b4f] uppercase tracking-widest mb-4">{title}</h3>
      {children}
    </div>
  )
}
