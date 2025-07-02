# CourseFlow Agent Guide

## Commands
- **Development**: `npm run dev` (starts Next.js dev server on http://localhost:3000)
- **Build**: `npm run build` (production build)
- **Lint**: `npm run lint` (ESLint with Next.js config)
- **Start**: `npm start` (production server)

## Architecture
Full-stack university course management system with Next.js 14 frontend and external API backend.

**Key Features**: User authentication (STUDENT/LECTURER/ADMIN roles), course/department/schedule management, complaint system, verification codes, bulk uploads.

**Structure**:
- `src/app/`: Next.js App Router pages (admin, auth, courses, dashboard, departments, schedule, complaints)
- `src/components/`: React components + shadcn/ui (navigation.tsx, ui/)
- `src/lib/`: API client (api.ts) connecting to external backend, utilities (utils.ts)
- `src/contexts/`: AuthContext with role-based access control
- `src/hooks/`: Custom hooks (use-toast.ts)
- `src/types/`: Complete TypeScript definitions for API models and responses

## API & Data
- **Backend**: External API at `http://localhost:3001/api/v1` with comprehensive REST endpoints
- **Authentication**: JWT tokens with localStorage persistence
- **Models**: User, Department, Course, Schedule, Complaint, VerificationCode with proper relationships
- **Pagination**: Built-in pagination support for all list endpoints

## Code Style
- **Imports**: `@/` alias for src/, destructured imports preferred
- **Components**: Functional components with named exports, forwardRef for UI components
- **TypeScript**: Strict mode, strong typing with enums and interfaces
- **Auth**: Role-based access (`isAdmin`, `isLecturer`, `isStudent`)
- **Client Components**: `'use client'` directive for interactive components
- **Styling**: Tailwind CSS with shadcn/ui, CSS variables for theming
