-- Migration 002: videos can belong to an event (so one event can have many videos).
-- Only needed if your database was created before this change. Run it ONCE.
-- (A fresh database created from db/schema.sql already has this.)
USE anora_swim;

ALTER TABLE videos
  ADD COLUMN event_id INT NULL,
  ADD CONSTRAINT fk_video_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Existing videos: attach them to the event of the record that uses them
UPDATE videos v
JOIN records r ON r.video_id = v.id
SET v.event_id = r.event_id
WHERE v.event_id IS NULL;
