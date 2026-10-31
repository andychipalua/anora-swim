-- Migration 002: videos can belong to an event (so one event can have many videos).
-- Only needed if your database was created before this change. Run it ONCE.
-- (A fresh database created from db/schema.sql already has this.)
USE anora_swim;

ALTER TABLE videos
  ADD COLUMN event_id INT NULL,
  ADD CONSTRAINT fk_video_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
