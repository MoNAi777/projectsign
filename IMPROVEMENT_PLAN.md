# ProjectSign - Comprehensive Improvement Plan

## Current Status Summary
ProjectSign is a functional MVP but has critical gaps that need to be fixed before production use.

---

## PHASE 1: CRITICAL FIXES (Data Safety & Crashes)
**Goal: Ensure no data loss and no crashes**

### 1.1 Fix Form Edit/Delete (CRITICAL)
**Problem:** Users cannot edit or delete forms after creation
**Impact:** Mistakes cannot be corrected, test forms stuck forever

**Tasks:**
- [ ] Create form edit page: `/projects/[id]/forms/[formId]/edit`
- [ ] Create API endpoint: `PATCH /api/forms/[id]`
- [ ] Add delete form functionality (only if not signed)
- [ ] Add confirmation dialog before delete
- [ ] Add "Edit" button on form detail page (only if not signed)

**Files to create/modify:**
- `app/(dashboard)/projects/[id]/forms/[formId]/edit/page.tsx` (NEW)
- `app/api/forms/[id]/route.ts` (NEW)
- `app/(dashboard)/projects/[id]/forms/[formId]/page.tsx` (ADD delete button)

---

### 1.2 Fix Transaction Safety (CRITICAL)
**Problem:** Project + Contact creation not atomic - can create orphan data
**Impact:** Data inconsistency, lost contacts

**Tasks:**
- [ ] Wrap project+contact creation in single transaction
- [ ] Wrap form creation + status update in single transaction
- [ ] Add rollback on any failure
- [ ] Show proper error if partial failure

**Files to modify:**
- `app/(dashboard)/projects/new/page.tsx` - line 62-97
- `app/(dashboard)/projects/[id]/forms/new/work_approval/page.tsx` - line 98-115
- `app/(dashboard)/projects/[id]/forms/new/completion/page.tsx` - line 133-163

---

### 1.3 Fix Authorization/Security (CRITICAL)
**Problem:** Some queries don't verify user owns the data
**Impact:** Users could access other users' forms

**Tasks:**
- [ ] Add user verification to form detail page query
- [ ] Add user verification to all form-related operations
- [ ] Ensure RLS policies are properly configured in Supabase
- [ ] Add rate limiting to signature endpoint

**Files to modify:**
- `app/(dashboard)/projects/[id]/forms/[formId]/page.tsx` - line 30-39
- `middleware.ts` - add rate limiting

---

### 1.4 Add Server-Side Validation (CRITICAL)
**Problem:** API routes accept any data without validation
**Impact:** Malformed/malicious data could be stored

**Tasks:**
- [ ] Add Zod validation to POST /api/projects
- [ ] Add Zod validation to PATCH /api/projects/[id]
- [ ] Add Zod validation to POST /api/forms/[id]/send
- [ ] Add Zod validation to POST /api/sign/[token]
- [ ] Validate phone number format (Israeli format)

**Files to modify:**
- `app/api/projects/route.ts`
- `app/api/projects/[id]/route.ts`
- `app/api/forms/[id]/send/route.ts`
- `app/api/sign/[token]/route.ts`
- `lib/validations.ts` - add phone regex

---

## PHASE 2: CORE FUNCTIONALITY (Missing Features)

### 2.1 Implement Email Sending
**Problem:** Email button exists but doesn't send
**Impact:** Cannot send forms via email

**Tasks:**
- [ ] Set up Resend account and API key
- [ ] Create email template for form signing
- [ ] Implement sendEmail function in API
- [ ] Add RESEND_API_KEY to environment variables
- [ ] Test email delivery

**Files to modify:**
- `app/api/forms/[id]/send/route.ts` - line 75-84
- `.env.local` - add RESEND_API_KEY
- Create `lib/email.ts` (NEW)

---

### 2.2 Implement SMS Sending
**Problem:** SMS button exists but doesn't send
**Impact:** Cannot send forms via SMS

**Tasks:**
- [ ] Set up Twilio account (or alternative)
- [ ] Create SMS template for form signing
- [ ] Implement sendSMS function in API
- [ ] Add Twilio credentials to environment
- [ ] Test SMS delivery

**Files to modify:**
- `app/api/forms/[id]/send/route.ts` - line 86-95
- `.env.local` - add TWILIO_* keys
- Create `lib/sms.ts` (NEW)

---

### 2.3 Implement PDF Generation
**Problem:** PDF download button has no functionality
**Impact:** Cannot download/print signed documents

**Tasks:**
- [ ] Install PDF library (react-pdf or @react-pdf/renderer)
- [ ] Create PDF templates for each form type
- [ ] Create API endpoint for PDF generation
- [ ] Include signature in PDF
- [ ] Add download functionality to form detail page

**Files to create:**
- `lib/pdf.ts` (NEW)
- `app/api/forms/[id]/pdf/route.ts` (NEW)
- `components/pdf/QuotePDF.tsx` (NEW)
- `components/pdf/WorkApprovalPDF.tsx` (NEW)
- `components/pdf/CompletionPDF.tsx` (NEW)
- `components/pdf/PaymentPDF.tsx` (NEW)

---

### 2.4 Fix Password Reset Flow
**Problem:** Forgot password redirects to non-existent page
**Impact:** Users cannot reset their password

**Tasks:**
- [ ] Create reset password confirmation page
- [ ] Handle reset token from email
- [ ] Allow user to set new password
- [ ] Redirect to login after success

**Files to create:**
- `app/(auth)/reset-password/page.tsx` (NEW)

---

## PHASE 3: UX/UI IMPROVEMENTS

### 3.1 Add Proper Error Messages
**Problem:** Errors shown as generic Hebrew messages
**Impact:** Users don't know what went wrong

**Tasks:**
- [ ] Create error message constants file
- [ ] Map error types to specific Hebrew messages
- [ ] Show toast notifications for all errors
- [ ] Log detailed errors to console in development

**Files to create/modify:**
- `lib/errors.ts` (NEW)
- All form pages - update error handling

---

### 3.2 Add Loading States
**Problem:** Server pages have no loading indicators
**Impact:** Users think app is frozen

**Tasks:**
- [ ] Add loading.tsx to dashboard route
- [ ] Add loading.tsx to projects route
- [ ] Add loading.tsx to project detail route
- [ ] Add skeleton components for better UX
- [ ] Add Suspense boundaries where needed

**Files to create:**
- `app/(dashboard)/loading.tsx` (NEW)
- `app/(dashboard)/projects/loading.tsx` (NEW)
- `app/(dashboard)/projects/[id]/loading.tsx` (NEW)
- `components/shared/Skeleton.tsx` (NEW)

---

### 3.3 Fix Navigation & Back Buttons
**Problem:** Inconsistent navigation, dead ends after signing
**Impact:** Confusing user experience

**Tasks:**
- [ ] Add consistent back button to all pages
- [ ] Add breadcrumbs component
- [ ] Add navigation after signature success (close window option)
- [ ] Add mobile menu toggle for sidebar
- [ ] Fix sidebar responsive behavior

**Files to modify:**
- `components/layout/PageHeader.tsx` - add back button prop
- `app/sign/[token]/page.tsx` - add post-signature navigation
- `components/layout/Sidebar.tsx` - add mobile toggle
- `app/(dashboard)/layout.tsx` - add mobile menu state

---

### 3.4 Add Delete Confirmations
**Problem:** Delete buttons work but could use better UX
**Impact:** Accidental deletions possible

**Tasks:**
- [ ] Create reusable confirmation dialog component
- [ ] Use for project delete
- [ ] Use for form delete (new feature)
- [ ] Show what will be deleted (cascade info)

**Files to create/modify:**
- `components/shared/ConfirmDialog.tsx` (NEW)
- `app/(dashboard)/projects/[id]/edit/page.tsx`

---

### 3.5 Improve Mobile Responsiveness
**Problem:** Tables overflow, sidebar issues on mobile
**Impact:** Hebrew users on mobile have poor experience

**Tasks:**
- [ ] Fix quote items table for mobile (use cards instead)
- [ ] Make sidebar collapsible on mobile
- [ ] Test all forms on mobile viewport
- [ ] Fix RTL/LTR mixing issues
- [ ] Add viewport meta tag if missing

**Files to modify:**
- `app/(dashboard)/projects/[id]/forms/[formId]/page.tsx` - quote table
- `components/layout/Sidebar.tsx`
- `app/layout.tsx` - check meta tags

---

### 3.6 Add Search & Filter
**Problem:** Cannot find projects as list grows
**Impact:** Hard to manage many projects

**Tasks:**
- [ ] Add search input to projects page
- [ ] Add status filter dropdown
- [ ] Add date range filter
- [ ] Add pagination (20 projects per page)
- [ ] Save filter preferences

**Files to modify:**
- `app/(dashboard)/projects/page.tsx`
- Create `components/projects/ProjectFilters.tsx` (NEW)

---

## PHASE 4: NICE-TO-HAVE FEATURES

### 4.1 Export Functionality
- [ ] Export projects list to CSV
- [ ] Export single project with forms to PDF
- [ ] Batch download signed documents

### 4.2 Dashboard Improvements
- [ ] Add revenue metrics chart
- [ ] Add project status breakdown chart
- [ ] Add recent activity feed
- [ ] Quick actions panel

### 4.3 Workflow Validation
- [ ] Validate status transitions (can't skip steps)
- [ ] Show workflow progress indicator on project
- [ ] Warn if creating payment without completion

### 4.4 Batch Operations
- [ ] Select multiple projects
- [ ] Batch delete (with confirmation)
- [ ] Batch status change
- [ ] Batch export

### 4.5 Offline Support
- [ ] Add service worker
- [ ] Cache form data locally
- [ ] Sync when back online
- [ ] Show offline indicator

---

## IMPLEMENTATION ORDER

### Week 1: Critical Fixes
1. Form edit/delete functionality
2. Transaction safety
3. Authorization fixes
4. Server-side validation

### Week 2: Core Features
1. Email sending (Resend)
2. SMS sending (Twilio)
3. Password reset flow
4. Basic PDF generation

### Week 3: UX/UI
1. Error messages
2. Loading states
3. Navigation fixes
4. Mobile responsiveness

### Week 4: Polish
1. Search & filter
2. Delete confirmations
3. PDF templates polish
4. Testing & bug fixes

---

## TESTING CHECKLIST

### Before Each Deploy:
- [ ] Create new project with contact
- [ ] Create all 4 form types
- [ ] Send form via link
- [ ] Sign form on mobile
- [ ] Verify signature saved
- [ ] Edit project
- [ ] Delete project
- [ ] Login/logout flow
- [ ] Password reset flow

### Edge Cases to Test:
- [ ] Expired signing token
- [ ] Duplicate form submission
- [ ] Network loss during form creation
- [ ] Very long text in fields
- [ ] Special characters in Hebrew text
- [ ] Empty optional fields
- [ ] Maximum field lengths

---

## ENVIRONMENT VARIABLES NEEDED

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=

# To Add
RESEND_API_KEY=           # For email sending
TWILIO_ACCOUNT_SID=       # For SMS
TWILIO_AUTH_TOKEN=        # For SMS
TWILIO_PHONE_NUMBER=      # For SMS
```

---

## SUCCESS CRITERIA

The app is ready for production when:
1. All critical fixes implemented
2. Email and SMS sending work
3. PDF download works
4. No console errors
5. All forms work on mobile
6. Delete/edit forms works
7. No data loss scenarios
8. Users can recover from errors
