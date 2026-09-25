'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import axios from 'axios'
import AppNav from './AppNav'

const inputCls =
    'w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/80'

function errorMessage(err: unknown) {
    if (axios.isAxiosError(err)) return err.response?.data?.error ?? 'Request failed'
    return 'Something went wrong'
}

export default function DashboardClient() {
    const [businessName, setBusinessName] = useState('')
    const [supportEmail, setSupportEmail] = useState('')
    const [knowledge, setKnowledge] = useState('')
    const [domains, setDomains] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        axios
            .get('/api/settings')
            .then(({ data }) => {
                setBusinessName(data.businessName)
                setSupportEmail(data.supportEmail)
                setKnowledge(data.knowledge)
                setDomains((data.allowedDomains as string[]).join('\n'))
            })
            .catch((e) => setError(errorMessage(e)))
            .finally(() => setLoading(false))
    }, [])

    const save = async () => {
        setSaving(true)
        setError('')
        try {
            const { data } = await axios.put('/api/settings', {
                businessName,
                supportEmail,
                knowledge,
                allowedDomains: domains.split('\n'),
            })
            setDomains((data.allowedDomains as string[]).join('\n')) // show normalized values
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (e) {
            setError(errorMessage(e))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className='min-h-screen bg-zinc-50 text-zinc-900'>
            <AppNav />
            <div className='flex justify-center px-4 py-14 mt-20'>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className='w-full max-w-3xl bg-white rounded-2xl shadow-xl p-10'>
                    <h1 className='text-2xl font-semibold'>Chatbot Settings</h1>
                    <p className='text-zinc-500 mt-1 mb-10'>Manage what your AI assistant knows and where it can run.</p>

                    <section className='mb-10'>
                        <h2 className='text-lg font-medium mb-4'>Business details</h2>
                        <div className='space-y-4'>
                            <input className={inputCls} placeholder='Business name' maxLength={100} value={businessName} onChange={(e) => setBusinessName(e.target.value)} disabled={loading} />
                            <input className={inputCls} placeholder='Support email' maxLength={200} value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} disabled={loading} />
                        </div>
                    </section>

                    <section className='mb-10'>
                        <h2 className='text-lg font-medium mb-1'>Knowledge base</h2>
                        <p className='text-sm text-zinc-500 mb-4'>FAQs, policies, delivery info, refunds, opening hours. The assistant answers only from this.</p>
                        <textarea
                            className={`${inputCls} h-56`}
                            maxLength={20000}
                            placeholder={'Example:\n• Refund policy: 7 days return available\n• Delivery time: 3–5 working days\n• Cash on Delivery available'}
                            value={knowledge}
                            onChange={(e) => setKnowledge(e.target.value)}
                            disabled={loading}
                        />
                        <div className='text-xs text-zinc-400 text-right mt-1'>{knowledge.length.toLocaleString()} / 20,000</div>
                    </section>

                    <section className='mb-10'>
                        <h2 className='text-lg font-medium mb-1'>Allowed domains</h2>
                        <p className='text-sm text-zinc-500 mb-4'>One per line (e.g. <code>shop.example.com</code> or <code>*.example.com</code>). Leave empty to allow any site.</p>
                        <textarea className={`${inputCls} h-24 font-mono`} placeholder={'example.com\n*.example.com'} value={domains} onChange={(e) => setDomains(e.target.value)} disabled={loading} />
                    </section>

                    <div className='flex items-center gap-5'>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} disabled={saving || loading} onClick={save}
                            className='px-7 py-3 rounded-xl bg-black text-white text-sm font-medium hover:bg-zinc-800 transition disabled:opacity-60'>
                            {saving ? 'Saving…' : 'Save'}
                        </motion.button>
                        {saved && <span className='text-sm font-medium text-emerald-600'>✓ Settings saved</span>}
                        {error && <span className='text-sm font-medium text-red-600' role='alert'>{error}</span>}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
