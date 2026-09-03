# PRANAV AGENT INSTRUCTIONS & ARCHITECTURE SPECIFICATION

> **Repository Branch**: `pranav/map-kanban`  
> **Identity**: Pranav (Interactive Map + Kanban + Complaints Lifecycle)

---

## 🚨 Non-Negotiable Collaboration Rules (STRICT - DO NOT BREAK)

1. **NEVER MODIFY `frontend/src/App.jsx`**:
   - Three teammates are collaborating. Modifying `App.jsx` will cause merge conflicts.
   - Seana owns routing in `App.jsx` and will register `/map` and `/kanban` when ready.
2. **NEVER MODIFY `frontend/src/index.css`**:
   - Use Tailwind utility classes directly inside components.
3. **BOUNDARIES - NEVER TOUCH OTHER TEAM MEMBERS' DOMAINS**:
   - ❌ **Mansi (`mansi/heatmap`)**: Do NOT touch `frontend/src/pages/Heatmap.jsx`, `frontend/src/components/heatmap/`, `heatmapService.js`, or `heatmapUtils.js`.
   - ❌ **Seana (`seana/auth`)**: Do NOT touch `frontend/src/pages/Login.jsx`, `Register.jsx`, `Profile.jsx`, `Navbar.jsx`, or `ProtectedRoute.jsx`.
4. **GIT HYGIENE**:
   - Commit **ONLY and ONLY in branch `pranav/map-kanban`**.
   - **NEVER commit directly to `main`**.
   - Keep commits modular, descriptive, and clean.

---

## 👨‍💻 Pranav's Core Ownership & Responsibilities

Pranav owns the **operational backbone** of UniSafe:
1. **Interactive Map**: Where citizens view reports and pinpoint new issues.
2. **Kanban Board**: Where authorities view, assign, track, and resolve complaints.
3. **Complaints Lifecycle**: Status progression, category tagging, photos, and live synchronization.

---

## 📁 Files & Directory Structure Owned by Pranav

```text
frontend/src/
├── pages/
│   ├── Map.jsx                  # Main Interactive Map page
│   └── Kanban.jsx               # Main Kanban Board page
│
├── components/
│   ├── map/
│   │   ├── InteractiveMap.jsx   # Core Map component with pins & click-to-pin
│   │   ├── ComplaintMarker.jsx  # Custom map marker pins (color-coded by status/severity)
│   │   ├── ComplaintModal.jsx   # Dialog for citizens to submit a new complaint
│   │   └── ComplaintDetails.jsx # Drawer/modal displaying complaint details
│   │
│   └── kanban/
│       ├── KanbanBoard.jsx      # Multi-column Kanban (Pending, In Progress, Resolved)
│       ├── ComplaintCard.jsx    # Card with severity badge, category, photo thumbnail
│       └── AssignmentModal.jsx  # Dialog to assign department or authority
│
└── services/
    └── complaintService.js      # Supabase CRUD operations for complaints & logs
```

---

## 🔄 The End-to-End User Flow to Implement

1. **Citizen Flow (Map View - `/map`)**:
   - Citizen navigates the map (Leaflet / OpenStreetMap).
   - Clicks on any spot or taps "Report Issue at My Location".
   - Submits modal form:
     - Category (Streetlight, Pothole, Garbage, Water Leak, Safety, Other)
     - Description
     - Severity: `low` | `medium` | `high` | `critical`
     - Photo upload (original photo)
   - New complaint marker appears on map immediately.

2. **Authority Flow (Kanban View - `/kanban`)**:
   - Authority views complaint cards organized by status:
     - 🟡 **Pending**: New submissions awaiting review/assignment.
     - 🔵 **In Progress**: Assigned to authority/department and under repair.
     - 🟢 **Resolved**: Work completed with resolution notes and after-photo.
   - Authority can drag/move status or click to reassign.

3. **Map ↔ Kanban Synchronization**:
   - Any status change in Kanban immediately updates the marker icon and color on the Map.
   - Resolved complaints display before/after photo comparison.

---

## 🗄️ Supabase Database Schema (Owned by Pranav)

Pranav owns and manages the complaints data model (Mansi reads from this table for heatmaps):

### 1. `complaints` Table
- `id`: UUID (Primary Key, default: `gen_random_uuid()`)
- `citizen_id`: UUID (Foreign Key -> `citizens.id` or `auth.users.id`, nullable for guests)
- `category`: Text (`"Streetlight"`, `"Pothole"`, `"Garbage"`, `"Water Leak"`, `"Safety"`, etc.)
- `description`: Text
- `latitude`: Float / Numeric
- `longitude`: Float / Numeric
- `severity`: Text (`'low'`, `'medium'`, `'high'`, `'critical'`)
- `status`: Text (`'pending'`, `'in_progress'`, `'resolved'`)
- `assigned_authority_id`: UUID (Foreign Key -> `authorities.id`, nullable)
- `original_photo_url`: Text (Supabase Storage URL or fallback)
- `resolution_photo_url`: Text (Supabase Storage URL or fallback)
- `created_at`: Timestamptz (default: `now()`)
- `updated_at`: Timestamptz (default: `now()`)

### 2. `complaint_logs` Table
- `id`: UUID (Primary Key)
- `complaint_id`: UUID (Foreign Key -> `complaints.id`)
- `action`: Text (`"created"`, `"assigned"`, `"status_change"`, `"resolved"`)
- `changed_by`: UUID
- `notes`: Text
- `created_at`: Timestamptz

### 3. `complaint_verifications` Table
- `id`: UUID (Primary Key)
- `complaint_id`: UUID (Foreign Key -> `complaints.id`)
- `verified_by`: UUID
- `is_valid`: Boolean
- `created_at`: Timestamptz

---

## 🚀 3-Phase Execution Strategy

1. **Phase 1: Interactive Map UI (Mock Data First)**:
   - Setup Map dependencies (`leaflet`, `react-leaflet`, `lucide-react`).
   - Implement `InteractiveMap.jsx`, `ComplaintMarker.jsx`, `ComplaintModal.jsx`, and `Map.jsx`.
   - Ensure pins render cleanly, click-to-pin works, and complaints can be added to state.
2. **Phase 2: Kanban Board UI**:
   - Implement `Kanban.jsx`, `KanbanBoard.jsx`, `ComplaintCard.jsx`, and `AssignmentModal.jsx`.
   - Drag/drop or button-based column transitions (`Pending` ➔ `In Progress` ➔ `Resolved`).
3. **Phase 3: Supabase Integration**:
   - Connect `complaintService.js` to the shared Supabase instance.
   - Real-time fetching, adding complaints, and updating statuses.
