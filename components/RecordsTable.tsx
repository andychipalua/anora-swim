import Link from "next/link";
import { formatDate, formatTime } from "@/lib/helpers";
import type { SwimRecord, SwimVideo } from "@/data/types";

export default function RecordsTable({
  items,
  videos,
  editable = false,
}: {
  items: SwimRecord[];
  videos: SwimVideo[];
  editable?: boolean; // show an Edit link per row (admin only)
}) {
  if (items.length === 0) {
    return <p className="muted">No records added yet.</p>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Course</th>
            <th>Time</th>
            <th>Round</th>
            <th>Place</th>
            <th>Date</th>
            <th>Meet</th>
            <th>Video</th>
            {editable && <th></th>}
          </tr>
        </thead>
        <tbody>
          {items.map((r) => {
            const video = r.videoId != null ? videos.find((v) => v.id === r.videoId) : undefined;
            return (
              <tr key={r.id}>
                <td>{r.distance}m</td>
                <td>{r.course}</td>
                <td className="time">
                  {formatTime(r.timeSeconds)}
                  {r.isPb && <span className="badge">PB</span>}
                </td>
                <td>{r.round}</td>
                <td>{r.place ?? "—"}</td>
                <td>{formatDate(r.date)}</td>
                <td title={r.location ?? undefined}>{r.meet}</td>
                <td>
                  {video ? (
                    <a
                      href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ▶ Watch
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                {editable && (
                  <td>
                    <Link href={`/admin/records/${r.id}`}>Edit</Link>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
