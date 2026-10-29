"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createEvent,
  createRecord,
  createVideos,
  updateEvent,
  updateRecord,
  type UpdateRecordPayload,
  type NewEventPayload,
  type NewRecordPayload,
  type NewVideoPayload,
} from "@/lib/api";
import { endSession, isAdmin, passwordMatches, startSession } from "@/lib/auth";

// ---------- Login / logout ----------

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return { error: "Incorrect password." };
  }
  await startSession();
  redirect("/admin/new-record");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

// ---------- Shared helpers ----------

export type VideoRowValue = { url: string; title: string; stroke: string };

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  videos?: VideoRowValue[]; // the video rows the user typed, so they survive an error
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const opt = (v: string) => (v === "" ? undefined : v);

/** "31.45" -> 31.45, "1:08.20" -> 68.2. Returns null if it isn't a valid swim time. */
function parseTime(input: string): number | null {
  const m = input.trim().match(/^(?:(\d{1,2}):)?(\d{1,2})(?:[.,](\d{1,2}))?$/);
  if (!m) return null;
  const minutes = m[1] ? Number(m[1]) : 0;
  const secs = Number(m[2]);
  if (m[1] && secs > 59) return null;
  const hundredths = m[3] ? Number(m[3].padEnd(2, "0")) : 0;
  const total = minutes * 60 + secs + hundredths / 100;
  return total > 0 ? Math.round(total * 100) / 100 : null;
}

/** Accepts a full YouTube link (watch, youtu.be, shorts, embed, live) or a bare 11-char id. */
function parseYoutubeId(input: string): string | null {
  const ID = /^[A-Za-z0-9_-]{11}$/;
  if (ID.test(input)) return input;
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") {
      id = url.pathname.slice(1).split("/")[0];
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = url.searchParams.get("v");
      if (!id) {
        const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/);
        id = m ? m[1] : null;
      }
    }
    return id && ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * Reads the repeated video rows (videoUrl / videoTitle / videoStroke) from the form.
 * Blank rows are skipped. `indexMap[n]` is the form row that API video n came from,
 * so API errors can be shown on the right row.
 */
function readVideos(
  fd: FormData,
  fieldErrors: Record<string, string>
): { rows: VideoRowValue[]; payload: NewVideoPayload[]; indexMap: number[] } {
  const urls = fd.getAll("videoUrl").map((v) => String(v).trim());
  const titles = fd.getAll("videoTitle").map((v) => String(v).trim());
  const strokes = fd.getAll("videoStroke").map((v) => String(v).trim());

  const rows: VideoRowValue[] = urls.map((url, i) => ({
    url,
    title: titles[i] ?? "",
    stroke: strokes[i] ?? "",
  }));

  const payload: NewVideoPayload[] = [];
  const indexMap: number[] = [];
  rows.forEach((r, i) => {
    if (!r.url) return;
    const id = parseYoutubeId(r.url);
    if (!id) {
      fieldErrors[`videoUrl_${i}`] = "That doesn't look like a YouTube video link";
      return;
    }
    payload.push({ youtubeId: id, title: opt(r.title), strokeSlug: opt(r.stroke) });
    indexMap.push(i);
  });
  return { rows, payload, indexMap };
}

const VIDEO_FIELD_KEYS: Record<string, string> = {
  youtubeId: "videoUrl",
  title: "videoTitle",
  strokeSlug: "videoStroke",
};

/** Turns API errors like "videos.2.youtubeId" into form keys like "videoUrl_5". */
function mapApiFields(
  fields: Record<string, string> | undefined,
  indexMap: number[],
  rename: (k: string) => string
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, msg] of Object.entries(fields ?? {})) {
    const m = k.match(/^videos\.(\d+)(?:\.(\w+))?$/);
    if (m) {
      const row = indexMap[Number(m[1])] ?? Number(m[1]);
      out[`${VIDEO_FIELD_KEYS[m[2] ?? "youtubeId"] ?? "videoUrl"}_${row}`] = msg;
    } else {
      out[rename(k)] = msg;
    }
  }
  return out;
}

// ---------- New record ----------

// API field name -> form field name
const RECORD_FIELD_MAP: Record<string, string> = {
  strokeSlug: "stroke",
  timeSeconds: "time",
};

export async function saveRecordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) redirect("/admin/login");

  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("video")) values[k] = v;
  }

  const fieldErrors: Record<string, string> = {};
  const eventMode = values.eventMode === "new" ? "new" : "existing";

  // ---- swim fields ----
  const strokeSlug = text(formData, "stroke");
  const distance = Number(text(formData, "distance"));
  const course = text(formData, "course");
  if (!strokeSlug) fieldErrors.stroke = "Choose a stroke";
  if (!Number.isInteger(distance) || distance <= 0) fieldErrors.distance = "Choose a distance";
  if (!course) fieldErrors.course = "Choose a course";

  const timeSeconds = parseTime(text(formData, "time"));
  if (timeSeconds === null) fieldErrors.time = "Enter a time like 31.45 or 1:08.20";

  const placeText = text(formData, "place");
  const place = placeText ? Number(placeText) : undefined;
  if (place !== undefined && (!Number.isInteger(place) || place < 1 || place > 999)) {
    fieldErrors.place = "Enter a whole number, e.g. 1";
  }

  // ---- videos (any number) ----
  const { rows: videoRows, payload: videos, indexMap } = readVideos(formData, fieldErrors);

  // ---- event ----
  let eventId = Number(text(formData, "eventId"));
  if (eventMode === "existing") {
    if (!Number.isInteger(eventId) || eventId <= 0) fieldErrors.eventId = "Choose an event";
  } else {
    if (!text(formData, "event_name")) fieldErrors.event_name = "Required";
    if (!text(formData, "event_date")) fieldErrors.event_date = "Required";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors,
      values,
      videos: videoRows,
    };
  }

  // Create the event first if needed
  if (eventMode === "new") {
    const payload: NewEventPayload = {
      name: text(formData, "event_name"),
      date: text(formData, "event_date"),
      endDate: opt(text(formData, "event_endDate")),
      venue: opt(text(formData, "event_venue")),
      address: opt(text(formData, "event_address")),
      city: opt(text(formData, "event_city")),
      course: opt(text(formData, "event_course")),
      level: opt(text(formData, "event_level")),
      website: opt(text(formData, "event_website")),
      notes: opt(text(formData, "event_notes")),
    };
    const ev = await createEvent(payload);
    if (!ev.ok) {
      return {
        error: ev.error === "Validation failed" ? "Please fix the highlighted fields." : ev.error,
        fieldErrors: mapApiFields(ev.fields, indexMap, (k) => `event_${k}`),
        values,
        videos: videoRows,
      };
    }
    eventId = ev.data.id;
  }

  const recordPayload: NewRecordPayload = {
    strokeSlug,
    distance,
    course,
    timeSeconds: timeSeconds as number,
    eventId,
    date: opt(text(formData, "date")),
    round: opt(text(formData, "round")),
    place,
    isPb: values.isPb === "on",
    notes: opt(text(formData, "notes")),
    videos: videos.length > 0 ? videos : undefined,
  };

  const rec = await createRecord(recordPayload);
  if (!rec.ok) {
    const result: FormState = {
      error: rec.error === "Validation failed" ? "Please fix the highlighted fields." : rec.error,
      fieldErrors: mapApiFields(rec.fields, indexMap, (k) => RECORD_FIELD_MAP[k] ?? k),
      values,
      videos: videoRows,
    };
    if (eventMode === "new") {
      // The event was saved; switch the form to use it so a retry doesn't duplicate it
      result.values = { ...values, eventMode: "existing", eventId: String(eventId) };
      result.error = `The event was saved, but the swim wasn't: ${result.error}`;
      revalidatePath("/admin/new-record");
    }
    return result;
  }

  redirect(`/strokes/${encodeURIComponent(strokeSlug)}`);
}

// ---------- Edit an event ----------

export async function updateEventAction(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await isAdmin())) redirect("/admin/login");

  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") values[k] = v;

  const fieldErrors: Record<string, string> = {};
  if (!text(formData, "event_name")) fieldErrors.event_name = "Required";
  if (!text(formData, "event_date")) fieldErrors.event_date = "Required";
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors, values };
  }

  const payload: NewEventPayload = {
    name: text(formData, "event_name"),
    date: text(formData, "event_date"),
    endDate: opt(text(formData, "event_endDate")),
    venue: opt(text(formData, "event_venue")),
    address: opt(text(formData, "event_address")),
    city: opt(text(formData, "event_city")),
    course: opt(text(formData, "event_course")),
    level: opt(text(formData, "event_level")),
    website: opt(text(formData, "event_website")),
    notes: opt(text(formData, "event_notes")),
  };

  const res = await updateEvent(id, payload);
  if (!res.ok) {
    return {
      error: res.error === "Validation failed" ? "Please fix the highlighted fields." : res.error,
      fieldErrors: mapApiFields(res.fields, [], (k) => `event_${k}`),
      values,
    };
  }

  redirect("/events");
}

// ---------- Edit a record ----------

export async function updateRecordAction(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  if (!(await isAdmin())) redirect("/admin/login");

  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") values[k] = v;

  const fieldErrors: Record<string, string> = {};

  const strokeSlug = text(formData, "stroke");
  const distance = Number(text(formData, "distance"));
  const course = text(formData, "course");
  const eventId = Number(text(formData, "eventId"));
  if (!strokeSlug) fieldErrors.stroke = "Choose a stroke";
  if (!Number.isInteger(distance) || distance <= 0) fieldErrors.distance = "Choose a distance";
  if (!course) fieldErrors.course = "Choose a course";
  if (!Number.isInteger(eventId) || eventId <= 0) fieldErrors.eventId = "Choose an event";

  const timeSeconds = parseTime(text(formData, "time"));
  if (timeSeconds === null) fieldErrors.time = "Enter a time like 31.45 or 1:08.20";

  const placeText = text(formData, "place");
  const place = placeText ? Number(placeText) : undefined;
  if (place !== undefined && (!Number.isInteger(place) || place < 1 || place > 999)) {
    fieldErrors.place = "Enter a whole number, e.g. 1";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors, values };
  }

  const payload: UpdateRecordPayload = {
    strokeSlug,
    distance,
    course,
    timeSeconds: timeSeconds as number,
    eventId,
    date: opt(text(formData, "date")),
    round: opt(text(formData, "round")),
    place,
    isPb: values.isPb === "on",
    notes: opt(text(formData, "notes")),
  };

  const res = await updateRecord(id, payload);
  if (!res.ok) {
    return {
      error: res.error === "Validation failed" ? "Please fix the highlighted fields." : res.error,
      fieldErrors: mapApiFields(res.fields, [], (k) => RECORD_FIELD_MAP[k] ?? k),
      values,
    };
  }

  redirect(`/strokes/${encodeURIComponent(strokeSlug)}`);
}

// ---------- Add videos to an event ----------

export async function addVideosAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) redirect("/admin/login");

  const values: Record<string, string> = { eventId: text(formData, "eventId") };
  const fieldErrors: Record<string, string> = {};

  const eventId = Number(values.eventId);
  if (!Number.isInteger(eventId) || eventId <= 0) fieldErrors.eventId = "Choose an event";

  const { rows, payload, indexMap } = readVideos(formData, fieldErrors);
  if (payload.length === 0 && Object.keys(fieldErrors).length === 0) {
    fieldErrors.videos = "Add at least one YouTube link";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors, values, videos: rows };
  }

  const res = await createVideos({ eventId, videos: payload });
  if (!res.ok) {
    return {
      error: res.error === "Validation failed" ? "Please fix the highlighted fields." : res.error,
      fieldErrors: mapApiFields(res.fields, indexMap, (k) => k),
      values,
      videos: rows,
    };
  }

  redirect("/events");
}
