CREATE TABLE IF NOT EXISTS tbl_payment (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  UID VARCHAR(36) NOT NULL,
  reference_number VARCHAR(64) NOT NULL,
  checkout_session_id VARCHAR(128) NULL,
  amount INT UNSIGNED NOT NULL COMMENT 'Amount in centavos',
  currency VARCHAR(8) NOT NULL DEFAULT 'PHP',
  status ENUM('pending', 'paid', 'failed', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_id VARCHAR(128) NULL,
  checkout_url TEXT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  UNIQUE KEY uq_payment_reference (reference_number),
  UNIQUE KEY uq_checkout_session (checkout_session_id),
  INDEX idx_payment_uid (UID)
);

CREATE TABLE IF NOT EXISTS tbl_webhook_event (
  event_id VARCHAR(128) NOT NULL PRIMARY KEY,
  event_type VARCHAR(128) NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
