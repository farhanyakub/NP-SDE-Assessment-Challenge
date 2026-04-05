CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'todo'
                CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
  priority    TEXT DEFAULT 'normal'
                CHECK (priority IN ('low', 'normal', 'high')),
  due_date    DATE,
  assignee_ids UUID[] DEFAULT '{}',
  user_id     UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE team_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#8b5cf6',
  user_id    UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Tasks: SELECT
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Tasks: INSERT
CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tasks: UPDATE
CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tasks: DELETE
CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Team Members: SELECT
CREATE POLICY "Users can view their own team members"
  ON team_members FOR SELECT
  USING (auth.uid() = user_id);

-- Team Members: INSERT
CREATE POLICY "Users can create their own team members"
  ON team_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Team Members: UPDATE
CREATE POLICY "Users can update their own team members"
  ON team_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Team Members: DELETE
CREATE POLICY "Users can delete their own team members"
  ON team_members FOR DELETE
  USING (auth.uid() = user_id);