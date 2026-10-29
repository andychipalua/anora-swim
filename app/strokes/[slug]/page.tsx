import { notFound } from "next/navigation";
import ProgressChart from "@/components/ProgressChart";
import RecordsTable from "@/components/RecordsTable";
import VideoCard from "@/components/VideoCard";
import { getRecords, getStrokes, getVideos } from "@/lib/api";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StrokePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const strokes = await getStrokes();
  const stroke = strokes.find((s) => s.slug === slug);
  if (!stroke) notFound();

  const [items, videos, admin] = await Promise.all([
    getRecords(slug),
    getVideos(slug),
    isAdmin(),
  ]);

  return (
    <>
      <h1>
        {stroke.emoji} {stroke.name}
      </h1>

      {items.length > 0 && (
        <>
          <h2>Progress</h2>
          <div className="card">
            <ProgressChart records={items} />
          </div>
        </>
      )}

      <h2>Records</h2>
      <RecordsTable items={items} videos={videos} editable={admin} />

      {videos.length > 0 && (
        <>
          <h2>Videos</h2>
          <div className="grid">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
