-- Create the invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'member',
  token TEXT UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  inviter_id INTEGER NOT NULL REFERENCES users(id),
  accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create an index on email and token
CREATE INDEX IF NOT EXISTS idx_invitations_email_token ON invitations(email, token); 