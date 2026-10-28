import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { getStrokes } from "@/lib/api";
import { swimmer } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${swimmer.name} - Swim Records`,
  description: swimmer.tagline,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const strokes = await getStrokes().catch(() => []);

  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container nav">
            <Link href="/" className="brand">
              🏊 {swimmer.name}
            </Link>
            <nav>
              {strokes.map((s) => (
                <Link key={s.slug} href={`/strokes/${s.slug}`}>
                  {s.name}
                </Link>
              ))}
              <Link href="/events">Events</Link>
              <Link href="/videos">Videos</Link>
            </nav>
          </div>
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
