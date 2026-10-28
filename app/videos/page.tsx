import VideoCard from "@/components/VideoCard";
import { getVideos } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Videos" };

export default async function VideosPage() {
  const videos = await getVideos();
  return (
    <>
      <h1>Videos</h1>
      {videos.length === 0 ? (
        <p className="muted">No videos added yet.</p>
      ) : (
        <div className="grid">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </>
  );
}
