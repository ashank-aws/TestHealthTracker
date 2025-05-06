# Architecture Overview

## Overview

This application is a Test Environment Management System designed to track, monitor, and book test environments. It provides metrics on environment health, booking functionality, and fund management features. The system follows a standard client-server architecture with a React frontend and Node.js/Express backend, utilizing PostgreSQL for data persistence.

## System Architecture

The application follows a monorepo structure with clear separation between client and server components:

```
/
├── client/           # Frontend React application
├── server/           # Express backend server
├── db/               # Database configuration and seeding
├── shared/           # Shared code (schemas, types)
└── public/           # Static assets (built during deployment)
```

### Key Technical Choices

- **Frontend**: React with TypeScript, utilizing React Query for data fetching and state management
- **UI Components**: ShadCN UI component library built on Radix UI primitives
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL via Neon Serverless, with Drizzle ORM for database operations
- **API Pattern**: RESTful API with JSON payloads
- **Authentication**: Simple username/password authentication
- **Deployment**: Configured for Replit with autoscaling

## Key Components

### Frontend Architecture

The frontend is a single-page application built with React, organized as follows:

- **Pages**: Route-specific components (Dashboard, EnvironmentBookings, FundManagement)
- **Components**: Reusable UI components, including:
  - Core application components (`booking-form.tsx`, `metric-card.tsx`, etc.)
  - UI library components (based on shadcn/ui)
- **Hooks**: Custom React hooks for toast notifications, mobile detection
- **Lib**: Utility functions and shared resources
  - API request handling via React Query
  - UI utilities

The application uses Wouter for routing and TailwindCSS for styling with a cohesive design system based on CSS variables.

### Backend Architecture

The server is built with Express.js and is structured as follows:

- **API Routes**: RESTful endpoints for resources (environments, metrics, bookings, etc.)
- **Storage Layer**: Database access abstraction with Drizzle ORM
- **Middleware**: Request processing, error handling, logging
- **Vite Integration**: Development environment setup

The server follows a controller-service pattern where routes delegate to storage functions for database operations.

### Database Schema

The database uses PostgreSQL with the following key entities:

- **Environments**: Test environments that can be monitored and booked
- **Metrics**: Performance metrics for environments (uptime, MTTR, MTBF, etc.)
- **DailyStatus**: Daily health status of environments
- **Teams**: Groups that can book environments
- **Bookings**: Reservations of environments
- **Incidents**: Recorded issues with environments
- **Users**: System users
- **Funds**: Budget tracking for environment usage

The schema is defined using Drizzle ORM, with relations between entities and validation through Zod schemas.

## Data Flow

### Client-Server Interaction

1. Client makes API requests via React Query
2. Express server handles requests through defined routes
3. Routes use storage layer to interact with database
4. Database operations are performed using Drizzle ORM
5. Results are returned as JSON to the client
6. React Query caches responses and updates UI

### Environment Monitoring Flow

1. Metrics are collected and stored in the database
2. Dashboard fetches latest metrics and health analytics
3. Data is displayed through charts and metric cards
4. Status calendar shows historical health data

### Booking Flow

1. User selects environment and time period
2. Booking request is sent to server
3. Server checks availability and creates booking
4. Bookings are displayed in tables with filtering options

## External Dependencies

### Key Frontend Dependencies

- **@tanstack/react-query**: Data fetching and state management
- **Radix UI**: Headless UI components
- **TailwindCSS**: Utility-first CSS framework
- **Wouter**: Lightweight routing
- **date-fns**: Date manipulation

### Key Backend Dependencies

- **Express**: Web server framework
- **Drizzle ORM**: Database ORM
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **Zod**: Schema validation

## Deployment Strategy

The application is configured for deployment on Replit with the following workflow:

1. **Development**: Local development using Vite dev server
2. **Build**: 
   - Frontend: Vite builds static assets
   - Backend: esbuild bundles server code
3. **Runtime**: 
   - Node.js serves the Express application
   - Static assets are served from the `dist/public` directory
4. **Database**: Connects to Neon PostgreSQL via environment variables

### Environment Configuration

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Runtime environment detection

The deployment uses Replit's deployment target configuration for autoscaling.

## Security Considerations

- Passwords are stored in plain text (should be improved with hashing)
- No JWT or session management implemented yet
- API endpoints lack proper authentication/authorization
- Database connections are protected via connection string

## Future Enhancement Opportunities

- Implement proper authentication with JWTs or sessions
- Add user roles and permissions
- Enhance security with password hashing
- Add real-time notifications using WebSockets
- Implement CI/CD pipeline for testing