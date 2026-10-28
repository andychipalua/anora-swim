-- Anora Swim: MySQL schema (runs automatically the first time the Docker volume is created)
CREATE DATABASE IF NOT EXISTS anora_swim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE anora_swim;

CREATE TABLE IF NOT EXISTS strokes (
  slug  VARCHAR(30)  NOT NULL PRIMARY KEY,
  name  VARCHAR(60)  NOT NULL,
  emoji VARCHAR(8)   NOT NULL DEFAULT '',
  sort_order INT     NOT NULL DEFAULT 0
);

-- A swim meet / competition. Many records can belong to one event.
CREATE TABLE IF NOT EXISTS events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  event_date  DATE         NOT NULL,                 -- first day
  end_date    DATE         NULL,                     -- last day, for multi-day meets
  venue       VARCHAR(150) NULL,                     -- pool / aquatic centre name
  address     VARCHAR(255) NULL,
  city        VARCHAR(100) NULL,
  course      ENUM('SCM','LCM') NULL,                -- pool length used at the meet
  level       ENUM('Club','Regional','State','National','International','Other')
                           NOT NULL DEFAULT 'Club',
  website     VARCHAR(255) NULL,
  notes       TEXT         NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_date (event_date)
);

CREATE TABLE IF NOT EXISTS videos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  youtube_id  VARCHAR(20)  NOT NULL,
  stroke_slug VARCHAR(30)  NULL,
  video_date  DATE         NULL,
  event_id    INT          NULL,                     -- an event can have many videos
  CONSTRAINT fk_video_stroke FOREIGN KEY (stroke_slug) REFERENCES strokes(slug)
    ON DELETE SET NULL,
  CONSTRAINT fk_video_event FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS records (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  stroke_slug  VARCHAR(30)   NOT NULL,
  distance     INT           NOT NULL,                -- metres
  course       ENUM('SCM','LCM') NOT NULL,            -- short / long course
  time_seconds DECIMAL(7,2)  NOT NULL,                -- 68.20 = 1:08.20
  race_date    DATE          NOT NULL,
  event_id     INT           NOT NULL,
  round        ENUM('Heat','Semi-final','Final','Time trial') NOT NULL DEFAULT 'Heat',
  place        TINYINT UNSIGNED NULL,                 -- finishing position
  is_pb        BOOLEAN       NOT NULL DEFAULT 0,      -- personal best at the time
  notes        TEXT          NULL,
  video_id     INT           NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_record_stroke FOREIGN KEY (stroke_slug) REFERENCES strokes(slug),
  CONSTRAINT fk_record_event  FOREIGN KEY (event_id)    REFERENCES events(id),
  CONSTRAINT fk_record_video  FOREIGN KEY (video_id)    REFERENCES videos(id) ON DELETE SET NULL,
  INDEX idx_stroke_distance (stroke_slug, distance)
);
