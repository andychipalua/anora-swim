"use client";

import { useMemo, useState } from "react";
import { formatDate, formatTime } from "@/lib/helpers";
import type { SwimRecord } from "@/data/types";

// Distinct in light and dark mode
const COLORS = ["#0a84c6", "#e8590c", "#2f9e44", "#9c36b5", "#d6336c", "#f59f00", "#6c757d"];

const W = 800;
const H = 380;
const M = { top: 16, right: 24, bottom: 52, left: 68 };
const DAY = 86_400_000;

type Point = { x: number; y: number; rec: SwimRecord };
type Series = { key: string; label: string; color: string; points: Point[] };

const toX = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const monthYear = (ms: number) =>
  new Date(ms).toLocaleDateString("en-AU", { month: "short", year: "numeric", timeZone: "UTC" });

/**
 * One line per distance (date on the x axis, time on the y axis).
 * If a distance has been swum in both short and long course, those become two separate lines,
 * because the times aren't comparable.
 */
export default function ProgressChart({ records }: { records: SwimRecord[] }) {
  const series = useMemo<Series[]>(() => {
    const coursesByDistance = new Map<number, Set<string>>();
    for (const r of records) {
      const set = coursesByDistance.get(r.distance) ?? new Set<string>();
      set.add(r.course);
      coursesByDistance.set(r.distance, set);
    }

    const groups = new Map<string, SwimRecord[]>();
    for (const r of records) {
      const split = (coursesByDistance.get(r.distance)?.size ?? 1) > 1;
      const key = split ? `${r.distance}-${r.course}` : String(r.distance);
      const list = groups.get(key);
      if (list) list.push(r);
      else groups.set(key, [r]);
    }

    return [...groups.entries()]
      .map(([key, recs]) => ({
        key,
        distance: recs[0].distance,
        course: recs[0].course,
        split: key.includes("-"),
        recs,
      }))
      .sort((a, b) => a.distance - b.distance || a.course.localeCompare(b.course))
      .map((g, i) => ({
        key: g.key,
        label: `${g.distance}m${g.split ? ` ${g.course}` : ""}`,
        color: COLORS[i % COLORS.length],
        points: [...g.recs]
          .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
          .map((r) => ({ x: toX(r.date), y: r.timeSeconds, rec: r })),
      }));
  }, [records]);

  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const visible = series.filter((s) => !hidden.has(s.key));
  const pts = visible.flatMap((s) => s.points);

  // Axis ranges, fitted to the lines currently shown
  let xMin = 0;
  let xMax = 1;
  let yMin = 0;
  let yMax = 1;
  if (pts.length > 0) {
    xMin = Math.min(...pts.map((p) => p.x));
    xMax = Math.max(...pts.map((p) => p.x));
    if (xMin === xMax) {
      xMin -= 15 * DAY;
      xMax += 15 * DAY;
    } else {
      const pad = (xMax - xMin) * 0.04;
      xMin -= pad;
      xMax += pad;
    }
    yMin = Math.min(...pts.map((p) => p.y));
    yMax = Math.max(...pts.map((p) => p.y));
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    } else {
      const pad = (yMax - yMin) * 0.12;
      yMin = Math.max(0, yMin - pad);
      yMax += pad;
    }
  }

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const px = (x: number) => M.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const py = (y: number) => M.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const ticks = [0, 1, 2, 3, 4];

  return (
    <div className="chart">
      <div className="chart-legend" role="group" aria-label="Distances shown">
        {series.map((s) => {
          const on = !hidden.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              className={`legend-item${on ? "" : " off"}`}
              aria-pressed={on}
              onClick={() => toggle(s.key)}
            >
              <span className="swatch" style={{ background: s.color }} />
              {s.label}
            </button>
          );
        })}
      </div>

      {pts.length === 0 ? (
        <p className="muted">Select at least one distance to see its progress.</p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Line chart of swim times over time, one line per distance"
          className="chart-svg"
        >
          {/* grid + y axis labels */}
          {ticks.map((i) => {
            const val = yMin + ((yMax - yMin) * i) / 4;
            const y = py(val);
            return (
              <g key={`y${i}`}>
                <line x1={M.left} x2={W - M.right} y1={y} y2={y} className="grid-line" />
                <text x={M.left - 8} y={y + 4} textAnchor="end">
                  {formatTime(val)}
                </text>
              </g>
            );
          })}

          {/* x axis labels */}
          {ticks.map((i) => {
            const val = xMin + ((xMax - xMin) * i) / 4;
            return (
              <text
                key={`x${i}`}
                x={px(val)}
                y={H - M.bottom + 20}
                textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}
              >
                {monthYear(val)}
              </text>
            );
          })}

          <line
            x1={M.left}
            x2={W - M.right}
            y1={H - M.bottom}
            y2={H - M.bottom}
            className="axis-line"
          />
          <line x1={M.left} x2={M.left} y1={M.top} y2={H - M.bottom} className="axis-line" />

          <text
            x={M.left + plotW / 2}
            y={H - 8}
            textAnchor="middle"
            className="axis-title"
          >
            Date
          </text>
          <text
            transform={`translate(14 ${M.top + plotH / 2}) rotate(-90)`}
            textAnchor="middle"
            className="axis-title"
          >
            Time (lower is faster)
          </text>

          {/* lines, then dots on top */}
          {visible.map(
            (s) =>
              s.points.length > 1 && (
                <polyline
                  key={`l${s.key}`}
                  points={s.points.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )
          )}
          {visible.map((s) =>
            s.points.map((p) => (
              <circle
                key={`${s.key}-${p.rec.id}`}
                cx={px(p.x)}
                cy={py(p.y)}
                r={4.5}
                fill={s.color}
                className="dot"
              >
                <title>
                  {`${s.label} · ${formatTime(p.y)} · ${formatDate(p.rec.date)} · ${p.rec.meet}`}
                </title>
              </circle>
            ))
          )}
        </svg>
      )}

      <p className="muted small-text">
        Hover a dot for details. Click a distance above to show or hide its line; the time scale
        adjusts to the lines shown.
      </p>
    </div>
  );
}
