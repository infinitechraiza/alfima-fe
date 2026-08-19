import { Monitor, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

type Property = {
  id: number;
  title: string;
  price: number;
  city?: string;
  location?: string;
  listing_type?: string;
  status?: string;
  images?: { url: string; path: string }[];
  thumbnail?: string;
  image?: string;
};

function formatPrice(price: number): string {
  if (price == null || isNaN(price)) return "Price on request";
  if (price >= 1_000_000) return `₱${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `₱${(price / 1_000).toFixed(0)}K`;
  return `₱${price.toLocaleString()}`;
}

function getTagColor(type?: string): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("rent")) return "#7c3aed";
  return "#c41e3a";
}

function getTag(type?: string): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("rent")) return "For Rent";
  return "For Sale";
}

function getImage(p: Property): string {
  if (p.images?.[0]?.url) return p.images[0].url;
  if (p.images?.[0]?.path) return p.images[0].path;
  if (p.thumbnail) return p.thumbnail;
  if (p.image) return p.image;
  return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop&auto=format&q=80";
}

function getLocation(p: Property): string {
  return p.city ?? p.location ?? "Philippines";
}

// Returns 3 properties rotating by day, cycling back to start when exhausted
function getDailySlice(props: Property[]): Property[] {
  if (!props.length) return [];
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const startIdx = (dayIndex * 3) % props.length;
  const result: Property[] = [];
  for (let i = 0; i < 3; i++) {
    result.push(props[(startIdx + i) % props.length]);
  }
  return result;
}

export function DeviceMockups() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalListings, setTotalListings] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/properties?per_page=100")
        .then((r) => r.json())
        .catch(() => null),
      fetch("/api/developers-properties?per_page=1")
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([propertiesData, devPropertiesData]) => {
        // Extract property list from regular properties
        const list: Property[] =
          propertiesData?.data ??
          propertiesData?.properties ??
          propertiesData?.results ??
          propertiesData ??
          [];

        // Extract totals from both sources
        const extractTotal = (data: any): number => {
          if (!data) return 0;
          return (
            data?.total ??
            data?.meta?.total ??
            data?.pagination?.total ??
            data?.data?.total ??
            0
          );
        };

        const propertiesTotal = extractTotal(propertiesData);
        const devPropertiesTotal = extractTotal(devPropertiesData);
        const combined = propertiesTotal + devPropertiesTotal;

        setProperties(Array.isArray(list) ? list : []);
        if (combined > 0) setTotalListings(combined);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dailyProps = getDailySlice(properties);
  const listingsLabel =
    totalListings !== null
      ? `${totalListings.toLocaleString()}+ Listings`
      : loading
        ? "..."
        : "Listings";

  // Hero image from first daily property
  const heroImage = dailyProps[0]
    ? getImage(dailyProps[0])
    : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop&auto=format&q=80";

  return (
    <div
      className="hidden lg:block"
      style={{ position: "relative", width: "100%", height: 620 }}
    >
      <style>{`
        .dm-laptop {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 72%;
          max-width: 480px;
          min-width: 340px;
          z-index: 3;
        }
        .dm-phone {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 26%;
          max-width: 175px;
          min-width: 140px;
          z-index: 6;
        }
        .dm-phone-shell {
          position: relative;
          width: 100%;
          aspect-ratio: 9 / 19.5;
          background: linear-gradient(145deg, #1c1c2e 0%, #0f0f1a 100%);
          border-radius: 32px;
          border: 2px solid rgba(255,255,255,0.12);
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.6),
            0 32px 80px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.1);
          overflow: hidden;
        }
        .dm-phone-screen {
          position: absolute;
          inset: 6px;
          border-radius: 26px;
          overflow: hidden;
          background: #0f0f1a;
          display: flex;
          flex-direction: column;
        }
        .dm-float-new {
          position: absolute;
          bottom: 60px;
          left: -10px;
          z-index: 10;
        }
        .dm-float-stats {
          position: absolute;
          top: 40px;
          left: 38%;
          z-index: 10;
        }
        @media (max-width: 1280px) {
          .dm-laptop { width: 68%; }
          .dm-phone  { width: 30%; }
        }
      `}</style>

      {/* ── LAPTOP ────────────────────────────────────────── */}
      <div className="dm-laptop">
        <div className="laptop-frame">
          <div className="laptop-chrome">
            <div className="flex gap-1.5">
              <div
                className="chrome-dot-r"
                style={{ width: 9, height: 9, borderRadius: "50%" }}
              />
              <div
                className="chrome-dot-y"
                style={{ width: 9, height: 9, borderRadius: "50%" }}
              />
              <div
                className="chrome-dot-g"
                style={{ width: 9, height: 9, borderRadius: "50%" }}
              />
            </div>
            <div className="laptop-url-bar">
              <span style={{ fontSize: 9, color: "#28c840" }}>🔒</span>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "monospace",
                }}
              >
                alfimarealtyinc.com
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
              background: "#0d0d14",
            }}
          >
            {/* Hero */}
            <div
              style={{
                position: "relative",
                height: 200,
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              <img
                src={heroImage}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.75,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop&auto=format&q=80";
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(13,13,20,0.3) 0%, rgba(13,13,20,0.95) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, rgba(196,30,58,0.12) 0%, transparent 60%)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "0 18px 16px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(196,30,58,0.2)",
                    border: "1px solid rgba(196,30,58,0.4)",
                    borderRadius: 20,
                    padding: "3px 10px",
                    marginBottom: 7,
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      background: "#c41e3a",
                      borderRadius: "50%",
                      boxShadow: "0 0 6px #c41e3a",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: "#ff6b6b",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    Helping You Find More Than Just a Home
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#fff",
                    lineHeight: 1.15,
                    fontFamily: "Georgia, serif",
                    marginBottom: 6,
                    textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                  }}
                >
                  Find Your
                  <br />
                  <span style={{ color: "#ff6b6b" }}>Dream Home.</span>
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.95)",
                    borderRadius: 10,
                    padding: "7px 10px",
                    gap: 8,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    style={{ width: 13, height: 13, flexShrink: 0 }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <span style={{ fontSize: 10, color: "#9ca3af", flex: 1 }}>
                    Search city, area, or property type…
                  </span>
                  <div
                    style={{
                      background: "#c41e3a",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 7,
                    }}
                  >
                    Search
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div
              style={{
                display: "flex",
                gap: 0,
                background: "#13131f",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
              }}
            >
              {[
                { val: listingsLabel, label: "Properties" },
                { val: "50+", label: "Agents" },
                { val: "4.9★", label: "Rating" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    textAlign: "center",
                    borderRight:
                      i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#fff",
                      margin: 0,
                    }}
                  >
                    {s.val}
                  </p>
                  <p
                    style={{
                      fontSize: 8,
                      color: "rgba(255,255,255,0.4)",
                      margin: 0,
                      marginTop: 1,
                    }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Property cards — REAL DATA */}
            <div
              style={{
                flex: 1,
                background: "#0d0d14",
                padding: "10px 12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  Featured Properties
                </p>
                <span
                  style={{ fontSize: 8, color: "#c41e3a", fontWeight: 600 }}
                >
                  View all →
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 7,
                }}
              >
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: 10,
                          height: 100,
                          opacity: 0.5,
                        }}
                      />
                    ))
                  : dailyProps.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: 10,
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ position: "relative" }}>
                          <img
                            src={getImage(p)}
                            alt={p.title}
                            style={{
                              width: "100%",
                              height: 54,
                              objectFit: "cover",
                              display: "block",
                              background: "#1a1a2e",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.background =
                                "#1a1a2e";
                              (e.target as HTMLImageElement).src = "";
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              top: 4,
                              left: 4,
                              background: getTagColor(
                                p.listing_type ?? p.status,
                              ),
                              color: "#fff",
                              fontSize: 7,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 8,
                            }}
                          >
                            {getTag(p.listing_type ?? p.status)}
                          </div>
                        </div>
                        <div style={{ padding: "6px 7px" }}>
                          <p
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: "#fff",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              margin: 0,
                            }}
                          >
                            {p.title}
                          </p>
                          <p
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: "#ff8a80",
                              margin: "2px 0 1px",
                            }}
                          >
                            {formatPrice(p.price)}
                          </p>
                          <p
                            style={{
                              fontSize: 8,
                              color: "rgba(255,255,255,0.4)",
                              margin: 0,
                            }}
                          >
                            {getLocation(p)}
                          </p>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
        <div className="laptop-base-bar" />
        <div className="laptop-foot-bar" />
      </div>

      {/* ── PHONE ─────────────────────────────────────────── */}
      {/* ── PHONE ─────────────────────────────────────────── */}
      <div className="dm-phone">
        <div className="dm-phone-shell">
          {/* Side buttons */}
          <div
            style={{
              position: "absolute",
              right: -3,
              top: 80,
              width: 3,
              height: 32,
              background: "#2a2a3e",
              borderRadius: "0 3px 3px 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -3,
              top: 64,
              width: 3,
              height: 24,
              background: "#2a2a3e",
              borderRadius: "3px 0 0 3px",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -3,
              top: 96,
              width: 3,
              height: 24,
              background: "#2a2a3e",
              borderRadius: "3px 0 0 3px",
            }}
          />

          <div className="dm-phone-screen">
            {/* Dynamic island */}
            <div
              style={{
                position: "absolute",
                top: 8,
                left: "50%",
                transform: "translateX(-50%)",
                width: 52,
                height: 14,
                background: "#000",
                borderRadius: 20,
                zIndex: 10,
              }}
            />

            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* ── FULL BLEED HERO ── */}
              <div
                style={{ position: "relative", flex: 1, overflow: "hidden" }}
              >
                <img
                  src={heroImage}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.5,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=600&fit=crop&auto=format&q=80";
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(13,13,20,0.95) 100%)",
                  }}
                />

                {/* ── NAV ── */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    paddingTop: 24,
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        background: "#fff",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ width: 14, height: 14 }}
                      >
                        <path
                          d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
                          fill="#c41e3a"
                        />
                        <rect
                          x="9"
                          y="13"
                          width="6"
                          height="8"
                          rx="1"
                          fill="#fff"
                        />
                      </svg>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        color: "#fff",
                        letterSpacing: "0.03em",
                      }}
                    >
                      ALFIMA REALTY
                    </span>
                  </div>
                  {/* Hamburger */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3.5,
                      padding: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 1.5,
                        background: "#fff",
                        borderRadius: 2,
                      }}
                    />
                    <div
                      style={{
                        width: 14,
                        height: 1.5,
                        background: "#fff",
                        borderRadius: 2,
                      }}
                    />
                    <div
                      style={{
                        width: 10,
                        height: 1.5,
                        background: "#fff",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>

                {/* ── HERO TEXT ── */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 14,
                    left: 12,
                    right: 12,
                  }}
                >
                  {/* Headline */}
                  {/* <p
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "#fff",
                      fontFamily: "Georgia, serif",
                      lineHeight: 1.1,
                      margin: "0 0 2px",
                    }}
                  >
                    Find Your
                  </p>
                  <p
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "#c41e3a",
                      fontFamily: "Georgia, serif",
                      lineHeight: 1.1,
                      margin: "0 0 12px",
                    }}
                  >
                    Dream Home.
                  </p> */}

                  {/* Single trust pill row */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                    {["Licensed Brokers", "Highly Rated"].map((label) => (
                      <div
                        key={label}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          background: "rgba(255,255,255,0.1)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 20,
                          padding: "3px 8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 8,
                            color: "rgba(255,255,255,0.85)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTAs */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <div
                      style={{
                        background: "#c41e3a",
                        borderRadius: 10,
                        padding: "9px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}
                      >
                        Browse Properties
                      </span>
                      <span style={{ fontSize: 12, color: "#fff" }}>→</span>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 10,
                        padding: "8px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.85)",
                        }}
                      >
                        Request Viewing
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── STATS STRIP ── */}
              <div
                style={{
                  background: "#111118",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  flexShrink: 0,
                }}
              >
                {[
                  {
                    val: totalListings ? `${totalListings}+` : "32+",
                    label: "Properties",
                  },
                  { val: "25", label: "Agents" },
                  { val: "4.9★", label: "Rating" },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      textAlign: "center",
                      borderRight:
                        i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#fff",
                        margin: 0,
                      }}
                    >
                      {s.val}
                    </p>
                    <p
                      style={{
                        fontSize: 8,
                        color: "rgba(255,255,255,0.4)",
                        margin: 0,
                        marginTop: 1,
                      }}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating cards ── */}
      <div className="float-card dm-float-new">
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "rgba(196,30,58,0.15)",
            border: "1px solid rgba(196,30,58,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Monitor size={20} color="#c41e3a" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            Showcase
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.55)",
              marginTop: 2,
            }}
          >
            Presented on real device screens
          </p>
        </div>
      </div>

      <div className="float-card dm-float-stats">
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "rgba(39,174,96,0.2)",
            border: "1px solid rgba(39,174,96,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <TrendingUp size={20} color="#2ecc71" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            {listingsLabel}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.55)",
              marginTop: 2,
            }}
          >
            Across the Philippines
          </p>
        </div>
      </div>
    </div>
  );
}
