"use client";

import type { Dispatch, SetStateAction } from "react";
import type { StrokeInfo } from "@/data/types";

export type VideoRow = { id: number; url: string; title: string; stroke: string };

let counter = 0;
export function newVideoRow(partial: Partial<Omit<VideoRow, "id">> = {}): VideoRow {
  counter += 1;
  return { id: counter, url: "", title: "", stroke: "", ...partial };
}

/**
 * Repeatable "YouTube link + title" rows. Rows submit as repeated
 * videoUrl / videoTitle (/ videoStroke) fields. Pass `strokes` to show a stroke picker per row.
 */
export default function VideoFields({
  rows,
  setRows,
  errors,
  strokes,
}: {
  rows: VideoRow[];
  setRows: Dispatch<SetStateAction<VideoRow[]>>;
  errors: Record<string, string>;
  strokes?: StrokeInfo[];
}) {
  const update = (id: number, patch: Partial<VideoRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const remove = (id: number) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : [newVideoRow()]));

  return (
    <div className="video-rows">
      {rows.map((r, i) => (
        <div key={r.id} className="video-row">
          <label className="field">
            <span className="field-label">YouTube link {rows.length > 1 ? i + 1 : ""}</span>
            <input
              name="videoUrl"
              value={r.url}
              onChange={(e) => update(r.id, { url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=…"
              autoComplete="off"
            />
            {errors[`videoUrl_${i}`] && (
              <span className="field-error">{errors[`videoUrl_${i}`]}</span>
            )}
          </label>
          <label className="field">
            <span className="field-label">Title</span>
            <input
              name="videoTitle"
              value={r.title}
              onChange={(e) => update(r.id, { title: e.target.value })}
              maxLength={200}
              placeholder="Optional"
            />
            {errors[`videoTitle_${i}`] && (
              <span className="field-error">{errors[`videoTitle_${i}`]}</span>
            )}
          </label>
          {strokes && (
            <label className="field">
              <span className="field-label">Stroke</span>
              <select
                name="videoStroke"
                value={r.stroke}
                onChange={(e) => update(r.id, { stroke: e.target.value })}
              >
                <option value="">Not specific</option>
                {strokes.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors[`videoStroke_${i}`] && (
                <span className="field-error">{errors[`videoStroke_${i}`]}</span>
              )}
            </label>
          )}
          <button
            type="button"
            className="button secondary small"
            onClick={() => remove(r.id)}
            aria-label={`Remove video ${i + 1}`}
          >
            Remove
          </button>
        </div>
      ))}
      {errors.videos && <p className="field-error">{errors.videos}</p>}
      <button
        type="button"
        className="button secondary small"
        onClick={() => setRows((rs) => [...rs, newVideoRow()])}
      >
        + Add another video
      </button>
    </div>
  );
}
