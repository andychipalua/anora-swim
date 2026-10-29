"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateRecordAction, type FormState } from "@/app/admin/actions";
import { formatDate, formatTime } from "@/lib/helpers";
import type { EventInfo, StrokeInfo, SwimRecord } from "@/data/types";

const DISTANCES = [25, 50, 100, 200, 400, 800, 1500];
const ROUNDS = ["Heat", "Semi-final", "Final", "Time trial"];

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

export default function EditRecordForm({
  record,
  strokes,
  events,
}: {
  record: SwimRecord;
  strokes: StrokeInfo[];
  events: EventInfo[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateRecordAction.bind(null, record.id),
    {}
  );
  const fe = state.fieldErrors ?? {};

  // What the user last submitted wins over the saved values (so errors don't lose their edits)
  const v: Record<string, string> = {
    eventId: String(record.eventId),
    stroke: record.stroke,
    distance: String(record.distance),
    course: record.course,
    time: formatTime(record.timeSeconds),
    round: record.round,
    place: record.place != null ? String(record.place) : "",
    date: record.date,
    isPb: record.isPb ? "on" : "",
    notes: record.notes ?? "",
    ...state.values,
  };

  // Keep an unusual saved distance selectable
  const distances = DISTANCES.includes(record.distance)
    ? DISTANCES
    : [...DISTANCES, record.distance].sort((a, b) => a - b);

  return (
    <form action={formAction} className="form" key={JSON.stringify(state.values ?? {})}>
      {state.error && <p className="form-error">{state.error}</p>}

      <fieldset className="card">
        <legend>Event</legend>
        <Field label="Event *" error={fe.eventId}>
          <select name="eventId" defaultValue={v.eventId} required>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {formatDate(e.date)}
                {e.city ? ` · ${e.city}` : ""}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="card">
        <legend>Swim</legend>
        <div className="form-grid">
          <Field label="Stroke *" error={fe.stroke}>
            <select name="stroke" defaultValue={v.stroke} required>
              {strokes.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Distance *" error={fe.distance}>
            <select name="distance" defaultValue={v.distance} required>
              {distances.map((d) => (
                <option key={d} value={d}>
                  {d}m
                </option>
              ))}
            </select>
          </Field>
          <Field label="Course *" error={fe.course}>
            <select name="course" defaultValue={v.course} required>
              <option value="SCM">Short course (25m)</option>
              <option value="LCM">Long course (50m)</option>
            </select>
          </Field>
          <Field label="Time *" error={fe.time} hint="e.g. 31.45 or 1:08.20">
            <input
              name="time"
              defaultValue={v.time}
              inputMode="decimal"
              autoComplete="off"
              required
            />
          </Field>
          <Field label="Round" error={fe.round}>
            <select name="round" defaultValue={v.round}>
              {ROUNDS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Finishing place" error={fe.place} hint="Leave blank for none">
            <input
              type="number"
              name="place"
              defaultValue={v.place}
              min={1}
              max={999}
              inputMode="numeric"
            />
          </Field>
          <Field label="Swim date" error={fe.date}>
            <input type="date" name="date" defaultValue={v.date} />
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

      <p className="muted small-text">
        Videos aren&apos;t changed here. Add more from{" "}
        <Link href="/admin/event-videos">Add videos to an event</Link>.
      </p>

      <div className="head-actions">
        <button type="submit" className="button" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link href={`/strokes/${record.stroke}`} className="button secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
