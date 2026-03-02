# HANDOFF — Apollo TMS Stage (work4)

**Date:** March 2, 2026 6:57 AM CST  
**Repo:** https://github.com/moltapollo-cvtx/Apollo-tms-demo-work4  
**Local:** `~/Projects/apollo-tms-demo-work4/`  
**Server:** Port 3003, production mode, `npx next start -p 3003 -H 0.0.0.0`  
**LAN URL:** http://10.0.0.139:3003  
**Framework:** Next.js 16 with Turbopack  

---

## What This Is

A fully functional TMS (Transportation Management System) tech demo for Apollo Energy Resources. All data is mock — no real database. Uses next-auth but auth is bypassed via a passthrough `src/proxy.ts` (Next.js 16 uses proxy.ts instead of middleware.ts).

---

## Commit History (work4)

| Commit | Description | Potential Issues |
|--------|-------------|-----------------|
| `9bdd10c` | **Baseline** — snapshot from work3 branch `claude/fix-sidebar-toggle-SzPmE` | Known good state |
| `272f038` | **Driver planner Gantt fix** — loads laid out sequentially on x-axis | ⚠️ See notes below |
| `ef3928b` | **Mobile sidebar fix** — always opens expanded on mobile | ⚠️ See notes below |
| `fc0172a` | **Scroll lock + fleet map mobile** — overflow-x hidden site-wide | ⚠️ See notes below |

---

## Recent Changes — Detailed Review Needed

### 1. Driver Planner / Timeline (`src/components/dispatch/driver-timeline.tsx`)
**Commit:** `272f038`  
**Intent:** Loads were stacking vertically on the same day. Fix makes them lay out sequentially on the x-axis like a Gantt chart.

**What was changed:**
- `getLoadDuration()` — now returns 1.5-3x `COL_WIDTH_PCT` based on order status (was always 1x)
- `computeAssignmentRows()` — now returns an `offsets` Map that pushes overlapping loads rightward with a 0.5% gap. All loads go to row 0 (no vertical stacking)
- Rendering uses `assignmentOffsets?.get(id)` for `leftPosition` instead of raw `getTimelinePosition()`

**Potential mistakes:**
- Loads could extend past the right edge of the timeline if there are many per driver (no clamping)
- The `maxRow` is always 0 now, which collapses lane height — may look wrong if a driver has many loads
- The `offsets` map is returned from `computeAssignmentRows` but the TypeScript return type wasn't explicitly updated (relies on inference)
- Duration multipliers (1.5x, 2x, 3x) are arbitrary — may not look right visually

### 2. Mobile Sidebar (`src/components/layout/sidebar.tsx`)
**Commit:** `ef3928b`  
**Intent:** Sidebar was opening collapsed (icons only) on mobile because `useState(true)`.

**What was changed:**
- Renamed `collapsed` state to `desktopCollapsed`
- Added computed: `const collapsed = isMobileOpen ? false : desktopCollapsed;`
- Toggle button uses `setDesktopCollapsed` instead of `setCollapsed`

**Potential mistakes:**
- `isMobileOpen` is a prop, and when the mobile overlay closes (`isMobileOpen` → false), `collapsed` reverts to `desktopCollapsed` (true). This is correct behavior.
- However, if `sidebarContent` is rendered in both desktop and mobile aside elements, the mobile aside might flash from expanded to collapsed during the AnimatePresence exit animation since `isMobileOpen` becomes false before the exit animation completes. This could cause a visual glitch.

### 3. Scroll Lock + Fleet Map Mobile (`src/app/globals.css` + `src/app/(dashboard)/fleet-map/page.tsx`)
**Commit:** `fc0172a`  
**Intent:** Prevent accidental horizontal scrolling site-wide; fix fleet map on iOS.

**What was changed in globals.css:**
```css
html, body {
  overflow-x: hidden;
  overscroll-behavior-x: none;
}
*, *::before, *::after {
  box-sizing: border-box;
}
.horizontal-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}
```

**What was changed in fleet-map/page.tsx:**
- Main container: `-mx-6 -mt-6` → `-mx-3 -mt-3 md:-mx-6 md:-mt-6`
- Main container: `h-[calc(100vh-4rem)]` → `h-[calc(100dvh-4rem)]`
- Map shell: `min-h-0` → `min-h-[50vh]`
- Map shell: `rounded-[2rem]` → `rounded-2xl md:rounded-[2rem]`

**Potential mistakes:**
- `overflow-x: hidden` on `html, body` is aggressive — it could clip absolutely positioned elements (dropdowns, tooltips, modals) that extend past the viewport edge. Popovers using `position: fixed` are fine, but `position: absolute` relative to body could be clipped.
- The `box-sizing: border-box` on `*` shouldn't cause issues (it's best practice) but if any component relied on `content-box` sizing, it could break.
- `.horizontal-scroll` class was added but NOT applied to any existing elements — the existing elements still use Tailwind's `overflow-x-auto` class directly, which should still work since they're children of the body, not the body itself.
- Fleet map `-mx-3` on mobile may not perfectly align with the page padding — test visually.

---

## Critical Files

| File | Purpose |
|------|---------|
| `src/proxy.ts` | **Auth bypass** — must be passthrough for demo. Gets overwritten if pulling from remote. |
| `.env.local` | `NEXTAUTH_URL=http://10.0.0.139:3003`, `NEXTAUTH_SECRET=apollo-tms-dev-secret-2026` |
| `src/components/layout/sidebar.tsx` | Sidebar — desktop collapsed by default, mobile always expanded |
| `src/components/dispatch/driver-timeline.tsx` | Driver visual planner / Gantt chart |
| `src/app/globals.css` | Global styles including scroll lock |
| `src/app/(dashboard)/fleet-map/page.tsx` | Fleet map page with Leaflet |

---

## How to Rebuild 3003

```bash
pkill -f "next start"
sleep 2
cd ~/Projects/apollo-tms-demo-work4
npm install
npm run build -- --webpack
nohup npx next start -p 3003 -H 0.0.0.0 > /tmp/stage.log 2>&1 &
```

---

## If Pulling from Remote

ALWAYS restore these after pulling:

**src/proxy.ts:**
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export default function proxy(req: NextRequest) { return NextResponse.next(); }
export const config = { matcher: [] };
```

**.env.local:**
```
NEXTAUTH_SECRET=apollo-tms-dev-secret-2026
NEXTAUTH_URL=http://10.0.0.139:3003
```

---

## Known Good Baseline

If the recent changes (commits after `9bdd10c`) need to be reverted:
```bash
git revert fc0172a ef3928b 272f038
```
Or hard reset to baseline:
```bash
git reset --hard 9bdd10c
```

---

## Skip List
- `src/app/(dashboard)/ai/page.tsx` — Walker said skip, too involved
- Finance Dashboard (port 3001) and Mission Control (port 3002) LaunchAgents are unloaded to free memory
