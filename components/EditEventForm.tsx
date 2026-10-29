"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateEventAction, type FormState } from "@/app/admin/actions";
import type { EventInfo } from "@/data/types";

const LEVELS = ["Club", "Regional", "State", "National", "International", "Other"];

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

export default function EditEventForm({ event }: { event: EventInfo }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateEventAction.bind(null, event.id),
    {}
  );
  const fe = state.fieldErrors ?? {};

  // What the user last submitted wins over the saved values (so errors don't lose their edits)
  const v: Record<string, string> = {
    event_name: event.name,
    event_date: event.date,
    event_endDate: event.endDate ?? "",
    event_venue: event.venue ?? "",
    event_address: event.address ?? "",
    event_city: event.city ?? "",
    event_course: event.course ?? "",
    event_level: event.level,
    event_website: event.website ?? "",
    event_notes: event.notes ?? "",
    ...state.values,
  };

  return (
    <form action={formAction} className="form" key={JSON.stringify(state.values ?? {})}>
      {state.error && <p className="form-error">{state.error}</p>}

      <fieldset className="card">
        <legend>Event</legend>
        <div className="form-grid">
          <Field label="Event name *" error={fe.event_name}>
            <input name="event_name" defaultValue={v.event_name} maxLength={200} required />
          </Field>
          <Field label="Start date *" error={fe.event_date}>
            <input type="date" name="event_date" defaultValue={v.event_date} required />
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
            <select name="event_course" defaultValue={v.event_course}>
              <option value="">Not sure</option>
              <option value="SCM">Short course (25m)</option>
              <option value="LCM">Long course (50m)</option>
            </select>
          </Field>
          <Field label="Level" error={fe.event_level}>
            <select name="event_level" defaultValue={v.event_level}>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Meet website" error={fe.event_website} hint="Full link, https://…">
            <input type="url" name="event_website" defaultValue={v.event_website} maxLength={255} />
          </Field>
          <Field label="Event notes" error={fe.event_notes}>
            <textarea name="event_notes" defaultValue={v.event_notes} rows={2} maxLength={2000} />
          </Field>
        </div>
      </fieldset>

      <div className="head-actions">
        <button type="submit" className="button" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link href="/events" className="button secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
