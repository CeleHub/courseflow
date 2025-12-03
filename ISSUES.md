# Codebase Issues and Potential Bugs

## Critical Issues

### 1. **Type Definition Mismatch - PaginatedResponse Structure**
**Location:** `src/types/index.ts` (lines 11-24)  
**Issue:** The `PaginatedResponse<T>` interface includes a `success` field, but it's wrapped in `ApiResponse<T>` which also has a `success` field. This creates double nesting:
- `ApiResponse<PaginatedResponse<T>>` becomes `{ success, data: { success, data: { items, pagination } } }`
- Code accesses `response.data.data.items` instead of `response.data.items`

**Impact:** Confusing type structure and potential runtime errors if API response format changes.

**Recommendation:** Either:
- Remove `success` from `PaginatedResponse` and use `ApiResponse<{ items: T[], pagination: {...} }>`, OR
- Create a separate type for paginated data without the `success` field

---

### 2. **Inconsistent Response Handling - getMyComplaints**
**Location:** `src/app/complaints/page.tsx` (lines 66-68)  
**Issue:** The code assumes `/complaints/my-complaints` returns an array directly, but it might follow the standard API response format with `{ success, data }` wrapper.

```typescript
// Current code assumes:
setComplaints(Array.isArray(response.data) ? response.data : [])

// But API might return:
// { success: true, data: { items: [...] } }
```

**Impact:** May fail to parse complaints correctly if API returns paginated format.

**Recommendation:** Check API documentation or handle both array and paginated responses.

---

### 3. **Missing Dependency in useEffect**
**Location:** `src/app/complaints/page.tsx` (line 89)  
**Issue:** `useEffect` calls `fetchComplaints()` which depends on `isAdmin`, but `isAdmin` is not in the dependency array.

```typescript
useEffect(() => {
  if (isAuthenticated) {
    fetchComplaints()  // Uses isAdmin inside
  }
  fetchDepartments()
}, [isAuthenticated, isAdmin])  // isAdmin is in array, but fetchComplaints isn't memoized
```

**Impact:** Stale closure issues or unnecessary re-renders.

**Recommendation:** Include all dependencies or use `useCallback` for `fetchComplaints`.

---

## Code Quality Issues

### 4. **Fake Error Response in Dashboard**
**Location:** `src/app/dashboard/page.tsx` (lines 43-49)  
**Issue:** Creates a fake error response object instead of gracefully handling the unauthenticated state.

```typescript
isAuthenticated ? apiClient.getComplaints({ limit: 1 }) : Promise.resolve({ 
  success: false, 
  data: null,
  error: 'Not authenticated',
  statusCode: 401,
  timestamp: new Date().toISOString()
})
```

**Impact:** Misleading error handling, harder to debug.

**Recommendation:** Conditionally add complaints request to Promise.all, or handle separately.

---

### 5. **Type Safety - Use of `any` Types**
**Location:** Multiple files  
**Issues:**
- `src/lib/api.ts` line 199: `return this.request<any[]>('/auth/verification-codes')`
- `src/lib/api.ts` line 240: `return this.request<PaginatedResponse<any>>(...)`
- Similar patterns throughout API client

**Impact:** Loss of type safety, potential runtime errors.

**Recommendation:** Use proper generic types instead of `any`.

---

### 6. **Inconsistent Error Handling**
**Location:** Multiple files  
**Issue:** Some API calls have try-catch blocks with user-facing errors, others only log to console.

**Impact:** Inconsistent user experience.

**Recommendation:** Standardize error handling across all API calls.

---

### 7. **Missing Response Validation**
**Location:** `src/app/admin/verification-codes/page.tsx` (line 50)  
**Issue:** Directly uses `response.data` without checking if it's an array.

```typescript
if (response.success && response.data) {
  setCodes(response.data)  // Assumes it's an array
}
```

**Impact:** Runtime error if API returns unexpected format.

**Recommendation:** Add array validation or type guards.

---

## Minor Issues

### 8. **Hardcoded API URL Fallback**
**Location:** `src/lib/api.ts` (line 3)  
**Status:** Actually correct - uses environment variable with fallback.

### 9. **Missing Loading States**
**Location:** Some components  
**Issue:** Not all async operations show loading indicators.

### 10. **Console.error Instead of Error Tracking**
**Location:** Multiple files  
**Issue:** Errors are only logged to console, no error tracking service integration.

---

## Recommendations Summary

1. **Fix PaginatedResponse type structure** - Remove `success` field or restructure types
2. **Standardize API response handling** - Create utility functions for consistent parsing
3. **Add proper TypeScript types** - Replace `any` with proper generics
4. **Fix useEffect dependencies** - Ensure all dependencies are included
5. **Improve error handling** - Standardize across all API calls
6. **Add response validation** - Type guards for API responses
7. **Consider error tracking** - Integrate error tracking service (Sentry, etc.)

