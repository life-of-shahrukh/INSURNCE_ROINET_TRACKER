# Phase 4: Frontend Architecture & State Management

**Implementation Date**: June 7, 2026  
**Status**: ✅ Completed  
**Developer(s)**: Development Team

## Overview

This phase implements a modern, scalable frontend architecture using Next.js 16 with React 19. Instead of Redux, we use a combination of **React Context**, **TanStack Query (React Query)**, and **Zustand** for optimal performance and developer experience.

## Goals

- ✅ Implement modern state management without Redux
- ✅ Integrate external RoiNet Cognitensor API
- ✅ Set up TanStack Query for server state
- ✅ Implement Zustand for client UI state
- ✅ Create reusable location selector component
- ✅ Establish scalable patterns for future development

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│           Frontend Architecture              │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐  ┌──────────────────────┐│
│  │  Auth State  │  │   Server State       ││
│  │  (Context)   │  │  (React Query)       ││
│  │              │  │  - CRM API           ││
│  │  - Login     │  │  - External API      ││
│  │  - User      │  │  - Caching           ││
│  │  - Token     │  │  - Refetching        ││
│  └──────────────┘  └──────────────────────┘│
│                                              │
│  ┌──────────────┐  ┌──────────────────────┐│
│  │  UI State    │  │   Components         ││
│  │  (Zustand)   │  │  - Pages             ││
│  │              │  │  - UI Components     ││
│  │  - Modals    │  │  - Charts            ││
│  │  - Filters   │  │  - Forms             ││
│  │  - Selection │  │                      ││
│  └──────────────┘  └──────────────────────┘│
└─────────────────────────────────────────────┘
```

## State Management Strategy

### Why Not Redux?

Redux has become unnecessarily complex for modern React applications:
- ❌ Too much boilerplate
- ❌ Actions, reducers, selectors complexity
- ❌ Doesn't handle async well without middleware
- ❌ Mixes server state with client state
- ❌ Performance issues with large state trees

### Our Approach: Separation of Concerns

We separate state into three categories:

#### 1. **Auth State** → React Context
**Purpose**: Authentication and user session  
**Why**: Doesn't change often, needs to be global

```typescript
// providers/auth-provider.tsx
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
```

**Features**:
- Login/logout
- User information
- Token management
- Persistent to localStorage

#### 2. **Server State** → TanStack Query (React Query)
**Purpose**: Data from APIs (backend + external)  
**Why**: Automatic caching, refetching, invalidation

```typescript
// hooks/useExternalApi.ts
export function useStates() {
  return useQuery({
    queryKey: ['external-api', 'states'],
    queryFn: () => externalApi.getStates(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
```

**Features**:
- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication
- Parallel queries
- Dependent queries

#### 3. **UI State** → Zustand
**Purpose**: Client-side UI concerns  
**Why**: Simple, performant, no boilerplate

```typescript
// store/ui-store.ts
export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  modal: { type: null, isOpen: false },
  openModal: (type, data) => set({ modal: { type, isOpen: true, data } }),
  
  filters: { status: null, pospId: null },
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
}));
```

**Features**:
- Modal states
- Sidebar open/closed
- Filters
- Selected items
- Temporary form data
- Persists to localStorage

## External API Integration

### RoiNet Cognitensor API

Integrated external API for location and hierarchy data:

```typescript
// lib/api/external-api.ts
export const externalApi = {
  async getStates(): Promise<State[]> {
    return externalApiRequest('/Cognitensor/ListState', { body: '' });
  },
  
  async getDistricts(stateId: string): Promise<District[]> {
    return externalApiRequest('/Cognitensor/ListDistrict', {
      body: JSON.stringify({ stateid: stateId }),
    });
  },
  
  async getCities(districtId: string): Promise<City[]> {
    return externalApiRequest('/Cognitensor/ListCity', {
      body: JSON.stringify({ districtid: districtId }),
    });
  },
  
  async getHierarchyUserData(): Promise<HierarchyUser[]> {
    return externalApiRequest('/Cognitensor/ListHierarchyUserData', { body: '' });
  },
};
```

### React Query Hooks

Custom hooks for external API with automatic caching:

```typescript
// hooks/useExternalApi.ts

// Individual hooks
const states = useStates();
const districts = useDistricts(stateId);
const cities = useCities(districtId);

// Cascading hook for State -> District -> City
const { states, districts, cities } = useLocationCascade(
  selectedStateId,
  selectedDistrictId
);
```

**Benefits**:
- Automatic caching (1 hour for states)
- Dependent queries (districts need stateId)
- Loading/error states
- Background refetching
- Stale-while-revalidate

## File Structure

```
app/src/
├── components/
│   ├── location/
│   │   └── LocationSelector.tsx      # Cascading location picker
│   ├── ui/                             # Reusable UI components
│   ├── auth/                           # Auth components
│   ├── deals/                          # Deal components
│   ├── posp/                           # POSP components
│   └── charts/                         # Chart components
│
├── hooks/
│   └── useExternalApi.ts              # React Query hooks for external API
│
├── lib/
│   ├── api/
│   │   ├── external-api.ts            # External API client
│   │   ├── crm-api.ts                 # Internal CRM API
│   │   └── http-crm-api.ts            # HTTP CRM implementation
│   ├── external-api-types.ts          # External API types
│   ├── types.ts                       # Internal types
│   └── auth-types.ts                  # Auth types
│
├── providers/
│   ├── auth-provider.tsx              # Auth Context provider
│   ├── react-query-provider.tsx       # React Query provider
│   └── crm-provider.tsx               # CRM provider
│
├── store/
│   └── ui-store.ts                    # Zustand UI store
│
└── app/
    ├── (crm)/                         # Authenticated routes
    │   ├── dashboard/
    │   ├── deals/
    │   ├── posp/
    │   ├── reports/
    │   └── layout.tsx
    ├── login/
    ├── signup/
    └── layout.tsx                     # Root layout with providers
```

## New Components

### LocationSelector Component

Cascading select for State → District → City:

```typescript
<LocationSelector
  onLocationChange={(location) => {
    console.log(location);
    // { stateId, districtId, cityId }
  }}
/>
```

**Features**:
- Automatic loading states
- Dependent dropdowns (districts require state)
- Error handling
- Reset functionality
- Connected to Zustand store
- Uses external API via React Query

## Provider Setup

Providers are nested in root layout:

```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

**Provider Order**:
1. `ReactQueryProvider` - Outermost (provides query client)
2. `AuthProvider` - Auth context
3. App content

## Dependencies Added

```json
{
  "@tanstack/react-query": "^5.x",
  "@tanstack/react-query-devtools": "^5.x",
  "zustand": "^4.x",
  "axios": "^1.x"
}
```

## Usage Examples

### Example 1: Using External API Hooks

```typescript
'use client';

import { useStates, useDistricts } from '@/hooks/useExternalApi';

export function MyComponent() {
  const { data: states, isLoading, error } = useStates();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <select>
      {states?.map(state => (
        <option key={state.id} value={state.id}>
          {state.name}
        </option>
      ))}
    </select>
  );
}
```

### Example 2: Using Zustand UI Store

```typescript
'use client';

import { useUIStore } from '@/store/ui-store';

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  
  return (
    <aside className={sidebarOpen ? 'open' : 'closed'}>
      <button onClick={toggleSidebar}>Toggle</button>
      {/* Sidebar content */}
    </aside>
  );
}
```

### Example 3: Using Auth Context

```typescript
'use client';

import { useAuth } from '@/providers/auth-provider';

export function Header() {
  const { user, logout } = useAuth();
  
  return (
    <header>
      <span>Welcome, {user?.email}</span>
      <button onClick={logout}>Logout</button>
    </header>
  );
}
```

### Example 4: Location Cascade

```typescript
'use client';

import { useLocationCascade } from '@/hooks/useExternalApi';
import { useUIStore } from '@/store/ui-store';

export function AddressForm() {
  const { selectedState, selectedDistrict } = useUIStore();
  const { states, districts, cities } = useLocationCascade(
    selectedState,
    selectedDistrict
  );
  
  return (
    <form>
      <select>
        {states.data.map(s => <option key={s.id}>{s.name}</option>)}
      </select>
      
      {selectedState && (
        <select>
          {districts.data.map(d => <option key={d.id}>{d.name}</option>)}
        </select>
      )}
      
      {selectedDistrict && (
        <select>
          {cities.data.map(c => <option key={c.id}>{c.name}</option>)}
        </select>
      )}
    </form>
  );
}
```

## Performance Optimizations

### 1. React Query Caching

```typescript
// States rarely change - cache for 1 hour
queryKey: ['states'],
staleTime: 1000 * 60 * 60,

// Districts change sometimes - cache for 30 min
queryKey: ['districts', stateId],
staleTime: 1000 * 60 * 30,
```

### 2. Zustand Selectors

```typescript
// ❌ BAD - Re-renders on any store change
const store = useUIStore();

// ✅ GOOD - Only re-renders when sidebarOpen changes
const sidebarOpen = useUIStore(state => state.sidebarOpen);
```

### 3. Query Key Structure

```typescript
export const externalApiKeys = {
  all: ['external-api'] as const,
  states: () => [...externalApiKeys.all, 'states'] as const,
  districts: (stateId: string) => 
    [...externalApiKeys.all, 'districts', stateId] as const,
};

// Invalidate all external API queries
queryClient.invalidateQueries({ queryKey: externalApiKeys.all });

// Invalidate only districts
queryClient.invalidateQueries({ queryKey: externalApiKeys.districts(stateId) });
```

## Error Handling

### External API Errors

```typescript
class ExternalApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'ExternalApiError';
  }
}
```

### React Query Error Handling

```typescript
const { data, error, isError } = useStates();

if (isError) {
  return (
    <div className="error">
      <p>Failed to load states</p>
      <p>{error.message}</p>
    </div>
  );
}
```

## Testing

### Testing React Query Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStates } from '@/hooks/useExternalApi';

test('useStates fetches states', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  const { result } = renderHook(() => useStates(), { wrapper });
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(35); // 35 states in India
});
```

### Testing Zustand Store

```typescript
import { renderHook, act } from '@testing-library/react';
import { useUIStore } from '@/store/ui-store';

test('toggleSidebar works', () => {
  const { result } = renderHook(() => useUIStore());
  
  expect(result.current.sidebarOpen).toBe(true);
  
  act(() => {
    result.current.toggleSidebar();
  });
  
  expect(result.current.sidebarOpen).toBe(false);
});
```

## Best Practices

### 1. Separate Server and Client State

```typescript
// ✅ GOOD - Server state in React Query
const { data: deals } = useQuery({
  queryKey: ['deals'],
  queryFn: fetchDeals,
});

// ✅ GOOD - Client state in Zustand
const sidebarOpen = useUIStore(state => state.sidebarOpen);
```

### 2. Use Query Keys Consistently

```typescript
// Define keys in one place
export const queryKeys = {
  deals: {
    all: ['deals'] as const,
    list: (filters: Filters) => [...queryKeys.deals.all, { filters }] as const,
    detail: (id: string) => [...queryKeys.deals.all, id] as const,
  },
};
```

### 3. Handle Loading States

```typescript
if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

return <DataDisplay data={data} />;
```

### 4. Use Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updateDeal,
  onMutate: async (newDeal) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['deals'] });
    
    // Snapshot previous value
    const previousDeals = queryClient.getQueryData(['deals']);
    
    // Optimistically update
    queryClient.setQueryData(['deals'], (old) => 
      old.map(d => d.id === newDeal.id ? newDeal : d)
    );
    
    return { previousDeals };
  },
  onError: (err, newDeal, context) => {
    // Rollback on error
    queryClient.setQueryData(['deals'], context.previousDeals);
  },
});
```

## Migration Path from Redux

If migrating from Redux:

1. **Auth State** → Move to React Context
2. **API Data** → Move to React Query
3. **UI State** → Move to Zustand
4. **Derived State** → Use useMemo or React Query transforms

## Future Enhancements

### Immediate
- [ ] Add React Query DevTools in development
- [ ] Implement optimistic updates for all mutations
- [ ] Add error boundaries for better error handling

### Short-term
- [ ] Add offline support with React Query persistence
- [ ] Implement infinite scroll with useInfiniteQuery
- [ ] Add request cancellation for slow queries

### Long-term
- [ ] Consider React Query streaming for real-time data
- [ ] Add service worker for offline-first
- [ ] Implement progressive enhancement

## Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [React Context Best Practices](https://react.dev/reference/react/useContext)

---

**Phase Status**: ✅ Completed  
**Previous Phase**: [Phase 3 - Role-Based Access Control](./phase-3-role-based-access-control.md)  
**Next Phase**: Phase 5 - Advanced Features (Upcoming)
