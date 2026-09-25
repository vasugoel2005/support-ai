'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import AppNav from './AppNav'

export default function EmbedClient({ botId, appUrl }: { botId: string; appUrl: string }) {
    const [copied, setCopied] = useState(false)
    const embedCode = `<script src="${appUrl}/chatBot.js" data-bot-id="${botId}"></script>`

    // Load the REAL widget on this page so owners can test their bot end to end.
    useEffect(() => {
        const s = document.createElement('script')
        s.src = '/chatBot.js'
        s.setAttribute('data-bot-id', botId)
        document.body.appendChild(s)
        return () => {
            s.remove()
            document.getElementById('support-ai-widget-host')?.remove()
        }
    }, [botId])

    const copy = async () => {
        await navigator.clipboard.writeText(embedCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className='min-h-screen bg-zinc-50 text-zinc-900'>
            <AppNav />
            <div className='flex justify-center px-4 py-14 mt-20'>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className='w-full max-w-3xl bg-white rounded-2xl shadow-xl p-10'>
                    <h1 className='text-2xl font-semibold mb-2'>Embed your chatbot</h1>
                    <p className='text-zinc-600 mb-6'>Paste this before the closing <code>&lt;/body&gt;</code> tag of your site.</p>

                    <div className='relative bg-zinc-900 text-zinc-100 rounded-xl p-5 text-sm font-mono mb-8'>
                        <pre className='overflow-x-auto pr-16'>{embedCode}</pre>
                        <button onClick={copy} className='absolute top-3 right-3 bg-white text-zinc-900 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition'>
                            {copied ? 'Copied ✓' : 'Copy'}
                        </button>
                    </div>

                    <h2 className='text-lg font-medium mb-2'>Try it now</h2>
                    <p className='text-sm text-zinc-500'>
                        The live widget is loaded on this page, so click the chat bubble in the bottom-right corner and
                        ask something from your knowledge base. Questions it can&apos;t answer show up under <b>Insights</b>.
                    </p>
                    <p className='text-sm text-zinc-500 mt-4'>
                        Optional attributes: <code>data-title=&quot;Help&quot;</code> and <code>data-color=&quot;#0f766e&quot;</code>.
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
