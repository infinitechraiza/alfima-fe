'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Video, X, Play } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Service {
  id: number;
  name?: string;   // some APIs return 'name'
  label?: string;   // Laravel model uses 'label'
}

interface Testimonial {
  id: number;
  full_name: string;
  service_id: number | null;
  service?: Service | null;
  message: string;
  video_url: string | null;
  is_approved: boolean;
  created_at: string;
}

// ── Zod Schema ─────────────────────────────────────────────────────────────────
const testimonialSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  service_id: z.number().nullable().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
});

type TestimonialFormData = z.infer<typeof testimonialSchema>;

// ── Helper ─────────────────────────────────────────────────────────────────────
function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getServiceLabel(service: Service): string {
  return service.label ?? service.name ?? `Service #${service.id}`;
}

// ── VideoCard ──────────────────────────────────────────────────────────────────
function VideoCard({ testimonial }: { testimonial: Testimonial }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="bg-[#4a3333] border border-[#6b4949] rounded-xl flex flex-col overflow-hidden shadow-lg">
      {/* Fixed height video — no longer flex-1 so info strip always shows */}
      <div className="relative h-64 bg-black cursor-pointer flex-shrink-0" onClick={toggle}>
        <video
          ref={videoRef}
          src={testimonial.video_url!}
          className="w-full h-full object-cover"
          onEnded={() => setPlaying(false)}
          playsInline
        />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-[#3d2626] ml-1" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Info strip — always visible now */}
      <div className="px-5 py-4 bg-[#4a3333]">
        <p className="text-white font-semibold text-sm">{testimonial.full_name}</p>
        {testimonial.service && (
          <p className="text-amber-400 text-xs font-medium mt-0.5">
            {getServiceLabel(testimonial.service)}
          </p>
        )}
        <p className="text-gray-400 text-xs mt-0.5">
          {new Date(testimonial.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
        {testimonial.message && (
          <p className="text-gray-300 text-xs mt-2 line-clamp-2">{testimonial.message}</p>
        )}
      </div>
    </div>
  );
}

// ── TextCard ───────────────────────────────────────────────────────────────────
function TextCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-[#4a3333] border border-[#6b4949] rounded-xl p-8 h-96 flex flex-col justify-between shadow-lg">
      <p className="text-white text-lg leading-relaxed flex-1">{testimonial.message}</p>
      <div>
        <p className="text-white font-semibold">{testimonial.full_name}</p>
        {testimonial.service && (
          <p className="text-amber-400 text-xs font-medium mt-0.5">
            {getServiceLabel(testimonial.service)}
          </p>
        )}
        <p className="text-sm text-gray-400">
          {new Date(testimonial.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [video, setVideo] = useState<{ file: File; preview: string } | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema) as Resolver<TestimonialFormData>,
    defaultValues: { full_name: '', service_id: null, message: '' },
  });

  // ── Fetch testimonials + services ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [tRes, sRes] = await Promise.all([
          fetch('/api/testimonials'),
          fetch('/api/services?all=1'),
        ]);
        const [tData, sData] = await Promise.all([tRes.json(), sRes.json()]);

        if (tData.success) setTestimonials(tData.data || []);

        // Handle all possible API shapes:
        // { data: [...] }  |  { success: true, data: [...] }  |  [...]
        const serviceList: Service[] =
          Array.isArray(sData) ? sData :
            Array.isArray(sData.data) ? sData.data :
              Array.isArray(sData.services) ? sData.services :
                [];

        setServices(serviceList);
      } catch {
        toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  // ── Video pick ─────────────────────────────────────────────────────────────
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Video must be under 200 MB.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setVideo({ file, preview: reader.result as string });
    reader.readAsDataURL(file);
  };

  const removeVideo = () => {
    setVideo(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values: TestimonialFormData) => {
    try {
      setSubmitting(true);

      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!data.success) {
        toast({ title: 'Error', description: data.message || 'Failed to submit testimonial', variant: 'destructive' });
        return;
      }

      const testimonialId: number = data.data.id;

      if (video && testimonialId) {
        setVideoUploading(true);
        try {
          const tokenRes = await fetch('/api/auth/token');
          const tokenData = await tokenRes.json();
          const token = tokenData.token;

          const fd = new FormData();
          fd.append('video', video.file);

          const laravelBase = process.env.NEXT_PUBLIC_API_URL;
          const videoRes = await fetch(
            `${laravelBase}/api/testimonials/${testimonialId}/video`,
            {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: fd,
            }
          );

          if (!videoRes.ok) {
            toast({
              title: 'Partial success',
              description: 'Testimonial submitted! But video upload failed. Please try again later.',
              variant: 'destructive',
            });
          }
        } catch {
          toast({
            title: 'Partial success',
            description: 'Testimonial submitted! But video upload failed due to a network error.',
            variant: 'destructive',
          });
        } finally {
          setVideoUploading(false);
        }
      }

      toast({
        title: 'Success!',
        description: data.message || 'Thank you for your testimonial!',
      });

      form.reset();
      setVideo(null);
      if (videoInputRef.current) videoInputRef.current.value = '';

    } catch {
      toast({ title: 'Error', description: 'An error occurred while submitting your testimonial', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || videoUploading;

  return (
    <section className="relative py-24 sm:py-34 bg-white">

      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/1200x/e9/01/bf/e901bf2bed461c411f141c92b0344ecf.jpg')",
        }}
      />

      {/* Semi-transparent white overlay (shows ~20% of image) */}
      <div className="absolute inset-0 bg-white opacity-60" />

      <div className="relative container mx-auto px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold bg-gradient-to-tr from-red-600 from-[10%] via-red-rose-500 via-[80%] to-red-600 to-[100%] backdrop-blur-sm bg-clip-text text-transparent mb-4">What Our Clients Say</h2>
          <p className="text-lg text-gray-800/70 max-w-2xl mx-auto">
            Hear from satisfied clients about their experience with our real estate services.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

          {/* ── Carousel ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-center">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <Spinner className="w-8 h-8" />
              </div>
            ) : testimonials.length === 0 ? (
              <div className="flex items-center justify-center h-96 bg-[#4a3333] rounded-xl border border-[#6b4949] p-8 shadow-lg">
                <p className="text-center text-gray-300">
                  No testimonials yet. Be the first to share your experience!
                </p>
              </div>
            ) : (
              <Carousel
                opts={{ align: 'start', loop: true }}
                plugins={[Autoplay({ delay: 5000 })]}
                className="w-full"
              >
                <CarouselContent>
                  {testimonials.map((t) => (
                    <CarouselItem key={t.id}>
                      {t.video_url ? <VideoCard testimonial={t} /> : <TextCard testimonial={t} />}
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="text-gray-700 absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16" />
                <CarouselNext className="text-white absolute right-0 top-1/2 -translate-y-1/2 translate-x-16" />
              </Carousel>
            )}
          </div>

          {/* ── Form ──────────────────────────────────────────────────────── */}
          <div className="flex items-center">
            <div className="w-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-white mb-6">Share Your Experience</h3>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-100">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your name"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                            {...field}
                            disabled={isBusy}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Service Selector */}
                  <FormField
                    control={form.control}
                    name="service_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-100">
                          Service{' '}
                          <span className="text-gray-400 font-normal">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <select
                            disabled={isBusy}
                            className="w-full rounded-md bg-slate-700 border border-slate-600 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? null : Number(e.target.value))
                            }
                          >
                            <option value="">— Select a service —</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {getServiceLabel(s)}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        {services.length === 0 && (
                          <p className="text-xs text-gray-500 mt-1">No services available</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Message */}
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-100">Your Testimonial</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share your experience with us..."
                            className="min-h-28 resize-none bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                            {...field}
                            disabled={isBusy}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Video Upload */}
                  <div>
                    <p className="text-sm font-medium text-gray-100 mb-2">
                      Video Testimonial{' '}
                      <span className="text-gray-400 font-normal">(optional)</span>
                    </p>

                    {video ? (
                      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                        <video
                          src={video.preview}
                          controls
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={removeVideo}
                          disabled={isBusy}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        <p className="absolute bottom-2 left-3 text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded">
                          {video.file.name} · {formatBytes(video.file.size)}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isBusy}
                        className="w-full border-2 border-dashed border-slate-600 hover:border-slate-400 rounded-xl p-6 text-center transition-all bg-slate-700/30 hover:bg-slate-700/50 disabled:opacity-50"
                      >
                        <Video className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-300 text-sm font-medium">Click to upload a video</p>
                        <p className="text-slate-500 text-xs mt-1">MP4, MOV, or WebM </p>
                      </button>
                    )}

                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isBusy}
                    className="w-full"
                    size="lg"
                  >
                    {videoUploading ? (
                      <><Spinner className="w-4 h-4 mr-2" />Uploading video...</>
                    ) : submitting ? (
                      <><Spinner className="w-4 h-4 mr-2" />Submitting...</>
                    ) : (
                      'Submit Testimonial'
                    )}
                  </Button>

                  <p className="text-xs text-gray-400 text-center">
                    Your testimonial will be reviewed and published after approval.
                  </p>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}