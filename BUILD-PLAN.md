# Apollo TMS — Overnight Build Pipeline

## Pass Schedule (10-12 passes, ~15-20 min each)

### Pass 1: Project Scaffold + Design System
- Next.js 15 App Router + TypeScript
- Tailwind v4 + Geist fonts + design tokens
- shadcn/ui installed + customized (emerald accent, zinc base, rounded-2xl)
- Layout shell: sidebar nav, top bar, command palette skeleton
- Auth placeholder (NextAuth stub)
- Folder structure per PRD modules

### Pass 2: Component Library + Design System Polish
- Button, Input, Select, Modal, Sheet, Table, Badge, Card, Tabs, Toast
- All following taste skill: no Inter, no purple, no emoji, spring physics
- Loading skeletons, empty states, error states for every component
- Geist Mono for numerical displays
- Staggered reveal animations (Framer Motion)
- Command palette (Cmd+K) functional

### Pass 3: Data Models + Database Schema
- Drizzle ORM setup with PostgreSQL schema
- All core entities: organizations, users, customers, drivers, equipment, orders, stops, charges, invoices, settlements
- Seed data (realistic — no "John Doe" or "Acme Corp")
- API route stubs for CRUD operations
- Type definitions exported for frontend

### Pass 4: Auth + RBAC + Layout
- NextAuth.js with credential provider
- Role-based access control middleware
- Sidebar navigation — role-aware (dispatcher vs accounting vs admin)
- User menu, notification bell, global search bar
- Protected routes per role
- Login page (premium design)

### Pass 5: Dispatch — Visual Planner
- THE core screen — split layout: timeline left, map right
- Gantt-style driver timeline (drag-and-drop)
- Load cards with color-coded status
- Quick action buttons (pre-assign, dispatch, split, hold)
- Dispatch slide-out panel (driver details)
- Smart filters (status, region, equipment, customer, urgency)
- Mock real-time data via intervals (WebSocket stub)

### Pass 6: Order Management + Driver Management
- Order list view with filters, search, sorting
- Order detail page (tabbed: overview, stops, documents, charges, tracking, history)
- Order entry form (quick + full modes)
- Multi-stop builder with drag-and-drop reorder
- Driver list + profile pages
- Driver detail (tabbed: qualifications, loads, pay, safety, documents, preferences)
- HOS status display

### Pass 7: Equipment + Customer Management
- Equipment list (tractors + trailers)
- Equipment detail pages
- Maintenance schedule view
- Customer database + profiles
- Location/facility database with search
- Customer portal placeholder pages
- Facility ratings display

### Pass 8: Billing & Financial
- Rating engine (rate types, accessorial charges)
- Invoice list + detail views
- Invoice generation flow
- Settlement run interface (table, bulk select, preview)
- Settlement PDF preview
- AR aging dashboard
- Charge code management

### Pass 9: Safety, Compliance, Documents
- Compliance dashboard (expiration calendar, certification tracking)
- Safety scorecard per driver
- Accident report form
- Document management (upload, classify, search, associate to loads)
- Document viewer (inline preview)
- ePOD display

### Pass 10: Analytics + Dashboard
- Executive dashboard (bento grid, KPI cards, mini-charts)
- Revenue, margin, on-time %, utilization, deadhead metrics
- Lane analysis view
- Driver performance view
- Customer profitability view
- Chart components (Recharts)
- Role-aware dashboard (different KPIs per role)

### Pass 11: Mobile + PWA + Workflow
- Responsive pass on ALL screens (mobile-first refinement)
- Driver mobile experience (home, loads, scan, messages, pay)
- PWA manifest + service worker
- Notification system UI
- Workflow automation builder (visual, drag-and-drop)

### Pass 12: Polish + Integration
- Full taste skill audit (every screen)
- Motion polish (spring physics, staggered reveals, layout transitions)
- Empty states for every view
- Loading skeletons for every view
- Error boundaries everywhere
- Command palette fully wired
- README with setup instructions
- Final design coherence pass

## Handoff Protocol
Each pass creates/updates `HANDOFF.md` in the project root:
- What was completed
- What's next
- Known issues
- Files modified
- Design decisions made
