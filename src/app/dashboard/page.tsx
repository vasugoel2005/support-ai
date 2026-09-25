import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'
import { getSession } from '@/lib/getSession'

export default async function Page() {
    if (!(await getSession())) redirect('/')
    return <DashboardClient />
}
