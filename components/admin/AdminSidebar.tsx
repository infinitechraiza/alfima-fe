"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Home,
  Users,
  Eye,
  Settings,
  HelpCircle,
  Wrench,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Handshake,
  Calendar,
  Phone,
  MessageCircle,
  Star,
  File,
  Share2,
  LayoutTemplate,
  Info,
  Newspaper,
} from "lucide-react";

const NAV_ITEMS = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Chat", href: "/admin/chat", icon: MessageCircle },
      { label: "Services", href: "/admin/services", icon: Wrench },
      { label: "About Us", href: "/admin/about", icon: Info },
    ],
  },
  {
    section: "Listings",
    items: [
      { label: "Properties", href: "/admin/properties", icon: Home },
      { label: "Developers", href: "/admin/developer", icon: Home },
      { label: "Agents", href: "/admin/agents", icon: Users },
    ],
  },
  {
    section: "Content",
    items: [
      { label: "Contacts", href: "/admin/contacts", icon: Phone },
      { label: "News&Events", href: "/admin/news&events", icon: Newspaper },
      { label: "Viewing Requests", href: "/admin/viewing-request", icon: Eye },
      { label: "Inquiries", href: "/admin/inquiries", icon: HelpCircle },
      {
        label: "Developer Inquiries",
        href: "/admin/developer-inquiries",
        icon: HelpCircle,
      },
      { label: "Viewing Appointments", href: "/admin/tours", icon: Calendar },
      { label: "Testimonials", href: "/admin/testimonials", icon: Star },
      { label: "Partners", href: "/admin/partners", icon: Handshake },
      { label: "Documents", href: "/admin/documents", icon: File },
      { label: "Social Media", href: "/admin/social", icon: Share2 },
      { label: "Footer", href: "/admin/footer-contacts", icon: LayoutTemplate },
    ],
  },
  {
    section: "Config",
    items: [{ label: "Settings", href: "/admin/settings", icon: Settings }],
  },
];

function SidebarInner({
  collapsed,
  setCollapsed,
  onNavClick,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch("/api/admin/properties/pending-count");
        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.count || 0);
        }
      } catch (error) {
        console.error("[v0] Error fetching pending count:", error);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 5000);

    const handlePropertyUpdate = () => fetchPendingCount();
    window.addEventListener("propertyUpdated", handlePropertyUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("propertyUpdated", handlePropertyUpdate);
    };
  }, []);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo / header */}
      <div
        className={`flex items-center gap-3 px-5 py-5 border-b border-slate-100 flex-shrink-0 ${collapsed ? "justify-center px-3" : ""}`}
      >
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
          <img
            src="/alfima.png"
            alt="Alfima"
            className="w-full h-full object-cover"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-slate-800 font-bold text-sm leading-tight">
              Alfima Realty
            </p>
            <p className="text-slate-400 text-xs">Admin Panel</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden lg:flex w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 items-center justify-center text-slate-400 hover:text-slate-600 transition-all flex-shrink-0 ${collapsed ? "rotate-180 mx-auto mt-0" : ""}`}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Nav links — scrollable */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-none">
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            {!collapsed && (
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-2">
                {group.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = isActive(href);
                const showBadge = label === "Properties" && pendingCount > 0;

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavClick}
                      title={collapsed ? label : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative
                        ${
                          active
                            ? "bg-red-50 text-red-700"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        } ${collapsed ? "justify-center px-0" : ""}`}
                    >
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-500 rounded-full" />
                      )}

                      {/* Icon — with small dot indicator when collapsed */}
                      <div className="relative flex-shrink-0">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            active
                              ? "text-red-500"
                              : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                        {/* Small dot shown only in collapsed mode */}
                        {showBadge && collapsed && (
                          <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </div>

                      {/* Expanded label + text badge */}
                      {!collapsed && (
                        <div className="flex-1 min-w-0 flex flex-col gap-0">
                          <div className="flex items-center gap-2">
                            <span className="flex-1 min-w-0">{label}</span>
                            {showBadge ? (
                              <span className="flex-shrink-0 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-bold whitespace-nowrap">
                                {pendingCount} pending
                              </span>
                            ) : (
                              active && (
                                <ChevronRight className="w-3 h-3 flex-shrink-0 text-red-400/70" />
                              )
                            )}
                          </div>
                          {showBadge && (
                            <span
                              style={{
                                animation:
                                  "badgeBounce 1s ease-in-out infinite",
                              }}
                              className="text-[10px] font-semibold text-red-400 leading-tight"
                            >
                              Review{" "}
                              {pendingCount === 1
                                ? "this property"
                                : `these ${pendingCount} properties`}{" "}
                              now
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User + Logout — pinned to bottom */}
      <div className="flex-shrink-0 border-t border-slate-100 p-3 space-y-1">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-1">
            {user?.avatar ? (
              <img
                src={
                  user.avatar.startsWith("http")
                    ? user.avatar
                    : `${process.env.NEXT_PUBLIC_IMAGE_URL}/${user.avatar}`
                }
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() ?? "A"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-slate-700 text-sm font-semibold truncate">
                {user?.name ?? "Admin"}
              </p>
              <p className="text-slate-400 text-xs truncate">
                {user?.email ?? ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-1">
            {user?.avatar ? (
              <img
                src={
                  user.avatar.startsWith("http")
                    ? user.avatar
                    : `${process.env.NEXT_PUBLIC_IMAGE_URL}/${user.avatar}`
                }
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase() ?? "A"}
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );
}

// ─── Desktop sidebar ─────────────────────────────────────────────────────────
export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes badgeBounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-3px); opacity: 0.75; }
        }
      `}</style>
      <aside
        className={`
          hidden lg:flex flex-col flex-shrink-0
          h-screen
          bg-white border-r border-slate-200
          transition-all duration-300 shadow-sm
          ${collapsed ? "w-[68px]" : "w-72"}
        `}
      >
        <SidebarInner collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>
    </>
  );
}

// ─── Mobile topbar + drawer ───────────────────────────────────────────────────
export function AdminMobileTopbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes badgeBounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-3px); opacity: 0.75; }
        }
      `}</style>

      {/* Topbar strip */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow">
            <img
              src="/alfima.png"
              alt="Alfima"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-slate-800 font-bold text-sm">Alfima Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Slide-in drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200 z-50 flex flex-col shadow-2xl"
            style={{ animation: "slideInLeft 0.25s ease" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl overflow-hidden shadow">
                  <img
                    src="/alfima.png"
                    alt="Alfima"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-slate-800 font-bold text-sm">
                  Alfima Admin
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarInner
                collapsed={false}
                setCollapsed={() => {}}
                onNavClick={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
