export type Course = "SCM" | "LCM"; // short course / long course metres
export type Round = "Heat" | "Semi-final" | "Final" | "Time trial";
export type EventLevel =
  | "Club"
  | "Regional"
  | "State"
  | "National"
  | "International"
  | "Other";

export interface StrokeInfo {
  slug: string;
  name: string;
  emoji: string;
}

export interface EventInfo {
  id: number;
  name: string;
  date: string; // first day, "YYYY-MM-DD"
  endDate: string | null; // last day for multi-day meets
  venue: string | null;
  address: string | null;
  city: string | null;
  course: Course | null;
  level: EventLevel;
  website: string | null;
  notes: string | null;
  recordCount: number;
}

export interface SwimRecord {
  id: number;
  stroke: string; // strokes.slug
  distance: number; // metres
  course: Course;
  timeSeconds: number; // e.g. 31.45 or 68.2
  date: string; // "YYYY-MM-DD"
  eventId: number;
  meet: string; // event name
  location: string | null; // "venue, city"
  round: Round;
  place: number | null;
  isPb: boolean;
  notes: string | null;
  videoId: number | null; // videos.id, if a video is linked
}

export interface SwimVideo {
  id: number;
  title: string;
  youtubeId: string; // the part after v= in a YouTube URL
  stroke: string | null;
  date: string | null;
  eventId: number | null; // the event this video belongs to
}
