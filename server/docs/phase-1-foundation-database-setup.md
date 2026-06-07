# Phase 1: Foundation & Database Setup

**Implementation Date**: June 6, 2026  
**Status**: ✅ Completed  
**Developer(s)**: Development Team

## Overview

This phase establishes the foundational architecture of the RoiNet Insurance Tracker, including project structure, database design, and core infrastructure setup. The goal was to create a solid, scalable foundation for future development.

## Goals

- ✅ Set up monorepo structure with frontend and backend
- ✅ Configure MS SQL Server database with Docker
- ✅ Design and implement database schema
- ✅ Set up Prisma ORM for type-safe database access
- ✅ Create initial migrations and seed data
- ✅ Establish development environment

## Tech Stack Decisions

### Why MS SQL Server?
- Enterprise-grade reliability
- Strong transaction support
- Native Windows integration
- Familiar for insurance industry

### Why Prisma?
- Type-safe database queries
- Automatic migrations
- Schema-first approach
- Excellent TypeScript support

### Why Docker?
- Consistent development environment
- Easy database setup
- Portability across machines
- Production-ready containerization

## Project Structure

```
roinet-crm/
├── app/                    # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities
│   ├── package.json
│   └── .env.local
│
├── server/                 # NestJS backend
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   ├── common/        # Shared utilities
│   │   └── prisma/        # Prisma service
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   ├── migrations/    # Migration files
│   │   └── seed.ts        # Seed data
│   ├── package.json
│   └── .env
│
├── docker-compose.yml      # Docker configuration
└── README.md
```

## Database Schema

### Core Models

#### 1. User Model
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         String   // ADMIN | POSP
  status       String   @default("PENDING") // PENDING | ACTIVE | INACTIVE
  pospId       String?  @unique
  posp         Posp?    @relation(fields: [pospId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Purpose**: Authentication and authorization
**Key Features**:
- Role-based access control
- Status management (approval workflow)
- Optional link to POSP profile

#### 2. POSP Model
```prisma
model Posp {
  id        String   @id @default(cuid())
  name      String
  code      String   @unique
  mobile    String
  email     String   @unique
  joined    DateTime
  active    Boolean  @default(true)
  deals     Deal[]
  user      User?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Purpose**: Point of Sale Person (insurance agent) management
**Key Features**:
- Unique code for identification
- One-to-many relationship with deals
- Optional user account

#### 3. Deal Model
```prisma
model Deal {
  id        String    @id @default(cuid())
  pospId    String
  posp      Posp      @relation(fields: [pospId], references: [id])
  customer  String
  policy    String
  sum       Float
  premium   Float
  coa       Float     // Cost of acquisition
  margin    Float
  status    String    // H=Hot, W=Warm, C=Cold
  expected  DateTime
  proposal  String
  policyNo  String    @default("")
  issued    DateTime?
  remarks   String    @default("")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

**Purpose**: Insurance deal/policy tracking
**Key Features**:
- Deal pipeline management (Hot/Warm/Cold)
- Financial tracking (premium, COA, margin)
- Issue tracking and remarks

### Relationships

```
User (1) ←→ (0..1) POSP
POSP (1) ←→ (0..n) Deal
```

## Environment Configuration

### Backend (.env)
```env
DATABASE_URL="sqlserver://localhost:1433;database=roinet_crm;user=sa;password=Sql@1234!;trustServerCertificate=true;encrypt=false"
JWT_SECRET="change_me_to_a_long_random_secret"
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Docker Configuration

### docker-compose.yml
```yaml
services:
  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: roinet_mssql
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "Sql@1234!"
    ports:
      - "1433:1433"
    volumes:
      - mssql_data:/var/opt/mssql
    healthcheck:
      test: ["CMD", "/opt/mssql-tools18/bin/sqlcmd", "-S", "localhost", "-U", "sa", "-P", "Sql@1234!", "-Q", "SELECT 1", "-No"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

volumes:
  mssql_data:
```

## Seed Data

### Admin User
```typescript
{
  email: 'admin@roinet.com',
  password: 'Admin@1234',
  role: 'ADMIN',
  status: 'ACTIVE'
}
```

### Sample POSPs (5)
- Anjali Sharma (POSP-1001) - Active
- Rohit Kumar (POSP-1002) - Active
- Priya Iyer (POSP-1003) - Active
- Vikram Singh (POSP-1004) - Active
- Neha Patel (POSP-1005) - Inactive

### Sample Deals (21)
- Mix of insurance types: Life, Health, Motor, Term, Travel, Home, ULIP
- Mix of loan types: Personal, Home, Business
- Various statuses: Hot (8), Warm (9), Cold (4)
- Some with issued policies

## Setup Instructions

### 1. Install Dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd app
npm install
```

### 2. Start Database
```bash
docker compose up -d
```

### 3. Run Migrations
```bash
cd server
npm run db:push
```

### 4. Seed Database
```bash
npm run db:seed
```

### 5. Start Development Servers
```bash
# Backend (terminal 1)
cd server
npm run start:dev

# Frontend (terminal 2)
cd app
npm run dev
```

## Prisma Commands Reference

```bash
# Generate Prisma Client
npm run db:generate

# Create a migration
npm run db:migrate:name -- <migration-name>

# Deploy migrations
npm run db:migrate:deploy

# Reset database
npm run db:migrate:reset

# Push schema without migration
npm run db:push

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Format schema
npm run db:format

# Validate schema
npm run db:validate
```

## Database Management

### Connecting to Database
```bash
# Using Prisma Studio (Recommended)
npm run db:studio

# Using sqlcmd (if installed)
sqlcmd -S localhost -U sa -P "Sql@1234!" -d roinet_crm
```

### Backup Database
```bash
docker exec roinet_mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "Sql@1234!" \
  -Q "BACKUP DATABASE roinet_crm TO DISK = '/var/opt/mssql/data/backup.bak'"
```

## Common Issues & Solutions

### Issue 1: Docker not starting
**Error**: `docker: command not found`
**Solution**: Install Docker Desktop for Windows

### Issue 2: Port 1433 already in use
**Error**: `address already in use :::1433`
**Solution**: 
```bash
# Stop existing SQL Server
docker stop roinet_mssql
docker rm roinet_mssql
docker compose up -d
```

### Issue 3: Database connection failed
**Error**: `Can't reach database server at localhost:1433`
**Solution**: 
1. Check if Docker container is running: `docker ps`
2. Check if database is healthy: `docker ps` (look for "healthy" status)
3. Wait 30 seconds for SQL Server to fully start

### Issue 4: Prisma Client not generated
**Error**: `Cannot find module '@prisma/client'`
**Solution**: 
```bash
npm run db:generate
```

## Testing the Setup

### 1. Check Backend Health
```bash
curl http://localhost:3001/api/auth/login
```
Should return authentication error (expected)

### 2. Test Database Connection
```bash
npm run db:studio
```
Should open Prisma Studio in browser

### 3. Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@roinet.com","password":"Admin@1234"}'
```
Should return access token

### 4. Check Frontend
Navigate to http://localhost:3000
Should see Next.js application

## Performance Considerations

### Database Indexes
- Unique constraints on email, code (automatically indexed)
- Foreign keys automatically indexed
- Consider adding index on `deal.status` for filtering

### Connection Pooling
Prisma handles connection pooling automatically with these defaults:
- Pool size: 10 connections
- Timeout: 10 seconds
- Can be configured in `schema.prisma`

## Security Considerations

### Database
- ✅ Database user credentials in `.env` (gitignored)
- ✅ `trustServerCertificate` only for local development
- ⚠️ Change default passwords in production
- ⚠️ Use proper SSL certificates in production

### Passwords
- ✅ Bcrypt hashing with salt rounds of 10
- ✅ JWT secret should be long and random
- ⚠️ Store JWT secret in environment variables
- ⚠️ Rotate secrets regularly in production

## Migration Strategy

### Development
- Use `db:push` for rapid iteration
- Create migrations before committing

### Production
- Always use migrations (`db:migrate:deploy`)
- Never use `db:push` in production
- Test migrations on staging first
- Keep backups before migrations

## Future Enhancements

### Phase 1 Follow-ups
- [ ] Add database indexes for performance
- [ ] Implement soft deletes
- [ ] Add audit logging tables
- [ ] Set up database replication
- [ ] Configure automated backups

### Data Model Extensions
- [ ] Add `Company` model for multi-tenancy
- [ ] Add `Document` model for file attachments
- [ ] Add `Notification` model
- [ ] Add `AuditLog` model
- [ ] Add `Setting` model for configuration

## Lessons Learned

1. **MS SQL with Prisma**: Some features require workarounds (enums → string constants)
2. **Docker Healthcheck**: Essential for knowing when database is ready
3. **Seed Data**: Makes development and testing much easier
4. **Connection Strings**: `trustServerCertificate=true` needed for local development

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [MS SQL Server Docker Image](https://hub.docker.com/_/microsoft-mssql-server)
- [NestJS Prisma Recipe](https://docs.nestjs.com/recipes/prisma)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Phase Status**: ✅ Completed and Stable  
**Next Phase**: [Phase 2 - CQRS & Event-Driven Architecture](./phase-2-cqrs-event-driven-architecture.md)
