---
name: RoiNet CRM Gap Analysis
overview: Comprehensive analysis of implemented vs required features for the RoiNet Insurance Broker Sales CRM, identifying completed work and remaining development scope.
todos:
  - id: gap-analysis-complete
    content: Comprehensive gap analysis document created - review with client
    status: pending
  - id: prioritize-phases
    content: Work with client to prioritize Phase 5-9 based on business value and timeline
    status: pending
  - id: obtain-api-access
    content: Get API credentials for HRMS, Xpresso, SAP integrations
    status: pending
  - id: clarify-business-rules
    content: Get exact formulas for reward points, incentives, TAT thresholds
    status: pending
  - id: schema-evolution-plan
    content: Create detailed database migration plan for 11 new models
    status: pending
isProject: false
---

# RoiNet Insurance Broker Sales CRM - Implementation Status

## Executive Summary

Your current implementation has a **solid technical foundation** but covers approximately **25-30% of the client requirements**. The authentication, basic deal tracking, and POSP management features are working, but most business-critical features from the requirements document are missing.

---

## What Is Already Executed

### Backend Infrastructure (100% Complete)

**Architecture & Patterns**

- NestJS backend with CQRS and Event-Driven Architecture
- MS SQL Server database via Docker
- Prisma ORM with type-safe queries
- JWT authentication with Passport
- Role-Based Access Control (ADMIN, POSP)
- Repository pattern and dependency injection
- Command/Query separation across all modules
- Event publishing framework

**Authentication System**

- Login with JWT tokens
- POSP self-registration
- Admin approval workflow (PENDING → ACTIVE → INACTIVE)
- Password hashing with bcrypt
- Protected routes with RolesGuard

**POSP Management Module**

- Create, Read, Update POSP records
- Unique code and email enforcement
- Active/Inactive status tracking
- Role-based access (Admin sees all, POSP sees own)
- POSP-User linking (one-to-one)

**Deal Management Module**

- Create, Read, Update, Delete deals
- Deal fields: customer, policy, sum assured, premium, COA, margin, status (Hot/Warm/Cold), expected closure date, proposal number, policy number, issued date, remarks
- Role-based scoping (POSP users only see their deals)
- CSV export functionality
- Status change event tracking

### Frontend Implementation (30% Complete)

**Pages Built**

- Login and POSP signup
- Dashboard with KPIs and charts (total premium, margin, deal counts, conversion rate)
- Leads Kanban board (Hot/Warm/Cold columns)
- Deals master tracker with search and filtering
- POSP roster with cards and stats
- Renewals table (90-day window, auto-calculated)
- Commissions breakdown by POSP
- Reports with charts and CSV export
- API Reference documentation page

**State Management**

- React Context for authentication
- TanStack Query setup (not fully integrated)
- Zustand store for UI state
- External API types defined for RoiNet Cognitensor

**UI Components**

- Reusable Button, Card, Badge, Modal components
- KPI cards, charts (6 chart types)
- Data tables with filters
- PageHeader, Sidebar navigation
- DealModal and PospModal forms

### Database Schema (15% Complete)

**Current Models**

- `User` (id, email, passwordHash, role, status, pospId, timestamps)
- `POSP` (id, name, code, mobile, email, joined, active, timestamps)
- `Deal` (id, pospId, customer, policy, sum, premium, coa, margin, status, expected, proposal, policyNo, issued, remarks, timestamps)

---

## What Is Missing - Critical Features

### 1. Leads Module (0% Complete)

**Current State**: You have a "Leads" page that displays deals in Kanban view, but it's actually just filtering the `Deal` table by status.

**What's Missing**:

- **Separate Leads entity** - Leads should be distinct from Deals
- **Closure Timeline Tracking** - "This Month / T+1 / T+2 / Later" categorization
- **Monthly Commitment Tracking** - Cumulative view of expected closures per salesperson
- **Lead → Deal Conversion** - Workflow to convert lead to deal when proposal is accepted
- **Lead Source Tracking** - Where the lead came from
- **Lead Assignment** - Assigning leads to sales team members

**Database Changes Required**:

```prisma
model Lead {
  id            String    @id @default(cuid())
  customerId    String    // FK to Customer
  assignedTo    String    // FK to SalesTeam
  product       String    // Life/Health/Motor
  estimatedPremium Float
  closureTimeline String  // THIS_MONTH, T_PLUS_1, T_PLUS_2, LATER
  status        String    // NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, WON, LOST
  source        String    // REFERRAL, CAMPAIGN, WALK_IN, etc.
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  convertedToDeal String? // FK to Deal (nullable)
}
```

---

### 2. Quote Requests Module (0% Complete)

**What's Required**:

- Central repository for quotes raised to underwriting
- Split by category: **Life, Health, Motor**
- Quote status tracking: **Pending, Sent, Closed**
- TAT (Turnaround Time) tracking for response time
- Management visibility dashboard

**Database Changes Required**:

```prisma
model QuoteRequest {
  id              String    @id @default(cuid())
  leadId          String?   // Optional FK to Lead
  customerId      String    // FK to Customer
  raisedBy        String    // FK to SalesTeam
  category        String    // LIFE, HEALTH, MOTOR
  productDetails  String    // JSON or text
  sumAssured      Float
  requestDate     DateTime  @default(now())
  status          String    // PENDING, SENT, CLOSED
  sentDate        DateTime?
  responseDate    DateTime?
  tat             Int?      // Calculated TAT in hours
  quotedPremium   Float?
  remarks         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**API Endpoints Needed**:

- `POST /quote-requests` - Create quote
- `GET /quote-requests` - List with filters (category, status)
- `PATCH /quote-requests/:id` - Update status
- `GET /quote-requests/analytics` - TAT metrics

---

### 3. Active/Inactive Partners with Auto-Flagging (30% Complete)

**What's Implemented**:

- POSP roster with active/inactive status
- Manual status toggling by admin

**What's Missing**:

- **Automatic flagging logic**: POSP should be auto-flagged as inactive if no business in last 60 days
- **ASM (Area Sales Manager) hierarchy** - POSPs organized by ASM
- **Country-level consolidated view** - Rollup by region/ASM
- **Re-engagement workflow** - Actions for inactive POSPs

**Database Changes Required**:

```prisma
model Posp {
  // ... existing fields ...
  asmId          String?   // FK to SalesTeam (ASM)
  lastBusinessAt DateTime? // Auto-updated when deal/policy issued
  autoInactive   Boolean   @default(false) // System-flagged vs manual
  region         String?   // For country-level grouping
}

// Background job needed to check lastBusinessAt every day
```

**Backend Logic Needed**:

- Scheduled job (cron) to check `lastBusinessAt`
- If `now() - lastBusinessAt > 60 days`, set `active = false` and `autoInactive = true`
- Webhook/event when POSP auto-flagged for re-engagement

---

### 4. Policies Issued Module (0% Complete)

**What's Required**:

- Every issued policy record by date and POSP
- **Reward points calculation** per policy
- **Payment release date** tracking
- **SAP integration** for production (live policy data feed)

**Database Changes Required**:

```prisma
model Policy {
  id              String    @id @default(cuid())
  policyNumber    String    @unique
  pospId          String    // FK to Posp
  customerId      String    // FK to Customer
  product         String    // Life/Health/Motor
  premium         Float
  sumAssured      Float
  issueDate       DateTime
  rewardPoints    Int
  paymentReleaseDate DateTime
  paymentStatus   String    // PENDING, RELEASED, PAID
  sapSyncStatus   String    // SYNCED, PENDING, FAILED
  sapSyncAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Integration Needed**:

- SAP API integration (or Xpresso database hook as mentioned)
- Reward points calculation logic
- Payment release date calculation based on policy terms

---

### 5. Channel Sourcing Targets (0% Complete)

**What's Required**:

- POSP recruitment targets by ASM
- Actual vs target tracking
- Leadership visibility into channel growth

**Database Changes Required**:

```prisma
model ChannelTarget {
  id              String    @id @default(cuid())
  asmId           String    // FK to SalesTeam
  month           DateTime  // Target month
  recruitmentTarget Int     // Number of new POSPs
  actualsToDate   Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Backend Logic Needed**:

- Admin portal to set targets
- Dashboard showing target vs actuals
- Auto-calculation of actuals from POSP creation dates

---

### 6. Field Visits Module (0% Complete)

**What's Required**:

- GPS-based punch-in/out for partner meetings
- Sales team logs field engagement
- Time-stamped, verifiable records
- Mobile-friendly interface

**Database Changes Required**:

```prisma
model FieldVisit {
  id            String    @id @default(cuid())
  salesTeamId   String    // FK to SalesTeam
  pospId        String    // FK to Posp
  checkInTime   DateTime
  checkOutTime  DateTime?
  latitude      Float
  longitude     Float
  location      String    // Geocoded address
  purpose       String    // Meeting purpose
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

**Frontend Requirements**:

- Mobile PWA or native app
- Geolocation API integration
- Camera integration for meeting photos (optional)

---

### 7. Payouts & Incentives (0% Complete)

**What's Required**:

- **POSP Payouts**: What partners earn per policy
- **Sales Team Incentives**: Calculated based on leadership-defined incentive program
- Separate views for each
- Payment tracking and history

**Database Changes Required**:

```prisma
model PospPayout {
  id              String    @id @default(cuid())
  pospId          String    // FK to Posp
  policyId        String    // FK to Policy
  payoutAmount    Float
  payoutDate      DateTime
  status          String    // PENDING, PROCESSED, PAID
  transactionId   String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model IncentiveProgram {
  id              String    @id @default(cuid())
  name            String
  year            Int
  quarter         Int?
  rules           String    // JSON with incentive calculation logic
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model SalesIncentive {
  id              String    @id @default(cuid())
  salesTeamId     String    // FK to SalesTeam
  programId       String    // FK to IncentiveProgram
  period          String    // Month/Quarter
  targetAchieved  Float
  incentiveAmount Float
  status          String    // PENDING, APPROVED, PAID
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Backend Logic Needed**:

- Configurable incentive calculation engine
- Admin portal to define incentive programs
- Automated calculation based on sales metrics

---

### 8. Power Deals Tracker (0% Complete)

**What's Required**:

- Dedicated tracker for **strategic accounts**
- **Weekly status updates** from responsible stakeholder
- High-value deal monitoring

**Database Changes Required**:

```prisma
model PowerDeal {
  id              String    @id @default(cuid())
  accountName     String
  potentialValue  Float
  ownerId         String    // FK to SalesTeam (responsible person)
  status          String    // PROSPECTING, NEGOTIATING, CLOSING, WON, LOST
  lastUpdateDate  DateTime
  nextActionDate  DateTime
  weeklyUpdates   PowerDealUpdate[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model PowerDealUpdate {
  id              String    @id @default(cuid())
  powerDealId     String    // FK to PowerDeal
  week            DateTime  // Week start date
  update          String    // Status update text
  challenges      String?
  nextSteps       String?
  createdBy       String    // FK to SalesTeam
  createdAt       DateTime  @default(now())
}
```

---

### 9. Dashboards & Reports (30% Complete)

**What's Implemented**:

- Basic dashboard with KPIs
- Simple charts (deals by status, premium breakdown, top POSPs)
- CSV export

**What's Missing**:

- **Live performance views for leadership**
- **Leadership Bulletin** - Urgent pricing and regulatory updates
- **Advanced analytics** - Trends, forecasting, pipeline health
- **Customizable reports** - User-defined filters and exports
- **Role-specific dashboards** - Different views for Admin, ASM, POSP

**Features Needed**:

- Bulletin/announcement system
- Report builder
- Scheduled reports via email
- Data visualization library (Chart.js or Recharts)

---

### 10. Customer Entity (0% Complete)

**Critical Missing**: You don't have a `Customer` model at all. Currently, customer name is just a string field in Deal.

**Database Changes Required**:

```prisma
model Customer {
  id              String    @id @default(cuid())
  name            String
  email           String?
  mobile          String
  dateOfBirth     DateTime?
  address         String?
  city            String?
  state           String?
  pincode         String?
  panNumber       String?
  aadharNumber    String?
  kycStatus       String    // PENDING, VERIFIED, REJECTED
  source          String?   // Lead source
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  leads           Lead[]
  deals           Deal[]
  policies        Policy[]
}
```

---

### 11. Sales Team / Hierarchy (0% Complete)

**What's Missing**:

- Sales team roster (ASM, managers, field agents)
- Reporting hierarchy (who reports to whom)
- Territory assignments
- Performance tracking per team member

**Database Changes Required**:

```prisma
model SalesTeam {
  id              String    @id @default(cuid())
  userId          String    @unique // FK to User
  name            String
  employeeCode    String    @unique
  designation     String    // ASM, MANAGER, FIELD_AGENT, etc.
  managerId       String?   // FK to SalesTeam (self-referencing)
  territory       String?   // Geography assignment
  mobile          String
  email           String
  joiningDate     DateTime
  status          String    // ACTIVE, INACTIVE, ON_LEAVE
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  manager         SalesTeam? @relation("Hierarchy", fields: [managerId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  subordinates    SalesTeam[] @relation("Hierarchy")
  pospsManaged    Posp[]    @relation("ASMManaged")
}
```

**Note**: Need to update User model to support SalesTeam role beyond just ADMIN/POSP.

---

### 12. Admin Portal (0% Complete)

**What's Required**:

- Separate admin portal for controlled data entry
- **Key Leadership Messages** - Broadcast announcements
- **POSP/Channel Targets** - Set and manage targets
- **Incentive Program Configuration** - Define incentive rules
- **Reference Data Management** - Product types, policy terms, etc.
- **Audit Trail** - Who changed what and when

**Features Needed**:

- Admin-only routes (separate from main CRM)
- Forms for target setting
- Bulletin/announcement editor
- Incentive program builder (rule engine)
- Audit log viewer

---

### 13. System Integrations (0% Complete)

**HRMS Integration**:

- Sales roster sync
- Designations and reporting structure
- Cost-to-company (CTC) data for incentive calculations
- **Status**: Not started

**Xpresso Database Integration**:

- Policy issuance records (online + offline)
- Premium data
- Reward points for partners
- **Status**: External API types defined but not integrated

**SAP Integration**:

- Partner payment information
- Payment status tracking
- **Status**: Not started

**Core Xpresso Platform**:

- Application should reside within Core Xpresso platform
- **Status**: Standalone application, not integrated

---

## Summary: Implementation Status by Feature


| Feature                                     | Required | Implemented | Completion % |
| ------------------------------------------- | -------- | ----------- | ------------ |
| **1. Leads with Closure Timelines**         | Yes      | No          | 0%           |
| **2. Quote Requests (Life/Health/Motor)**   | Yes      | No          | 0%           |
| **3. Active/Inactive Partners**             | Yes      | Partial     | 30%          |
| **4. Policies Issued (with Reward Points)** | Yes      | No          | 0%           |
| **5. Channel Sourcing Targets**             | Yes      | No          | 0%           |
| **6. Field Visits (GPS Punch-in)**          | Yes      | No          | 0%           |
| **7. Payouts & Incentives**                 | Yes      | No          | 0%           |
| **8. Power Deals Tracker**                  | Yes      | No          | 0%           |
| **9. Dashboards & Reports**                 | Yes      | Partial     | 30%          |
| **10. Leadership Bulletin**                 | Yes      | No          | 0%           |
| **11. Admin Portal**                        | Yes      | No          | 0%           |
| **12. HRMS Integration**                    | Yes      | No          | 0%           |
| **13. Xpresso Integration**                 | Yes      | No          | 0%           |
| **14. SAP Integration**                     | Yes      | No          | 0%           |
| **15. Authentication & RBAC**               | Yes      | Yes         | 100%         |
| **16. Basic POSP Management**               | Yes      | Yes         | 100%         |
| **17. Basic Deal Tracking**                 | Yes      | Yes         | 80%          |


**Overall Completion: 25-30%**

---

## Critical Database Schema Changes Needed

### New Models Required (11 total)

1. `Customer` - Customer master data
2. `Lead` - Separate from Deal, with closure timeline
3. `QuoteRequest` - Quote management
4. `SalesTeam` - Sales hierarchy and territory
5. `Policy` - Issued policies with reward points
6. `ChannelTarget` - POSP recruitment targets
7. `FieldVisit` - GPS-tracked field engagement
8. `PospPayout` - Partner payouts
9. `IncentiveProgram` - Incentive rules configuration
10. `SalesIncentive` - Sales team incentives
11. `PowerDeal` & `PowerDealUpdate` - Strategic account tracking
12. `Announcement` - Leadership bulletin messages

### Models to Extend

- `User` - Add support for SalesTeam role, expand beyond ADMIN/POSP
- `POSP` - Add asmId, lastBusinessAt, autoInactive, region
- `Deal` - Add customerId FK, convert customer from string to FK

---

## Technology Gaps

### Backend

- **Scheduled Jobs**: Need cron/scheduler for auto-flagging inactive POSPs, TAT calculations
- **Background Jobs**: Bull queues for SAP sync, email notifications
- **WebSockets**: Real-time updates for dashboards
- **File Upload**: Document management for policies, KYC
- **Geolocation API**: For field visit tracking
- **Email Service**: SendGrid/AWS SES for notifications
- **SMS Service**: For customer communication

### Frontend

- **Mobile App/PWA**: For field team (field visits, GPS tracking)
- **Rich Text Editor**: For leadership bulletins
- **Advanced Charts**: Chart.js or Recharts for analytics
- **Date Range Picker**: For filtering reports
- **Map Component**: Show field visit locations
- **File Upload Component**: Document uploads
- **Notification Center**: Real-time alerts

### Infrastructure

- **SAP Connector**: Integration layer
- **HRMS Connector**: API or database sync
- **Xpresso Integration**: Database hooks or API
- **Background Job Queue**: Redis + Bull
- **File Storage**: AWS S3 or Azure Blob
- **Logging**: Structured logging (Winston)
- **Monitoring**: APM tool (New Relic, DataDog)

---

## Next Steps & Priorities

### Phase 5: Core Business Features (HIGH PRIORITY)

1. Create Customer model and migrate existing data
2. Build separate Leads module with closure timeline tracking
3. Implement Quote Requests module (Life/Health/Motor)
4. Build Sales Team hierarchy and territory management
5. Add auto-flagging logic for inactive POSPs

### Phase 6: Policy & Payment Management (HIGH PRIORITY)

1. Build Policies Issued module with reward points
2. Implement Payouts & Incentives engine
3. Create Admin Portal for target setting and incentive configuration
4. Integrate with SAP/Xpresso for policy data

### Phase 7: Field Operations (MEDIUM PRIORITY)

1. Build Field Visits module with GPS tracking
2. Develop mobile PWA for field team
3. Implement Power Deals tracker
4. Build Leadership Bulletin system

### Phase 8: Integrations (MEDIUM PRIORITY)

1. HRMS integration for sales roster
2. Xpresso database integration for policies
3. SAP integration for payments
4. Core Xpresso platform embedding

### Phase 9: Advanced Features (LOW PRIORITY)

1. Advanced analytics and forecasting
2. Document management system
3. Email/SMS notification engine
4. Audit logging and compliance reporting
5. Custom report builder

---

## Estimated Development Effort

**Remaining Work**: ~70-75% of total project

**Rough Estimates**:

- Phase 5 (Core Business Features): 4-6 weeks
- Phase 6 (Policy & Payment): 3-4 weeks
- Phase 7 (Field Operations): 3-4 weeks
- Phase 8 (Integrations): 4-6 weeks (depends on external API availability)
- Phase 9 (Advanced Features): 3-4 weeks

**Total Additional Development**: 17-24 weeks (4-6 months)

**Note**: These are estimates for a single full-time developer. Timeline can be compressed with additional resources.

---

## Immediate Blockers

1. **API Access Required**:
  - HRMS API documentation and credentials
  - Xpresso database access (schema, credentials)
  - SAP API documentation and credentials
  - RoiNet Cognitensor API authentication tokens
2. **Business Rules Clarification**:
  - Reward points calculation formula per policy type
  - Incentive program calculation logic
  - Payment release date calculation rules
  - TAT thresholds for quote requests
3. **Core Xpresso Platform Integration**:
  - Integration specifications
  - Deployment requirements
  - SSO/authentication requirements

---

## Recommendations

1. **Prioritize Customer and Sales Team models** - These are foundational for most other features
2. **Get API access ASAP** - Integration work cannot proceed without credentials
3. **Start with Leads module** - High business value, relatively independent
4. **Build Admin Portal early** - Needed for configuring targets and incentive programs
5. **Plan for mobile** - Field visits require mobile-first design
6. **Consider hiring additional resources** - 4-6 month timeline for single developer is aggressive

---

## Questions for Client

1. Do you have API documentation and credentials for HRMS, Xpresso, and SAP?
2. What is the exact formula for calculating reward points per policy?
3. How should incentive programs be configured (fixed rules vs dynamic)?
4. Is mobile app development in scope (native iOS/Android vs PWA)?
5. What are the specific TAT thresholds for quote requests by category?
6. Should inactive POSP auto-flagging be reversible by admin?
7. What reports/exports are most critical for leadership?
8. Are there specific compliance/audit requirements we should design for?

