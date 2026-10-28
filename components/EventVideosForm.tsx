"use client";

import { useActionState, useEffect, useState } from "react";
import { addVideosAction, type FormState } from "@/app/admin/actions";
import VideoFields, { newVideoRow, type VideoRow } from "@/components/VideoFields";
import { formatDate } from "@/lib/helpers";
import type { EventInfo, StrokeInfo } from "@/data/types";

export default function EventVideosForm({
  strokes,
  events,
}: {
  strokes: StrokeInfo[];
  events: EventInfo[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(addVideosAction, {});
  const fe = state.fieldErrors ?? {};

  const [eventId, setEventId] = useState("");
  const [rows, setRows] = useState<VideoRow[]>(() => [newVideoRow()]);

  useEffect(() => {
    if (state.values) setEventId(state.values.eventId ?? "");
    if (state.videos && state.videos.length > 0) {
      setRows(state.videos.map((r) => newVideoRow(r)));
    }
  }, [state]);

  return (
    <form action={formAction} className="form">
      {state.error && <p className="form-error">{state.error}</p>}

      <fieldset className="card">
        <legend>Event</legend>
        <label className="field">
          <span className="field-label">Event *</span>
          <select
            name="eventId"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            required
          >
            <option value="" disabled>
              Choose an event…
            </option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {formatDate(e.date)}
                {e.city ? ` · ${e.city}` : ""}
              </option>
            ))}
          </select>
          {fe.eventId && <span className="field-error">{fe.eventId}</span>}
        </label>
      </fieldset>

      <fieldset className="card">
        <legend>Videos</legend>
        <VideoFields rows={rows} setRows={setRows} errors={fe} strokes={strokes} />
      </fieldset>

      <button type="submit" className="button" disabled={pending}>
        {pending ? "Saving…" : "Save videos"}
      </button>
    </form>
  );
}
