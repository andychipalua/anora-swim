export const swimmer = {
  name: process.env.NEXT_PUBLIC_SWIMMER_NAME ?? "Anora",
  club: process.env.NEXT_PUBLIC_CLUB_NAME ?? "Your Club Name",
  tagline: "Personal bests, records and race videos",
};

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const secStr = seconds.toFixed(2).padStart(minutes > 0 ? 5 : 1, "0");
  return minutes > 0 ? `${minutes}:${secStr}` : secStr;
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
