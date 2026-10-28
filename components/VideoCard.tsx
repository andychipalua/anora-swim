import type { SwimVideo } from "@/data/types";

export default function VideoCard({ video }: { video: SwimVideo }) {
  return (
    <div className="card video-card">
      <div className="video-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
          title={video.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <h3>{video.title}</h3>
      <a
        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open on YouTube ↗
      </a>
    </div>
  );
}
