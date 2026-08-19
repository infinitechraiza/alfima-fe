"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface FooterContact {
  id: number;
  type: "address" | "phone" | "email";
  value: string;
  href: string | null;
  is_active: boolean;
  sort_order: number;
}

const CONTACT_ICON = {
  address: MapPin,
  phone: Phone,
  email: Mail,
};

export function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<FooterContact[]>([]);

  useEffect(() => {
    fetch("/api/footer-contacts")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setContacts(data))
      .catch(() => {});
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  const handleSubscribe = async () => {
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setStatus("success");
      setMessage(data.message ?? "Subscribed! Check your inbox.");
      setEmail("");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Failed to subscribe."
      );
    }
  };

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #590e0e 0%, #5e0c12 30%, #3b0f0f 70%, #370505 100%)",
      }}
    >
      {/* Top border glow */}
      <div
        className="absolute top-0 left-0 w-full h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,120,120,0.5), transparent)",
        }}
      />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <div className="w-14 h-14 p-1 bg-white rounded-full overflow-hidden ring-2 ring-white/20 flex-shrink-0">
                <img
                  src="/alfima.png"
                  alt="Alfima Realty"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <p className="font-black text-sm text-white">
                  ALFIMA REALTY INC.
                </p>

                <p className="text-[10px] text-red-200/70 tracking-widest uppercase">
                  Brokerage Company
                </p>
              </div>
            </Link>

            <p className="text-xs text-white/65 leading-relaxed mb-4">
              Helping Filipinos find their dream homes with integrity and
              expertise.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-red-300 inline-block rounded-full" />
              Links
            </h4>

            <ul className="space-y-2.5">
              {[
                { label: "Properties", href: "/properties" },
                { label: "Agents", href: "/agents" },
                { label: "About Us", href: "/about" },
                { label: "Contact Us", href: "/contact" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs text-white/70 hover:text-white transition-colors hover:underline underline-offset-2"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dynamic Contacts */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-red-300 inline-block rounded-full" />
              Contact
            </h4>

            <ul className="space-y-3">
              {contacts.map((contact) => {
                const Icon = CONTACT_ICON[contact.type];

                const resolvedHref =
                  contact.type === "phone"
                    ? `tel:${contact.value.replace(/\s+/g, "")}`
                    : contact.type === "email"
                    ? `mailto:${contact.value.trim()}`
                    : contact.href;

                if (resolvedHref) {
                  return (
                    <li key={contact.id}>
                      <a
                        href={resolvedHref}
                        target={
                          contact.type === "address"
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          contact.type === "address"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="flex items-start gap-2.5 group"
                      >
                        <Icon className="w-3.5 h-3.5 text-red-200 flex-shrink-0 mt-0.5 group-hover:text-white transition-colors" />

                        <span className="text-xs text-white/70 leading-relaxed group-hover:text-white transition-colors">
                          {contact.value}
                        </span>
                      </a>
                    </li>
                  );
                }

                return (
                  <li
                    key={contact.id}
                    className="flex items-start gap-2.5"
                  >
                    <Icon className="w-3.5 h-3.5 text-red-200 flex-shrink-0 mt-0.5" />

                    <span className="text-xs text-white/70 leading-relaxed">
                      {contact.value}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-red-300 inline-block rounded-full" />
              Newsletter
            </h4>

            <p className="text-xs text-white/70 mb-3 leading-relaxed">
              Get the latest listings delivered to your inbox.
            </p>

            {status === "success" ? (
              <div
                className="flex items-start gap-2.5 p-3 rounded-lg border border-green-400/30"
                style={{ background: "rgba(0,200,100,0.1)" }}
              >
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />

                <p className="text-xs text-green-300 leading-relaxed">
                  {message}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus("idle");
                    setMessage("");
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSubscribe()
                  }
                  placeholder="Your email address"
                  disabled={status === "loading"}
                 className="w-full px-3 py-2.5 rounded-lg text-xs text-white placeholder-white focus:outline-none border border-white/20 focus:border-white/40 transition-all disabled:opacity-50"
                  style={{ background: "rgba(0,0,0,0.25)" }}
                />

                {status === "error" && (
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-red-300 flex-shrink-0" />

                    <p className="text-[11px] text-red-300">
                      {message}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubscribe}
                  disabled={
                    status === "loading" || !email.trim()
                  }
                  className="w-full py-2.5 rounded-lg text-white text-xs font-bold transition-all border border-white/20 hover:border-white/40 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background:
                      "linear-gradient(135deg, #c0392b, #96281b)",
                  }}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Subscribing…
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Subscribe
                    </>
                  )}
                </button>
              </div>
            )}

            <p className="text-[10px] text-white/40 mt-2">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>

        <div className="h-px w-full mb-5 bg-white/15" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-white/55">
          <p>
            © {currentYear} ALFIMA REALTY INC. All rights reserved.
          </p>

          <a
            href="https://www.infinitechphil.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors group"
          >
            <span>Powered by</span>

            <span className="font-semibold text-white/55 group-hover:text-white/80 transition-colors tracking-wide">
              Infinitech Advertising Corporation
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}

