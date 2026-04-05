import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Setup 
const SUPABASE_URL = 'https://ypjgsuhobykmxbimjfpp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwamdzdWhvYnlrbXhiaW1qZnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDgzMjAsImV4cCI6MjA5MDk4NDMyMH0.PWniJ4O_BOVYjauCqCZBwIEIKbVcs0Oo_3ZNDS0yivM';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Constants
const COLUMNS = [
  { id: 'todo', label: 'To Do', icon: '○' },
  { id: 'in_progress', label: 'In Progress', icon: '◐' },
  { id: 'in_review', label: 'In Review', icon: '◑' },
  { id: 'done', label: 'Done', icon: '●' },
];

// Task priority separated by colors for urgency
const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#4a9eff' },
  { value: 'normal', label: 'Normal', color: '#f5a623' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

// Colors for team members assigned to groups
const MEMBER_COLORS = [
  '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
];

// Ensures user exists before creating new guest user
async function ensureGuestSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}

// Translates due dates to be more user friendly 
// Satisfies one of the advanced features
function formatRelativeDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `${diffDays}d left`;
}

// changes color and style based on how close/far due date is
function getDueDateUrgency(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 2) return 'soon';
  return 'normal';
}

// used to get initials from names
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// CSS styles used throughout the app (considered importing outside libraries like 
// MaterialUI but wanted everything to be custom)
const styles = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-tertiary: #1a1a28;
  --bg-card: #16161f;
  --bg-card-hover: #1c1c2b;
  --bg-input: #1e1e2e;
  --border-subtle: #2a2a3d;
  --border-active: #4a4a6a;
  --text-primary: #e8e8f0;
  --text-secondary: #8888a8;
  --text-muted: #55556a;
  --accent: #7c5cfc;
  --accent-hover: #6a4ae8;
  --accent-subtle: rgba(124, 92, 252, 0.12);
  --success: #22c55e;
  --warning: #f5a623;
  --danger: #ef4444;
  --column-todo: #7c5cfc;
  --column-progress: #f5a623;
  --column-review: #06b6d4;
  --column-done: #22c55e;
  --shadow-card: 0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-drag: 0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(124,92,252,0.15);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Outfit', -apple-system, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow-x: hidden;
  min-height: 100vh;
}

#root { min-height: 100vh; }

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-active); }

/* App Layout */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,92,252,0.08), transparent),
    var(--bg-primary);
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(10,10,15,0.8);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--accent), #a78bfa);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  color: white;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.header h1 span {
  color: var(--text-muted);
  font-weight: 400;
  margin-left: 8px;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Summary Bar */
.summary-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 28px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}

.summary-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.summary-stat .count {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

.team-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.team-avatars {
  display: flex;
  align-items: center;
}

.team-avatar-sm {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: white;
  border: 2px solid var(--bg-secondary);
  margin-left: -6px;
  cursor: default;
  position: relative;
  transition: transform 0.15s;
}

.team-avatar-sm:first-child { margin-left: 0; }
.team-avatar-sm:hover { transform: scale(1.15); z-index: 2; }

.add-member-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px dashed var(--border-active);
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -4px;
  transition: all 0.15s;
}

.add-member-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-subtle);
}

/* Board */
.board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  padding: 20px;
  flex: 1;
  min-height: 0;
  background: var(--border-subtle);
  margin: 20px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.column {
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  min-height: 500px;
  max-height: calc(100vh - 200px);
  transition: background 0.2s;
}

.column:first-child { border-radius: var(--radius-lg) 0 0 var(--radius-lg); }
.column:last-child { border-radius: 0 var(--radius-lg) var(--radius-lg) 0; }

.column.drag-over {
  background: rgba(124, 92, 252, 0.06);
}

.column-header {
  padding: 18px 18px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 5;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-secondary);
}

.column-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.column-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 10px;
}

.column-cards {
  flex: 1;
  overflow-y: auto;
  padding: 4px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.add-task-btn-col {
  margin: 6px 12px 12px;
  padding: 8px;
  border: 1.5px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Outfit', sans-serif;
}

.add-task-btn-col:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-subtle);
}

/* Task Card */
.task-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 14px;
  cursor: grab;
  transition: all 0.15s ease;
  position: relative;
  user-select: none;
}

.task-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-active);
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

.task-card.dragging {
  opacity: 0.4;
  transform: scale(0.97);
}

.task-card-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.45;
  margin-bottom: 6px;
  color: var(--text-primary);
}

.task-card-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.priority-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-low {
  background: rgba(74, 158, 255, 0.12);
  color: #4a9eff;
}

.priority-normal {
  background: rgba(245, 166, 35, 0.12);
  color: #f5a623;
}

.priority-high {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.due-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', monospace;
}

.due-normal {
  background: rgba(136, 136, 168, 0.1);
  color: var(--text-secondary);
}

.due-soon {
  background: rgba(245, 166, 35, 0.12);
  color: #f5a623;
}

.due-today {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-weight: 500;
}

.due-overdue {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-weight: 600;
  animation: pulse-overdue 2s ease-in-out infinite;
}

@keyframes pulse-overdue {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.task-card-assignees {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.card-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  color: white;
  border: 2px solid var(--bg-card);
  margin-left: -5px;
}

.card-avatar:first-child { margin-left: 0; }

.task-card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.15s;
}

.task-card:hover .task-card-actions { opacity: 1; }

.icon-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.15s;
}

.icon-btn:hover {
  background: var(--accent-subtle);
  color: var(--accent);
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  border: none;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover { background: var(--accent-hover); }

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.btn-secondary:hover {
  background: var(--bg-input);
  color: var(--text-primary);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover { color: var(--text-primary); background: var(--bg-tertiary); }

.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.btn-danger:hover { background: rgba(239, 68, 68, 0.2); }

/* ─── Modal / Overlay ─── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fade-in 0.15s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: 480px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: modal-in 0.2s ease;
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  padding: 20px 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 16px;
  font-weight: 600;
}

.modal-body { padding: 20px 24px; }

.modal-footer {
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--border-subtle);
}

/* Form */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  transition: border-color 0.15s;
  outline: none;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: var(--accent);
}

.form-textarea {
  resize: vertical;
  min-height: 72px;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238888a8' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

/* Assignee picker */
.assignee-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.assignee-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 4px;
  border-radius: 20px;
  border: 1.5px solid var(--border-subtle);
  background: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
  color: var(--text-secondary);
}

.assignee-chip:hover {
  border-color: var(--border-active);
}

.assignee-chip.selected {
  border-color: var(--accent);
  background: var(--accent-subtle);
  color: var(--text-primary);
}

.chip-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  color: white;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  flex: 1;
}

.empty-state-icon {
  font-size: 28px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.empty-state-text {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* Loading */
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-muted);
  font-size: 14px;
}

/* Error toast */
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 300;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  animation: toast-in 0.3s ease;
  max-width: 360px;
}

.toast-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.toast-success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Drop indicator */
.drop-indicator {
  height: 2px;
  background: var(--accent);
  border-radius: 1px;
  margin: -1px 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.drop-indicator.active {
  opacity: 1;
}

/* Responsive */
@media (max-width: 900px) {
  .board {
    grid-template-columns: 1fr;
    margin: 10px;
    padding: 10px;
    gap: 10px;
    background: transparent;
  }
  .column {
    border-radius: var(--radius-lg) !important;
    min-height: auto;
    max-height: none;
    border: 1px solid var(--border-subtle);
  }
  .header { padding: 12px 16px; }
  .summary-bar { padding: 10px 16px; flex-wrap: wrap; gap: 12px; }
  .team-section { margin-left: 0; }
}

/* Detail Panel */
.detail-panel {
  width: 520px;
  max-width: 95vw;
}

.detail-body { padding: 20px 24px; }

.detail-field {
  margin-bottom: 20px;
}

.detail-field-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 6px;
}

.detail-field-value {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

.detail-field-value.muted {
  color: var(--text-muted);
  font-style: italic;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
`;

// Toast notifications to tell user action has been completed
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}

// Function that handles creating and editing tasks
// Used to populate all the fields and ensures task has a title
function TaskModal({ isOpen, onClose, onSave, task, members, defaultStatus }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('todo');
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'normal');
      setDueDate(task.due_date || '');
      setStatus(task.status || 'todo');
      setAssigneeIds(task.assignee_ids || []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('normal');
      setDueDate('');
      setStatus(defaultStatus || 'todo');
      setAssigneeIds([]);
    }
  }, [task, isOpen, defaultStatus]);

  if (!isOpen) return null;

  const toggleAssignee = (id) => {
    setAssigneeIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      ...(task || {}),
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || null,
      status,
      assignee_ids: assigneeIds,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSave()}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more detail..."
            />
          </div>
          <div className="detail-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                className="form-input"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              {COLUMNS.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          {members.length > 0 && (
            <div className="form-group">
              <label className="form-label">Assignees</label>
              <div className="assignee-picker">
                {members.map(m => (
                  <button
                    key={m.id}
                    className={`assignee-chip ${assigneeIds.includes(m.id) ? 'selected' : ''}`}
                    onClick={() => toggleAssignee(m.id)}
                  >
                    <div className="chip-avatar" style={{ background: m.color }}>{getInitials(m.name)}</div>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Gives information on the task when clicked, doesn't edit or create new task but 
// can delete tasks
function TaskDetailModal({ task, members, onClose, onEdit, onDelete }) {
  if (!task) return null;

  const urgency = getDueDateUrgency(task.due_date);
  const assignees = (task.assignee_ids || []).map(id => members.find(m => m.id === id)).filter(Boolean);
  const col = COLUMNS.find(c => c.id === task.status);
  const pri = PRIORITIES.find(p => p.value === task.priority);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal detail-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task.title}</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="detail-body">
          {task.description && (
            <div className="detail-field">
              <div className="detail-field-label">Description</div>
              <div className="detail-field-value">{task.description}</div>
            </div>
          )}
          <div className="detail-row">
            <div className="detail-field">
              <div className="detail-field-label">Status</div>
              <div className="detail-field-value">{col?.icon} {col?.label}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Priority</div>
              <div className="detail-field-value">
                <span className={`priority-badge priority-${task.priority}`}>{pri?.label}</span>
              </div>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-field">
              <div className="detail-field-label">Due Date</div>
              <div className={`detail-field-value ${!task.due_date ? 'muted' : ''}`}>
                {task.due_date ? (
                  <>
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {urgency && <span className={`due-badge due-${urgency}`} style={{ marginLeft: 8, display: 'inline-flex' }}>{formatRelativeDate(task.due_date)}</span>}
                  </>
                ) : 'No due date'}
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">Created</div>
              <div className="detail-field-value">
                {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
          {assignees.length > 0 && (
            <div className="detail-field">
              <div className="detail-field-label">Assignees</div>
              <div className="assignee-picker">
                {assignees.map(m => (
                  <div key={m.id} className="assignee-chip selected" style={{ cursor: 'default' }}>
                    <div className="chip-avatar" style={{ background: m.color }}>{getInitials(m.name)}</div>
                    {m.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-danger" onClick={() => { onDelete(task.id); onClose(); }}>Delete</button>
          <button className="btn btn-primary" onClick={() => { onEdit(task); onClose(); }}>Edit</button>
        </div>
      </div>
    </div>
  );
}

// One of the advanced components where we can add new team members to our group
// uses the colors from the constant variable above to assign colors as well 
function AddMemberModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('');
  const [colorIdx, setColorIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setColorIdx(Math.floor(Math.random() * MEMBER_COLORS.length));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 380 }}>
        <div className="modal-header">
          <h2>Add Team Member</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && name.trim()) {
                  onSave({ name: name.trim(), color: MEMBER_COLORS[colorIdx] });
                  onClose();
                }
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MEMBER_COLORS.map((c, i) => (
                <div
                  key={c}
                  onClick={() => setColorIdx(i)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c,
                    cursor: 'pointer', border: i === colorIdx ? '2px solid white' : '2px solid transparent',
                    transition: 'border-color 0.15s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() => {
              onSave({ name: name.trim(), color: MEMBER_COLORS[colorIdx] });
              onClose();
            }}
          >Add Member</button>
        </div>
      </div>
    </div>
  );
}

// Renders the actual task card on the kanban board with all relevant information
// Ensures cards have dragging capability by editing the CSS as well
function TaskCard({ task, members, onDragStart, onDragEnd, onClick }) {
  const urgency = getDueDateUrgency(task.due_date);
  const assignees = (task.assignee_ids || []).map(id => members.find(m => m.id === id)).filter(Boolean);

  return (
    <div
      className="task-card"
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
        onDragStart(task.id);
      }}
      onDragEnd={e => {
        e.currentTarget.classList.remove('dragging');
        onDragEnd();
      }}
      onClick={() => onClick(task)}
    >
      <div className="task-card-title">{task.title}</div>
      {task.description && <div className="task-card-desc">{task.description}</div>}
      <div className="task-card-meta">
        <span className={`priority-badge priority-${task.priority || 'normal'}`}>
          {(task.priority || 'normal').charAt(0).toUpperCase() + (task.priority || 'normal').slice(1)}
        </span>
        {task.due_date && (
          <span className={`due-badge due-${urgency}`}>
            {formatRelativeDate(task.due_date)}
          </span>
        )}
        {assignees.length > 0 && (
          <div className="task-card-assignees">
            {assignees.map(m => (
              <div key={m.id} className="card-avatar" style={{ background: m.color }} title={m.name}>
                {getInitials(m.name)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Renders the columns in the kanban board and ensures that any tasks dragged to its column
// is populated correctly and all relevant information is updated
function Column({ column, tasks, members, onDropTask, onAddTask, onTaskClick, draggedTaskId }) {
  const [dragOver, setDragOver] = useState(false);

  const colorMap = {
    todo: 'var(--column-todo)',
    in_progress: 'var(--column-progress)',
    in_review: 'var(--column-review)',
    done: 'var(--column-done)',
  };

  return (
    <div
      className={`column ${dragOver ? 'drag-over' : ''}`}
      onDragOver={e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) onDropTask(taskId, column.id);
      }}
    >
      <div className="column-header">
        <div className="column-title">
          <div className="column-dot" style={{ background: colorMap[column.id] }} />
          {column.label}
        </div>
        <span className="column-count">{tasks.length}</span>
      </div>
      <div className="column-cards">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{column.icon}</div>
            <div className="empty-state-text">
              {column.id === 'todo' ? 'No tasks yet — create one!' :
               column.id === 'done' ? 'Completed tasks appear here' :
               'Drag tasks here'}
            </div>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              onDragStart={() => {}}
              onDragEnd={() => {}}
              onClick={onTaskClick}
            />
          ))
        )}
      </div>
      <button className="add-task-btn-col" onClick={() => onAddTask(column.id)}>
        + Add task
      </button>
    </div>
  );
}

// Default app that ties everything together to ensure application runs smoothly
export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [detailTask, setDetailTask] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Init: auth + load data
  useEffect(() => {
    async function init() {
      try {
        const u = await ensureGuestSession();
        setUser(u);
        await loadTasks(u.id);
        loadMembers(u.id);
      } catch (err) {
        setError('Failed to initialize. Please check your Supabase configuration.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadTasks(userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId || user?.id)
      .order('created_at', { ascending: false });
    if (error) {
      addToast('Failed to load tasks');
      console.error(error);
      return;
    }
    setTasks(data || []);
  }

  async function loadMembers(userId) {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', userId || user?.id)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Members table may not exist yet:', error);
      return;
    }
    setMembers(data || []);
  }

  // Task CRUD 
  async function saveTask(taskData) {
    try {
      if (taskData.id) {
        // Update
        const { error } = await supabase
          .from('tasks')
          .update({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            due_date: taskData.due_date,
            status: taskData.status,
            assignee_ids: taskData.assignee_ids,
          })
          .eq('id', taskData.id);
        if (error) throw error;
        addToast('Task updated', 'success');
      } else {
        // Create
        const { error } = await supabase
          .from('tasks')
          .insert({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            due_date: taskData.due_date,
            status: taskData.status,
            assignee_ids: taskData.assignee_ids,
            user_id: user.id,
          });
        if (error) throw error;
        addToast('Task created', 'success');
      }
      await loadTasks();
    } catch (err) {
      addToast('Failed to save task');
      console.error(err);
    }
  }

  async function deleteTask(taskId) {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
      addToast('Task deleted', 'success');
    } catch (err) {
      addToast('Failed to delete task');
      console.error(err);
    }
  }

  async function moveTask(taskId, newStatus) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      if (error) throw error;
    } catch (err) {
      addToast('Failed to move task');
      await loadTasks();
    }
  }

  // Team Members
  async function addMember({ name, color }) {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({ name, color, user_id: user.id });
      if (error) throw error;
      await loadMembers();
      addToast(`${name} added to team`, 'success');
    } catch (err) {
      addToast('Failed to add member');
      console.error(err);
    }
  }

  // Handlers
  function handleAddTask(status) {
    setEditingTask(null);
    setDefaultStatus(status);
    setTaskModalOpen(true);
  }

  function handleEditTask(task) {
    setEditingTask(task);
    setTaskModalOpen(true);
  }

  function handleTaskClick(task) {
    setDetailTask(task);
  }

  // Loading screen
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div className="loading-text">Setting up your board...</div>
      </div>
    );
  }
  // Error screen
  if (error) {
    return (
      <div className="loading-screen">
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚠</div>
        <div className="loading-text">{error}</div>
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => getDueDateUrgency(t.due_date) === 'overdue' && t.status !== 'done').length;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <div className="header-left">
            <div className="logo">NP</div>
            <h1>TaskFlow<span>Board</span></h1>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => handleAddTask('todo')}>
              + New Task
            </button>
          </div>
        </header>

        <div className="summary-bar">
          <div className="summary-stat">
            <span className="count">{totalTasks}</span> total
          </div>
          <div className="summary-stat">
            <span className="count" style={{ color: 'var(--success)' }}>{doneTasks}</span> done
          </div>
          {overdueTasks > 0 && (
            <div className="summary-stat">
              <span className="count" style={{ color: 'var(--danger)' }}>{overdueTasks}</span> overdue
            </div>
          )}
          <div className="team-section">
            <div className="team-avatars">
              {members.map(m => (
                <div
                  key={m.id}
                  className="team-avatar-sm"
                  style={{ background: m.color }}
                  title={m.name}
                >
                  {getInitials(m.name)}
                </div>
              ))}
              <button
                className="add-member-btn"
                onClick={() => setMemberModalOpen(true)}
                title="Add team member"
              >+</button>
            </div>
          </div>
        </div>

        <div className="board">
          {COLUMNS.map(col => (
            <Column
              key={col.id}
              column={col}
              tasks={tasks.filter(t => t.status === col.id)}
              members={members}
              onDropTask={moveTask}
              onAddTask={handleAddTask}
              onTaskClick={handleTaskClick}
              draggedTaskId={draggedTaskId}
            />
          ))}
        </div>

        <TaskModal
          isOpen={taskModalOpen}
          onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
          onSave={saveTask}
          task={editingTask}
          members={members}
          defaultStatus={defaultStatus}
        />

        <TaskDetailModal
          task={detailTask}
          members={members}
          onClose={() => setDetailTask(null)}
          onEdit={(t) => { setDetailTask(null); handleEditTask(t); }}
          onDelete={deleteTask}
        />

        <AddMemberModal
          isOpen={memberModalOpen}
          onClose={() => setMemberModalOpen(false)}
          onSave={addMember}
        />

        <ToastContainer toasts={toasts} />
      </div>
    </>
  );
}
