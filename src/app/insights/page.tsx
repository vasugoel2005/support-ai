import { redirect } from 'next/navigation'
import InsightsClient from '@/components/InsightsClient'
import { getSession } from '@/lib/getSession'

export default async function Page() {
    if (!(await getSession())) redirect('/')
    return <InsightsClient />
}
