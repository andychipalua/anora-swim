import "./globals.css";
import type { Metadata } from "next";
import { Barlow, Bebas_Neue } from "next/font/google";
import Link from "next/link";
import { getStrokes } from "@/lib/api";
import { swimmer } from "@/lib/helpers";

export const dynamic = "force-dynamic";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const barlow = Barlow({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-barlow" });

export const metadata: Metadata = {
  title: `${swimmer.name} - Swim Records`,
  description: swimmer.tagline,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const strokes = await getStrokes().catch(() => []);

  return (
    <html lang="en" className={`${bebas.variable} ${barlow.variable}`}>
      <body>
        <header className="sticky top-0 z-50 bg-gradient-to-r from-navy-deep to-pool shadow-md">
          <div className="container flex h-[60px] items-center justify-between gap-x-6">
            <Link href="/" className="font-display text-3xl uppercase leading-none tracking-wide text-white no-underline hover:no-underline">
              {swimmer.name} Swims
            </Link>
            <nav className="flex flex-wrap gap-x-7 gap-y-1 text-[0.95rem] font-semibold">
              {strokes.map((s) => (
                <Link key={s.slug} href={`/strokes/${s.slug}`} className="text-white/90 transition-colors hover:text-white">
                  {s.slug === "im" ? "IM" : s.name}
                </Link>
              ))}
              <Link href="/events" className="text-white/90 transition-colors hover:text-white">
                Events
              </Link>
              <Link href="/videos" className="text-white/90 transition-colors hover:text-white">
                Gallery
              </Link>
            </nav>
          </div>
          {/* lane-rope stripe */}
          <div
            aria-hidden
            className="h-[6px] bg-[repeating-linear-gradient(90deg,#0a84c6_0_28px,#ffffff_28px_44px,#f26b4a_44px_72px,#ffffff_72px_88px)]"
          />
        </header>
        <main className="container">{children}</main>
        <footer className="container muted footer">
          © {new Date().getFullYear()} {swimmer.name} · {swimmer.club} ·{" "}
          <Link href="/admin/new-record">Admin</Link>
        </footer>
      </body>
    </html>
  );
}
