# TaskFlow Board

A polished, dark-themed Kanban task board built with React and Supabase.

## Features

### Core
- **Kanban Board** with 4 columns: To Do, In Progress, In Review, Done
- **Drag & Drop** — drag tasks between columns to update status (real-time persistence)
- **Task CRUD** — create, view, edit, and delete tasks
- **Guest Auth** — anonymous sign-in via Supabase (no email/password required)
- **Row Level Security** — each user only sees their own data

### Task Fields
- Title (required)
- Description
- Priority (Low / Normal / High)
- Due Date (Advaned Feature)
- Status
- Assignees (Advanced Feature)

### Advanced Features
- **Team Members & Assignees** — add team members with name + color, assign them to tasks, see avatars on cards
- **Due Date Indicators** — visual badges showing urgency (overdue, due today, due soon) with color coding and animation for overdue items
- **Board Summary** — header stats showing total tasks, completed, and overdue count

### Design
- Dark theme inspired by my LifeOS system
- Smooth transitions and hover effects
- Responsive layout (stacks to single column on mobile)
- Thoughtful empty states, loading spinner, and error toasts

---

## Setup Instructions

### 1. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run/create schema for your database
3. Go to **Authentication → Providers → Anonymous Sign-In** and **enable** it
4. Copy **Project URL** and **anon public key** from **Settings → API**

### 2. Install & Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### 3. Build for Production

```bash
npm run build
```

The output will be in the `dist/` folder, ready to deploy.

---

## Database Schema

### `tasks` table

| Field        | Type         | Notes                                           |
|-------------|-------------|------------------------------------------------|
| id          | UUID         | Primary key, auto-generated                     |
| title       | TEXT         | Required                                        |
| description | TEXT         | Optional                                        |
| status      | TEXT         | `todo`, `in_progress`, `in_review`, `done`      |
| priority    | TEXT         | `low`, `normal`, `high`                         |
| due_date    | DATE         | Optional                                        |
| assignee_ids| UUID[]       | Array of team_member IDs                        |
| user_id     | UUID         | Tied to anonymous auth user                     |
| created_at  | TIMESTAMPTZ  | Auto-set                                        |

### `team_members` table

| Field      | Type         | Notes                          |
|-----------|-------------|-------------------------------|
| id        | UUID         | Primary key, auto-generated    |
| name      | TEXT         | Required                       |
| color     | TEXT         | Hex color for avatar           |
| user_id   | UUID         | Tied to anonymous auth user    |
| created_at| TIMESTAMPTZ  | Auto-set                       |

### RLS Policies

Both tables have full CRUD policies scoped to `auth.uid() = user_id`. This ensures each guest user can only access their own data.

---

## Tech Stack

- **React 18** — UI framework
- **Vite** — build tool
- **Supabase** — database, auth, and RLS
- **CSS** — custom styles, dark theme with CSS variables

---

## Design Decisions

- **No UI library** — hand-crafted CSS for full control over the design and smaller bundle size
- **Native HTML5 drag & drop** — no additional library needed, works well for column-based Kanban
- **Optimistic updates** on drag-drop for snappy UX, with rollback on failure
- **Anonymous auth** — zero friction onboarding, automatic guest session on first visit
- **UUID arrays for assignees** — stored directly on the task to avoid a join table for this scope
- **CSS variables** — consistent theming throughout which makes it easy to modify

## Tradeoffs & Future Improvements

- **Drag & drop** uses native HTML5 API which works well but lacks touch support on some mobile browsers. 
- **Task ordering within columns** — currently sorted by creation date. Adding a `position` field would allow reordering within columns.
- **Team member deletion** — not yet implemented in the UI.
- **Search & filtering** — would be a natural next addition.
- **Activity log** — tracking status changes in a separate table would enable a full task history timeline.