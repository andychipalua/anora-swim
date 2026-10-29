import type { EventInfo, StrokeInfo, SwimRecord, SwimVideo } from "@/data/types";

const BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const getStrokes = () => get<StrokeInfo[]>("/api/strokes");
export const getEvents = () => get<EventInfo[]>("/api/events");

export const getRecords = (stroke?: string) =>
  get<SwimRecord[]>(`/api/records${stroke ? `?stroke=${encodeURIComponent(stroke)}` : ""}`);

export const getVideos = (stroke?: string) =>
  get<SwimVideo[]>(`/api/videos${stroke ? `?stroke=${encodeURIComponent(stroke)}` : ""}`);

// ---- Writes (server-side only: the key never reaches the browser) ----

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> };

async function send<T>(
  method: "POST" | "PUT",
  path: string,
  body: unknown
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.API_WRITE_KEY ?? "",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: json as T };
    return {
      ok: false,
      error: json.error ?? `Request failed (${res.status})`,
      fields: json.fields,
    };
  } catch {
    return { ok: false, error: "Could not reach the API." };
  }
}

const post = <T>(path: string, body: unknown) => send<T>("POST", path, body);
const put = <T>(path: string, body: unknown) => send<T>("PUT", path, body);

export interface NewEventPayload {
  name: string;
  date: string;
  endDate?: string;
  venue?: string;
  address?: string;
  city?: string;
  course?: string;
  level?: string;
  website?: string;
  notes?: string;
}

export interface NewVideoPayload {
  youtubeId: string;
  title?: string;
  strokeSlug?: string;
}

export interface NewRecordPayload {
  strokeSlug: string;
  distance: number;
  course: string;
  timeSeconds: number;
  eventId: number;
  date?: string;
  round?: string;
  place?: number;
  isPb?: boolean;
  notes?: string;
  videos?: NewVideoPayload[];
}

export const createEvent = (p: NewEventPayload) => post<EventInfo>("/api/events", p);
export const createRecord = (p: NewRecordPayload) =>
  post<{ id: number; videoIds: number[] }>("/api/records", p);
export const createVideos = (p: { eventId: number; videos: NewVideoPayload[] }) =>
  post<{ videoIds: number[] }>("/api/videos", p);

// Updates replace all editable fields. Videos linked to a record are not touched.
export type UpdateRecordPayload = Omit<NewRecordPayload, "videos">;

export const updateEvent = (id: number, p: NewEventPayload) =>
  put<EventInfo>(`/api/events/${id}`, p);
export const updateRecord = (id: number, p: UpdateRecordPayload) =>
  put<{ id: number }>(`/api/records/${id}`, p);
