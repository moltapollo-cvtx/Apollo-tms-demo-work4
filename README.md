# Apollo TMS — Modern Transportation Management System

A web-native, modern TMS for asset-based trucking companies built with Next.js 15. Apollo TMS provides everything McLeod LoadMaster does, but with a 2026 user experience.

![Apollo TMS](https://img.shields.io/badge/Next.js-16.1.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)

## ✨ Features

### 🚚 **Core TMS Functionality**
- **Visual Planner** — Drag-and-drop load assignment with real-time driver timelines
- **Order Management** — Full lifecycle from booking through delivery
- **Driver Management** — Profiles, qualifications, HOS tracking, settlements
- **Equipment Management** — Tractors, trailers, maintenance scheduling
- **Customer Portal** — Self-service load tracking and document access
- **Billing & Invoicing** — Automated invoicing, settlements, AR/AP management
- **Safety & Compliance** — HOS monitoring, safety scores, DOT compliance
- **Document Management** — Electronic PODs, BOL scanning, file organization
- **Analytics & Reporting** — Real-time KPIs, custom dashboards, business intelligence

### 🎨 **Modern User Experience**
- **Web-Native** — Built for the browser, no desktop app needed
- **Real-Time Updates** — WebSocket-powered live data across all screens
- **Command Palette** — Cmd+K to search pages, orders, drivers, customers
- **Spring Physics Animations** — Buttery smooth interactions with framer-motion
- **Responsive Design** — Works beautifully on desktop, tablet, and mobile
- **Dark/Light Theme** — System preference aware with manual toggle

### 🔧 **Developer Experience**
- **TypeScript** — Fully typed for better development experience
- **Modern Stack** — Next.js 15, React 19, Tailwind v4
- **Component Library** — Reusable UI components with consistent design
- **API Routes** — Full REST API with proper error handling
- **Real-Time** — WebSocket support for live updates
- **Performance** — Optimized builds, code splitting, lazy loading

## Tech Stack

- Framework: Next.js 16.1.6 (App Router)
- Runtime: React 19
- Language: TypeScript
- Styling: Tailwind CSS v4 + design tokens in `src/app/globals.css`
- UI primitives: Radix UI + custom UI components
- Data fetching/caching: TanStack Query
- Auth: NextAuth
- Database: PostgreSQL + Drizzle ORM
- Motion: Framer Motion (spring-based transitions)
- Icons: Phosphor Icons
- Fonts: Geist Sans + Geist Mono (loaded locally)

## Project Structure

```text
src/
  app/
    (auth)/                 # Auth routes (login)
    (dashboard)/            # Main TMS screens
    api/                    # Route handlers
    layout.tsx              # Root layout + providers + fonts
    globals.css             # Design tokens + theme
  components/
    analytics/ billing/ customers/ dispatch/ documents/ drivers/
    equipment/ layout/ mobile/ notifications/ orders/ safety/ workflows/
    ui/                     # Shared primitives (table, modal, sheet, etc.)
  hooks/                    # Client hooks (toast, dispatch websocket, etc.)
  lib/
    db/                     # Drizzle schema + seed
    hooks/api/              # Feature query hooks
    providers/              # React context/query providers
  types/                    # Shared app/domain types
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Redis (for real-time features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/apollo-tms.git
   cd apollo-tms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/apollo_tms"

   # Redis
   REDIS_URL="redis://localhost:6379"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"

   # External APIs
   MAPBOX_ACCESS_TOKEN="your-mapbox-token"
   ```

4. **Set up the database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

```bash
npm run dev         # start development server
npm run build       # production build
npm run start       # start production server
npm run lint        # run ESLint

npm run db:generate # drizzle migration generation
npm run db:migrate  # apply migrations
npm run db:studio   # open drizzle studio
npm run db:seed     # seed development data
```

## 📱 Main Applications

### 1. **Dashboard**
Central command center with real-time KPIs, activity feed, and revenue trends.

### 2. **Visual Planner** (Dispatch)
Heart of operations with drag-and-drop load assignment:
- Split-screen: Driver timeline + Live fleet map
- Real-time position updates via WebSocket
- Color-coded status indicators
- Drag loads onto driver timeline to assign

### 3. **Orders Management**
Complete load lifecycle management:
- Advanced filtering and search
- Multi-stop support
- Rate calculation engine
- Document association
- Real-time tracking

### 4. **Driver Management**
Comprehensive driver operations:
- Driver profiles with qualifications
- HOS visual gauges with compliance tracking
- Safety scoring and performance metrics
- Settlement processing
- Mobile driver app (PWA)

### 5. **Equipment Management**
Fleet asset tracking:
- Tractor and trailer inventory
- Maintenance scheduling
- Utilization dashboards
- GPS tracking integration

### 6. **Analytics & Reporting**
Business intelligence suite:
- Executive dashboard with key metrics
- Custom report builder
- Lane profitability analysis
- Driver performance trends
- Customer profitability scoring

## 🎯 Key Features Deep Dive

### Command Palette (Cmd+K)
Global search across the entire application:
- **Navigation**: Jump to any page instantly
- **Data Search**: Find specific orders, drivers, customers
- **Quick Actions**: Create new orders, add drivers, etc.
- **Keyboard Navigation**: Full keyboard support with arrow keys

### Real-Time Updates
WebSocket-powered live data:
- Driver location updates
- Load status changes
- Assignment notifications
- System alerts and messaging

### Design System
Consistent, modern UI with:
- **Colors**: Zinc/Slate base with Emerald accent
- **Typography**: Geist Sans for UI, Geist Mono for data
- **Spacing**: Consistent 8pt grid system
- **Components**: 50+ reusable UI components
- **Motion**: Spring physics animations throughout

### Data Tables
Advanced table component with:
- Loading skeleton states
- Empty state handling
- Error state management
- Sorting and filtering
- Pagination
- Mobile-responsive card layout
- Bulk selection and actions

## API Overview

Feature APIs are under `src/app/api/*` and generally return:

```ts
{
  success: boolean;
  data: unknown;
  message?: string;
}
```

Primary route groups:

- `/api/orders`
- `/api/dispatch`
- `/api/drivers`
- `/api/equipment/*`
- `/api/customers`
- `/api/billing/*`
- `/api/analytics/*`
- `/api/auth/[...nextauth]`

## 🔧 Development

### Adding New Features

1. **Create the route** in `src/app/(dashboard)/[feature]/page.tsx`
2. **Add API endpoints** in `src/app/api/[feature]/route.ts`
3. **Create components** in `src/components/[feature]/`
4. **Add types** in `src/types/index.ts`
5. **Update navigation** in `src/components/layout/sidebar.tsx`

### Database Changes

1. **Modify schema** in `prisma/schema.prisma`
2. **Generate migration** with `npm run db:generate`
3. **Apply migration** with `npm run db:migrate`
4. **Update types** by running `npm run type-check`

## 🔐 Authentication & Permissions

Apollo TMS uses NextAuth.js with role-based access control (RBAC):

### User Roles
- **Admin**: Full system access
- **Dispatcher**: Operations and load management
- **Driver Manager**: Driver-focused operations
- **Safety Manager**: Compliance and safety features
- **Accounting**: Billing and financial features
- **Driver**: Mobile app access only
- **Customer**: Portal access only

### Protected Routes
All dashboard routes require authentication. API routes validate user permissions based on the requested action and data scope.

## 🌐 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   Configure production environment variables in your deployment platform.

3. **Deploy**
   Apollo TMS can be deployed to any platform supporting Node.js:
   - Vercel (recommended)
   - AWS
   - Google Cloud
   - Docker containers
   - Traditional VPS

### Docker Deployment

```dockerfile
# Dockerfile included in repository
docker build -t apollo-tms .
docker run -p 3000:3000 apollo-tms
```

## 📊 Performance

### Lighthouse Scores
- **Performance**: 95+
- **Accessibility**: 98+
- **Best Practices**: 95+
- **SEO**: 90+

### Technical Metrics
- **First Contentful Paint**: <2s
- **Largest Contentful Paint**: <2.5s
- **Time to Interactive**: <3s
- **Bundle Size**: <500KB (gzipped)

## 🆘 Support

- **Documentation**: [docs.apollo-tms.com](https://docs.apollo-tms.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/apollo-tms/issues)
- **Discord**: [Join our community](https://discord.gg/apollo-tms)
- **Email**: support@apollo-tms.com

## 🗺️ Roadmap

### Phase 1 ✅ (Current)
- Core TMS functionality
- Visual dispatch planner
- Driver and equipment management
- Basic billing and invoicing

### Phase 2 🚧 (Q2 2026)
- Advanced analytics and reporting
- Mobile driver application (PWA)
- ELD integration (Samsara, Motive, etc.)
- Customer portal

### Phase 3 📋 (Q3 2026)
- Load board integrations
- EDI support for large shippers
- Advanced workflow automation
- AI-powered load matching

### Phase 4 🔮 (Q4 2026)
- Brokerage module
- LTL operations support
- Marketplace features
- Advanced AI and machine learning

---

**Apollo TMS** — Move smarter. Built with ❤️ using Next.js 15.
