import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import EmbedClient from '@/components/EmbedClient'
import { getSession } from '@/lib/getSession'
import { getOrCreateSettings } from '@/lib/settings'

export default async function Page() {
    const session = await getSession()
    if (!session?.user?.id) redirect('/')
    const { botId } = await getOrCreateSettings(session.user.id)

    const h = await headers()
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`

    return <EmbedClient botId={botId} appUrl={appUrl} />
}
