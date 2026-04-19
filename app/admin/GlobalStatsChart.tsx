'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type QuizStat = { title: string; participants: number }

export default function GlobalStatsChart({ data }: { data: QuizStat[] }) {
  if (!data.length) return null

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e8edf1" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#8fa3b0' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="title" tick={{ fontSize: 12, fill: '#021f35' }} tickLine={false} axisLine={false} width={140} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #d0d8e0', fontSize: 12 }}
          cursor={{ fill: '#f4f7f9' }}
        />
        <Bar dataKey="participants" name="Participantes" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? '#163b4f' : i === 1 ? '#1e4d67' : '#8fa3b0'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
