import { getEvents, getVideos } from "@/lib/api";
import { formatDate } from "@/lib/helpers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

export default async function EventsPage() {
  const [events, videos] = await Promise.all([getEvents(), getVideos()]);

  return (
    <>
      <h1>Events</h1>
      {events.length === 0 ? (
        <p className="muted">No events added yet.</p>
      ) : (
        <div className="grid">
          {events.map((e) => {
            const when = e.endDate
              ? `${formatDate(e.date)} – ${formatDate(e.endDate)}`
              : formatDate(e.date);
            const where = [e.venue, e.address, e.city].filter(Boolean).join(", ");
            const eventVideos = videos.filter((v) => v.eventId === e.id);
            return (
              <div key={e.id} className="card">
                <h3>{e.name}</h3>
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
                    <h4 className="event-videos-title">
                      Videos ({eventVideos.length})
                    </h4>
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
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
