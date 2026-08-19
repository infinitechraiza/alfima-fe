'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function FloatingLogo() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/home-loan-calculator')) return null

  return (
    <Link
      href="/"
      aria-label="ALFIMA Realty Inc. — Go to homepage"
      className="
        hidden md:flex
        fixed left-4 top-24 z-50
        group
        flex-col items-center justify-center gap-0
        transition-all duration-300 ease-out
        hover:scale-110
      "
    >
      <Image
        src="/alfima.png"
        alt="ALFIMA Realty Inc."
        width={180}
        height={180}
        className="object-contain transition-transform duration-300 group-hover:scale-105"
        priority
      />
      <div className="flex flex-col items-center leading-tight -mt-1">
        <span className="text-white font-black text-xs tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          ALFIMA
        </span>
        <span className="text-white font-black text-xs tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          REALTY INC.
        </span>
      </div>
    </Link>
  )
}