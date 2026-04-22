-- Migration: review_requests — outbound invitations for clients to submit a review.
-- Each request carries a unique token that unlocks a public, auth-less review
-- form at /r/{token}. Tokens expire after 30 days.

CREATE TABLE IF NOT EXISTS review_requests (
  id            text        PRIMARY KEY NOT NULL,
  vendor_id     text        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  token         text        NOT NULL UNIQUE,
  client_name   text        NOT NULL,
  client_email  text,
  client_phone  text,
  event_date    text,
  status        text        NOT NULL DEFAULT 'sent',  -- 'sent' | 'used' | 'expired'
  sent_channel  text,                                  -- 'email' | 'whatsapp' | 'both'
  review_id     text        REFERENCES reviews(id) ON DELETE SET NULL,
  expires_at    timestamp   NOT NULL,
  created_at    timestamp   NOT NULL DEFAULT now(),
  used_at       timestamp
);

CREATE INDEX IF NOT EXISTS review_requests_token_idx     ON review_requests(token);
CREATE INDEX IF NOT EXISTS review_requests_vendor_id_idx ON review_requests(vendor_id);
CREATE INDEX IF NOT EXISTS review_requests_status_idx    ON review_requests(status);
