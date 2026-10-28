-- Migration 001: add events + extra record fields to an EXISTING database.
-- Only needed if you already started the old version. Run it ONCE.
-- (A fresh database created from db/schema.sql already has all of this.)
USE anora_swim;

CREATE TABLE IF NOT EXISTS events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  event_date  DATE         NOT NULL,
  end_date    DATE         NULL,
  venue       VARCHAR(150) NULL,
  address     VARCHAR(255) NULL,
  city        VARCHAR(100) NULL,
  course      ENUM('SCM','LCM') NULL,
  level       ENUM('Club','Regional','State','National','International','Other')
                           NOT NULL DEFAULT 'Club',
  website     VARCHAR(255) NULL,
  notes       TEXT         NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_date (event_date)
);

ALTER TABLE records
  ADD COLUMN event_id   INT NULL,
  ADD COLUMN round      ENUM('Heat','Semi-final','Final','Time trial') NOT NULL DEFAULT 'Heat',
  ADD COLUMN place      TINYINT UNSIGNED NULL,
  ADD COLUMN is_pb      BOOLEAN NOT NULL DEFAULT 0,
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- One event per distinct meet name already stored on records
INSERT INTO events (name, event_date, end_date, venue)
SELECT meet, MIN(race_date), NULLIF(MAX(race_date), MIN(race_date)), MAX(location)
FROM records
GROUP BY meet;

UPDATE records r JOIN events e ON e.name = r.meet SET r.event_id = e.id;

ALTER TABLE records
  MODIFY event_id INT NOT NULL,
  ADD CONSTRAINT fk_record_event FOREIGN KEY (event_id) REFERENCES events(id),
  DROP COLUMN meet,
  DROP COLUMN location;
