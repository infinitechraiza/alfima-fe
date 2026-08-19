"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Mail,
  Phone,
  X,
  Share2,
  Globe,
  Youtube,
  Linkedin,
  Twitter,
  MessageCircle,
} from "lucide-react";

// ── SVG Icons ──────────────────────────────────────────────────────────────────

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <img
      src="https://cdn.simpleicons.org/viber/white"
      className={className}
      alt="Viber"
    />
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

// ── Icon Map ───────────────────────────────────────────────────────────────────

export const ICON_MAP: Record<
  string,
  { icon: React.FC<{ className?: string }>; defaultGradient: string }
> = {
  facebook: {
    icon: FacebookIcon,
    defaultGradient: "linear-gradient(135deg, #1877f2, #0d5dc7)",
  },
  instagram: {
    icon: InstagramIcon,
    defaultGradient: "linear-gradient(135deg, #f58529, #dd2a7b, #8134af)",
  },
  tiktok: {
    icon: TikTokIcon,
    defaultGradient: "linear-gradient(135deg, #010101, #69c9d0)",
  },
  whatsapp: {
    icon: WhatsAppIcon,
    defaultGradient: "linear-gradient(135deg, #25d366, #128c7e)",
  },
  telegram: {
    icon: TelegramIcon,
    defaultGradient: "linear-gradient(135deg, #2aabee, #1c84c6)",
  },
  viber: {
    icon: ViberIcon,
    defaultGradient: "linear-gradient(135deg, #7360f2, #563acc)",
  },
  youtube: {
    icon: Youtube,
    defaultGradient: "linear-gradient(135deg, #ff0000, #cc0000)",
  },
  twitter: {
    icon: Twitter,
    defaultGradient: "linear-gradient(135deg, #1da1f2, #0c85d0)",
  },
  linkedin: {
    icon: Linkedin,
    defaultGradient: "linear-gradient(135deg, #0077b5, #005e8e)",
  },
  pinterest: {
    icon: PinterestIcon,
    defaultGradient: "linear-gradient(135deg, #e60023, #b5001a)",
  },
  email: {
    icon: Mail,
    defaultGradient: "linear-gradient(135deg, #c0392b, #96281b)",
  },
  phone: {
    icon: Phone,
    defaultGradient: "linear-gradient(135deg, #27ae60, #1e8449)",
  },
  website: {
    icon: Globe,
    defaultGradient: "linear-gradient(135deg, #6c5ce7, #5f27cd)",
  },
  sms: {
    icon: MessageCircle,
    defaultGradient: "linear-gradient(135deg, #00b894, #00a381)",
  },
};

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SocialLink {
  id: number;
  platform: string;
  label: string;
  url: string;
  gradient_from: string;
  gradient_to: string;
  sort_order: number;
  is_active: boolean;
}

// ── Widget ─────────────────────────────────────────────────────────────────────

export function FloatingSocialWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    fetch("/api/social-links")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLinks(data);
        } else {
          console.error("Unexpected social-links response:", data);
        }
      })
      .catch(() => {});
  }, []);

  if (pathname.startsWith("/admin")) return null;
  if (links.length === 0) return null;

  return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-col gap-1.5">
        {links.map((link) => {
          const entry = ICON_MAP[link.platform] ?? ICON_MAP["website"];
          const IconComp = entry.icon;
          const gradient =
            link.gradient_from && link.gradient_to
              ? `linear-gradient(135deg, ${link.gradient_from}, ${link.gradient_to})`
              : entry.defaultGradient;

          return (
            <a
              key={link.id}
              href={link.url}
              target={link.url.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              title={link.label}
              className="group flex items-center justify-end overflow-hidden rounded-l-2xl text-white shadow-lg transition-all duration-300"
              style={{ background: gradient, width: "44px", height: "44px" }}
            >
              <div className="flex items-center justify-center w-11 h-11 flex-shrink-0">
                <IconComp className="w-5 h-5" />
              </div>
            </a>
          );
        })}
      </div>

      {/* ── Mobile FAB ── */}
      {/* flex-col-reverse: toggle button stays at bottom, icons expand upward */}
      <div className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col-reverse items-center gap-1.5">
        {/* Toggle button — rendered first in DOM but appears at bottom due to flex-col-reverse */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="flex items-center justify-center w-11 h-11 rounded-l-2xl text-white shadow-xl transition-all duration-300 border-l border-t border-b border-red-500/30"
          style={{ background: "linear-gradient(135deg, #c0392b, #96281b)" }}
          aria-label={isOpen ? "Close social menu" : "Open social menu"}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
        </button>

        {/* Social icons — appear above the toggle button */}
        {isOpen && (
          <div className="flex flex-col-reverse items-end gap-1.5">
            {links.map((link) => {
              const entry = ICON_MAP[link.platform] ?? ICON_MAP["website"];
              const IconComp = entry.icon;
              const gradient =
                link.gradient_from && link.gradient_to
                  ? `linear-gradient(135deg, ${link.gradient_from}, ${link.gradient_to})`
                  : entry.defaultGradient;

              return (
                <a
                  key={link.id}
                  href={link.url}
                  target={link.url.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  title={link.label}
                  className="flex items-center justify-center w-11 h-11 rounded-l-2xl text-white shadow-lg transition-all duration-200"
                  style={{ background: gradient }}
                >
                  <IconComp className="w-6 h-6" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
