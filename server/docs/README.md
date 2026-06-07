# RoiNet Insurance Tracker - Developer Documentation

## Overview

This documentation provides a comprehensive, phase-by-phase guide to the RoiNet Insurance Tracker application. Each phase represents a major milestone in the development process and includes detailed information about features, architecture decisions, and implementation details.

## Documentation Structure

Each phase is documented in a separate markdown file following the naming convention:
```
phase-{number}-{brief-description}.md
```

## Completed Phases

### [Phase 1: Foundation & Database Setup](./phase-1-foundation-database-setup.md)
**Status**: ✅ Completed  
**Summary**: Initial project setup, database schema design, and core infrastructure

- Project structure setup (Next.js + NestJS)
- MS SQL Server with Docker
- Prisma ORM integration
- Database schema for Users, POSPs, and Deals
- Initial migration and seeding

---

### [Phase 2: CQRS & Event-Driven Architecture](./phase-2-cqrs-event-driven-architecture.md)
**Status**: ✅ Completed  
**Summary**: Implementation of CQRS pattern and Event-Driven Architecture

- Command-Query Responsibility Segregation (CQRS)
- Event-driven architecture with EventBus
- Command and Query handlers
- Event listeners with proper error handling
- Repository pattern for data access
- Service layer refactoring

---

### [Phase 3: Role-Based Access Control](./phase-3-role-based-access-control.md)
**Status**: ✅ Completed  
**Summary**: Comprehensive RBAC system with custom decorators and guards

- Role decorators (@Roles, @Public, @AdminOnly, @PospOnly)
- Enhanced RolesGuard with logging and validation
- Authorization decorators
- Controller updates with role protection
- Comprehensive RBAC documentation

---

## Upcoming Phases

### Phase 4: Frontend Development
**Status**: 🔄 Planned  
**Scope**: 
- React components with Atomic Design
- API integration
- Authentication flow
- Dashboard and analytics

### Phase 5: Advanced Features
**Status**: 📋 Backlog  
**Scope**:
- Notifications system
- File uploads
- Reporting and exports
- Email integration

### Phase 6: Testing & Quality
**Status**: 📋 Backlog  
**Scope**:
- Unit tests
- Integration tests
- E2E tests
- Code coverage

### Phase 7: DevOps & Deployment
**Status**: 📋 Backlog  
**Scope**:
- CI/CD pipeline
- Docker deployment
- Environment configuration
- Monitoring and logging

---

## How to Use This Documentation

### For New Developers
1. Start with **Phase 1** to understand the foundation
2. Read **Phase 2** to understand the architecture patterns
3. Review **Phase 3** for authentication and authorization
4. Read the current phase you'll be working on

### For Feature Development
1. Read the relevant phase documentation
2. Follow the established patterns and conventions
3. Update the documentation when adding new features
4. Create a new phase document for major features

### For Maintenance
1. Refer to the phase where the feature was implemented
2. Check the architecture decisions and rationale
3. Follow the same patterns for consistency

---

## Additional Documentation

- [RBAC Decorators Guide](./RBAC_DECORATORS.md) - Detailed guide on role-based access control
- [Backend Rules](./../.cursor/rules/) - Cursor rules for maintaining code standards
- [API Documentation](http://localhost:3001/api/docs) - Swagger/OpenAPI docs (when server is running)

---

## Contributing to Documentation

When implementing a new feature:

1. **Determine if it's a new phase** - Major features deserve their own phase
2. **Update existing phase** - Minor features can be added to existing phase docs
3. **Follow the template** - Use the structure from existing phase documents
4. **Include code examples** - Show actual implementation code
5. **Document decisions** - Explain why certain approaches were chosen

### Documentation Template

```markdown
# Phase {N}: {Brief Description}

**Implementation Date**: {Date}  
**Status**: {Completed/In Progress/Planned}  
**Developer(s)**: {Names}

## Overview
Brief description of what this phase accomplishes

## Goals
- Goal 1
- Goal 2

## Implementation Details
### Feature 1
Description and code examples

### Feature 2
Description and code examples

## Architecture Decisions
Why certain choices were made

## Testing
How to test this phase

## Future Considerations
What could be improved or extended
```

---

## Tech Stack Reference

### Backend
- **Framework**: NestJS 11.x
- **Database**: MS SQL Server 2022
- **ORM**: Prisma 6.x
- **Authentication**: JWT with Passport
- **Architecture**: CQRS + Event-Driven

### Frontend
- **Framework**: Next.js 16.x
- **React**: 19.x
- **Styling**: TailwindCSS (planned)
- **State Management**: React Context (planned)

### DevOps
- **Containerization**: Docker
- **Database Container**: MS SQL Server
- **Version Control**: Git

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop
- Git

### Quick Start
```bash
# Clone repository
git clone <repository-url>

# Install dependencies
cd app && npm install
cd ../server && npm install

# Start database
docker compose up -d

# Run database migrations
cd server && npm run db:push
npm run db:seed

# Start backend
npm run start:dev

# Start frontend (in another terminal)
cd app && npm run dev
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs
- Database: localhost:1433

---

## Maintenance

This documentation should be updated:
- ✅ When completing a new phase
- ✅ When making significant changes to existing features
- ✅ When architectural decisions change
- ✅ When adding new dependencies or tools
- ✅ When updating the tech stack

---

## Questions or Issues?

For questions about the documentation:
1. Check the relevant phase document
2. Review the code examples
3. Check the Cursor rules in `.cursor/rules/`
4. Refer to external documentation (NestJS, Next.js, Prisma)

---

**Last Updated**: June 7, 2026  
**Version**: 1.0.0
