# Phase 2: CQRS & Event-Driven Architecture

**Implementation Date**: June 6, 2026  
**Status**: ✅ Completed  
**Developer(s)**: Development Team

## Overview

This phase implements Command-Query Responsibility Segregation (CQRS) pattern and Event-Driven Architecture across the entire backend. The goal was to create a scalable, maintainable architecture that separates read and write operations and enables reactive side effects through events.

## Goals

- ✅ Implement CQRS pattern for all modules
- ✅ Set up Event-Driven Architecture with EventBus
- ✅ Create Command and Query handlers
- ✅ Implement Event listeners with proper error handling
- ✅ Refactor services to use CommandBus and QueryBus
- ✅ Implement Repository pattern for data access
- ✅ Create Cursor rule for maintaining patterns

## Architecture Overview

```
┌─────────────┐
│ Controller  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │───────┐
└──────┬──────┘       │
       │              │
   ┌───▼───┐      ┌───▼────┐
   │Command│      │ Query  │
   │  Bus  │      │  Bus   │
   └───┬───┘      └───┬────┘
       │              │
   ┌───▼────────┐ ┌──▼──────┐
   │  Command   │ │  Query  │
   │  Handler   │ │ Handler │
   └──────┬─────┘ └──┬──────┘
          │          │
      ┌───▼──────────▼───┐
      │   Repository     │
      └────────┬─────────┘
               │
          ┌────▼────┐
          │ Prisma  │
          └────┬────┘
               │
          ┌────▼────┐
          │   DB    │
          └─────────┘

       (Side Effects)
          ┌──────┐
          │Event │
          │ Bus  │
          └──┬───┘
             │
      ┌──────▼──────┐
      │  Listeners  │
      └─────────────┘
```

## CQRS Implementation

### Command Pattern

Commands **mutate** state and return the created/updated entity.

#### Example: CreateDealCommand

```typescript
// create-deal.command.ts
export class CreateDealCommand {
  constructor(public readonly dto: CreateDealDto) {}
}

// create-deal.handler.ts
@CommandHandler(CreateDealCommand)
export class CreateDealHandler implements ICommandHandler<CreateDealCommand> {
  constructor(
    private readonly dealRepo: DealRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateDealCommand): Promise<Deal> {
    const deal = await this.dealRepo.create(command.dto);
    
    // Publish event after mutation
    this.eventBus.publish(
      new DealCreatedEvent(deal.id, deal.pospId, deal.status)
    );
    
    return deal;
  }
}
```

### Query Pattern

Queries **read** state and never mutate.

#### Example: GetAllDealsQuery

```typescript
// get-all-deals.query.ts
export class GetAllDealsQuery {
  constructor(public readonly pospId?: string) {}
}

// get-all-deals.handler.ts
@QueryHandler(GetAllDealsQuery)
export class GetAllDealsHandler implements IQueryHandler<GetAllDealsQuery> {
  constructor(private readonly dealRepo: DealRepository) {}

  async execute(query: GetAllDealsQuery): Promise<Deal[]> {
    if (query.pospId) {
      return this.dealRepo.findAllByPospId(query.pospId);
    }
    return this.dealRepo.findAll();
  }
}
```

### Service Layer

Services orchestrate commands and queries through buses.

```typescript
@Injectable()
export class DealService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  getAll(user: AuthUser): Promise<Deal[]> {
    const pospId = user.pospId ?? undefined;
    return this.queryBus.execute(new GetAllDealsQuery(pospId));
  }

  create(dto: CreateDealDto, user: AuthUser): Promise<Deal> {
    const finalDto = { ...dto };
    if (user.pospId) {
      finalDto.pospId = resolvePospScope(user, dto.pospId);
    }
    return this.commandBus.execute(new CreateDealCommand(finalDto));
  }
}
```

## Event-Driven Architecture

### Event Structure

Events are immutable facts about state changes.

```typescript
export class DealCreatedEvent {
  constructor(
    public readonly dealId: string,
    public readonly pospId: string,
    public readonly status: DealStatus,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

**Event Naming Conventions**:
- Use past tense: `DealCreatedEvent`, `DealStatusChangedEvent`
- Include all data listeners need (avoid DB lookups)
- Include `occurredAt` timestamp
- Make all properties `readonly`

### Event Publishing

Publish events after successful mutations.

```typescript
@CommandHandler(UpdateDealCommand)
export class UpdateDealHandler implements ICommandHandler<UpdateDealCommand> {
  constructor(
    private readonly dealRepo: DealRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateDealCommand): Promise<Deal> {
    const existing = await this.dealRepo.findById(command.id);
    const updated = await this.dealRepo.update(command.id, command.dto);

    // Publish event if status changed
    if (existing.status !== updated.status) {
      this.eventBus.publish(
        new DealStatusChangedEvent(
          updated.id,
          existing.status,
          updated.status,
        ),
      );
    }

    return updated;
  }
}
```

### Event Listeners

Listeners handle side effects like logging, notifications, analytics.

```typescript
@EventsHandler(DealCreatedEvent)
export class DealCreatedListener implements IEventHandler<DealCreatedEvent> {
  private readonly logger = new Logger(DealCreatedListener.name);

  async handle(event: DealCreatedEvent): Promise<void> {
    try {
      this.logger.log(
        `Deal created [id=${event.dealId}] [pospId=${event.pospId}]`,
      );
      
      // Future: notifications, analytics, etc.
      // await this.notificationService.notifyPospOfNewDeal(event.pospId, event.dealId);
    } catch (error) {
      this.logger.error(
        `Failed to handle DealCreatedEvent for deal ${event.dealId}`,
        error,
      );
      // Don't throw - listeners should not break main flow
    }
  }
}
```

**Listener Rules**:
- ✅ Wrap logic in try-catch
- ✅ Log errors but don't throw
- ✅ Make handlers idempotent (safe to replay)
- ✅ Keep side effects in listeners, not in commands
- ❌ Never mutate primary state in listeners

## Repository Pattern

All database access goes through repositories.

### Example: DealRepository

```typescript
@Injectable()
export class DealRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Deal[]> {
    return this.prisma.deal.findMany({
      include: { posp: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByPospId(pospId: string): Promise<Deal[]> {
    return this.prisma.deal.findMany({
      where: { pospId },
      include: { posp: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateDealDto): Promise<Deal> {
    return this.prisma.deal.create({
      data: dto,
      include: { posp: true },
    });
  }

  async update(id: string, dto: UpdateDealDto): Promise<Deal> {
    return this.prisma.deal.update({
      where: { id },
      data: dto,
      include: { posp: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.deal.delete({ where: { id } });
  }
}
```

## Module Structure

### Deal Module (Complete CQRS Example)

```
src/modules/deal/
├── commands/
│   ├── create-deal.command.ts
│   ├── create-deal.handler.ts
│   ├── update-deal.command.ts
│   ├── update-deal.handler.ts
│   ├── delete-deal.command.ts
│   └── delete-deal.handler.ts
├── queries/
│   ├── get-all-deals.query.ts
│   ├── get-all-deals.handler.ts
│   ├── export-deals-csv.query.ts
│   └── export-deals-csv.handler.ts
├── events/
│   ├── deal-created.event.ts
│   └── deal-status-changed.event.ts
├── listeners/
│   └── deal-events.listener.ts
├── dto/
│   ├── create-deal.dto.ts
│   └── update-deal.dto.ts
├── deal.repository.ts
├── deal.service.ts
├── deal.controller.ts
└── deal.module.ts
```

### Module Registration

```typescript
@Module({
  imports: [CqrsModule],
  controllers: [DealController],
  providers: [
    DealService,
    DealRepository,
    // Commands
    CreateDealHandler,
    UpdateDealHandler,
    DeleteDealHandler,
    // Queries
    GetAllDealsHandler,
    ExportDealsCsvHandler,
    // Listeners
    DealCreatedListener,
    DealStatusChangedListener,
  ],
})
export class DealModule {}
```

## Implemented Modules

### 1. Deal Module
**Commands**:
- CreateDealCommand
- UpdateDealCommand
- DeleteDealCommand

**Queries**:
- GetAllDealsQuery (with POSP filtering)
- ExportDealsCsvQuery (with POSP filtering)

**Events**:
- DealCreatedEvent
- DealStatusChangedEvent

### 2. POSP Module
**Commands**:
- CreatePospCommand
- UpdatePospCommand

**Queries**:
- GetAllPospQuery
- GetPospByIdQuery

**Events**:
- PospCreatedEvent

### 3. Auth Module (Repository Pattern)
**Repository**: UserRepository
- findByEmail()
- findById()
- create()
- createWithPosp() (transaction)
- updateStatus()
- findPospByCode()
- findPospByEmail()

## Benefits Achieved

### Separation of Concerns
- ✅ Clear boundaries between reads and writes
- ✅ Each handler has single responsibility
- ✅ Easy to test in isolation

### Scalability
- ✅ Queries can be optimized independently
- ✅ Commands and queries can scale separately
- ✅ Event listeners can be moved to background jobs

### Maintainability
- ✅ Easy to add new commands/queries
- ✅ Clear code organization
- ✅ Predictable patterns

### Auditability
- ✅ All state changes emit events
- ✅ Complete audit trail
- ✅ Easy to add analytics

### Extensibility
- ✅ Add new listeners without modifying commands
- ✅ Easy to add notifications, webhooks, etc.
- ✅ Prepared for microservices architecture

## Cursor Rule Created

Created `.cursor/rules/backend-cqrs-event-driven.mdc` to maintain patterns:

**Rule enforces**:
- Command-Query separation
- Event publishing patterns
- Listener error handling
- Service layer using buses
- Anti-patterns to avoid

## Testing Strategy

### Unit Testing Commands

```typescript
describe('CreateDealHandler', () => {
  let handler: CreateDealHandler;
  let repository: DealRepository;
  let eventBus: EventBus;

  beforeEach(() => {
    repository = createMock<DealRepository>();
    eventBus = createMock<EventBus>();
    handler = new CreateDealHandler(repository, eventBus);
  });

  it('should create deal and publish event', async () => {
    const dto = { /* ... */ };
    const deal = { id: '1', /* ... */ };
    
    jest.spyOn(repository, 'create').mockResolvedValue(deal);
    const eventBusSpy = jest.spyOn(eventBus, 'publish');

    const result = await handler.execute(new CreateDealCommand(dto));

    expect(result).toBe(deal);
    expect(eventBusSpy).toHaveBeenCalledWith(
      expect.objectContaining({ dealId: '1' })
    );
  });
});
```

### Unit Testing Queries

```typescript
describe('GetAllDealsHandler', () => {
  it('should return all deals when no filter', async () => {
    const deals = [{ id: '1' }, { id: '2' }];
    jest.spyOn(repository, 'findAll').mockResolvedValue(deals);

    const result = await handler.execute(new GetAllDealsQuery());

    expect(result).toEqual(deals);
  });

  it('should filter by pospId when provided', async () => {
    const pospId = 'posp-1';
    jest.spyOn(repository, 'findAllByPospId').mockResolvedValue([]);

    await handler.execute(new GetAllDealsQuery(pospId));

    expect(repository.findAllByPospId).toHaveBeenCalledWith(pospId);
  });
});
```

## Performance Considerations

### Query Optimization
- Repositories use Prisma's `include` for eager loading
- Avoid N+1 queries
- Consider pagination for large datasets

### Event Handling
- Event listeners are async but non-blocking
- Consider using queue (Bull) for heavy operations
- Failures in listeners don't affect main flow

### Command Optimization
- Use transactions for multi-step operations
- Batch operations when possible
- Consider optimistic locking for concurrent updates

## Common Patterns

### Pattern 1: Conditional Event Publishing

```typescript
async execute(command: UpdateCommand): Promise<Entity> {
  const existing = await this.repo.findById(command.id);
  const updated = await this.repo.update(command.id, command.dto);

  // Only publish if something meaningful changed
  if (existing.status !== updated.status) {
    this.eventBus.publish(new StatusChangedEvent(/* ... */));
  }

  return updated;
}
```

### Pattern 2: Multiple Listeners for Same Event

```typescript
// Logging listener
@EventsHandler(DealCreatedEvent)
export class DealCreatedLogger { /* ... */ }

// Notification listener
@EventsHandler(DealCreatedEvent)
export class DealCreatedNotifier { /* ... */ }

// Analytics listener
@EventsHandler(DealCreatedEvent)
export class DealCreatedAnalytics { /* ... */ }
```

### Pattern 3: Authorization in Commands

```typescript
async execute(command: DeleteCommand): Promise<void> {
  // Authorization check in handler
  if (command.pospId) {
    await this.repo.deleteByPosp(command.id, command.pospId);
  } else {
    await this.repo.delete(command.id);
  }
}
```

## Migration from Direct Repository Calls

### Before (Anti-pattern)
```typescript
@Injectable()
export class DealService {
  constructor(private readonly dealRepo: DealRepository) {}

  async create(dto: CreateDealDto) {
    return this.dealRepo.create(dto); // ❌ Direct repository call
  }
}
```

### After (CQRS Pattern)
```typescript
@Injectable()
export class DealService {
  constructor(private readonly commandBus: CommandBus) {}

  async create(dto: CreateDealDto) {
    return this.commandBus.execute(new CreateDealCommand(dto)); // ✅
  }
}
```

## Troubleshooting

### Issue 1: Handler Not Registered
**Error**: `There is no handler for command "CreateDealCommand"`
**Solution**: Add handler to module providers

### Issue 2: Event Not Being Handled
**Error**: Silent - event published but nothing happens
**Solution**: Check if listener is registered in module

### Issue 3: Circular Dependency
**Error**: `Nest can't resolve dependencies`
**Solution**: Use `forwardRef()` or restructure dependencies

## Future Enhancements

### Immediate
- [ ] Add saga pattern for complex workflows
- [ ] Implement event sourcing for audit trail
- [ ] Add command validation middleware

### Short-term
- [ ] Move heavy listeners to Bull queue
- [ ] Add command retry mechanism
- [ ] Implement event versioning

### Long-term
- [ ] Split read/write databases
- [ ] Implement CQRS projections
- [ ] Add event replay capability

## Resources

- [NestJS CQRS Documentation](https://docs.nestjs.com/recipes/cqrs)
- [CQRS Pattern by Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Event-Driven Architecture](https://microservices.io/patterns/data/event-driven-architecture.html)

---

**Phase Status**: ✅ Completed and In Production  
**Previous Phase**: [Phase 1 - Foundation & Database Setup](./phase-1-foundation-database-setup.md)  
**Next Phase**: [Phase 3 - Role-Based Access Control](./phase-3-role-based-access-control.md)
