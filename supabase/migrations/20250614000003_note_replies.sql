-- Note replies (for teacher responses to student notes)
CREATE TABLE IF NOT EXISTS note_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_note_replies_note_id ON note_replies(note_id);
CREATE INDEX IF NOT EXISTS idx_note_replies_user_id ON note_replies(user_id);

ALTER TABLE note_replies ENABLE ROW LEVEL SECURITY;

-- Note owner can view replies to their notes
CREATE POLICY "Users can view replies to their notes"
  ON note_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_replies.note_id AND notes.user_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

-- Teachers can insert replies
CREATE POLICY "Teachers can reply to shared notes"
  ON note_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'teacher'
    )
  );

-- Reply author can update their reply
CREATE POLICY "Users can update own replies"
  ON note_replies FOR UPDATE
  USING (auth.uid() = user_id);

-- Reply author can delete their reply
CREATE POLICY "Users can delete own replies"
  ON note_replies FOR DELETE
  USING (auth.uid() = user_id);
