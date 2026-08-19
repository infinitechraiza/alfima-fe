import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="relative py-24 sm:py-38 bg-white">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/56/93/d9/5693d91e81c6bbf6f5c281145574ab4e.jpg')",
        }}
      />

      {/* Semi-transparent white overlay */}
      <div className="absolute inset-0 bg-white opacity-70" />

      {/* Card container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-bl from-red-800 from-[10%] via-[#3d0012] via-[80%] to-red-800 to-[100%] rounded-3xl p-12 sm:p-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-rose-100 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Start exploring your perfect property today or list your property to reach thousands of qualified buyers and renters.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/properties">
              <Button className="bg-gradient-to-r from-rose-400 to-red-500 hover:from-rose-500 hover:to-red-600 text-white font-bold text-lg px-8 py-6">
                Browse Properties
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}