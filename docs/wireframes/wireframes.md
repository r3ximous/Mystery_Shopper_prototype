# Wireframes (Textual Description)

## 1. Shopper Submission Page
- Header: Logo, language toggle (EN | AR), progress indicator (Step 1 of 2)
- Form Sections:
  - Visit Details: Channel (dropdown), Location Code, Date/Time picker (auto now), Shopper ID (prefilled if logged in)
  - Questions: Card list each question with 1-5 radio buttons + optional comment icon
  - Attachments: Upload photo/audio (future)
  - Submit button (primary), Save Draft (secondary)
- Confirmation modal after submit (Reference # + Next steps)

## 2. Admin Dashboard
- KPIs Row: Overall Score, # Submissions (Today / MTD), SLA Breaches, Alerts
- Filters: Date range, Channel multi-select, Location, Template version
- Chart Area: Line (Score trend), Bar (Avg per channel), Heatmap (Locations vs Score)
- Table: Latest submissions (sortable)
- Sidebar: Navigation (Dashboard, Submissions, Templates, Questions, Users, Alerts, Reports, Settings)

## 3. Submission Detail View
- Breadcrumbs: Dashboard > Submissions > #1234
- Header: Submission ID, Status badge, Export PDF
- Panels:
  - Visit Info (Channel, Location, DateTime, Shopper alias)
  - Scores table (Question, Raw, Weight, Weighted, Comment)
  - KPIs (Composite Score, Compliance %, Wait Time Score)
  - Audit trail

## 4. Template Management
- List view with template name, version, status, actions (Edit, Clone, Retire)
- Editor: Drag/drop question ordering, weight inputs, category tags, multi-language text fields.
