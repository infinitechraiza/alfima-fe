import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FloatingSocialWidget } from "@/components/global/floating-social";
import { Chatbot } from "@/components/global/chatbot";
import { CookieConsent } from "@/components/global/cookie-consent";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const FAVICON_VERSION = "v2";

// ─── Canonical base — no trailing slash ──────────────────────────────────────
// Use your real domain once deployed; Vercel preview URL hurts canonical signals
const BASE_URL = "https://alfimarealtyinc.com";

// ─── Shared copy ─────────────────────────────────────────────────────────────
const SITE_NAME = "ALFIMA Realty Inc.";
const DEFAULT_TITLE =
  "ALFIMA Realty Inc. | Buy, Sell & Rent Properties in the Philippines";
const DEFAULT_DESCRIPTION =
  "ALFIMA Realty Inc. is a PRC-licensed real estate brokerage in Pasig, Metro Manila. " +
  "Browse houses, condos, lots, and commercial spaces for sale or rent. " +
  "Expert brokers ready to help you buy, sell, or invest — call us at 0917 174 2419.";

// ─── Metadata ────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Core ──────────────────────────────────────────────────────────────────
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,

  // High-intent keywords: mix brand, location, property type, and intent
  keywords: [
    // Brand
    "ALFIMA Realty Inc",
    "Alfima Realty",
    "Alfima Real Estate Philippines",
    // High-intent buyer/seller
    "buy house Philippines",
    "sell property Philippines",
    "rent condo Philippines",
    "real estate agent Philippines",
    "licensed real estate broker Philippines",
    "PRC broker Philippines",
    // Property types
    "house and lot for sale Philippines",
    "condo for sale Metro Manila",
    "lot for sale Philippines",
    "commercial property for sale Philippines",
    "foreclosed property Philippines",
    "pre-selling condo Metro Manila",
    "RFO condo Philippines",
    "townhouse for sale Metro Manila",
    // Location-specific (highest conversion)
    "real estate Pasig City",
    "properties for sale Pasig",
    "condo for sale Ortigas",
    "house for sale BGC Taguig",
    "properties Metro Manila",
    "real estate broker Pasig",
    "IBP Tower Pasig real estate",
    // Long-tail investment intent
    "property investment Philippines 2025",
    "real estate ROI Philippines",
    "affordable homes Metro Manila",
    "luxury condo Philippines",
    "OFW property investment Philippines",
  ],

  authors: [{ name: SITE_NAME, url: BASE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Real Estate",
  classification: "Real Estate Brokerage",

  // ── Canonical & Alternates ────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-PH": BASE_URL,
      "en-US": BASE_URL,
    },
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_PH",
    // alternate_locale helps surface correct result for Filipino users abroad
    alternateLocale: ["en_US", "fil_PH"],
    url: BASE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description:
      "Find your dream home or next investment with ALFIMA Realty Inc. — a trusted, PRC-licensed brokerage in Pasig, Philippines. " +
      "Browse hundreds of verified listings, connect with expert brokers, and close the deal with confidence.",
    images: [
      {
        // Primary: 1200×630 — used by Facebook, LinkedIn, iMessage, etc.
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Buy, Sell & Rent Properties in the Philippines`,
        type: "image/png",
        secureUrl: `${BASE_URL}/og-image.png`,
      },
      {
        // Square fallback — WhatsApp, some mobile previews
        url: `${BASE_URL}/og-image-square.png`,
        width: 800,
        height: 800,
        alt: SITE_NAME,
        type: "image/png",
        secureUrl: `${BASE_URL}/og-image-square.png`,
      },
    ],
  },

  // ── Twitter / X Card ──────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@AlfimaRealty",
    creator: "@AlfimaRealty",
    title: DEFAULT_TITLE,
    description:
      "PRC-licensed real estate brokerage in Pasig, Philippines. Buy, sell, or rent homes, condos, lots & commercial spaces. Call 0917 174 2419.",
    images: {
      url: `${BASE_URL}/og-image.png`,
      alt: `${SITE_NAME} — Properties in the Philippines`,
    },
  },

  // ── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Verification — add tokens once confirmed ──────────────────────────────
  // verification: {
  //   google: 'YOUR_GOOGLE_SEARCH_CONSOLE_TOKEN',
  //   bing: 'YOUR_BING_WEBMASTER_TOKEN',
  // },

  // ── App / PWA ─────────────────────────────────────────────────────────────
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ALFIMA Realty",
  },
  formatDetection: { telephone: false },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      {
        url: `/icon-32x32.png?v=${FAVICON_VERSION}`,
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: `/icon-192x192.png?v=${FAVICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `/icon-512x512.png?v=${FAVICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: `/apple-icon.png?v=${FAVICON_VERSION}`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#1a3c5e" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a3c5e" },
  ],
  width: "device-width",
  initialScale: 1,
  userScalable: true,
};

// ─── JSON-LD — single @graph bundle (Google-preferred format) ────────────────
//
// Why @graph?
//  • Lets Google see all entities and their relationships in one parse
//  • Avoids duplicate @context declarations (bandwidth + clarity)
//  • Required for some rich result types (Sitelinks Searchbox, etc.)
//
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    // 1. RealEstateAgent (LocalBusiness sub-type) ─────────────────────────────
    {
      "@type": ["RealEstateAgent", "LocalBusiness"],
      "@id": `${BASE_URL}/#organization`,
      name: SITE_NAME,
      legalName: "ALFIMA Realty Inc.",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        "@id": `${BASE_URL}/#logo`,
        url: `${BASE_URL}/logo.png`,
        width: 200,
        height: 60,
        caption: SITE_NAME,
      },
      image: {
        "@type": "ImageObject",
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
      description:
        "ALFIMA Realty Inc. is a PRC-licensed real estate brokerage in Pasig, Philippines, " +
        "specializing in buying, selling, and renting residential and commercial properties across Metro Manila.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "10th Floor IBP Tower, Jade Drive, Brgy. San Antonio",
        addressLocality: "Pasig City",
        addressRegion: "Metro Manila",
        postalCode: "1604",
        addressCountry: "PH",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 14.5794,
        longitude: 121.0851,
      },
      hasMap: "https://maps.google.com/?q=IBP+Tower+Jade+Drive+Pasig",
      telephone: "+63-917-174-2419",
      email: "ABMacalincag@alfimarealtyinc.com",
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+63-917-174-2419",
          contactType: "customer service",
          areaServed: "PH",
          availableLanguage: ["English", "Filipino"],
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "08:00",
            closes: "17:00",
          },
        },
        {
          "@type": "ContactPoint",
          telephone: "+63-917-174-2419",
          contactType: "sales",
          areaServed: "PH",
          availableLanguage: ["English", "Filipino"],
        },
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "08:00",
          closes: "17:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Saturday"],
          opens: "09:00",
          closes: "13:00",
        },
      ],
      priceRange: "₱₱₱",
      currenciesAccepted: "PHP",
      paymentAccepted: "Cash, Bank Transfer, Check",
      areaServed: [
        { "@type": "City", name: "Pasig City" },
        { "@type": "City", name: "Makati" },
        { "@type": "City", name: "Taguig" },
        { "@type": "City", name: "Quezon City" },
        { "@type": "AdministrativeArea", name: "Metro Manila" },
      ],
      // ── Aggregate Rating stub ─────────────────────────────────────────────
      // Uncomment and populate once you have real review data.
      // Google will show star ratings in SERPs — high click-through impact.
      //
      // aggregateRating: {
      //   '@type': 'AggregateRating',
      //   ratingValue: '4.9',
      //   reviewCount: '87',
      //   bestRating: '5',
      //   worstRating: '1',
      // },
      sameAs: [
        "https://www.facebook.com/p/Alfima-Realty-Inc-61579807227114/",
        // 'https://www.instagram.com/AlfimaRealty',
        // 'https://www.linkedin.com/company/alfima-realty',
        // 'https://twitter.com/AlfimaRealty',
      ],
    },

    // 2. WebSite + Sitelinks Searchbox ────────────────────────────────────────
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: SITE_NAME,
      description: "Buy, Sell & Rent Properties in the Philippines",
      publisher: { "@id": `${BASE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/properties?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      inLanguage: "en-PH",
    },

    // 3. WebPage (home page) ───────────────────────────────────────────────────
    {
      "@type": "WebPage",
      "@id": `${BASE_URL}/#webpage`,
      url: BASE_URL,
      name: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      isPartOf: { "@id": `${BASE_URL}/#website` },
      about: { "@id": `${BASE_URL}/#organization` },
      inLanguage: "en-PH",
      breadcrumb: { "@id": `${BASE_URL}/#breadcrumb` },
    },

    // 4. BreadcrumbList ────────────────────────────────────────────────────────
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: BASE_URL,
        },
      ],
    },

    // 5. FAQPage — high value: Google may show expandable Q&A in SERPs ─────────
    // Replace/extend with real FAQ content from your site
    {
      "@type": "FAQPage",
      "@id": `${BASE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Where is ALFIMA Realty Inc. located?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ALFIMA Realty Inc. is located at the 10th Floor, IBP Tower, Jade Drive, Brgy. San Antonio, Pasig City, Metro Manila, Philippines (Postal Code 1604).",
          },
        },
        {
          "@type": "Question",
          name: "What types of properties does ALFIMA Realty offer?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ALFIMA Realty offers a wide range of properties including houses and lots, condominiums, townhouses, vacant lots, and commercial spaces for sale or rent across Metro Manila.",
          },
        },
        {
          "@type": "Question",
          name: "How can I contact ALFIMA Realty Inc.?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can reach ALFIMA Realty Inc. by calling 0917 174 2419, emailing ABMacalincag@alfimarealtyinc.com, or visiting our office at IBP Tower, Pasig City. Office hours are Monday to Friday, 8AM–5PM, and Saturday, 9AM–1PM.",
          },
        },
        {
          "@type": "Question",
          name: "Is ALFIMA Realty a licensed brokerage in the Philippines?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. ALFIMA Realty Inc. is a PRC-licensed real estate brokerage operating in the Philippines, compliant with Republic Act 9646 (Real Estate Service Act).",
          },
        },
        {
          "@type": "Question",
          name: "Does ALFIMA Realty cater to OFW property buyers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. ALFIMA Realty Inc. assists Overseas Filipino Workers (OFWs) in buying property in the Philippines remotely. Our brokers guide you through the process, from property selection to documentation and financing.",
          },
        },
      ],
    },
  ],
};

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-PH" className="overflow-x-hidden">
      <head>
        {/* ── Performance: preconnect to critical origins ── */}
        {/* Shaves 100-300ms off first-party font/asset requests */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* ── PWA / Mobile ── */}
        <meta name="application-name" content="ALFIMA Realty" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ALFIMA Realty" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1a3c5e" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* ── Local SEO geo tags ── */}
        <meta name="geo.region" content="PH-00" />
        <meta
          name="geo.placename"
          content="Pasig City, Metro Manila, Philippines"
        />
        <meta name="geo.position" content="14.5794;121.0851" />
        <meta name="ICBM" content="14.5794, 121.0851" />

        {/* ── Business contact (legacy crawlers) ── */}
        <meta name="contact" content="0917 174 2419" />
        <meta name="reply-to" content="ABMacalincag@alfimarealtyinc.com" />

        {/* ── Ownership / trust signals ── */}
        {/* Uncomment once verified in respective consoles */}
        {/* <meta name="google-site-verification" content="YOUR_TOKEN" /> */}
        {/* <meta name="msvalidate.01" content="YOUR_BING_TOKEN" /> */}

        {/* ── JSON-LD Structured Data (@graph bundle) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased overflow-x-hidden">
        <AuthProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Chatbot />
          <FloatingSocialWidget />
          <Footer />
          <CookieConsent />
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
