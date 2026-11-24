SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS items (
  id          VARCHAR(64)  NOT NULL PRIMARY KEY,
  kind        ENUM('pc','part') NOT NULL,
  cat         VARCHAR(32)  NOT NULL,
  name        VARCHAR(160) NOT NULL,
  year_made   SMALLINT     NULL,
  spec        VARCHAR(255) NOT NULL DEFAULT '',
  grade       CHAR(1)      NOT NULL DEFAULT 'B',
  price       INT UNSIGNED NOT NULL DEFAULT 0,
  stock       INT UNSIGNED NOT NULL DEFAULT 0,
  icon        VARCHAR(32)  NOT NULL DEFAULT 'laptop',
  images      TEXT         NULL COMMENT 'JSON tömb: ["assets/img/x.jpg", ...]',
  active      TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_list (kind, active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tickets (
  code        VARCHAR(16)  NOT NULL PRIMARY KEY COMMENT 'pl. RB-2041',
  device      VARCHAR(160) NOT NULL,
  issue       VARCHAR(500) NOT NULL DEFAULT '',
  stage       TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0 Beérkezett, 1 Diagnosztika, 2 Árajánlat, 3 Javítás, 4 Teszt, 5 Átvehető',
  quote       VARCHAR(255) NOT NULL DEFAULT '',
  eta         VARCHAR(255) NOT NULL DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_events (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(16)  NOT NULL,
  happened_at  DATETIME     NOT NULL,
  note         VARCHAR(500) NOT NULL,
  KEY idx_ticket (code, happened_at),
  CONSTRAINT fk_event_ticket FOREIGN KEY (code) REFERENCES tickets (code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
