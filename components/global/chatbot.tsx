"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  X,
  Send,
  HeadphonesIcon,
  Phone,
  Clock,
  User,
  MessageSquare,
  MapPin,
  Lock,
  ChevronRight,
  Mail,
  Building2,
} from "lucide-react";
import { useAuth } from "@/lib/store";

type SenderType = "user" | "admin" | "bot";
type Message = {
  id: string;
  text: string;
  sender: SenderType;
  suggestions?: string[];
  properties?: Property[];
};
type ChatPhase =
  | "welcome"
  | "contact-form"
  | "bot"
  | "human"
  | "loading"
  | "resolved";

const CHAT_API = "/api/chat";
const POLL_MS = 4000;

const CONTACT = {
  email: "ABMacalincag@alfimarealtyinc.com",
  phone: "09171742419",
  address:
    "10th Floor IBP Tower, Jade Drive, Brgy San Antonio, Pasig, Philippines",
  hours: "Mon–Sun 9AM–6PM", // ← change 8AM to 9AM
};

interface Property {
  id: number;
  title: string;
  price: number;
  listing_type: "for_sale" | "for_rent";
  property_type: string;
  city: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  slug?: string;
  images?: { url: string }[];
}

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  company: string;
}

function tokenKey(userId?: number | string | null): string {
  return userId ? `alfima_chat_token_u${userId}` : "alfima_chat_token_guest";
}
function getToken(userId?: number | string | null): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(tokenKey(userId));
}
function saveToken(
  token: string,
  sid: number,
  userId?: number | string | null,
) {
  const key = tokenKey(userId);
  localStorage.setItem(key, token);
  localStorage.setItem(`${key}_sid`, String(sid));
}
function clearStaleTokens(currentUserId?: number | string | null) {
  if (typeof window === "undefined") return;
  const currentKey = tokenKey(currentUserId);
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (
      k.startsWith("alfima_chat_token") &&
      k !== currentKey &&
      !k.endsWith("_sid")
    ) {
      toRemove.push(k);
      toRemove.push(`${k}_sid`);
    }
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}
function wipeToken(userId?: number | string | null) {
  if (typeof window === "undefined") return;
  const k = tokenKey(userId);
  localStorage.removeItem(k);
  localStorage.removeItem(`${k}_sid`);
}
function buildHeaders(
  token?: string | null,
  userId?: number | string | null,
): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const t = token ?? getToken(userId);
  if (t) h["X-Chat-Token"] = t;
  const auth =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (auth) h["Authorization"] = `Bearer ${auth}`;
  return h;
}

async function fetchProperties(
  params: Record<string, string>,
): Promise<Property[]> {
  const attempts: Record<string, string>[] = [];
  attempts.push({ ...params });
  if (params.city) {
    const noCity = { ...params };
    delete noCity.city;
    attempts.push(noCity);
  }
  if (params.property_type) {
    const noType = { ...params };
    delete noType.property_type;
    delete noType.city;
    attempts.push(noType);
  }
  if (params.listing_type) {
    const listingOnly = {
      listing_type: params.listing_type,
      per_page: params.per_page ?? "3",
    };
    attempts.push(listingOnly);
  }
  attempts.push({ per_page: params.per_page ?? "6" });
  for (const attempt of attempts) {
    try {
      const qs = new URLSearchParams(attempt).toString();
      const res = await fetch(`/api/properties?${qs}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = await res.json();
      const list: Property[] = Array.isArray(data)
        ? data
        : (data.data ?? data.properties ?? data.items ?? []);
      if (list.length > 0) return list;
    } catch {
      /* try next attempt */
    }
  }
  return [];
}

function formatPrice(price: number, listingType: string): string {
  if (price == null || isNaN(price)) return "Price on request"; // ← add this
  if (listingType === "for_rent") {
    return `₱${price.toLocaleString("en-PH")}/mo`;
  }
  if (price >= 1_000_000) {
    return `₱${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  return `₱${price.toLocaleString("en-PH")}`;
}

interface Intent {
  listing_type?: "for_sale" | "for_rent";
  property_type?: string;
  city?: string;
  min_price?: string;
  max_price?: string;
  action?: "agent" | "schedule" | "contact" | "about" | "browse";
}

const CITY_MAP: Record<string, string> = {
  makati: "Makati",
  bgc: "Taguig",
  taguig: "Taguig",
  "bonifacio global city": "Taguig",
  "quezon city": "Quezon City",
  qc: "Quezon City",
  cubao: "Quezon City",
  pasig: "Pasig",
  ortigas: "Pasig",
  paranaque: "Paranaque",
  "las pinas": "Las Pinas",
  "las piñas": "Las Pinas",
  mandaluyong: "Mandaluyong",
  "san juan": "San Juan",
  marikina: "Marikina",
  cavite: "Cavite",
  bacoor: "Cavite",
  dasmarinas: "Cavite",
  imus: "Cavite",
  tagaytay: "Tagaytay",
  laguna: "Laguna",
  "sta rosa": "Sta. Rosa",
  calamba: "Laguna",
  binan: "Laguna",
  bulacan: "Bulacan",
  rizal: "Rizal",
  antipolo: "Antipolo",
  manila: "Manila",
  "metro manila": "Metro Manila",
};

const TYPE_MAP: Record<string, string> = {
  condo: "condominium",
  condominium: "condominium",
  condominiums: "condominium",
  condos: "condominium",
  "house and lot": "house_and_lot",
  "house & lot": "house_and_lot",
  house: "house_and_lot",
  "single family": "house_and_lot",
  townhouse: "townhouse",
  townhomes: "townhouse",
  townhouses: "townhouse",
  lot: "lot",
  land: "lot",
  vacant: "lot",
  commercial: "commercial",
  // ← remove "office" and "warehouse" and "retail" — too generic
  warehouse: "commercial",
  retail: "commercial",
};

function detectIntent(text: string): Intent {
  const lower = text.toLowerCase();
  const intent: Intent = {};

  if (
    /\b(buy|for sale|purchase|bilhin|pre-selling|preselling|bibili|nabibili)\b/.test(
      lower,
    )
  ) {
    intent.listing_type = "for_sale";
  }
  if (
    /\b(rent|rental|lease|for rent|upa|mag-rent|inuupahan|paupahan)\b/.test(
      lower,
    )
  ) {
    intent.listing_type = "for_rent";
  }
  if (
    !intent.listing_type &&
    /\b(browse|show|list|find|search|available|looking for)\b/.test(lower) &&
    /\b(properties|property|condo|condominiums|house|houses|townhouse|lot|lots|listing|listings|rental|rentals|units|unit)\b/.test(
      lower,
    )
  ) {
    intent.listing_type = "for_sale";
  }

  for (const [kw, type] of Object.entries(TYPE_MAP)) {
    if (lower.includes(kw)) {
      intent.property_type = type;
      break;
    }
  }
  for (const [kw, city] of Object.entries(CITY_MAP)) {
    if (lower.includes(kw)) {
      intent.city = city;
      break;
    }
  }

  if (/under\s*[₱p]?\s*3\s*m/i.test(lower)) intent.max_price = "3000000";
  if (/[₱p]?\s*3\s*m?\s*[–-]\s*[₱p]?\s*8\s*m/i.test(lower)) {
    intent.min_price = "3000000";
    intent.max_price = "8000000";
  }
  if (/[₱p]?\s*8\s*m?\s*[–-]\s*[₱p]?\s*20\s*m/i.test(lower)) {
    intent.min_price = "8000000";
    intent.max_price = "20000000";
  }
  if (/20\s*m\+|luxury/i.test(lower)) intent.min_price = "20000000";
  if (/studio.*rent|1br.*rent|rent.*studio|rent.*1br/i.test(lower)) {
    intent.listing_type = "for_rent";
    intent.property_type = "condominium";
  }

  if (/\b(agent|broker|speak|talk|human|live|kausap|call)\b/.test(lower))
    intent.action = "agent";
  if (/\b(schedule|viewing|visit|tour|tripping|mag-visit)\b/.test(lower))
    intent.action = "schedule";
  if (/\b(contact|address|location|office|saan|where|map)\b/.test(lower))
    intent.action = "contact";
  if (/\b(about|who are you|alfima|licensed|legit)\b/.test(lower))
    intent.action = "about";

  return intent;
}

function getStaticResponse(
  intent: Intent,
  name: string,
): { text: string; suggestions: string[] } | null {
  switch (intent.action) {
    case "contact":
      return {
        text: `📍 **Alfima Realty Inc.**\n${CONTACT.address}\nMetro Manila, Philippines\n\n📧 **${CONTACT.email}**\n\n🕐 ${CONTACT.hours}`,
        suggestions: withBack([
          "Call us now",
          "Browse properties for sale",
          "Schedule a viewing",
        ]),
      };
    case "schedule":
      return {
        text: `📅 We'd love to show you the property!\n\n**Viewing Hours:**\n• Mon–Sun: 9AM–6PM \n\nTell us which property and your preferred date, or talk to one of our agents!`,
        suggestions: withBack([
          "Talk to an agent",
          "Browse properties for sale",
          "Find rental properties",
        ]),
      };
    case "about":
      return {
        text: `🏢 **Alfima Realty Inc.**\n\n✅ Brokerage Company\n\n✅ Accredited by 20+ Developers\n\n📍 ${CONTACT.address}\n📞 ${CONTACT.phone}\n📧 ${CONTACT.email}`,
        suggestions: withBack([
          "Browse properties",
          "Talk to an agent",
          "Office location",
        ]),
      };
    default:
      return null;
  }
}

const INITIAL_SUGGESTIONS = [
  "Browse properties for sale",
  "Find rental properties",
  "Talk to an agent",
  "Schedule a viewing",
  "About Alfima Realty",
  "Office location & hours",
];

const BACK_CHIP = "← Back to main menu";
function withBack(suggestions: string[]): string[] {
  if (suggestions.includes(BACK_CHIP)) return suggestions;
  return [...suggestions, BACK_CHIP];
}

function FormatText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i, arr) => (
        <span key={i}>
          {line
            .split(/(\*\*[^*]+\*\*)/g)
            .map((seg, j) =>
              seg.startsWith("**") && seg.endsWith("**") ? (
                <strong key={j}>{seg.slice(2, -2)}</strong>
              ) : (
                seg
              ),
            )}
          {i < arr.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function PropertyCards({ properties }: { properties: Property[] }) {
  if (!properties.length) return null;

  return (
    <div className="flex flex-col gap-2 mt-2 w-full max-w-[90%]">
      {properties.slice(0, 3).map((p) => (
        <a
          key={p.id}
          href={p.slug ? `/properties/${p.slug}` : `/properties/${p.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-red-500/40 hover:bg-white/10 transition-all group"
        >
          {p.images?.[0]?.url && (
            <img
              src={p.images[0].url}
              alt={p.title}
              className="w-full h-24 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          )}

          <div className="px-3 py-2">
            <p className="text-white text-xs font-semibold leading-tight line-clamp-2">
              {p.title}
            </p>

            <div className="flex items-center justify-between mt-1">
              <span className="text-red-400 text-xs font-bold">
                {formatPrice(p.price, p.listing_type)}
              </span>

              <span className="text-white/40 text-[10px] flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {p.city}
              </span>
            </div>

            {(p.bedrooms != null || p.area != null) && (
              <p className="text-white/40 text-[10px] mt-0.5">
                {p.bedrooms != null ? `${p.bedrooms}BR` : ""}
                {p.bedrooms != null && p.bathrooms != null
                  ? ` · ${p.bathrooms}BA`
                  : ""}
                {p.area ? ` · ${p.area}sqm` : ""}
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
// ─── Main Component ───────────────────────────────────────────────────────────
export function Chatbot() {
  const pathname = usePathname();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<ChatPhase>("loading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [contactForm, setContactForm] = useState<ContactFormState>({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [contactFormError, setContactFormError] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgIdRef = useRef<number>(0);
  const isPollingRef = useRef(false);
  const isOpenRef = useRef(false);
  const tokenRef = useRef<string | null>(null);
  const sessionUserIdRef = useRef<number | string | null | undefined>(
    undefined,
  );
  const prevUserIdRef = useRef<number | string | null | undefined>(undefined);

  const isAdmin = pathname.startsWith("/admin");

  const canSubmitContactForm =
    contactForm.name.trim().length > 0 &&
    contactForm.email.trim().length > 0 &&
    contactForm.phone.trim().length > 0 &&
    agreedToTerms;

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Effect 1: handle user switching only
  useEffect(() => {
    if (isAdmin) return;

    const userChanged =
      prevUserIdRef.current !== undefined &&
      prevUserIdRef.current !== (user?.id ?? null);

    if (userChanged) {
      wipeToken(prevUserIdRef.current);
      clearStaleTokens(user?.id);
      tokenRef.current = null;
      lastMsgIdRef.current = 0;
      setMessages([]);
      setGuestName("");
      setContactForm({ name: "", email: "", phone: "", company: "" });
      setAgreedToTerms(false);
      setContactFormError("");
      setUnreadCount(0);
      setPhase("loading");
      stopPolling();
    }

    prevUserIdRef.current = user?.id ?? null;
    sessionUserIdRef.current = user?.id;

    return () => stopPolling();
  }, [user?.id, isAdmin]);

  // Effect 2: init session only when chat is opened
  useEffect(() => {
    if (isAdmin || !isOpen) return;

    // Guest user: show welcome takeover locally, no backend call yet
    if (!user) {
      if (phase === "loading") {
        setPhase("welcome");
      }
      return;
    }

    // Logged-in user: init session normally
    if (phase !== "loading" && messages.length > 0) return;
    initSession();
  }, [isOpen, isAdmin, user]);

  // ── Polling ───────────────────────────────────────────────────────────────
  const startPolling = useCallback((token: string) => {
    tokenRef.current = token;
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const res = await fetch(
          `${CHAT_API}/messages?after=${lastMsgIdRef.current}`,
          { headers: buildHeaders(tokenRef.current, sessionUserIdRef.current) },
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "resolved") {
          setPhase("resolved");
          stopPolling();
          return;
        }

        const msgs: any[] = data.messages ?? [];
        if (!msgs.length) return;

        const maxId = Math.max(...msgs.map((m: any) => m.id));
        if (maxId > lastMsgIdRef.current) lastMsgIdRef.current = maxId;

        const adminMsgs = msgs.filter((m: any) => m.sender_type === "admin");
        if (adminMsgs.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = adminMsgs
              .filter((m: any) => !existingIds.has(String(m.id)))
              .map((m: any) => ({
                id: String(m.id),
                text: m.message,
                sender: "admin" as SenderType,
              }));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
          setPhase("human");
          if (!isOpenRef.current) setUnreadCount((c) => c + adminMsgs.length);
        }
      } catch {
        /* ignore */
      } finally {
        isPollingRef.current = false;
      }
    }, POLL_MS);
  }, []);

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }
  // ── Sync tokenRef/localStorage if the backend recovered onto a different
  // session than what we had (e.g. our token was stale/missing and it fell
  // back to the fingerprint match) ──────────────────────────────────────────
  function syncSessionIfChanged(data: {
    session_token?: string;
    session_id?: number;
  }) {
    if (
      data.session_token &&
      data.session_id &&
      data.session_token !== tokenRef.current
    ) {
      saveToken(data.session_token, data.session_id, sessionUserIdRef.current);
      tokenRef.current = data.session_token;
      setSessionToken(data.session_token);
    }
  }
  // ── Init / resume session (logged-in users only) ──────────────────────────
  const initSession = useCallback(async () => {
    setPhase("loading");
    try {
      const existingToken = getToken(user?.id);
      const sessRes = await fetch(`${CHAT_API}/session`, {
        method: "POST",
        headers: buildHeaders(existingToken, user?.id),
        body: JSON.stringify({}),
      });
      const sessData = await sessRes.json();

      if (
        user?.id &&
        sessData.user_id &&
        String(sessData.user_id) !== String(user.id)
      ) {
        localStorage.removeItem(tokenKey(user.id));
        const freshRes = await fetch(`${CHAT_API}/session`, {
          method: "POST",
          headers: buildHeaders(null, user?.id),
          body: JSON.stringify({}),
        });
        const freshData = await freshRes.json();
        saveToken(freshData.session_token, freshData.session_id, user?.id);
        setSessionToken(freshData.session_token);
        tokenRef.current = freshData.session_token;
        Object.assign(sessData, freshData);
      } else {
        saveToken(sessData.session_token, sessData.session_id, user?.id);
        setSessionToken(sessData.session_token);
        tokenRef.current = sessData.session_token;
      }

      if (sessData.status === "resolved") {
        const msgRes = await fetch(`${CHAT_API}/messages`, {
          headers: buildHeaders(sessData.session_token, user?.id),
        });
        const msgData = await msgRes.json();

        syncSessionIfChanged(msgData); // ← replaces the broken inline block

        const history: any[] = msgData.messages ?? [];
        if (history.length > 0) {
          lastMsgIdRef.current = Math.max(...history.map((m: any) => m.id));
          setMessages(
            history.map((m: any) => ({
              id: String(m.id),
              text: m.message,
              sender: m.sender_type as SenderType,
            })),
          );
        }
        setPhase("resolved");
        return;
      }

      const msgRes = await fetch(`${CHAT_API}/messages`, {
        headers: buildHeaders(sessData.session_token, user?.id),
      });
      const msgData = await msgRes.json();
      const history: any[] = msgData.messages ?? [];

      if (history.length > 0) {
        lastMsgIdRef.current = Math.max(...history.map((m: any) => m.id));
        setMessages(
          history.map((m: any) => ({
            id: String(m.id),
            text: m.message,
            sender: m.sender_type as SenderType,
          })),
        );
        setPhase(
          history.some((m: any) => m.sender_type === "admin") ? "human" : "bot",
        );
      } else {
        // Logged-in user, no history — show welcome
        const name = user?.name ?? "";
        setPhase("bot");
        addLocalBotMsg(
          `👋 Hello${name ? ", **" + name + "**" : ""}! Welcome to **Alfima Realty Inc.**!\n\nI can help you find your dream property across Metro Manila and nearby provinces. What are you looking for today?`,
          INITIAL_SUGGESTIONS,
          true,
          sessData.session_token,
          undefined,
          name, // ← add this so guest_name gets persisted server-side
        );
      }

      startPolling(sessData.session_token);
    } catch (err) {
      console.error("Chat init error:", err);
      setPhase("bot");
      addLocalBotMsg(
        "👋 Welcome to **Alfima Realty Inc.**! How can I help you today?",
        INITIAL_SUGGESTIONS,
        false,
        null,
      );
    }
  }, [user, startPolling]);

  function addLocalBotMsg(
    text: string,
    suggestions: string[],
    save: boolean,
    token: string | null,
    properties?: Property[],
    nameToSave?: string,
  ) {
    setMessages((prev) => [
      ...prev,
      { id: `bot-${Date.now()}`, text, sender: "bot", suggestions, properties },
    ]);
    if (save) {
      const t = token ?? tokenRef.current ?? getToken(sessionUserIdRef.current);
      if (!t) return;
      fetch(`${CHAT_API}/bot-message`, {
        method: "POST",
        headers: buildHeaders(t, sessionUserIdRef.current),
        body: JSON.stringify({
          message: text,
          ...(nameToSave ? { guest_name: nameToSave } : {}),
        }),
      })
        .then((res) => res.json())
        .then((data) => syncSessionIfChanged(data))
        .catch(() => {});
    }
  }

  // ── Contact form submit — creates session for guests HERE ─────────────────
  const handleContactSubmit = async () => {
    const name = contactForm.name.trim();
    const email = contactForm.email.trim();
    const phone = contactForm.phone.trim();
    const company = contactForm.company.trim();

    if (!name || !email || !phone) {
      setContactFormError("Please fill in all required fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setContactFormError("Please enter a valid email address.");
      return;
    }
    if (!agreedToTerms) {
      setContactFormError(
        "Please agree to the Privacy Policy and Terms of Service.",
      );
      return;
    }

    setContactFormError("");
    setGuestName(name);
    setPhase("loading");

    try {
      // Create session NOW with contact details already attached
      const sessRes = await fetch(`${CHAT_API}/session`, {
        method: "POST",
        headers: buildHeaders(null, null),
        body: JSON.stringify({
          guest_name: name,
          guest_email: email,
          guest_phone: phone,
          guest_company: company || null,
        }),
      });
      const sessData = await sessRes.json();

      saveToken(sessData.session_token, sessData.session_id, null);
      setSessionToken(sessData.session_token);
      tokenRef.current = sessData.session_token;
      sessionUserIdRef.current = null;

      setPhase("bot");

      setTimeout(() => {
        addLocalBotMsg(
          `Nice to meet you, **${name}**! 😊\n\nWelcome to **Alfima Realty Inc.**! What are you looking for today?`,
          INITIAL_SUGGESTIONS,
          true,
          sessData.session_token,
          undefined,
          name,
        );
      }, 600);

      startPolling(sessData.session_token);
    } catch {
      // If session creation fails, let them try again
      setContactFormError("Something went wrong. Please try again.");
      setPhase("contact-form");
    }
  };

  // ── Agent availability check ──────────────────────────────────────────────
  const handleTalkToAgent = useCallback(async (token: string | null) => {
    try {
      const res = await fetch(`${CHAT_API}/agent-status`, {
        headers: buildHeaders(token, sessionUserIdRef.current),
      });
      const data = await res.json();
      if (data.available) {
        addLocalBotMsg(
          "✅ Great news! **Our agents are online right now.**\n\nI've notified them — someone will join this chat shortly!",
          [],
          true,
          token,
        );
      } else {
        addLocalBotMsg(
          `🕐 Our agents are **currently offline**.\n\nPlease leave your message and we'll get back to you!\n\n\n📧 **${CONTACT.email}**`,
          withBack([
            "Leave a message",
            "Browse properties for sale",
            "Find rental properties",
          ]),
          true,
          token,
        );
      }
    } catch {
      addLocalBotMsg(
        "🔔 I've notified our agents. Someone will join shortly!",
        [],
        true,
        token,
      );
    }
  }, []);

  // ── Core send logic ───────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (
      !text.trim() ||
      isTyping ||
      phase === "welcome" ||
      phase === "contact-form" ||
      phase === "resolved"
    )
      return;

    if (
      text === BACK_CHIP ||
      text.toLowerCase().includes("back to main menu") ||
      text.toLowerCase() === "main menu"
    ) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, text, sender: "user" },
      ]);
      const token = tokenRef.current ?? getToken(sessionUserIdRef.current);
      if (token) {
        const msgRes = await fetch(`${CHAT_API}/message`, {
          method: "POST",
          headers: buildHeaders(token, sessionUserIdRef.current),
          body: JSON.stringify({
            message: text,
            guest_name: guestName || user?.name || null,
          }),
        }).catch(() => null);

        if (msgRes?.ok) {
          const data = await msgRes.json().catch(() => null);
          if (data) syncSessionIfChanged(data);
        }

        if (msgRes?.status === 403) {
          const body = await msgRes.json().catch(() => ({}));
          if (body?.status === "resolved") {
            setPhase("resolved");
            stopPolling();
            return;
          }
        }
      }
      return;
    }

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, text, sender: "user" },
    ]);

    const token = tokenRef.current ?? getToken(sessionUserIdRef.current);
    if (token) {
      const msgRes = await fetch(`${CHAT_API}/message`, {
        method: "POST",
        headers: buildHeaders(token, sessionUserIdRef.current),
        body: JSON.stringify({
          message: text,
          guest_name: guestName || user?.name || null,
        }),
      }).catch(() => null);

      if (msgRes?.status === 403) {
        const body = await msgRes.json().catch(() => ({}));
        if (body?.status === "resolved") {
          setPhase("resolved");
          stopPolling();
          return;
        }
      }
    }

    if (phase !== "bot") return;

    const intent = detectIntent(text);

    const wantsHuman =
      intent.action === "agent" ||
      [
        "talk to agent",
        "talk to an agent",
        "speak to agent",
        "speak to an agent",
        "kausapin",
        "human agent",
        "live agent",
        "real person",
      ].some((p) => text.toLowerCase().includes(p));

    setIsTyping(true);

    const hasPropertySignal = !!(
      intent.listing_type ||
      intent.property_type ||
      intent.city ||
      intent.min_price ||
      intent.max_price
    );

    const staticResp = getStaticResponse(intent, guestName || user?.name || "");
    if (staticResp) {
      setTimeout(() => {
        addLocalBotMsg(
          staticResp.text,
          withBack(staticResp.suggestions),
          true,
          token,
        );
        setIsTyping(false);
        if (wantsHuman) setTimeout(() => handleTalkToAgent(token), 800);
      }, 700);
      return;
    }

    if (wantsHuman && !hasPropertySignal) {
      setTimeout(() => {
        addLocalBotMsg(
          "Sure! Let me connect you with one of our agents. 👨‍💼",
          [],
          true,
          token,
        );
        setIsTyping(false);
        setTimeout(() => handleTalkToAgent(token), 800);
      }, 500);
      return;
    }

    if (!hasPropertySignal && !intent.action) {
      setTimeout(() => {
        const name = user?.name ?? guestName;
        addLocalBotMsg(
          `😊 Hi${name ? `, **${name}**` : ""}! How can I help you today?`,
          INITIAL_SUGGESTIONS,
          true,
          token,
        );
        setIsTyping(false);
      }, 600);
      return;
    }

    const params: Record<string, string> = { per_page: "3" };
    if (intent.listing_type) params.listing_type = intent.listing_type;
    if (intent.property_type) params.property_type = intent.property_type;
    if (intent.city) params.city = intent.city;
    if (intent.min_price) params.min_price = intent.min_price;
    if (intent.max_price) params.max_price = intent.max_price;

    try {
      const properties = await fetchProperties(params);
      setTimeout(() => {
        if (properties.length > 0) {
          const foundType =
            properties[0].property_type?.replace(/_/g, " ") ?? "";
          const askedType = intent.property_type?.replace(/_/g, " ") ?? "";
          const askedCity = intent.city ?? "";
          const foundCity = properties[0].city ?? "";
          const typeLabel = askedType || foundType;
          const listLabel =
            intent.listing_type === "for_rent" ? "for rent" : "for sale";
          const cityLabel = askedCity
            ? askedCity === foundCity
              ? ` in **${askedCity}**`
              : ` — showing results near **${foundCity}** (no exact match for ${askedCity})`
            : "";
          const budgetLabel =
            intent.max_price && !intent.min_price
              ? ` under ₱${(parseInt(intent.max_price) / 1_000_000).toFixed(0)}M`
              : intent.min_price && intent.max_price
                ? ` ₱${(parseInt(intent.min_price) / 1_000_000).toFixed(0)}M–₱${(parseInt(intent.max_price) / 1_000_000).toFixed(0)}M`
                : "";

          addLocalBotMsg(
            `🏠 Here are some **${typeLabel} ${listLabel}${cityLabel}${budgetLabel}** for you:`,
            withBack([
              "Browse all properties",
              "Schedule a viewing",
              "Talk to an agent",
            ]),
            true,
            token,
            properties,
          );
        } else {
          addLocalBotMsg(
            `😔 I couldn't find listings matching that search right now, but our portfolio is updated regularly!\n\nOur agents may have **exclusive off-market listings** — want me to connect you with one?`,
            withBack([
              "Talk to an agent",
              "Browse properties for sale",
              "Find rental properties",
            ]),
            true,
            token,
          );
        }
        setIsTyping(false);
        if (wantsHuman) setTimeout(() => handleTalkToAgent(token), 800);
      }, 800);
    } catch {
      setTimeout(() => {
        addLocalBotMsg(
          `😔 Had trouble loading listings just now. Please try again or talk to our agents!\n\n`,
          withBack(["Try again", "Talk to an agent"]),
          true,
          token,
        );
        setIsTyping(false);
      }, 700);
    }
  };

  if (isAdmin) return null;

  const displayName = user?.name ?? guestName;
  const isTakeover = phase === "welcome" || phase === "contact-form";

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen && (
        <div
          className="absolute bottom-20 right-0 w-80 sm:w-96 flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-white/10"
          style={{ height: "540px", animation: "chatFadeUp 0.2s ease" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-800 to-red-700 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <HeadphonesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">
                  Alfima Realty
                </p>
                {!isTakeover && (
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        phase === "human"
                          ? "bg-green-400 animate-pulse"
                          : phase === "resolved"
                            ? "bg-white/30"
                            : "bg-yellow-400"
                      }`}
                    />
                    <p className="text-red-200 text-xs">
                      {phase === "human"
                        ? "Live Agent Connected"
                        : phase === "resolved"
                          ? "Conversation closed"
                          : "AI Assistant"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {phase === "welcome" ? (
            /* ── Welcome takeover ───────────────────────────────────────── */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-neutral-950/90 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-700 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/40">
                <HeadphonesIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  Welcome to Alfima Realty
                </h3>
                <p className="text-white/50 text-sm mt-2 max-w-[260px]">
                  I'm your Alfima Assistant. Before we begin, we'll collect a
                  few details so we can better serve you.
                </p>
              </div>
              <button
                onClick={() => setPhase("contact-form")}
                className="mt-2 flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all"
              >
                Get Started
                <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-white/20 text-[11px] mt-4">
                Powered by Alfima Realty Inc.
              </p>
            </div>
          ) : phase === "contact-form" ? (
            /* ── Contact details takeover ───────────────────────────────── */
            <div className="flex-1 flex flex-col bg-neutral-950/90 overflow-y-auto">
              <div className="px-6 pt-6 pb-2 text-center flex-shrink-0">
                <h3 className="text-white font-bold text-base">
                  Your contact details
                </h3>
                <p className="text-white/40 text-xs mt-1">
                  Please fill in your details before continuing.
                </p>
              </div>

              <div className="flex-1 flex flex-col gap-3 px-6 py-4">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                  <User className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm((f) => ({ ...f, name: e.target.value }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      canSubmitContactForm &&
                      handleContactSubmit()
                    }
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                    maxLength={60}
                  />
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                  <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm((f) => ({ ...f, email: e.target.value }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      canSubmitContactForm &&
                      handleContactSubmit()
                    }
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                    maxLength={100}
                  />
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                  <Phone className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      canSubmitContactForm &&
                      handleContactSubmit()
                    }
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
                    maxLength={20}
                  />
                </div>

                <label className="flex items-start gap-2 mt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 accent-red-600 flex-shrink-0"
                  />
                  <span className="text-white/40 text-[11px] leading-relaxed">
                    I agree to the{" "}
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a
                      href="/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      Terms of Service
                    </a>
                    .
                  </span>
                </label>

                {contactFormError && (
                  <p className="text-red-400 text-[11px]">{contactFormError}</p>
                )}
              </div>

              <div className="px-6 pb-6 flex-shrink-0">
                <button
                  onClick={handleContactSubmit}
                  disabled={!canSubmitContactForm}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl transition-all"
                >
                  Continue
                </button>
                <p className="text-white/20 text-[11px] text-center mt-2">
                  Powered by Alfima Realty Inc.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Sub-header */}
              <div className="bg-red-900/80 px-4 py-2 flex items-center gap-4 flex-shrink-0 border-b border-white/5">
                {/* <div className="flex items-center gap-1 text-red-200 text-xs">
                  <Phone className="w-3 h-3" />
                  <span>{CONTACT.phone}</span>
                </div> */}
                <div className="flex items-center gap-1 text-red-200 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{CONTACT.hours}</span>
                </div>
                {displayName && (
                  <div className="flex items-center gap-1 text-red-200 text-xs ml-auto">
                    <User className="w-3 h-3" />
                    <span className="max-w-[80px] truncate">{displayName}</span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950/90">
                {phase === "loading" && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-2 ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      {msg.sender === "admin" && (
                        <span className="text-[10px] text-red-400/70 px-1">
                          Alfima Agent
                        </span>
                      )}
                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-red-600 text-white rounded-br-sm"
                            : msg.sender === "admin"
                              ? "bg-red-900/60 text-white rounded-bl-sm border border-red-500/30"
                              : "bg-white/10 text-white/90 rounded-bl-sm border border-white/5"
                        }`}
                      >
                        <FormatText text={msg.text} />
                      </div>

                      {msg.sender !== "user" &&
                        msg.properties &&
                        msg.properties.length > 0 && (
                          <PropertyCards properties={msg.properties} />
                        )}

                      {msg.sender !== "user" &&
                        msg.suggestions &&
                        msg.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 max-w-[90%]">
                            {msg.suggestions.map((s) => (
                              <button
                                key={s}
                                onClick={() => sendMessage(s)}
                                disabled={
                                  isTyping ||
                                  phase === "loading" ||
                                  phase === "resolved"
                                }
                                className="text-xs px-3 py-1.5 rounded-full border border-red-500/40 text-red-300 hover:bg-red-600/20 hover:border-red-400 hover:text-white transition-all bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  ))
                )}

                {isTyping && (
                  <div className="flex items-start">
                    <div className="bg-white/10 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        {[0, 150, 300].map((d) => (
                          <div
                            key={d}
                            className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                            style={{ animationDelay: `${d}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="bg-neutral-950/90 border-t border-white/10 p-3 flex-shrink-0">
                {phase === "resolved" ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 text-white/35 text-xs">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>This conversation has been closed.</span>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={
                        phase === "human"
                          ? "Reply to your agent…"
                          : "Ask about properties, areas, prices…"
                      }
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 transition-all"
                    />
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || isTyping}
                      className="w-9 h-9 bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-white/20 text-xs text-center mt-2">
                  {phase === "human"
                    ? "💬 You're chatting with a live agent"
                    : phase === "resolved"
                      ? "Start a new chat by refreshing the page"
                      : "Alfima Realty Inc. · Pasig City, Philippines"}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-red-700 to-red-800 text-white shadow-xl shadow-red-900/50 hover:shadow-red-700/50 hover:scale-110 transition-all duration-300 flex items-center justify-center border border-red-500/30"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-neutral-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <style>{`
        @keyframes chatFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
