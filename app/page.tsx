import Link from "next/link";
import { getRecords, getStrokes } from "@/lib/api";
import type { StrokeInfo, SwimRecord } from "@/data/types";
import { formatDate, formatTime } from "@/lib/helpers";

export const dynamic = "force-dynamic";

const TAGLINES: Record<string, string> = {
  freestyle: "Speed down the lane",
  backstroke: "Eyes to the sky",
  butterfly: "Power and rhythm",
  breaststroke: "Glide and kick",
  im: "All four, one race",
};

const SHORT: Record<string, string> = { freestyle: "FREE", backstroke: "BACK", butterfly: "FLY", breaststroke: "BREAST", im: "IM" };
const shortName = (s: StrokeInfo) => SHORT[s.slug] ?? s.name.toUpperCase();

export default async function HomePage() {
  const [strokes, records] = await Promise.all([getStrokes(), getRecords()]);

  // Personal best for every stroke / distance / course combination in the database.
  const bests = strokes.flatMap((stroke) => {
    const fastest = new Map<string, SwimRecord>();
    for (const r of records.filter((r) => r.stroke === stroke.slug)) {
      const key = `${r.distance}-${r.course}`;
      const cur = fastest.get(key);
      if (!cur || r.timeSeconds < cur.timeSeconds) fastest.set(key, r);
    }
    return [...fastest.values()]
      .sort((x, y) => x.distance - y.distance || x.course.localeCompare(y.course))
      .map((record) => ({ stroke, record }));
  });

  const latest = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <>
      <section className="relative left-1/2 h-[420px] w-screen -translate-x-1/2 overflow-hidden md:h-[480px]">
        <img src="/assets/images/hero.jpg" alt="Anora swimming freestyle" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-[1120px] flex-col justify-end px-4 pb-10">
          <p className="m-0 mb-1 text-sm font-bold uppercase tracking-[0.2em] text-coral">Age group · Club swimmer</p>
          <h1 className="m-0 font-display text-7xl uppercase leading-[0.9] text-white md:text-[8.5rem]">Every second counts</h1>
        </div>
      </section>

      <section className="pt-14">
        <h2 className="m-0 mb-6 font-display text-4xl uppercase tracking-wide text-navy dark:text-foreground">Personal bests</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {bests.map(({ stroke, record }) => (
            <Link
              key={`${stroke.slug}-${record.distance}-${record.course}`}
              href={`/strokes/${stroke.slug}`}
              className="block rounded-2xl border border-border bg-card p-5 text-foreground no-underline transition hover:-translate-y-1 hover:border-primary hover:no-underline hover:shadow-lg"
            >
              <p className="m-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {record.distance} {shortName(stroke)} · {record.course}
              </p>
              <p className="m-0 my-1 font-display text-5xl leading-none text-primary">{formatTime(record.timeSeconds)}</p>
              <p className="m-0 mt-3 font-bold">{stroke.name}</p>
              <p className="m-0 text-sm text-muted-foreground">{TAGLINES[stroke.slug] ?? record.meet}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="pb-4 pt-14">
        <h2 className="m-0 mb-6 font-display text-4xl uppercase tracking-wide text-navy dark:text-foreground">Latest swims</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {latest.map((r) => {
            const stroke = strokes.find((s) => s.slug === r.stroke);
            return (
              <Link
                key={r.id}
                href={`/strokes/${r.stroke}`}
                className="block rounded-2xl border border-border bg-card p-5 text-foreground no-underline transition hover:-translate-y-1 hover:border-primary hover:no-underline hover:shadow-lg"
              >
                <p className="m-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {r.distance} {stroke ? shortName(stroke) : r.stroke} · {r.course}
                </p>
                <p className="m-0 my-1 font-display text-5xl leading-none text-primary">{formatTime(r.timeSeconds)}</p>
                <p className="m-0 mt-3 font-bold">{r.meet}</p>
                <p className="m-0 text-sm text-muted-foreground">{formatDate(r.date)}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
