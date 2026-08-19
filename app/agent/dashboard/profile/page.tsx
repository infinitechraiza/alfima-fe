'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Save, Camera, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, initialized, fetchUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({ name: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !user) router.push('/login');
  }, [user, initialized, router]);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, phone: user.phone ?? '', bio: '' });
    }
  }, [user]);

  if (!initialized || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const val = name === 'phone' ? value.replace(/\D/g, '').slice(0, 11) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    setStatus('idle');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus('idle');

    try {
      // Validate phone
      if (formData.phone && !/^09\d{9}$/.test(formData.phone)) {
        setErrorMsg('Phone must be 11 digits starting with 09');
        setStatus('error');
        return;
      }

      const fd = new FormData();
      fd.append('user_id', String(user.id)); // proxy route needs this to build the URL
      fd.append('name', formData.name);
      fd.append('phone', formData.phone);
      if (avatarFile) fd.append('avatar', avatarFile);

      // Call the Next.js proxy route which reads the httpOnly cookie server-side
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        body: fd,
        // credentials: 'include' ensures the httpOnly cookie is sent
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update profile');
      }

      // Re-fetch user to update navbar/store
      await fetchUser();
      setStatus('success');
      setAvatarFile(null);
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Failed to save changes');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const phoneDigits = formData.phone.length;
  const displayAvatar = avatarPreview ?? user.avatar;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {status === 'success' && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <p className="text-primary font-medium text-sm">Profile updated successfully</p>
        </div>
      )}
      {status === 'error' && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-red-500 text-sm">{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Avatar */}
        <div>
          <div className="glass rounded-xl p-6 text-center">
            <div className="relative inline-block mb-4">
              {displayAvatar
                ? <img src={displayAvatar} alt={user.name} className="w-24 h-24 rounded-full mx-auto object-cover ring-2 ring-primary/20" />
                : <div className="w-24 h-24 rounded-full mx-auto bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
              }
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition">
                <Camera className="w-4 h-4 text-primary-foreground" />
                <input type="file" accept="image/jpg,image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <h3 className="font-bold text-lg">{user.name}</h3>
            <p className="text-muted-foreground text-sm capitalize">{user.role}</p>
            {avatarFile && <p className="text-xs text-primary mt-2">New photo selected — save to apply</p>}
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition" />
            </div>

            {/* Email — read only */}
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input type="email" value={user.email} disabled
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed" />
              <p className="text-xs text-muted-foreground mt-2">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <div className="relative">
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="09171234567" inputMode="numeric"
                  className="w-full px-4 py-3 pr-16 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition" />
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold ${phoneDigits === 11 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {phoneDigits}/11
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">PH mobile — 11 digits (e.g. 09171234567)</p>
            </div>

            {/* Agent-only fields */}
           

            <Button type="submit" disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2" size="lg">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-12 glass rounded-xl p-8 border-2 border-red-500/20">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Danger Zone</h2>
        <p className="text-muted-foreground mb-6 text-sm">These actions are irreversible. Please proceed with caution.</p>
        <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
          Delete Account
        </Button>
      </div>
    </div>
  );
}