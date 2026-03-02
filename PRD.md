# Apollo TMS — Product Requirements Document
### A Modern Asset-Based Transportation Management System
**Version:** 1.0 | **Date:** 2026-02-27 | **Author:** Molt (Apollo Operations)

---

## 1. VISION & POSITIONING

### 1.1 What We're Building
A web-native, modern TMS for asset-based trucking companies that does everything McLeod LoadMaster does — but looks, feels, and performs like it was built in 2026, not 2002.

McLeod is migrating from a Windows desktop app to web (LoadMaster//web, piloted 2024, rolling out 2025). They're playing catch-up. We're building web-first from day one.

### 1.2 Why It Matters
- McLeod's LoadMaster serves 1,100+ companies on a legacy Windows UI
- Their web migration is incremental and conservative — "not just putting a new skin on" but still carrying decades of UX debt
- The market wants a TMS that feels like a modern SaaS product, not an enterprise relic
- Apollo needs this internally AND it's a product opportunity

### 1.3 Design Philosophy
- **Web-native** — Next.js + React, no desktop app, no Electron
- **Real-time everything** — WebSockets, live updates, no refresh-to-see-changes
- **AI-first** — not bolted on, woven into every workflow
- **Beautiful by default** — premium UI that makes dispatchers actually enjoy their tools
- **Role-based workflows** — each user type sees exactly what they need
- **Mobile-equal** — not a companion app, a first-class experience

### 1.4 Competitive Advantage Over McLeod
| Area | McLeod LoadMaster | Apollo TMS |
|------|------------------|------------|
| UI | Windows desktop → slow web migration | Web-native from day one |
| Design | Enterprise-functional, dated | Premium modern SaaS |
| AI | Bolted-on email parsing (2024) | Integrated into every workflow |
| Real-time | Polling-based updates | WebSocket live state |
| Mobile | Driver Sidekick companion app | Responsive-first, PWA |
| Customization | McLeod Tailor (limited) | Full config engine + plugin system |
| Onboarding | Weeks of training | Role-based guided workflows |
| API | DataFusion/FusionAPI (legacy) | Modern REST + GraphQL + webhooks |

---

## 2. ARCHITECTURE

### 2.1 Tech Stack
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 + custom design system
- **State:** Zustand (global) + React Query (server state)
- **Real-time:** WebSockets (Socket.io or native WS)
- **Backend:** Node.js API layer (Next.js API routes + standalone services)
- **Database:** PostgreSQL (primary) + Redis (caching, real-time, queues)
- **ORM:** Drizzle ORM
- **Auth:** NextAuth.js with RBAC
- **Maps:** Mapbox GL JS (truck routing, live tracking)
- **Charts:** Recharts or Nivo
- **Forms:** React Hook Form + Zod validation
- **File Storage:** S3-compatible (documents, images, PODs)
- **Search:** Full-text via PostgreSQL + optional Meilisearch
- **Deployment:** Docker, deployable on-prem or cloud

### 2.2 Design System
Following the **taste** skill directives:
- **Typography:** Geist (UI) + Geist Mono (data/numbers) — NO Inter
- **Colors:** Zinc/Slate neutral base, single high-contrast accent (Emerald for Apollo brand)
- **Layout:** Asymmetric where appropriate, data-dense where needed (VISUAL_DENSITY: 6-7 for operations screens)
- **Motion:** Framer Motion spring physics, staggered reveals, layout transitions (MOTION_INTENSITY: 5-6)
- **Design Variance:** 6 — offset layouts, not chaotic but not boring
- **No purple gradients, no neon glows, no Inter, no emoji in UI**
- **Monospace for all numerical data** (costs, miles, weights, times)
- **Loading states:** Skeleton shimmer matching layout
- **Empty states:** Beautifully composed with action prompts
- **Error states:** Inline, clear, actionable

### 2.3 Data Model (Core Entities)
```
Organizations (multi-tenant)
├── Users (RBAC: admin, dispatcher, driver_manager, safety, accounting, driver)
├── Customers (shippers/consignees)
│   ├── Contacts
│   ├── Locations/Facilities
│   ├── Contracts & Rate Agreements
│   └── Service Requirements
├── Drivers
│   ├── Qualifications & Certifications
│   ├── Pay Profiles (%, per-mile, flat, hourly)
│   ├── Preferences (lanes, home time, equipment)
│   ├── HOS Status
│   ├── Safety Records
│   └── Documents
├── Equipment
│   ├── Tractors
│   ├── Trailers
│   └── Maintenance Schedules
├── Orders/Loads
│   ├── Stops (multi-stop, sequenced)
│   ├── Assignments (driver + tractor + trailer)
│   ├── Status History
│   ├── Documents & Images
│   ├── Charges & Line Items
│   └── Tracking Events
├── Billing
│   ├── Invoices
│   ├── Settlements
│   ├── AP/AR
│   └── Charge Codes
├── Integrations
│   ├── ELD Connections
│   ├── GPS/Telematics
│   ├── Fuel Cards
│   ├── EDI Trading Partners
│   └── Load Boards
└── Analytics
    ├── Dashboards
    ├── Reports
    └── KPIs
```

---

## 3. MODULES & FEATURES (Comprehensive)

### 3.1 DISPATCH & OPERATIONS

#### 3.1.1 Visual Planner (Primary Dispatch Screen)
The heart of the system. McLeod's "Interactive Order Planning Screen" reimagined.

**Layout:** Split-screen — left: load list/timeline, right: map with live positions

**Features:**
- **Drag-and-drop load assignment** — drag a load onto a driver/truck on the timeline
- **Color-coded timeline view** — Gantt-style per driver showing: assigned, in-transit, delivered, available
- **Real-time position overlay** — live truck positions on map via WebSocket
- **Quick Action Buttons** (slide-out):
  - Pre-assign
  - Dispatch
  - Split load (Y-split: change driver/tractor/trailer mid-route)
  - Hold/Release
  - Cancel
- **Smart filters:**
  - By status (available, assigned, in-transit, delivered, problem)
  - By region/lane
  - By equipment type
  - By customer
  - By urgency (late, at-risk, on-time) — color-coded alerts
- **Dispatch slide-out panel:** Click any driver → see past/present/future loads, HOS, location, pay, notes — all in one panel without leaving the planner
- **Multi-select bulk operations** — select multiple loads, bulk assign/update

**Data Fields:**
- Order # (auto-generated, configurable format)
- Revenue code (Company, Owner-Op, Brokerage, etc.)
- Origin/Destination (with location database + autocomplete)
- Scheduled pickup/delivery windows
- Commodity, weight, pieces, dimensions
- Special requirements (tarping, FSMA, certs, hazmat UN#)
- Equipment type required
- Customer reference #s
- Trailer pre-assignment
- Rate/charges
- Priority level
- Notes/special instructions

#### 3.1.2 Order Entry
**Features:**
- **AI-powered order creation** — paste an email or upload a rate con → AI extracts all fields
- **Quick entry mode** — minimal fields for fast booking
- **Full entry mode** — every field exposed
- **Template system** — save frequent customer/lane combos as templates
- **Duplicate detection** — warn on similar existing orders
- **Multi-stop builder** — add/reorder/remove stops with drag-and-drop
- **Rate calculator** — inline distance + rate calc (per-mile, flat, CWT)
- **Customer lookup** — type-ahead search on customer database
- **Location database** — searchable facility database with dock info, hours, ratings
- **Auto-rate** — apply contract rates when customer + lane match exists

**Validations:**
- Required field enforcement per customer
- Weight/dimension limits per equipment type
- Hazmat certification matching
- Driver qualification matching
- HOS feasibility check

#### 3.1.3 Load Matching & Optimization
**Features:**
- **AutoMatch engine** — score and rank top N drivers for each load based on:
  - Current location (proximity)
  - HOS remaining
  - Equipment type match
  - Driver preferences/lane history
  - Certifications match
  - Home time schedule
  - Revenue optimization
- **Find Near** — radius search for available trucks near a pickup
- **Continuous moves planner** — chain loads to minimize deadhead
- **Lane analysis** — historical margin, volume, rate trends per lane
- **What-if scenarios** — simulate assignments before committing

#### 3.1.4 Real-Time Tracking & Visibility
**Features:**
- **Live map** — all assets plotted, filterable by status/type/region
- **Predictive ETA** — ML-based ETAs using GPS, traffic, weather, driver patterns
- **Geofencing** — auto-detect arrival/departure at facilities
- **Out-of-route alerts** — real-time deviation detection
- **Color-coded alert system:**
  - 🟢 On time
  - 🟡 At risk (might be late)
  - 🔴 Late
  - ⚫ No signal/offline
- **Customer auto-notifications** — configurable triggers (picked up, ETA update, delivered)
- **Check call automation** — scheduled + event-driven status updates
- **Exception dashboard** — all problems surfaced in one view

#### 3.1.5 Trip Management
**Features:**
- **Interactive trip builder** — route planning with commercial truck routing
- **Driver input integration** — drivers can suggest route preferences
- **Fuel stop optimization** — cheapest fuel along route
- **Rest stop planning** — HOS-aware rest scheduling
- **Multi-day trip management** — relay and team driving support
- **Trip cost estimation** — fuel, tolls, driver pay projected

### 3.2 DRIVER MANAGEMENT

#### 3.2.1 Driver Profiles
**Features:**
- **Comprehensive driver file:**
  - CDL info + endorsements + restrictions
  - Medical certificate status + expiration
  - Drug/alcohol test history
  - MVR records
  - Training certifications
  - Equipment certifications (hazmat, tanker, doubles)
  - Employment history
  - Emergency contacts
- **Expiration tracking** — auto-alerts at 30/60/90 days
- **Document storage** — scan/upload all driver documents
- **Driver photo** — profile image support
- **Performance dashboard** — per-driver metrics
- **Preference management** — lanes, equipment, home time, regions

#### 3.2.2 HOS & Compliance
**Features:**
- **Real-time HOS dashboard** — all drivers, current status, remaining hours
- **ELD integration** — auto-sync from Samsara, Motive, EROAD, ISAAC, Platform Science, Geotab, ORBCOMM
- **Violation detection** — real-time alerts for HOS violations
- **Drive time projections** — "can this driver make it?" feasibility checks
- **FMCSA compliance tracking** — BASICs scores, inspection history
- **Audit-ready logs** — exportable for DOT audits

#### 3.2.3 Driver Recruiting (HirePower equivalent)
**Features:**
- **Online application portal** — mobile-friendly, branded
- **Automated pipeline:**
  - Application received
  - Initial screening
  - Background check
  - Drug test
  - Road test
  - Orientation
  - Active
- **Document collection** — paperless, all digital
- **Employment gap detection** — auto-flag gaps in work history
- **Smart Packs** — pre-filled orientation document bundles
- **Applicant tracking dashboard** — kanban-style pipeline view
- **Integration:** background check services, drug testing providers

#### 3.2.4 Driver Settlements
**Features:**
- **Flexible pay structures:**
  - Percentage of revenue
  - Per-mile (loaded + empty rates)
  - Flat rate per load
  - Hourly
  - Combined/hybrid
  - Owner-operator vs company driver profiles
- **Automated calculation** — pay computed from load data + charge codes
- **Deduction management** — insurance, equipment lease, cash advances, escrow
- **Settlement preview** — driver can review before finalization
- **Direct deposit integration**
- **Settlement PDF generation** — detailed breakdown
- **Pay history** — full historical access
- **Accessorial pay** — detention, lumper, layover, premium pay auto-calculated
- **Batch processing** — run settlements for all drivers on schedule

#### 3.2.5 Driver Scorecard & Safety
**Features:**
- **Safety score** — composite score from:
  - HOS compliance rate
  - Inspection results
  - Accident history
  - Video events (Lytx/Samsara integration)
  - Customer feedback
  - On-time performance
- **Behavior trending** — improvement/decline visualization
- **Coaching integration** — flag drivers for coaching, track completion
- **Accident reporting** — mobile photo + details capture
- **Video event correlation** — link safety events to specific loads/routes

### 3.3 EQUIPMENT MANAGEMENT

#### 3.3.1 Asset Tracking
**Features:**
- **Tractor management:**
  - VIN, year, make, model, engine specs
  - Current location (GPS)
  - Assignment status (driver, load)
  - Mileage tracking
  - Fuel efficiency
  - Maintenance status
- **Trailer management:**
  - Type (dry van, reefer, flatbed, tanker, etc.)
  - Location tracking (trailer GPS/telematics)
  - Pool management for LTL
  - Inspection status
  - Load history
- **Equipment utilization dashboard** — % in use vs idle vs in shop

#### 3.3.2 Maintenance Management
**Features:**
- **Preventive maintenance scheduling:**
  - Mileage-based intervals
  - Time-based intervals
  - Engine hour-based
  - Custom programs
- **Work order management** — create, assign, track, close
- **Parts inventory** — basic parts tracking
- **Vendor management** — preferred shops, warranty tracking
- **Inspection management:**
  - Pre-trip / post-trip (mobile capture)
  - DOT inspection tracking
  - Defect reporting → auto-create work orders
  - Out-of-service tracking
- **Cost tracking** — cost per mile, cost by category, budget vs actual
- **Maintenance alerts** — push notifications when service due

### 3.4 BILLING & FINANCIAL

#### 3.4.1 Rating Engine
**Features:**
- **Rate types:**
  - Flat rate
  - Per-mile (with distance auto-calc)
  - Per-CWT (per 100 weight)
  - Per-unit
  - Percentage-based
  - Tiered/sliding scale
- **Contract rate management** — customer-specific rates by lane/commodity/equipment
- **Fuel surcharge engine:**
  - DOE index-based auto-calculation
  - Flat surcharge
  - Per-mile surcharge
  - Percentage-based surcharge
  - Customer-specific FSC tables
- **Accessorial charge library** (40+ codes):
  - Detention (pickup/delivery, with free time rules)
  - Lumper fees
  - Stop-off charges
  - TONU (Truck Ordered Not Used)
  - Layover
  - Driver assist
  - Inside delivery
  - Liftgate
  - Residential delivery
  - Hazmat surcharge
  - Overweight/oversize
  - Tarping
  - Permits/escorts
  - Reefer fuel
  - Team driver premium
  - Weekend/holiday premium
  - And more...
- **Rate quoting** — quick quotes with win/loss tracking
- **Market rate comparison** — benchmarking quotes against market data

#### 3.4.2 Invoicing
**Features:**
- **Auto-invoicing** — generate on delivery confirmation
- **Billing methods:**
  - Prepaid
  - Collect
  - Third-party
  - Split billing
- **Batch invoicing** — bulk generate on schedule
- **EDI invoicing** — 210 transaction set
- **Email invoicing** — auto-send with PDF attachment
- **Customer portal invoicing** — self-service access
- **Credit memo management**
- **Payment terms** — Net 15/30/45/60, custom
- **Collections tracking** — aging buckets, follow-up workflow
- **Factoring integration** — auto-submit to factoring companies

#### 3.4.3 Accounts Payable
**Features:**
- **Vendor invoice processing**
- **Purchase order management**
- **Fuel card integration** — auto-post transactions (Comdata, EFS, WEX)
- **Carrier pay (brokerage)** — quick-pay, standard terms
- **Payment processing** — check, ACH, wire
- **AP aging reports**
- **1099 generation**

#### 3.4.4 Accounts Receivable
**Features:**
- **Payment posting** — manual + auto-match
- **Credit management** — credit limits, hold triggers
- **AR aging dashboard**
- **Collection workflows** — automated reminders, escalation
- **Write-off management**
- **Cash application** — match payments to invoices

#### 3.4.5 General Ledger Integration
**Features:**
- **Chart of accounts management**
- **Auto journal entries** from operations (loads, settlements, fuel)
- **Multi-company/division accounting**
- **Cost center allocation**
- **Period close management**
- **Export to external accounting systems** (QuickBooks, Sage, NetSuite)

#### 3.4.6 Fuel Tax & IFTA
**Features:**
- **Automated fuel tax calculation** — by jurisdiction
- **IFTA quarterly report generation**
- **Mileage-by-state tracking** (GPS-based)
- **Fuel purchase reconciliation** — fuel card data + manual entries
- **Electronic IFTA filing**
- **Audit trail** — full supporting documentation
- **Tax rate auto-updates**

### 3.5 SAFETY & COMPLIANCE

#### 3.5.1 Compliance Dashboard
**Features:**
- **Single-pane view:** all compliance items across drivers, equipment, company
- **Expiration calendar** — visual calendar of upcoming expirations
- **FMCSA BASICs tracking** — pull and display CSA scores
- **Audit preparation tools** — one-click document packages
- **Drug & alcohol program management** — random selection, scheduling, results
- **Training tracking** — required courses, completion status, renewals

#### 3.5.2 Accident Management
**Features:**
- **Mobile accident report** — driver submits from phone (photos, location, details, other party info)
- **Accident file management** — all documents, photos, correspondence
- **Insurance claim tracking** — status, amounts, contacts
- **Trend analysis** — accident patterns by driver, route, time, weather
- **Preventability determination workflow**
- **OSHA recordkeeping integration**

#### 3.5.3 Inspection Management
**Features:**
- **DOT inspection tracking** — results, violations, ratings
- **Roadside inspection correlation** — by driver, equipment, location
- **DataQs challenge management** — track disputes with FMCSA
- **Inspection trend analysis**

### 3.6 DOCUMENT MANAGEMENT

#### 3.6.1 Document Imaging (DocumentPower equivalent)
**Features:**
- **Multi-source capture:**
  - Mobile camera scan (driver app)
  - Email attachment auto-import
  - Fax integration
  - Bulk scanner import
  - Drag-and-drop upload
- **AI document recognition** — auto-classify document type (BOL, POD, rate con, invoice, etc.)
- **Auto-association** — link documents to loads via OCR/reference number matching
- **Document workflow:**
  - Received → Classified → Associated → Verified → Filed
  - Exception queue for unmatched documents
- **Search & retrieval** — full-text search across all documents
- **Audit trail** — who viewed/edited/downloaded, when
- **Retention policies** — auto-archive/delete per configurable rules

#### 3.6.2 Electronic Proof of Delivery (ePOD)
**Features:**
- **Digital signature capture** — on driver mobile app
- **Photo documentation** — freight condition at delivery
- **Timestamp + GPS stamp** — immutable delivery proof
- **Auto-attach to load** — instant availability for billing
- **Customer portal access** — shipper/consignee can pull PODs self-service

### 3.7 CUSTOMER MANAGEMENT

#### 3.7.1 Customer Database (CRM-lite)
**Features:**
- **Customer profiles:**
  - Company info, contacts (multiple), locations
  - Credit terms, billing preferences
  - Service requirements (equipment, certifications, special handling)
  - FSMA compliance requirements
  - Dock specifications per facility
  - Operating hours per facility
- **Contact management** — multiple contacts with roles
- **Communication log** — emails, calls, notes linked to customer
- **Performance tracking** — on-time %, claims rate, volume trends
- **Service level agreements** — define and monitor SLAs
- **Customer scoring** — profitability ranking

#### 3.7.2 Customer Portal
**Features:**
- **Self-service capabilities:**
  - Place orders / request quotes
  - Track shipments in real-time (map + status)
  - View/download PODs and documents
  - View/pay invoices
  - View shipment history
  - Rate and review service
- **Branded portal** — customer sees carrier's branding
- **Real-time notifications** — email/SMS for status changes
- **API access** — customers can integrate programmatically

#### 3.7.3 Facility/Location Database
**Features:**
- **Location profiles:**
  - Address + geocoordinates
  - Dock specifications (# of docks, height, width)
  - Operating hours
  - Appointment requirements
  - Average wait times (calculated from historical data)
  - Driver ratings & reviews
  - Special instructions
  - Contact information
  - Photos
- **Location search** — by name, city, state, customer, region
- **Community ratings** — drivers rate facilities (like McLeod's facility ratings)

### 3.8 EDI & INTEGRATIONS

#### 3.8.1 EDI Engine
**Supported Transactions:**
- **204** — Motor Carrier Load Tender (receive)
- **990** — Response to Load Tender (send)
- **214** — Shipment Status (send)
- **210** — Freight Invoice (send)
- **997** — Functional Acknowledgment (send/receive)
- **Custom transaction sets**

**Communication Protocols:**
- AS2
- SFTP
- HTTPS/REST
- API direct connect

**Features:**
- **Trading partner management** — setup, testing, monitoring
- **Auto-mapping** — EDI data → system fields
- **Error handling** — failed transactions queue, retry, alerts
- **Transaction logging** — full audit trail

#### 3.8.2 REST API (Modern FusionAPI)
**Features:**
- **Full CRUD API** — every entity accessible
- **GraphQL endpoint** — flexible querying for complex needs
- **Webhooks** — push notifications on events (load created, status change, delivered, invoice generated)
- **API key management** — per-partner keys with scoping
- **Rate limiting** — configurable per partner
- **OpenAPI/Swagger documentation** — auto-generated
- **SDK** — JavaScript/Python client libraries

#### 3.8.3 Integration Hub
**Pre-built connectors:**
- **ELD/Telematics:** Samsara, Motive, EROAD, ISAAC, Platform Science, Geotab, ORBCOMM
- **Fuel Cards:** Comdata, EFS, WEX, RTS
- **Mapping:** Mapbox, PC*Miler, Trimble Maps
- **Load Boards:** DAT, Truckstop, Convoy
- **Factoring:** multiple providers
- **Accounting:** QuickBooks, Sage, NetSuite, Xero
- **HR/Payroll:** ADP, Gusto
- **Background Checks:** Tenstreet, HireRight
- **Video Safety:** Lytx, Samsara (dual-use)
- **Document:** various scanning/imaging services
- **Communication:** Twilio (SMS), SendGrid (email)

### 3.9 ANALYTICS & BUSINESS INTELLIGENCE

#### 3.9.1 Executive Dashboard
**KPIs (real-time):**
- Revenue (daily/weekly/monthly/YTD)
- Margin by load/lane/customer/driver
- Load count + trend
- On-time pickup/delivery %
- Deadhead %
- Revenue per truck per week
- Driver turnover rate
- Equipment utilization %
- Claims rate + cost
- AR aging summary
- Operating ratio

#### 3.9.2 Operational Analytics
**Features:**
- **Lane analysis** — profitability, volume, rate trends by lane
- **Driver performance** — revenue, miles, on-time, safety scores
- **Customer profitability** — true cost-to-serve analysis
- **Equipment analysis** — utilization, maintenance cost, fuel efficiency
- **Detention analysis** — worst facilities, cost impact, trends

#### 3.9.3 Market Intelligence (MPact equivalent)
**Features:**
- **Rate benchmarking** — internal rates vs market
- **Lane demand indicators** — where capacity is tight/loose
- **Rate prediction** — ML-based rate forecasting
- **Competitor intelligence** — market positioning insights
- **Sales opportunity scoring** — which lanes/customers to pursue

#### 3.9.4 Report Builder
**Features:**
- **Pre-built reports library** (50+ standard reports across all modules)
- **Custom report builder** — drag-and-drop, filter, group, sort
- **Scheduled reports** — auto-generate and email on schedule
- **Export formats** — PDF, Excel, CSV
- **Report sharing** — share with roles/users, link-based access

### 3.10 WORKFLOW AUTOMATION (FlowLogix equivalent)

#### 3.10.1 Automation Engine
**Features:**
- **Visual workflow builder** — no-code, drag-and-drop
- **Trigger types:**
  - Event-based (load created, status changed, delivered, etc.)
  - Time-based (cron schedules)
  - Condition-based (if late > 2 hours, if margin < X%)
- **Action types:**
  - Send notification (email, SMS, in-app, push)
  - Update field/status
  - Create task/alert
  - Send EDI transaction
  - Trigger integration webhook
  - Assign to user
  - Escalate
- **Conditional logic** — if/then/else branching
- **Templates** — pre-built automation recipes:
  - "Late load alert chain"
  - "New order → auto-rate → auto-match → suggest assignment"
  - "Delivered → request POD → generate invoice → send"
  - "Driver cert expiring → alert safety → alert driver"

#### 3.10.2 Notification System
**Channels:**
- In-app notifications (real-time, persistent)
- Email
- SMS (Twilio)
- Push notifications (mobile PWA)
- Slack/Teams webhooks

**Features:**
- **Notification preferences** — per-user channel preferences
- **Quiet hours** — respect time zones
- **Escalation chains** — if not acknowledged within X minutes, escalate
- **Digest mode** — batch low-priority notifications

### 3.11 MOBILE APPLICATION (PWA)

#### 3.11.1 Driver Experience
**Features:**
- **Home dashboard:**
  - Current assignment card
  - Next stop + miles
  - Quick actions (scan, message, time off)
  - Settlement summary
  - Safety score
- **Load management:**
  - View assigned loads (upcoming, in-progress, completed)
  - Accept/reject loads
  - Navigate to stops (integrated mapping)
  - Report arrival/departure
  - View load details (freight, stops, special instructions)
- **Document capture:**
  - Scan BOL, POD, any document via camera
  - Signature capture for ePOD
  - Freight condition photos
  - Required document checklist (red indicators for missing)
- **Communication:**
  - Chat with dispatch
  - Push notifications
  - OS&D claim submission (with photos)
  - Accident reporting (photos, details, location)
- **Pay:**
  - Current settlement details
  - Pay history
  - Settlement PDF download
  - Pending vs cleared view
- **Profile:**
  - Certification status + expiration alerts
  - Work anniversary
  - Performance stats
  - Preferences management

#### 3.11.2 Operations Mobile (McLeod Anywhere equivalent)
**Features:**
- **Dispatch overview** — load status at a glance
- **Quick dispatch** — assign/reassign from mobile
- **Alert management** — acknowledge/act on critical alerts
- **Customer lookup** — quick access to customer info
- **Driver lookup** — find driver, see status, contact

### 3.12 LTL OPERATIONS (Optional Module)

#### 3.12.1 LTL Management
**Features:**
- **Manifest management** — consolidate multiple shipments
- **Stop sequence optimization** — route multiple deliveries
- **Revenue allocation** — split revenue across shipments
- **Cross-dock management** — trailer exchange points
- **Partner P&D integration** — pickup & delivery partners
- **Electronic manifesting**
- **LTL-specific rating** — class-based, density, FAK
- **Claims management** — damage, shortage, overage

### 3.13 BROKERAGE MODULE (Optional)

#### 3.13.1 Carrier Management
**Features:**
- **Carrier database** — qualifications, insurance, authority, safety ratings
- **Carrier scorecards** — performance tracking
- **Waterfall tendering** — automated carrier selection cascade
- **Rate negotiation** — bid management, counter-offers
- **Carrier portal** — self-service load acceptance, document upload
- **Capacity management** — track preferred carriers by lane

#### 3.13.2 Brokerage Operations
**Features:**
- **Load posting** — auto-post to load boards
- **Margin management** — buy vs sell rate tracking
- **Carrier compliance monitoring** — insurance expiration, authority checks
- **Commission tracking** — broker compensation management

### 3.14 SYSTEM ADMINISTRATION

#### 3.14.1 Configuration
**Features:**
- **Multi-tenant support** — isolate data per organization
- **Role-based access control:**
  - Admin
  - Dispatcher
  - Driver Manager
  - Safety Manager
  - Accounting/Billing
  - Sales/CRM
  - Driver (mobile)
  - Customer (portal)
  - Custom roles
- **Permission granularity** — module + action + data scope
- **System settings:**
  - Revenue codes
  - Charge codes (full library, customizable)
  - Location code formats
  - Numbering schemes (orders, invoices)
  - Business rules
  - Default values
  - Email templates
- **Audit logging** — all user actions logged
- **API key management**
- **Integration configuration** — manage all partner connections

#### 3.14.2 Data Management
**Features:**
- **Import/export tools** — bulk data migration
- **Backup management** — automated + on-demand
- **Data archival** — configurable retention policies
- **Database health monitoring** — performance metrics

---

## 4. USER EXPERIENCE — SCREEN-BY-SCREEN

### 4.1 Login & Onboarding
- Clean login page (email + password + MFA)
- First-time setup wizard (company info, users, basic config)
- Role-based onboarding tours

### 4.2 Main Navigation
- **Left sidebar** — collapsible, icon + label
  - Dashboard
  - Dispatch (Visual Planner)
  - Orders
  - Drivers
  - Equipment
  - Customers
  - Billing
  - Safety & Compliance
  - Documents
  - Analytics
  - Integrations
  - Settings
- **Top bar** — search (global), notifications bell, user menu
- **Command palette** — Cmd+K for power users (search anything, jump anywhere)

### 4.3 Key Screens

**Dashboard:** Bento-style grid of KPI cards with live data, mini-charts, status indicators. Role-aware (dispatcher sees ops metrics, accounting sees financial metrics).

**Visual Planner:** Full-width, data-dense. Timeline + map + load list. Real-time WebSocket updates. This is where dispatchers live — it needs to be fast, information-dense, and zero-friction.

**Order Detail:** Tabbed view — Overview, Stops, Documents, Charges, Tracking, History. Slide-out panels for related data (driver info, equipment, customer).

**Driver Profile:** Header card (photo, name, status, key stats) + tabbed content (qualifications, loads, pay, safety, documents, preferences).

**Settlement Run:** Table view with inline editing, bulk select, preview/approve workflow. PDF generation inline.

**Analytics:** Dashboard builder with draggable widgets. Pre-built templates for common views.

---

## 5. AI FEATURES (Woven In, Not Bolted On)

### 5.1 AI-Powered Order Entry
- Paste email text → AI extracts order fields → human confirms → order created
- Upload rate confirmation PDF → AI parses → pre-fills order
- Voice-to-order (future): dispatcher speaks load details

### 5.2 Smart Load Matching
- AI scores driver-load compatibility (beyond simple proximity)
- Considers: profitability, driver satisfaction, equipment optimization, deadhead reduction
- Learns from dispatcher overrides to improve recommendations

### 5.3 Predictive ETAs
- ML model trained on historical GPS data, traffic patterns, driver behavior, facility wait times
- More accurate than simple distance/speed calculations
- Updates continuously as load progresses

### 5.4 Rate Intelligence
- AI suggests optimal rates based on lane, market, customer, season, capacity
- Win/loss prediction on quotes
- Margin optimization recommendations

### 5.5 Document AI
- Auto-classify uploaded documents
- Extract data from BOLs, PODs, invoices
- Flag discrepancies (weight mismatch, address mismatch)

### 5.6 Anomaly Detection
- Flag unusual patterns: unexpected detention, route deviations, billing anomalies
- Predictive maintenance alerts based on equipment patterns

---

## 6. NON-FUNCTIONAL REQUIREMENTS

### 6.1 Performance
- Page load: < 2 seconds
- Real-time updates: < 500ms latency
- Search: < 200ms response
- Support 100+ concurrent users per org
- Handle 10,000+ active loads without degradation

### 6.2 Security
- SOC 2 Type II compliance path
- Data encryption at rest + in transit
- RBAC with row-level security
- MFA support
- Session management
- API rate limiting
- Audit logging

### 6.3 Reliability
- 99.9% uptime target
- Automated backups (hourly incremental, daily full)
- Disaster recovery plan
- Zero-downtime deployments

### 6.4 Scalability
- Horizontal scaling via containerization
- Database read replicas for analytics
- CDN for static assets
- Queue-based processing for heavy operations

---

## 7. PHASED BUILD PLAN

### Phase 1: Foundation (MVP)
- Auth + RBAC + multi-tenant
- Core data models (orders, drivers, equipment, customers)
- Order entry + management
- Basic dispatch (list view, assignment)
- Driver profiles + basic management
- Equipment tracking
- Basic billing (invoice generation)
- Design system + component library

### Phase 2: Operations Core
- Visual Planner (drag-and-drop timeline + map)
- Real-time tracking (WebSocket + map integration)
- Load matching engine
- Driver settlements
- Document management (upload, associate, search)
- Mobile driver experience (PWA)
- Notification system

### Phase 3: Financial & Compliance
- Full billing engine (rating, accessorials, FSC)
- AP/AR management
- IFTA/fuel tax
- Safety & compliance dashboard
- HOS integration (ELD connectors)
- Customer portal

### Phase 4: Intelligence & Automation
- Analytics dashboards + report builder
- AI features (order entry, load matching, rate intelligence)
- Workflow automation engine
- Market intelligence
- Advanced integrations (EDI, load boards, fuel cards)

### Phase 5: Extensions
- LTL module
- Brokerage module
- HirePower recruiting
- Maintenance management
- Advanced AI (predictive maintenance, anomaly detection)

---

## 8. NAMING & BRANDING

**Working name:** Apollo TMS
**Tagline options:**
- "Move smarter."
- "Operations, modernized."
- "The TMS that doesn't look like 2005."

**Design identity:**
- Emerald accent on zinc/slate base
- Geist typography
- Clean, premium, data-rich
- The anti-McLeod — modern but just as powerful

---

*This PRD is the single source of truth for the Apollo TMS build. Every feature maps to a McLeod LoadMaster capability or exceeds it. The goal: 100% functional parity with a 10x better experience.*
