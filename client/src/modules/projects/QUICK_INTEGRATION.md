# Quick Integration Guide

## 30-Second Integration

### Step 1: Update App.jsx Router

**Current (Old)**:
```jsx
import ProjectPage from './pages/ProjectPage'

<Route path="/projects/:id" element={<ProjectPage />} />
```

**New**:
```jsx
import ProjectPage from './modules/projects/ProjectPage'

<Route path="/projects/:id" element={<ProjectPage />} />
```

**That's it!** The component extracts `projectId` from URL params automatically.

---

## Detailed Integration (5 minutes)

### Verify Prerequisites

```bash
# Check backend is running
curl http://localhost:3000/api/projects/1

# Check routes exist
curl http://localhost:3000/api/screens?projectId=1
curl http://localhost:3000/api/bugs?projectId=1
# ... etc
```

### Update Routes

**File**: `client/src/App.jsx`

```jsx
// OLD: Lines ~50
import ProjectPage from './pages/ProjectPage'

// NEW: Lines ~50
import ProjectPage from './modules/projects/ProjectPage'

// No other changes needed - same route path and prop passing
```

### Test in Browser

1. Navigate to any project: `http://localhost:5173/projects/1`
2. Open DevTools → Network tab
3. Verify 7-8 API calls made to fetch data
4. Check Console for no errors
5. Verify tabs visible and switchable
6. Try creating a bug (should hit backend)

### Verify Key Features

**Quick Test Checklist**:
- [ ] Page loads (no blank screen)
- [ ] Header shows project name
- [ ] 7 tabs visible
- [ ] Can switch between tabs
- [ ] "Add Bug" button works
- [ ] Bug form appears
- [ ] Can submit bug
- [ ] Bug appears in list
- [ ] Download browser console shows no errors

---

## API Route Validation

### Check Backend Routes Exist

Run these commands to verify your backend has all needed endpoints:

```bash
# GET endpoints (required)
curl http://localhost:3000/api/projects/1
curl http://localhost:3000/api/screens?projectId=1
curl http://localhost:3000/api/bugs?projectId=1
curl http://localhost:3000/api/milestones?projectId=1
curl http://localhost:3000/api/projectDocuments?projectId=1
curl http://localhost:3000/api/projects/1/activity
curl http://localhost:3000/api/tasks/project/1

# POST endpoints (for creating)
curl -X POST http://localhost:3000/api/bugs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test","projectId":"1"}'
```

### Route Mapping

| Component | Frontend | Backend Route | Method | Status |
|-----------|----------|--------------|--------|--------|
| ProjectHeader | GET project | `/api/projects/{id}` | GET | ✓ |
| ScreensTab | GET screens | `/api/screens?projectId={id}` | GET | ✓ |
| BugsTab | GET bugs | `/api/bugs?projectId={id}` | GET | ✓ |
| MilestonesTab | GET milestones | `/api/milestones?projectId={id}` | GET | ✓ |
| DocumentsTab | GET docs | `/api/projectDocuments?projectId={id}` | GET | ✓ |
| ActivityTab | GET activity | `/api/projects/{id}/activity` | GET | ✓ |
| TasksTab | GET tasks | `/api/tasks/project/{id}` | GET | ✓ |
| BugDialog | CREATE bug | `/api/bugs` | POST | ✓ |
| ScreenDialog | CREATE screen | `/api/screens` | POST | ✓ |
| | UPDATE screen | `/api/screens/{id}` | PATCH | ✓ |
| | DELETE screen | `/api/screens/{id}` | DELETE | ✓ |

---

## Environment Variables

No new environment variables needed. Uses existing:

```env
# .env (frontend)
VITE_API_URL=http://localhost:3000

# .env (backend)
DATABASE_URL=...
JWT_SECRET=...
# etc (unchanged)
```

---

## Common Issues & Fixes

### Issue: "Cannot read property 'map' of undefined"

**Cause**: Data not loaded yet
**Fix**: Component has loading state, should show spinner

**Check**:
```javascript
// Should see this in useProjectData hook
if (loading) return <Spinner />
```

### Issue: Token expires mid-session

**Cause**: Long component lifespan
**Fix**: `authFetch` auto-refreshes token

**No action needed** - already implemented

### Issue: API returns 404

**Cause**: Backend route not implemented
**Fix**: Check route exists on backend

**Verify**:
```bash
curl http://localhost:3000/api/projects/1
# Should return project object, not 404
```

### Issue: CORS errors

**Cause**: Backend not configured
**Fix**: Backend must allow frontend origin

**Backend config needed** (if not already done):
```javascript
// server/server.js
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
```

### Issue: Filters not persisting

**Cause**: localStorage cleared
**Fix**: Filters stored client-side, reload page

**Expected behavior**: Filters persist across tab switches

### Issue: Dialog won't close

**Cause**: Loading state still true
**Fix**: Waiting for API response

**Check browser console** for API errors

---

## Performance Baselines

Expected performance metrics:

| Metric | Target | Method |
|--------|--------|--------|
| Initial Load | < 3s | DevTools Lighthouse |
| Tab Switch | < 100ms | DevTools Performance |
| Bug Creation | < 1s | Network tab |
| Page Render | 60fps | DevTools Performance tab |

---

## Testing One Component in Isolation

### Test Just ProjectHeader

```jsx
// Create test file: src/components/ProjectHeader.test.jsx
import { render, screen } from '@testing-library/react'
import ProjectHeader from '../modules/projects/ProjectHeader'

describe('ProjectHeader', () => {
  const mockProject = {
    name: 'Test Project',
    clientName: 'Client A',
    status: 'In Progress'
  }

  it('displays project name', () => {
    render(<ProjectHeader project={mockProject} />)
    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })
})
```

Run: `npm test -- ProjectHeader.test.jsx`

---

## Rollback Plan

If new component has issues:

### Quick Rollback (2 minutes)

```jsx
// In App.jsx, revert to old import:
import ProjectPage from './pages/ProjectPage'

// Should work immediately (old component still exists)
```

### Gradual Rollout

```jsx
// Use feature flag:
const useNewProjectPage = localStorage.getItem('NEW_PROJECT_PAGE') === 'true'

const ProjectPageComponent = useNewProjectPage 
  ? ProjectPageNew 
  : ProjectPageOld

<Route path="/projects/:id" element={<ProjectPageComponent />} />

// Enable for specific user: localStorage.setItem('NEW_PROJECT_PAGE', 'true')
```

---

## Support Resources

### Documentation Files in `/modules/projects/`

1. **REFACTOR_GUIDE.md** - Architecture overview
2. **INTEGRATION_CHECKLIST.md** - Full test cases
3. **COMPONENT_API.md** - API reference
4. **QUICK_INTEGRATION.md** - This file

### Quick Command Reference

```bash
# Start frontend
cd client && npm run dev

# Start backend
cd server && npm run dev

# Run tests
npm test

# Build production
npm run build

# Check for errors
npm run lint

# Type check (if TypeScript)
npm run type-check
```

---

## FAQs

**Q: Do I need to change the database?**  
A: No. Database schema unchanged.

**Q: Do I need to change backend APIs?**  
A: No. All endpoints remain the same.

**Q: Can I use both old and new components?**  
A: Yes. Old ProjectPage still works, just update the import.

**Q: What if a tab breaks?**  
A: Each tab is isolated. Other tabs continue working. Check console for errors.

**Q: How do I debug API calls?**  
A: Open DevTools → Network tab. See all API requests and responses.

**Q: How do I debug component state?**  
A: Install React DevTools browser extension. Inspect component tree and props.

**Q: Performance is slow - what to check?**  
A: 1) Network tab (API latency?) 2) DevTools Performance tab (rendering?) 3) Check for console errors

**Q: How do I test API locally without backend?**  
A: Use mock data or MSW (Mock Service Worker) to intercept API calls.

---

## Success Criteria

After integration, verify:

- ✅ ProjectPage loads at `/projects/:id`
- ✅ Header displays project info
- ✅ All 7 tabs visible
- ✅ Tab content changes on click
- ✅ Data loads from 7 API endpoints
- ✅ Create bug modal works
- ✅ Bug appears in list after creation
- ✅ Edit bug dialog works
- ✅ Delete operations work
- ✅ No console errors
- ✅ No network errors (all API calls 200/201)
- ✅ Mobile responsive (375px width)
- ✅ Tablet responsive (768px width)
- ✅ Desktop optimal (1920px width)

---

## Next Steps

After successful integration:

1. **Performance Audit** - Check Lighthouse score
2. **Accessibility Audit** - Check WCAG compliance
3. **User Testing** - Get team feedback
4. **Documentation** - Update project wiki
5. **Deployment** - Plan rollout strategy
6. **Monitoring** - Set up error tracking

---

## Contact & Escalation

**Issue**: Page won't load  
**Check**: Network tab for 401/403 errors, token expired

**Issue**: API returning wrong data  
**Check**: Browser console for type errors

**Issue**: UI broken or misaligned  
**Check**: Missing TailwindCSS or conflicting CSS

**Issue**: Feature not working  
**Check**: INTEGRATION_CHECKLIST.md for detailed test cases

---

**Last Updated**: 2026-03-12  
**Status**: Ready for Integration  
**Difficulty**: 1/10 (Just change one import!)
