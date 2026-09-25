'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
    { href: '/dashboard', label: 'Settings' },
    { href: '/insights', label: 'Insights' },
    { href: '/embed', label: 'Embed' },
]

export default function AppNav() {
    const pathname = usePathname()
    return (
        <div className='fixed top-0 left-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-200'>
            <div className='max-w-5xl mx-auto px-6 h-16 flex items-center justify-between'>
                <Link href='/' className='text-lg font-semibold tracking-tight'>
                    Support <span className='text-zinc-400'>AI</span>
                </Link>
                <nav className='flex gap-1'>
                    {links.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`px-4 py-2 rounded-lg text-sm transition ${
                                pathname === l.href ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'
                            }`}
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    )
}
