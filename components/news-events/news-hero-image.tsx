
// ─── Hero side image ───────────────────────────────────────────────────────────
// Static asset — place the file at /public/news.png in the project.
const HERO_SIDE_IMAGE = "/news.png";


export default function HeroSideImage({ heroIn }: { heroIn: boolean }) {
  return (
    <div
      className="hidden lg:flex absolute right-0 top-0 h-full w-[50%] items-center justify-center pr-16 pl-6"
      style={{
        opacity: heroIn ? 1 : 0,
        transform: heroIn ? "none" : "translateX(40px)",
        transition: "opacity .9s ease 200ms, transform .9s ease 200ms",
      }}
    >
      <div className="relative w-full max-h-[80%]">
        <img
          src={HERO_SIDE_IMAGE}
          alt="News and events"
          className="w-full h-full object-contain drop-shadow-2xl"
          style={{
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 75% at center, black 55%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 75% 75% at center, black 55%, transparent 100%)",
          }}
        />
        {/* soft glow behind the image */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-30 pointer-events-none -z-10"
          style={{
            background: "radial-gradient(circle,#e74c3c 0%,transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}