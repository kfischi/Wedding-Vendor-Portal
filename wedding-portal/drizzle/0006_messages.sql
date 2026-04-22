-- Migration: outgoing messages log
CREATE TABLE IF NOT EXISTS messages (
  id           text        PRIMARY KEY NOT NULL,
  vendor_id    text        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  lead_id      text        REFERENCES leads(id) ON DELETE SET NULL,
  channel      text        NOT NULL, -- 'email' | 'whatsapp'
  recipient    text        NOT NULL, -- email address or phone
  subject      text,
  body         text        NOT NULL,
  status       text        NOT NULL DEFAULT 'sent', -- 'sent' | 'failed'
  error        text,
  created_at   timestamp   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_vendor_id_idx ON messages(vendor_id);
CREATE INDEX IF NOT EXISTS messages_lead_id_idx   ON messages(lead_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
