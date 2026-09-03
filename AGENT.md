# Agent Instructions & Collaboration Guidelines

## 🚨 Critical Collaboration Rules (STRICT - DO NOT BREAK)

1. **NEVER MODIFY `frontend/src/App.jsx`**:
   - Three teammates are collaborating on this project (`main`, `pranav`, `heatmap`, etc.).
   - Modifying `App.jsx` causes severe merge conflicts.
   - All features, pages, and components must be developed in **isolated files and modules** (e.g., `frontend/src/components/<Feature>/`, `frontend/src/pages/<FeaturePage>.jsx`, `frontend/src/services/`, etc.).

2. **Branch & Commit Rules**:
   - **Branch**: Commit **ONLY and ONLY in branch `pranav/map-kanban`**.
   - **Feature Ownership**: Pranav owns **Interactive Map + Kanban + Complaints**.
   - **Mansi owns**: Heatmap (`mansi/heatmap`) — DO NOT touch.
   - **Seana owns**: Auth & Users (`seana/auth`) — DO NOT touch.
   - **NEVER commit directly to `main`**.

3. **Architecture & Stack**:
   - **Frontend**: React + Vite (located in `frontend/`)
   - **Backend**: Flask + Python (located in `backend/`)
   - **Communication**: Frontend calls Flask REST API via HTTP (`/api/...`).
   - Maintain clean separation between frontend and backend.

4. **Hackathon MVP Principles** (per `HACKATHON_CONTEXT.md`):
   - Prioritize a working end-to-end MVP over unfinished features.
   - Do not overengineer or add unnecessary dependencies.
   - Do not commit `venv/`, `node_modules/`, or `.env` files.
