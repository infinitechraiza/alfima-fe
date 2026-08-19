'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeveloperInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  propertyTitle: string;
}

interface DeveloperInquiryForm {
  full_name: string;
  email: string;
  contact_number: string;
  message: string;
  preferred_viewing_date: string;
  preferred_viewing_time: string;
}

interface FieldError {
  [key: string]: string | null;
}

const TIME_SLOTS = [
  { label: '9:00 AM',  value: '09:00' },
  { label: '10:00 AM', value: '10:00' },
  { label: '11:00 AM', value: '11:00' },
  { label: '12:00 NN', value: '12:00' },
  { label: '1:00 PM',  value: '13:00' },
  { label: '2:00 PM',  value: '14:00' },
  { label: '3:00 PM',  value: '15:00' },
  { label: '4:00 PM',  value: '16:00' },
  { label: '5:00 PM',  value: '17:00' },
];

export default function DeveloperInquiryModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
}: DeveloperInquiryModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const [form, setForm] = useState<DeveloperInquiryForm>({
    full_name: '',
    email: '',
    contact_number: '',
    message: '',
    preferred_viewing_date: '',
    preferred_viewing_time: '',
  });

  const [errors, setErrors]   = useState<FieldError>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Validators ────────────────────────────────────────────────────────────
  const validateFullName = (v: string): string | null => {
    if (!v.trim()) return 'Full name is required';
    if (v.trim().length < 2) return 'Name must be at least 2 characters';
    if (v.trim().length > 60) return 'Name must be 60 characters or less';
    if (!/^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-\.]+$/.test(v.trim())) return 'Name must contain letters only';
    if (v.trim().split(/\s+/).length < 2) return 'Please enter your full name (first & last)';
    return null;
  };

  const validateEmail = (v: string): string | null => {
    if (!v.trim()) return 'Email is required';
    if (v.length > 100) return 'Email must be 100 characters or less';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Enter a valid email address';
    return null;
  };

  const validatePhone = (v: string): string | null => {
    if (!v.trim()) return 'Contact number is required';
    const digits = v.replace(/\D/g, '');
    if (!/^(09\d{9}|639\d{9})$/.test(digits)) {
      if (digits.length < 11) return 'Phone number too short — must be 11 digits (e.g. 09171234567)';
      if (digits.length > 12) return 'Phone number too long — must be 11 digits (e.g. 09171234567)';
      return 'Must start with 09 (e.g. 09171234567) or +639';
    }
    return null;
  };

  const validateMessage = (v: string): string | null => {
    if (!v.trim()) return 'Message is required';
    if (v.trim().length < 10) return 'Message must be at least 10 characters';
    if (v.length > 500) return `Message too long — ${v.length}/500 characters`;
    return null;
  };

  const validateDate = (v: string): string | null => {
    if (!v) return 'Preferred viewing date is required';
    const selected = new Date(v);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selected <= today) return 'Date must be tomorrow or later';
    const max = new Date(today); max.setMonth(today.getMonth() + 6);
    if (selected > max) return 'Date must be within the next 6 months';
    return null;
  };

  const validateTime = (v: string): string | null => {
    if (!v) return 'Preferred viewing time is required';
    return null;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const setTime = (value: string) => {
    setForm(prev => ({ ...prev, preferred_viewing_time: value }));
    if (errors.preferred_viewing_time) setErrors(prev => ({ ...prev, preferred_viewing_time: null }));
  };

  const validateForm = (): boolean => {
    const newErrors: FieldError = {
      full_name:              validateFullName(form.full_name),
      email:                  validateEmail(form.email),
      contact_number:         validatePhone(form.contact_number),
      message:                validateMessage(form.message),
      preferred_viewing_date: validateDate(form.preferred_viewing_date),
      preferred_viewing_time: validateTime(form.preferred_viewing_time),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(e => e === null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/developer-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name:              form.full_name,
          email:                  form.email,
          contact_number:         form.contact_number.replace(/\D/g, ''),
          message:                form.message,
          preferred_viewing_date: form.preferred_viewing_date,
          preferred_viewing_time: form.preferred_viewing_time,
          developer_property_id:  propertyId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Surface Laravel validation errors if present
        if (data.errors) {
          const mapped: FieldError = {};
          Object.entries(data.errors as Record<string, string[]>).forEach(([key, msgs]) => {
            mapped[key] = msgs[0];
          });
          setErrors(mapped);
        } else {
          setErrors({ submit: data.message ?? data.error ?? 'Failed to submit inquiry' });
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => { onClose(); setSuccess(false); }, 3000);
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Field style helper ────────────────────────────────────────────────────
  const inputCls = (field: string) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors ${
      errors[field]
        ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400'
        : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
    }`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Send Inquiry</h2>
            <p className="text-sm text-slate-500 mt-0.5 truncate max-w-xs">{propertyTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Inquiry Sent! 🎉</h3>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                Thank you for your interest. Our team will review your inquiry and get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Submit error banner */}
              {errors.submit && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 font-medium">⚠ {errors.submit}</p>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="full_name" type="text" value={form.full_name}
                  onChange={handleChange} placeholder="Juan Dela Cruz"
                  className={inputCls('full_name')} maxLength={60}
                />
                {errors.full_name && <p className="text-xs text-red-600 mt-1 font-medium">{errors.full_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="email" type="email" value={form.email}
                  onChange={handleChange} placeholder="juan@example.com"
                  className={inputCls('email')} maxLength={100}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1 font-medium">{errors.email}</p>}
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="contact_number" type="tel" value={form.contact_number}
                  onChange={handleChange} placeholder="09171234567"
                  className={inputCls('contact_number')} maxLength={15} inputMode="numeric"
                />
                {errors.contact_number && <p className="text-xs text-red-600 mt-1 font-medium">{errors.contact_number}</p>}
              </div>

              {/* Preferred Viewing Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <Calendar className="inline w-4 h-4 mr-1 -mt-0.5" />
                  Preferred Viewing Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="preferred_viewing_date" type="date"
                  value={form.preferred_viewing_date} onChange={handleChange}
                  min={minDate} max={maxDateStr}
                  className={inputCls('preferred_viewing_date')}
                />
                {errors.preferred_viewing_date
                  ? <p className="text-xs text-red-600 mt-1 font-medium">{errors.preferred_viewing_date}</p>
                  : <p className="text-xs text-slate-400 mt-1">Tomorrow up to 6 months ahead</p>}
              </div>

              {/* Preferred Viewing Time */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  <Clock className="inline w-4 h-4 mr-1 -mt-0.5" />
                  Preferred Viewing Time <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setTime(slot.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.preferred_viewing_time === slot.value
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
                {errors.preferred_viewing_time && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.preferred_viewing_time}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs ${form.message.length > 450 ? 'text-red-500' : 'text-slate-400'}`}>
                    {form.message.length}/500
                  </span>
                </div>
                <textarea
                  name="message" value={form.message} onChange={handleChange}
                  placeholder="Tell us more about your inquiry..."
                  rows={4} maxLength={500}
                  className={`${inputCls('message')} resize-none`}
                />
                {errors.message && <p className="text-xs text-red-600 mt-1 font-medium">{errors.message}</p>}
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0">
            <Button
  type="button"
  variant="outline"
  className="flex-1 border-primary text-primary hover:bg-primary/10"
  onClick={onClose}
  disabled={loading}
>
  Cancel
</Button>
            <Button
              type="submit" className="flex-1 bg-primary hover:bg-primary/90"
              disabled={loading} onClick={handleSubmit}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                : 'Send Inquiry'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}