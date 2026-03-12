# Project Page Refactor - Integration & Testing Checklist

## Pre-Integration Checklist

### Environment Setup
- [ ] Node modules updated (`npm install`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Vite build succeeds (`npm run build`)

### API Availability
- [ ] Backend server running (`npm run dev` in `/server`)
- [ ] Database connected and accessible
- [ ] All API endpoints responding (test via curl/Postman)
- [ ] Authentication token generation working

### Code Inspection
- [ ] All imports resolve correctly
- [ ] No circular dependencies
- [ ] All props match expected types
- [ ] All API endpoints match backend routes

---

## Integration Testing

### Phase 1: Data Loading

#### Test Case 1.1 - Initial Page Load
```
Steps:
1. Navigate to /projects/{id}
2. Observe network tab

Expected:
✓ 7-8 API requests initiated
✓ useProjectData fetching all data
✓ Loading skeletons visible
✓ No console errors
✓ Progress bar visible
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 1.2 - Error Handling
```
Steps:
1. Disable network (DevTools)
2. Refresh page
3. Enable network after 2 seconds

Expected:
✓ Error state displayed
✓ "Retry" button available
✓ No app crash
✓ Error message helpful
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 1.3 - Loading State
```
Steps:
1. Open DevTools Network, set 3G throttling
2. Navigate to project page
3. Observe loading states

Expected:
✓ Skeletons appear for all sections
✓ No content shift when loading completes
✓ Progress bar visible
✓ User can't interact during load
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 2: Tab Navigation

#### Test Case 2.1 - Tab Switching
```
Steps:
1. Click each tab: Overview → Screens → Milestones → Tasks → Bugs → Documents → Activity
2. Verify content changes
3. Go back to first tab

Expected:
✓ Each tab displays correct content
✓ No API re-fetches on tab switch
✓ Scroll position preserved per tab
✓ Active tab highlighted correctly
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 2.2 - Tab Data Persistence
```
Steps:
1. Filter bugs in BugsTab (e.g., High severity)
2. Switch to another tab
3. Return to BugsTab

Expected:
✓ Filter state persisted
✓ Same filtered view shown
✓ Filter applied without re-fetch
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 3: Overview Tab

#### Test Case 3.1 - Header Display
```
Steps:
1. View ProjectHeader component
2. Check stats display

Expected:
✓ Project name displayed
✓ Client name shown
✓ Status badge colored correctly
✓ 4 stat cards visible (screens, bugs, deadlines, progress)
✓ Progress bar reflects actual percentage
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 3.2 - Statistics Accuracy
```
Steps:
1. Count actual screens/bugs in database
2. Compare with displayed numbers

Expected:
✓ Screen count matches database
✓ Bug count matches database
✓ Completed screens % correct
✓ Deadline alerts accurate
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 3.3 - Overview Content
```
Steps:
1. View Overview tab
2. Scroll through all sections

Expected:
✓ Project summary visible
✓ Team members listed
✓ Timeline displayed
✓ Recent milestones shown
✓ No missing sections
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 4: Screens Tab

#### Test Case 4.1 - Screen List
```
Steps:
1. Navigate to Screens tab
2. View screen list

Expected:
✓ All project screens listed
✓ Screen names correct
✓ Status badges displayed
✓ Developer names shown
✓ List sorted by creation date
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 4.2 - Add Screen
```
Steps:
1. Click "Add Screen" button
2. Fill form (title, type, assignee)
3. Click "Save"

Expected:
✓ Dialog opens correctly
✓ Form fields functional
✓ API POST received (check network tab)
✓ New screen added to list
✓ Success notification shown
✓ Dialog closes automatically
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 4.3 - Edit Screen
```
Steps:
1. Click edit icon on screen
2. Modify values
3. Save

Expected:
✓ Form pre-populated with current data
✓ Changes reflected in list
✓ API PATCH request sent
✓ No validation errors
✓ Dialog closes after save
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 4.4 - Delete Screen
```
Steps:
1. Click delete on screen
2. Confirm deletion

Expected:
✓ Confirmation dialog shown
✓ API DELETE request sent
✓ Screen removed from list
✓ Success notification
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 5: Bugs Tab

#### Test Case 5.1 - Bug List & Filtering
```
Steps:
1. Navigate to Bugs tab
2. See all bugs displayed
3. Apply filters (severity, status)

Expected:
✓ All project bugs listed
✓ Severity color coding correct
✓ Filter options available
✓ Filters work correctly
✓ Count updates on filter change
✓ Pagination works (if enabled)
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 5.2 - Add Bug
```
Steps:
1. Click "Report Bug" button
2. Fill form (title, description, severity, assignee, deadline)
3. Submit

Expected:
✓ Dialog opens
✓ All form fields present
✓ Severity colors match constants
✓ Assignee dropdown populated
✓ Date picker works
✓ Bug created in database
✓ Appears in list immediately
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 5.3 - Update Bug Status
```
Steps:
1. Click status badge on bug
2. Select new status

Expected:
✓ Dropdown shows status options
✓ Selection updates immediately
✓ API PATCH request sent
✓ List re-renders (or optimistic update)
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 5.4 - Edit Bug Deadline
```
Steps:
1. Click deadline on bug
2. Select new date

Expected:
✓ Date picker opens
✓ Selection updates bug
✓ API PATCH request sent
✓ New date displayed
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 6: Milestones Tab

#### Test Case 6.1 - Milestone List
```
Steps:
1. Navigate to Milestones tab
2. View milestones

Expected:
✓ All milestones listed
✓ Timeline displayed
✓ Status indicators shown
✓ Completion percentage visible
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 6.2 - Create/Edit Milestone
```
Steps:
1. Add new milestone
2. Fill form
3. Save

Expected:
✓ Dialog functional
✓ Date fields work
✓ Status dropdown available
✓ Database updated
✓ List refreshed
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 7: Tasks Tab

#### Test Case 7.1 - Task Display
```
Steps:
1. Navigate to Tasks tab
2. View all project tasks

Expected:
✓ Tasks from all screens shown
✓ Sorted by priority (high → low)
✓ Developer names shown
✓ Status indicators correct
✓ Task counts accurate
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 8: Documents Tab

#### Test Case 8.1 - Document List
```
Steps:
1. Navigate to Documents tab
2. View all documents

Expected:
✓ All project documents listed
✓ File sizes displayed correctly
✓ Upload dates shown
✓ Uploader names visible
✓ Sort functionality works
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 8.2 - Upload Document
```
Steps:
1. Click "Upload Document"
2. Fill form (title, description)
3. Select file
4. Submit

Expected:
✓ Dialog opens
✓ File picker works
✓ Progress bar visible during upload
✓ Supported file types validated
✓ File size validated (< 25MB)
✓ Document appears in list
✓ Download link functional
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 8.3 - Download Document
```
Steps:
1. Click download on document
2. Verify file received

Expected:
✓ File downloads to user's device
✓ Filename correct
✓ File content intact
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 9: Activity Tab

#### Test Case 9.1 - Activity Timeline
```
Steps:
1. Navigate to Activity tab
2. View timeline

Expected:
✓ All project activities listed
✓ Reverse chronological order
✓ Timestamps formatted correctly
✓ User names displayed
✓ Action descriptions clear
✓ Icons match activity type
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 9.2 - Activity Updates
```
Steps:
1. Make change in another tab (add bug, create screen)
2. Navigate back to Activity
3. Verify new activity logged

Expected:
✓ New activity appears at top
✓ Timestamp accurate
✓ Description matches action
✓ User credited correctly
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 10: Dialog Components

#### Test Case 10.1 - Form Validation
```
Steps:
1. Open any dialog
2. Try to submit without filling required fields

Expected:
✓ Validation messages shown
✓ Submit disabled if invalid
✓ Required field indicators visible
✓ Error messages helpful
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 10.2 - Dialog Interactions
```
Steps:
1. Open dialog
2. Click cancel/close button
3. Open again

Expected:
✓ Dialog closes without saving
✓ Form resets on next open
✓ No API call on close
✓ UI returns to normal state
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 11: Responsive Design

#### Test Case 11.1 - Mobile (375px)
```
Steps:
1. Set viewport to 375px width
2. Test all tabs and features

Expected:
✓ Layout adapts properly
✓ Buttons clickable (min 44px)
✓ Text readable
✓ No horizontal scroll
✓ Forms functional
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 11.2 - Tablet (768px)
```
Steps:
1. Set viewport to 768px
2. Test layout

Expected:
✓ Two-column layouts where applicable
✓ Tables scrollable horizontally
✓ Touch interactions work
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 11.3 - Desktop (1920px)
```
Steps:
1. Set viewport to 1920px
2. Check spacing

Expected:
✓ Content centered properly
✓ No excessive whitespace
✓ Max-width applied if needed
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 12: Performance

#### Test Case 12.1 - Initial Load
```
Steps:
1. Open DevTools Performance tab
2. Navigate to project page
3. Record performance

Expected:
✓ First Paint < 2s
✓ Largest Contentful Paint < 3s
✓ Cumulative Layout Shift < 0.1
✓ No long tasks (>50ms)
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 12.2 - Tab Switching
```
Steps:
1. Record performance when switching tabs
2. Measure time to interactive

Expected:
✓ Tab switch instant (no re-fetch)
✓ No re-renders of other tabs
✓ Smooth animation (60fps)
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 13: Error Scenarios

#### Test Case 13.1 - 401 Unauthorized
```
Steps:
1. Clear localStorage token
2. Try to perform action (add bug, etc.)

Expected:
✓ Caught as 401
✓ User redirected to login
✓ Session cleared
✓ Error message shown
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 13.2 - 404 Not Found
```
Steps:
1. Navigate using invalid project ID
2. Observe response

Expected:
✓ Error state displayed
✓ "Not found" message shown
✓ Back button available
✓ No console errors
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 13.3 - Network Timeout
```
Steps:
1. Slow network (DevTools)
2. Trigger long-running request
3. Wait for timeout

Expected:
✓ Timeout caught
✓ Retry button shown
✓ User not blocked
✓ Error message appropriate
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

### Phase 14: Accessibility

#### Test Case 14.1 - Keyboard Navigation
```
Steps:
1. Disable mouse
2. Tab through all interactive elements
3. Use Enter/Space for actions

Expected:
✓ All buttons accessible via Tab
✓ Visible focus indicators
✓ Logical tab order
✓ No keyboard traps
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

#### Test Case 14.2 - Screen Reader
```
Steps:
1. Enable screen reader (NVDA/JAWS)
2. Navigate page

Expected:
✓ All content announced
✓ Button labels clear
✓ Form labels associated
✓ Icons have aria-labels
✓ Status updates announced
```

**Status**: [ ] Pass / [ ] Fail / [ ] N/A

---

## Sign-Off

### Integration Lead Approval
- [ ] All critical tests passed
- [ ] No blocking issues
- [ ] Performance acceptable
- [ ] Accessibility compliant

**Name**: _______________
**Date**: _______________
**Sign-off**: [APPROVED] / [APPROVED WITH NOTES] / [REJECTED]

### QA Lead Approval
- [ ] Test cases complete
- [ ] Edge cases covered
- [ ] Documentation reviewed
- [ ] Ready for production

**Name**: _______________
**Date**: _______________
**Sign-off**: [APPROVED] / [APPROVED WITH NOTES] / [REJECTED]

---

## Known Issues & Workarounds

| Issue | Workaround | Priority | Status |
|-------|-----------|----------|--------|
| | | | |

---

## Deployment Notes

1. **Backup old ProjectPage**: Keep `pages/ProjectPage.jsx` as fallback
2. **Monitor server logs**: Check for API errors in first hour
3. **Gradual rollout**: Consider canary deployment to 10% of users
4. **Rollback plan**: Keep old route available for quick revert
5. **Team notification**: Alert support team of new UI location

---

**Version**: 1.0  
**Created**: 2026-03-12  
**Next Review**: After first production week
