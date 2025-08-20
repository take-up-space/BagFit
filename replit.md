# BagFit - Airline Bag Compliance Checker

## Overview

BagFit is a web application that helps travelers determine whether their personal bags will fit under airplane seats. The app compares user-entered bag dimensions against airline-specific underseat space requirements, with support for verified airline data, community contributions, and future AI-powered measurement features.

The application follows a three-phase development roadmap: Phase 1 (MVP - Complete) focuses on core functionality with verified data and user authentication, Phase 2 adds enhanced UX and community data features, and Phase 3 introduces AI/AR measurement capabilities. See ROADMAP.md for detailed feature planning.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 20, 2025)

### Fixed Major Issues
- **Landing Page Routing**: Fixed root URL "/" to properly show Landing page; added "/home" route for main app functionality
- **Navigation Flow**: Fixed all navigation buttons ("Try as Guest", "Login", "Home") to properly route to "/home" instead of circular Landing page redirects
- **Authentication Callback**: Updated login success redirect from "/" to "/home" so users land on functional app page after authentication
- **Popular Bags Filtering**: Enhanced getPopularBags() function to only show verified/pre-loaded bags (96 bags), filtering out user-created "Custom" bags
- **Pet Carrier Support**: Pet carrier checkbox in manual entry form controls both filtering and bag creation
- **User Bag Management**: Resolved "My Bags" dropdown errors for unauthenticated users with proper authentication checks

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with JSON responses

### Database Design
- **Primary Database**: PostgreSQL via Neon Database
- **Schema Management**: Drizzle Kit for migrations
- **Core Tables**: 
  - Users (authentication and preferences)
  - Airlines (carrier data with verification status)
  - Bags (manufacturer specifications)
  - User Bags (personal bag collections)
  - Bag Checks (compliance check history)
- **Data Verification**: Enum-based verification status system (VERIFIED_OFFICIAL, UNVERIFIED_CONSERVATIVE, NEEDS_REVIEW)

### Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **User Management**: Profile data synchronization with Replit user accounts
- **Authorization**: Route-level authentication middleware

### Key Business Logic
- **Dimension Comparison**: Core algorithm comparing bag dimensions to airline underseat space limits
- **Unit Conversion**: Automatic conversion between inches and centimeters
- **Pet Carrier Rules**: Special validation logic for pet carrier compliance
- **Fallback Search**: Google Custom Search API integration for missing bag data
- **Community Data**: User-contributed dimension corrections and verification

### Development Workflow
- **Development**: Hot reload with Vite dev server and TSX for backend (`npm run dev`)
- **Build Process**: Client-side Vite build + server-side ESBuild bundling (`npm run build`)
- **Production**: Node.js server with built assets (`npm start`)
- **Type Safety**: Shared TypeScript schema between client and server
- **Code Organization**: Monorepo structure with shared types and utilities

### Deployment Configuration
- **Build Command**: `npm run build` (builds both frontend and backend)
- **Run Command**: `npm start` (uses NODE_ENV=production with built assets)
- **Environment**: Production mode with optimized builds
- **Port**: Server listens on all interfaces (0.0.0.0) for Replit deployment compatibility

## External Dependencies

### Authentication & User Management
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware with OpenID Connect strategy

### Database & ORM
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL adapter
- **connect-pg-simple**: PostgreSQL session store for Express

### Search Integration
- **Google Custom Search API**: Fallback for missing bag dimension data
- **Search functionality**: Automated bag specification lookup from manufacturer websites

### UI Framework & Styling
- **Radix UI**: Headless component library for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Wouter**: Lightweight routing library

### Data Fetching & State Management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state and validation
- **Zod**: Runtime type validation and schema definition

### Development Tools
- **Vite**: Frontend build tool and dev server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production
- **TSX**: TypeScript execution for development server