import Link from "next/link";
import { getEvents, getRecords, getStrokes, getVideos } from "@/lib/api";
import { isAdmin } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/helpers";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

// Compact cells so the swim rows fit inside a card
const cell: CSSProperties = { padding: "6px 8px", fontSize: "0.85rem" };

export default async function EventsPage() {
  const [events, records, strokes, videos, admin] = await Promise.all([
    getEvents(),
    getRecords(),
    getStrokes(),
    getVideos(),
    isAdmin(),
  ]);

  // Order swims within an event by stroke, then distance, then fastest time
  const strokeOrder = new Map(strokes.map((s, i) => [s.slug, i]));
  const strokeName = new Map(strokes.map((s) => [s.slug, s.name]));

  return (
    <>
      <h1>Events</h1>
      {events.length === 0 ? (
        <p className="muted">No events added yet.</p>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {events.map((e) => {
            const when = e.endDate
              ? `${formatDate(e.date)} – ${formatDate(e.endDate)}`
              : formatDate(e.date);
            const where = [e.venue, e.address, e.city].filter(Boolean).join(", ");
            const eventVideos = videos.filter((v) => v.eventId === e.id);
            const swims = records
              .filter((r) => r.eventId === e.id)
              .sort(
                (a, b) =>
                  (strokeOrder.get(a.stroke) ?? 99) - (strokeOrder.get(b.stroke) ?? 99) ||
                  a.distance - b.distance ||
                  a.timeSeconds - b.timeSeconds
              );

            return (
              <div key={e.id} className="card">
                <h3>{e.name}</h3>
                {admin && (
                  <p>
                    <Link href={`/admin/events/${e.id}`}>Edit event</Link>
                  </p>
                )}
                <p className="muted">{when}</p>
                {where && <p>{where}</p>}
                <p className="muted">
                  {e.level}
                  {e.course ? ` · ${e.course}` : ""} · {e.recordCount} record
                  {e.recordCount === 1 ? "" : "s"}
                </p>
                {e.website && (
                  <p>
                    <a href={e.website} target="_blank" rel="noopener noreferrer">
                      Meet website ↗
                    </a>
                  </p>
                )}
                {e.notes && <p className="muted">{e.notes}</p>}

                {eventVideos.length > 0 && (
                  <>
                    <h4 className="event-videos-title">Videos ({eventVideos.length})</h4>
                    <ul className="event-videos">
                      {eventVideos.map((v) => (
                        <li key={v.id}>
                          <a
                            href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ▶ {v.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* Swims at the end of the card */}
                {swims.length > 0 && (
                  <>
                    <h4 className="event-videos-title">Swims</h4>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th style={cell}>Event</th>
                            <th style={cell}>Distance</th>
                            <th style={cell}>Time</th>
                            <th style={cell}>Position</th>
                            {admin && <th style={cell}></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {swims.map((r) => (
                            <tr key={r.id}>
                              <td style={cell}>
                                {strokeName.get(r.stroke) ?? r.stroke}
                                {r.round !== "Heat" && (
                                  <span className="muted"> · {r.round}</span>
                                )}
                              </td>
                              <td style={cell}>{r.distance}m</td>
                              <td className="time" style={cell}>
                                {formatTime(r.timeSeconds)}
                                {r.isPb && <span className="badge">PB</span>}
                              </td>
                              <td style={cell}>{r.place ?? "—"}</td>
                              {admin && (
                                <td style={cell}>
                                  <Link href={`/admin/records/${r.id}`}>Edit</Link>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
