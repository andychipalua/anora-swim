"use client";

import { useActionState, useEffect, useState } from "react";
import { saveRecordAction, type FormState } from "@/app/admin/actions";
import VideoFields, { newVideoRow, type VideoRow } from "@/components/VideoFields";
import { formatDate } from "@/lib/helpers";
import type { EventInfo, StrokeInfo } from "@/data/types";

const DISTANCES = [25, 50, 100, 200, 400, 800, 1500];
const ROUNDS = ["Heat", "Semi-final", "Final", "Time trial"];
const LEVELS = ["Club", "Regional", "State", "National", "International", "Other"];

type Mode = "existing" | "new";

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export default function NewRecordForm({
  strokes,
  events,
}: {
  strokes: StrokeInfo[];
  events: EventInfo[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveRecordAction, {});
  const v = state.values ?? {};
  const fe = state.fieldErrors ?? {};

  // The user's radio choice wins until the server sends back a new result
  const [override, setOverride] = useState<Mode | null>(null);
  const defaultMode: Mode = events.length > 0 ? "existing" : "new";
  const mode: Mode = override ?? (v.eventMode as Mode | undefined) ?? defaultMode;

  // Controlled fields, so the swim date can follow the event's start date
  const [selectedEventId, setSelectedEventId] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [swimDate, setSwimDate] = useState("");
  const [dateEdited, setDateEdited] = useState(false);
  const [videoRows, setVideoRows] = useState<VideoRow[]>(() => [newVideoRow()]);

  const eventStart = (id: string) => events.find((e) => String(e.id) === id)?.date ?? "";

  // Restore what the user typed when the server sends back an error
  useEffect(() => {
    setOverride(null);
    if (state.values) {
      setSelectedEventId(state.values.eventId ?? "");
      setNewEventDate(state.values.event_date ?? "");
      setSwimDate(state.values.date ?? "");
      setDateEdited(true);
    }
    if (state.videos && state.videos.length > 0) {
      setVideoRows(state.videos.map((r) => newVideoRow(r)));
    }
  }, [state]);

  function changeMode(next: Mode) {
    setOverride(next);
    setDateEdited(false);
    setSwimDate(next === "existing" ? eventStart(selectedEventId) : newEventDate);
  }

  function changeEvent(id: string) {
    setSelectedEventId(id);
    setDateEdited(false);
    setSwimDate(eventStart(id)); // copy the event's start date into the swim date
  }

  function changeNewEventDate(value: string) {
    setNewEventDate(value);
    if (!dateEdited) setSwimDate(value); // follow the start date until the swim date is edited
  }

  return (
    <form action={formAction} className="form" key={JSON.stringify(state.values ?? {})}>
      {state.error && <p className="form-error">{state.error}</p>}

      {/* ---------------- Event ---------------- */}
      <fieldset className="card">
        <legend>Event</legend>

        <div className="radio-row">
          <label>
            <input
              type="radio"
              name="eventMode"
              value="existing"
              checked={mode === "existing"}
              onChange={() => changeMode("existing")}
              disabled={events.length === 0}
            />{" "}
            Existing event
          </label>
          <label>
            <input
              type="radio"
              name="eventMode"
              value="new"
              checked={mode === "new"}
              onChange={() => changeMode("new")}
            />{" "}
            New event
          </label>
        </div>

        {mode === "existing" ? (
          <Field label="Event *" error={fe.eventId}>
            <select
              name="eventId"
              value={selectedEventId}
              onChange={(e) => changeEvent(e.target.value)}
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
          </Field>
        ) : (
          <div className="form-grid">
            <Field label="Event name *" error={fe.event_name}>
              <input name="event_name" defaultValue={v.event_name} maxLength={200} required />
            </Field>
            <Field label="Start date *" error={fe.event_date}>
              <input
                type="date"
                name="event_date"
                value={newEventDate}
                onChange={(e) => changeNewEventDate(e.target.value)}
                required
              />
            </Field>
            <Field label="End date" error={fe.event_endDate} hint="Only for multi-day meets">
              <input type="date" name="event_endDate" defaultValue={v.event_endDate} />
            </Field>
            <Field label="Venue / pool name" error={fe.event_venue}>
              <input name="event_venue" defaultValue={v.event_venue} maxLength={150} />
            </Field>
            <Field label="Address" error={fe.event_address}>
              <input name="event_address" defaultValue={v.event_address} maxLength={255} />
            </Field>
            <Field label="City" error={fe.event_city}>
              <input name="event_city" defaultValue={v.event_city} maxLength={100} />
            </Field>
            <Field label="Pool length" error={fe.event_course}>
              <select name="event_course" defaultValue={v.event_course ?? ""}>
                <option value="">Not sure</option>
                <option value="SCM">Short course (25m)</option>
                <option value="LCM">Long course (50m)</option>
              </select>
            </Field>
            <Field label="Level" error={fe.event_level}>
              <select name="event_level" defaultValue={v.event_level ?? "Club"}>
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Meet website" error={fe.event_website} hint="Full link, https://…">
              <input
                type="url"
                name="event_website"
                defaultValue={v.event_website}
                maxLength={255}
              />
            </Field>
            <Field label="Event notes" error={fe.event_notes}>
              <textarea name="event_notes" defaultValue={v.event_notes} rows={2} maxLength={2000} />
            </Field>
          </div>
        )}
      </fieldset>

      {/* ---------------- Swim ---------------- */}
      <fieldset className="card">
        <legend>Swim</legend>
        <div className="form-grid">
          <Field label="Stroke *" error={fe.stroke}>
            <select name="stroke" defaultValue={v.stroke ?? ""} required>
              <option value="" disabled>
                Choose…
              </option>
              {strokes.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Distance *" error={fe.distance}>
            <select name="distance" defaultValue={v.distance ?? "50"} required>
              {DISTANCES.map((d) => (
                <option key={d} value={d}>
                  {d}m
                </option>
              ))}
            </select>
          </Field>
          <Field label="Course *" error={fe.course}>
            <select name="course" defaultValue={v.course ?? "SCM"} required>
              <option value="SCM">Short course (25m)</option>
              <option value="LCM">Long course (50m)</option>
            </select>
          </Field>
          <Field label="Time *" error={fe.time} hint="e.g. 31.45 or 1:08.20">
            <input
              name="time"
              defaultValue={v.time}
              inputMode="decimal"
              placeholder="1:08.20"
              autoComplete="off"
              required
            />
          </Field>
          <Field label="Round" error={fe.round}>
            <select name="round" defaultValue={v.round ?? "Heat"}>
              {ROUNDS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Finishing place" error={fe.place} hint="Optional">
            <input
              type="number"
              name="place"
              defaultValue={v.place}
              min={1}
              max={999}
              inputMode="numeric"
            />
          </Field>
          <Field
            label="Swim date"
            error={fe.date}
            hint="Filled in from the event's start date; change it for a later day of the meet"
          >
            <input
              type="date"
              name="date"
              value={swimDate}
              onChange={(e) => {
                setSwimDate(e.target.value);
                setDateEdited(true);
              }}
            />
          </Field>
          <label className="field check">
            <input type="checkbox" name="isPb" defaultChecked={v.isPb === "on"} />
            <span>Personal best</span>
          </label>
        </div>
        <Field label="Notes" error={fe.notes}>
          <textarea name="notes" defaultValue={v.notes} rows={2} maxLength={2000} />
        </Field>
      </fieldset>

      {/* ---------------- Videos ---------------- */}
      <fieldset className="card">
        <legend>Videos (optional)</legend>
        <p className="muted small-text">
          Add as many as you like. They&apos;re saved with the event, and the first one is linked to
          this swim.
        </p>
        <VideoFields rows={videoRows} setRows={setVideoRows} errors={fe} />
      </fieldset>

      <button type="submit" className="button" disabled={pending}>
        {pending ? "Saving…" : "Save record"}
      </button>
    </form>
  );
}
