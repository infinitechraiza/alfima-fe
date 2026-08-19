'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/store'

export default function BuyerSettingsPage() {
  const { user, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (initialized && !user) {
      router.push('/login')
    }
  }, [initialized, user, router])

  if (!initialized || !user) return null

  return (
    <div className='max-w-4xl mx-auto p-8'>
      <h1 className='text-3xl font-bold'>Buyer Settings</h1>
      <p className='mt-2 text-slate-600'>Your account settings are available here.</p>
      <p className='mt-4 text-sm text-slate-500'>Buyer settings page does not yet have a specialized layout, showing admin settings by default.</p>
    </div>
  )
}
