import Link from "next/link";
import { getRecords, getStrokes, getVideos } from "@/lib/api";
import { formatTime, swimmer } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [strokes, records, videos] = await Promise.all([
    getStrokes(),
    getRecords(),
    getVideos(),
  ]);

  const latest = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <>
        <section className="relative h-[70vh] min-h-[420px] overflow-hidden">
        <img src='//a7f0cc91-0702-5099-be77-b43f7855801c.lovableproject.com/src/assets/hero.jpg' alt="Anora swimming freestyle" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-12">
          <p className="font-semibold uppercase tracking-widest text-accent">Age group · Club swimmer</p>
          <h1 className="text-7xl leading-none text-primary-foreground md:text-9xl">Every second counts</h1>
        </div>
      </section>
      <section className="hero">
        <h1>{swimmer.name}</h1>
        <p>{swimmer.tagline}</p>
        <p className="muted">
          {records.length} records · {videos.length} videos
        </p>
      </section>

      <h2>Strokes</h2>
      <div className="grid">
        {strokes.map((s) => {
          const count = records.filter((r) => r.stroke === s.slug).length;
          return (
            <Link key={s.slug} href={`/strokes/${s.slug}`} className="card stroke-card">
              <span className="emoji">{s.emoji}</span>
              <h3>{s.name}</h3>
              <p className="muted">
                {count} record{count === 1 ? "" : "s"}
              </p>
            </Link>
          );
        })}
      </div>

      <h2>Latest swims</h2>
      <ul className="latest">
        {latest.map((r) => (
          <li key={r.id}>
            <strong>
              {r.distance}m {strokes.find((s) => s.slug === r.stroke)?.name}
            </strong>
            <span className="time">{formatTime(r.timeSeconds)}</span>
            <span className="muted">{r.meet}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
