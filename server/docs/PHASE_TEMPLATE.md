# Phase Template

**Copy this template when starting a new phase**

---

# Phase {N}: {Brief Description}

**Implementation Date**: {Date}  
**Status**: {🔄 In Progress / ✅ Completed / 📋 Planned}  
**Developer(s)**: {Names}

## Overview

{Brief description of what this phase accomplishes and why it's important}

## Goals

- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

## Architecture Overview

{Diagram or description of the architecture/design}

```
┌─────────┐
│Component│
└────┬────┘
     │
     ▼
┌─────────┐
│Component│
└─────────┘
```

## Implementation Details

### Feature 1: {Name}

{Description of the feature}

#### Code Example
```typescript
// Example code showing implementation
export class Example {
  // ...
}
```

#### Key Points
- Point 1
- Point 2

### Feature 2: {Name}

{Description of the feature}

## Files Created/Modified

### New Files
- `path/to/new/file.ts` - {Description}
- `path/to/another/file.ts` - {Description}

### Modified Files
- `path/to/modified/file.ts` - {What changed}
- `path/to/another/modified.ts` - {What changed}

## Configuration Changes

### Environment Variables
```env
NEW_VAR=value  # Description
```

### Dependencies Added
```json
{
  "dependency-name": "^version"
}
```

## Architecture Decisions

### Decision 1: {Title}
**Context**: {Why this decision was needed}  
**Decision**: {What was decided}  
**Rationale**: {Why this approach was chosen}  
**Alternatives Considered**: {What else was considered}

### Decision 2: {Title}
**Context**: {Why this decision was needed}  
**Decision**: {What was decided}  
**Rationale**: {Why this approach was chosen}

## API Changes

### New Endpoints
```
GET    /api/resource       - Description
POST   /api/resource       - Description
PATCH  /api/resource/:id   - Description
DELETE /api/resource/:id   - Description
```

### Modified Endpoints
- `GET /api/existing` - {What changed}

## Database Changes

### New Tables/Models
```prisma
model NewModel {
  id    String @id @default(cuid())
  field String
  // ...
}
```

### Schema Modifications
- Added field `X` to `ModelY`
- Created index on `field`

### Migration Commands
```bash
npm run db:migrate:name -- feature-name
npm run db:migrate:deploy
```

## Testing

### Unit Tests
```typescript
describe('FeatureName', () => {
  it('should do something', () => {
    // Test implementation
  });
});
```

### Integration Tests
{Description of integration test scenarios}

### Manual Testing Steps
1. Step 1
2. Step 2
3. Expected result

## Usage Examples

### Example 1: {Scenario}
```typescript
// Code showing how to use the feature
const result = await service.doSomething();
```

### Example 2: {Scenario}
```typescript
// Another usage example
```

## Common Patterns

### Pattern 1: {Name}
```typescript
// Code example of the pattern
```

### Pattern 2: {Name}
```typescript
// Code example of another pattern
```

## Performance Considerations

- Consideration 1: {Description and impact}
- Consideration 2: {Description and optimization}

## Security Considerations

- ✅ Security measure 1
- ✅ Security measure 2
- ⚠️ Warning: {What to watch out for}

## Breaking Changes

{List any breaking changes and migration path}

### Migration Guide
1. Step 1 to migrate
2. Step 2 to migrate

## Common Issues & Solutions

### Issue 1: {Problem}
**Symptom**: {How it manifests}  
**Solution**: {How to fix it}

### Issue 2: {Problem}
**Symptom**: {How it manifests}  
**Solution**: {How to fix it}

## Future Enhancements

### Immediate (Next Sprint)
- [ ] Enhancement 1
- [ ] Enhancement 2

### Short-term (Next Month)
- [ ] Enhancement 3
- [ ] Enhancement 4

### Long-term (Future)
- [ ] Enhancement 5
- [ ] Enhancement 6

## Dependencies

### Depends On
- Phase {N-1}: {Reason}
- {Other dependency}

### Blocks
- Phase {N+1}: {What it blocks}

## Rollback Plan

{How to rollback if this phase causes issues}

1. Revert step 1
2. Revert step 2

## Monitoring & Metrics

### Key Metrics
- Metric 1: {What to measure}
- Metric 2: {What to measure}

### Alerts
- Alert 1: {When to trigger}
- Alert 2: {When to trigger}

## Documentation Updates

### User Documentation
- [ ] Updated user guide
- [ ] Updated API docs
- [ ] Updated README

### Developer Documentation
- [ ] Updated architecture docs
- [ ] Updated code comments
- [ ] Updated this phase document

## Lessons Learned

1. **Lesson 1**: {What was learned}
2. **Lesson 2**: {What was learned}
3. **What Went Well**: {Positive outcomes}
4. **What Could Improve**: {Areas for improvement}

## Resources

- [Resource 1](https://example.com)
- [Resource 2](https://example.com)
- Internal documentation link

## Checklist Before Marking Complete

- [ ] All code implemented and tested
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Database migrations run successfully
- [ ] No linter errors
- [ ] Performance tested
- [ ] Security reviewed
- [ ] Deployed to staging
- [ ] Smoke tests passed
- [ ] This document completed

---

**Phase Status**: {Status}  
**Previous Phase**: [Phase {N-1} - {Title}](./phase-{N-1}-{title}.md)  
**Next Phase**: [Phase {N+1} - {Title}](./phase-{N+1}-{title}.md)

---

## Notes

{Any additional notes or context}

---

**Last Updated**: {Date}  
**Last Updated By**: {Name}
