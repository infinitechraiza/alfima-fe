'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/store'
import { Save, CheckCircle2, AlertCircle } from 'lucide-react'

type Status = 'idle' | 'success' | 'error'

export default function AgentSettingsPage() {
  const { user, initialized, fetchUser } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [profileStatus, setProfileStatus] = useState<Status>('idle')
  const [profileMessage, setProfileMessage] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordStatus, setPasswordStatus] = useState<Status>('idle')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    if (initialized && !user) {
      router.push('/login')
    }
  }, [user, initialized, router])

  useEffect(() => {
    if (!user) return
    setProfile({ name: user.name || '', email: user.email || '', phone: user.phone || '' })
  }, [user])

  if (!initialized || !user) return null

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: name === 'phone' ? value.replace(/\D/g, '').slice(0, 11) : value }))
    setProfileStatus('idle')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswords(prev => ({ ...prev, [name]: value }))
    setPasswordStatus('idle')
  }

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileStatus('idle')
    setProfileMessage('')

    try {
      if (!profile.name.trim()) throw new Error('Full name is required.')
      if (!profile.email.trim()) throw new Error('Email is required.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(profile.email)) throw new Error('Invalid email format.')
      if (profile.phone && !/^09\d{9}$/.test(profile.phone)) throw new Error('Phone must be 11 digits starting with 09.')

      const body = new FormData()
      body.append('user_id', String(user.id))
      body.append('name', profile.name)
      body.append('email', profile.email)
      body.append('phone', profile.phone)

      const res = await fetch('/api/admin/profile/update', {
        method: 'POST',
        body,
        credentials: 'include',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.')

      await fetchUser()
      setProfileStatus('success')
      setProfileMessage('Profile settings saved successfully.')
    } catch (error: any) {
      setProfileStatus('error')
      setProfileMessage(error?.message || 'Failed to update profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordStatus('idle')
    setPasswordMessage('')

    try {
      if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
        throw new Error('All password fields are required.')
      }
      if (passwords.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long.')
      }
      if (passwords.newPassword !== passwords.confirmPassword) {
        throw new Error('New password and confirm password do not match.')
      }

      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: passwords.currentPassword,
          new_password: passwords.newPassword,
          new_password_confirmation: passwords.confirmPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password.')

      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordStatus('success')
      setPasswordMessage('Password updated successfully.')
    } catch (error: any) {
      setPasswordStatus('error')
      setPasswordMessage(error?.message || 'Failed to change password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className='min-h-screen bg-slate-100 py-10'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8'>
        <div className='p-6 rounded-2xl bg-white border border-slate-200 shadow-sm'>
          <h1 className='text-3xl font-bold text-slate-900'>Admin Settings</h1>
          <p className='text-sm text-slate-500 mt-1'>Manage profile and security details for your account.</p>
        </div>
      
      <section className='bg-white border border-slate-200 rounded-2xl shadow-sm p-6'>
        <div className='mb-5 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-slate-800'>Profile Information</h2>
          <span className='text-xs text-slate-500 uppercase tracking-widest'>User ID: {user.id}</span>
        </div>

        {profileStatus === 'success' && (
          <div className='mb-4 p-3 text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-2'>
            <CheckCircle2 className='w-4 h-4 text-emerald-800' /> {profileMessage}
          </div>
        )}
        {profileStatus === 'error' && (
          <div className='mb-4 p-3 text-red-800 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2'>
            <AlertCircle className='w-4 h-4 text-red-800' /> {profileMessage}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className='grid grid-cols-1 gap-5'>
          <label className='grid gap-1'>
            <span className='text-sm font-medium text-emerald-100'>Full Name</span>
            <input
              name='name'
              value={profile.name}
              onChange={handleProfileChange}
              className='border border-emerald-300/60 bg-slate-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400'
            />
          </label>

          <label className='grid gap-1'>
            <span className='text-sm font-medium text-emerald-100'>Email Address</span>
            <input
              name='email'
              value={profile.email}
              onChange={handleProfileChange}
              className='border border-emerald-300/60 bg-slate-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400'
            />
          </label>

          <label className='grid gap-1'>
            <span className='text-sm font-medium text-emerald-100'>Phone Number</span>
            <input
              name='phone'
              value={profile.phone}
              onChange={handleProfileChange}
              placeholder='09171234567'
              className='border border-emerald-300/60 bg-slate-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400'
            />
          </label>

          <div className='pt-2'>
            <Button type='submit' disabled={profileSaving} className='w-full'>
              <Save className='w-4 h-4 mr-2' />
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </section>

      <section className='bg-white border border-slate-200 rounded-2xl shadow-sm p-6'>
        <div className='mb-5'>
          <h2 className='text-xl font-bold text-slate-800'>Change Password</h2>
          <p className='text-sm text-slate-500'>Enter current password and new password to update securely.</p>
        </div>

        {passwordStatus === 'success' && (
          <div className='mb-4 p-3 text-emerald-200 bg-emerald-900/40 border border-emerald-300/50 rounded-lg flex items-center gap-2'>
            <CheckCircle2 className='w-4 h-4 text-emerald-200' /> {passwordMessage}
          </div>
        )}
        {passwordStatus === 'error' && (
          <div className='mb-4 p-3 text-red-200 bg-red-900/40 border border-red-300/50 rounded-lg flex items-center gap-2'>
            <AlertCircle className='w-4 h-4 text-red-200' /> {passwordMessage}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className='grid grid-cols-1 gap-5'>
          <label className='grid gap-1'>
            <span className='text-sm font-medium text-emerald-100'>Current Password</span>
            <input
              name='currentPassword'
              type='password'
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              className='border border-emerald-300/60 bg-slate-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400'
            />
          </label>

          <label className='grid gap-1'>
            <span className='text-sm font-medium text-emerald-100'>New Password</span>
            <input
              name='newPassword'
              type='password'
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              className='border border-emerald-300/60 bg-slate-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400'
            />
          </label>

          <label className='grid gap-1'>
            <span className='text-sm font-medium text-emerald-100'>Confirm New Password</span>
            <input
              name='confirmPassword'
              type='password'
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              className='border border-emerald-300/60 bg-slate-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400'
            />
          </label>

          <div className='pt-2'>
            <Button type='submit' disabled={passwordSaving} className='w-full'>
              <Save className='w-4 h-4 mr-2' />
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  </div>
  )
}
