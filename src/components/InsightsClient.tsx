'use client'
import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import AppNav from './AppNav'

interface Insights {
    total: number
    answered: number
    answerRate: number | null
    daily: { date: string; total: number; unanswered: number }[]
    unanswered: { id: string; question: string; createdAt: string }[]
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className='rounded-xl border border-zinc-200 p-5'>
            <div className='text-sm text-zinc-500'>{label}</div>
            <div className='text-3xl font-semibold mt-1'>{value}</div>
        </div>
    )
}

export default function InsightsClient() {
    const [data, setData] = useState<Insights | null>(null)
    const [error, setError] = useState('')

    const load = useCallback(() => {
        axios.get<Insights>('/api/insights').then((r) => setData(r.data)).catch(() => setError('Could not load insights'))
    }, [])
    useEffect(load, [load])

    const resolve = async (id: string) => {
        setData((d) => d && { ...d, unanswered: d.unanswered.filter((u) => u.id !== id) }) // optimistic
        try {
            await axios.patch('/api/insights', { id })
        } catch {
            load()
        }
    }

    const max = Math.max(1, ...(data?.daily.map((d) => d.total) ?? [1]))

    return (
        <div className='min-h-screen bg-zinc-50 text-zinc-900'>
            <AppNav />
            <div className='flex justify-center px-4 py-14 mt-20'>
                <div className='w-full max-w-3xl bg-white rounded-2xl shadow-xl p-10'>
                    <h1 className='text-2xl font-semibold'>Insights</h1>
                    <p className='text-zinc-500 mt-1 mb-8'>See what customers ask and where your knowledge base falls short.</p>
                    {error && <p className='text-red-600 text-sm' role='alert'>{error}</p>}
                    {!data && !error && <p className='text-zinc-400 text-sm'>Loading…</p>}

                    {data && (
                        <>
                            <div className='grid grid-cols-3 gap-4 mb-10'>
                                <Stat label='Conversations (30d)' value={data.total} />
                                <Stat label='Answer rate' value={data.answerRate === null ? '–' : `${data.answerRate}%`} />
                                <Stat label='Unanswered' value={data.total - data.answered} />
                            </div>

                            <h2 className='text-lg font-medium mb-3'>Last 14 days</h2>
                            <div className='flex items-end gap-1.5 h-32 mb-10' aria-label='Messages per day'>
                                {data.daily.map((d) => (
                                    <div key={d.date} className='flex-1 flex flex-col justify-end h-full group relative' title={`${d.date}: ${d.total} messages, ${d.unanswered} unanswered`}>
                                        <div className='bg-red-300 rounded-t' style={{ height: `${(d.unanswered / max) * 100}%` }} />
                                        <div className='bg-black' style={{ height: `${((d.total - d.unanswered) / max) * 100}%`, minHeight: d.total ? 2 : 0 }} />
                                    </div>
                                ))}
                            </div>

                            <h2 className='text-lg font-medium mb-1'>Questions your bot couldn&apos;t answer</h2>
                            <p className='text-sm text-zinc-500 mb-4'>Add these to your knowledge base, then mark them resolved.</p>
                            {data.unanswered.length === 0 ? (
                                <p className='text-sm text-zinc-400'>Nothing here. 🎉</p>
                            ) : (
                                <ul className='divide-y divide-zinc-100 border border-zinc-200 rounded-xl'>
                                    {data.unanswered.map((u) => (
                                        <li key={u.id} className='flex items-center justify-between gap-4 px-4 py-3'>
                                            <div>
                                                <div className='text-sm'>{u.question}</div>
                                                <div className='text-xs text-zinc-400'>{new Date(u.createdAt).toLocaleString()}</div>
                                            </div>
                                            <button onClick={() => resolve(u.id)} className='shrink-0 text-xs px-3 py-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-100'>
                                                Mark resolved
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
