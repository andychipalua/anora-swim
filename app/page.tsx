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
      <section className="hero-banner">
        <img src="/assets/images/hero.jpg" alt="Anora swimming freestyle" width={1600} height={912} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-eyebrow">Age group · Club swimmer</p>
          <h1>Every second counts</h1>
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
