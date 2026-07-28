# Form Messages & Error Handling Guide

This guide explains how to implement consistent error and success messaging across all pages in Suqafuran.

## Overview

All pages with user input (forms, listings, verification, etc.) should display clear error and success messages. We provide reusable components and message constants to ensure consistency.

## Components

### 1. AlertMessage Component

Located at: `src/components/shared/AlertMessage.tsx`

A reusable alert component that displays error, success, warning, or info messages.

#### Types
- `success` - Green alert for successful operations
- `error` - Red alert for errors
- `warning` - Yellow alert for warnings
- `info` - Blue alert for informational messages

#### Basic Usage

```tsx
import { AlertMessage } from '@/components/shared/AlertMessage';
import { useState } from 'react';

export function MyForm() {
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  return (
    <div>
      {message.type && (
        <AlertMessage
          type={message.type}
          message={message.text}
          onClose={() => setMessage({ type: null, text: '' })}
        />
      )}

      {/* Form content */}
    </div>
  );
}
```

#### Advanced Usage

```tsx
<AlertMessage
  type="success"
  title="Profile Updated"
  message="Your profile has been updated successfully."
  autoClose={true}
  autoCloseDuration={3000}
  onClose={() => setSuccess('')}
/>
```

#### Props
- `type` - Alert type (success | error | warning | info)
- `message` - Alert message text
- `title` - (Optional) Alert title
- `onClose` - (Optional) Callback when alert is closed
- `autoClose` - (Optional) Auto-close alert after duration (default: false)
- `autoCloseDuration` - (Optional) Duration in ms before auto-close (default: 4000)

## Error Messages

Located at: `src/lib/errorMessages.ts`

Centralized error and success message constants for consistent messaging.

### Error Categories

#### AUTH - Authentication Errors
```tsx
import { ErrorMessages } from '@/lib/errorMessages';

// Usage
ErrorMessages.AUTH.INVALID_CREDENTIALS
ErrorMessages.AUTH.EMAIL_EXISTS
ErrorMessages.AUTH.PASSWORD_WEAK
```

#### PROFILE - Profile Update Errors
```tsx
ErrorMessages.PROFILE.UPDATE_FAILED
ErrorMessages.PROFILE.EMAIL_EXISTS
ErrorMessages.PROFILE.REQUIRED_FIELD('Full Name')
```

#### LISTING - Product Listing Errors
```tsx
ErrorMessages.LISTING.CREATE_FAILED
ErrorMessages.LISTING.INVALID_PRICE
ErrorMessages.LISTING.TITLE_TOO_SHORT
```

#### VERIFICATION - Account Verification Errors
```tsx
ErrorMessages.VERIFICATION.SUBMIT_FAILED
ErrorMessages.VERIFICATION.DOCUMENT_REQUIRED
```

#### PAYMENT - Payment Errors
```tsx
ErrorMessages.PAYMENT.FAILED
ErrorMessages.PAYMENT.INSUFFICIENT_FUNDS
```

#### SUCCESS - Success Messages
```tsx
import { SuccessMessages } from '@/lib/errorMessages';

SuccessMessages.PROFILE_UPDATED
SuccessMessages.LISTING_CREATED
SuccessMessages.VERIFICATION_SUBMITTED
```

## Implementation Pattern

### Step 1: Import Components
```tsx
import { AlertMessage } from '@/components/shared/AlertMessage';
import { ErrorMessages, SuccessMessages, getErrorMessage } from '@/lib/errorMessages';
import { useState } from 'react';
```

### Step 2: Create State
```tsx
const [alertMessage, setAlertMessage] = useState<{
  type: 'success' | 'error' | 'warning' | 'info' | null;
  text: string;
}>({ type: null, text: '' });

const [loading, setLoading] = useState(false);
```

### Step 3: Handle Form Submission
```tsx
const handleSubmit = async (formData: any) => {
  // Clear previous messages
  setAlertMessage({ type: null, text: '' });

  // Validate
  if (!formData.name) {
    setAlertMessage({
      type: 'error',
      text: ErrorMessages.PROFILE.REQUIRED_FIELD('Name'),
    });
    return;
  }

  try {
    setLoading(true);
    
    // Make API call
    await api.post('/endpoint', formData);

    // Show success
    setAlertMessage({
      type: 'success',
      text: SuccessMessages.PROFILE_UPDATED,
    });

    // Auto-hide success message
    setTimeout(() => {
      setAlertMessage({ type: null, text: '' });
    }, 3000);

  } catch (error: any) {
    setAlertMessage({
      type: 'error',
      text: getErrorMessage(error, ErrorMessages.GENERIC.PLEASE_TRY_AGAIN),
    });
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Display Alert
```tsx
return (
  <div className="space-y-6">
    {alertMessage.type && (
      <AlertMessage
        type={alertMessage.type}
        message={alertMessage.text}
        onClose={() => setAlertMessage({ type: null, text: '' })}
        autoClose={alertMessage.type === 'success'}
        autoCloseDuration={3000}
      />
    )}

    {/* Form content */}
  </div>
);
```

## Common Patterns

### Profile Update Form
```tsx
const handleSaveProfile = async () => {
  setAlertMessage({ type: null, text: '' });

  if (!editData.name.trim()) {
    setAlertMessage({
      type: 'error',
      text: ErrorMessages.PROFILE.REQUIRED_FIELD('Full Name'),
    });
    return;
  }

  try {
    setLoading(true);
    await authService.updateProfile(editData);
    setAlertMessage({
      type: 'success',
      text: SuccessMessages.PROFILE_UPDATED,
    });
  } catch (error) {
    setAlertMessage({
      type: 'error',
      text: getErrorMessage(error, ErrorMessages.PROFILE.UPDATE_FAILED),
    });
  } finally {
    setLoading(false);
  }
};
```

### Listing Creation
```tsx
const handleCreateListing = async () => {
  setAlertMessage({ type: null, text: '' });

  if (!title.trim()) {
    setAlertMessage({
      type: 'error',
      text: ErrorMessages.LISTING.TITLE_TOO_SHORT,
    });
    return;
  }

  if (!images.length) {
    setAlertMessage({
      type: 'error',
      text: ErrorMessages.LISTING.IMAGE_REQUIRED,
    });
    return;
  }

  try {
    setLoading(true);
    await api.post('/listings', { title, images, /* ... */ });
    setAlertMessage({
      type: 'success',
      text: SuccessMessages.LISTING_CREATED,
    });
  } catch (error) {
    setAlertMessage({
      type: 'error',
      text: getErrorMessage(error, ErrorMessages.LISTING.CREATE_FAILED),
    });
  } finally {
    setLoading(false);
  }
};
```

### Verification Submission
```tsx
const handleSubmitVerification = async () => {
  setAlertMessage({ type: null, text: '' });

  if (!documents.length) {
    setAlertMessage({
      type: 'error',
      text: ErrorMessages.VERIFICATION.DOCUMENT_REQUIRED,
    });
    return;
  }

  try {
    setLoading(true);
    await api.post('/verification', { documents });
    setAlertMessage({
      type: 'success',
      text: SuccessMessages.VERIFICATION_SUBMITTED,
    });
  } catch (error) {
    setAlertMessage({
      type: 'error',
      text: getErrorMessage(error, ErrorMessages.VERIFICATION.SUBMIT_FAILED),
    });
  } finally {
    setLoading(false);
  }
};
```

## Pages to Update

Priority pages that need error/success messaging:

### High Priority (User-Facing Forms)
- [ ] Listing creation/editing (`/sell` or product creation)
- [ ] Account verification (`/seller-dashboard/verification`)
- [ ] Profile editing (`/account` - already done)
- [ ] Password reset (`/reset-password`)
- [ ] Contact forms

### Medium Priority (Admin/Seller Forms)
- [ ] Seller dashboard forms
- [ ] Admin moderation actions
- [ ] Shop settings
- [ ] Payment management

### Lower Priority
- [ ] Filter/search functionality
- [ ] Export operations
- [ ] Bulk actions

## Best Practices

1. **Always validate before submit** - Show validation errors immediately
2. **Use specific error messages** - Tell users exactly what went wrong
3. **Clear on success** - Auto-hide success messages after 3 seconds
4. **Keep it concise** - One line error messages when possible
5. **Use consistent wording** - Refer to `ErrorMessages` and `SuccessMessages`
6. **Handle network errors** - Always catch and display network issues
7. **Disable submit during loading** - Prevent double submissions
8. **Clear messages on retry** - Clear previous message before new attempt

## Testing

Test error/success messaging by:
1. Submitting empty form → validation error
2. Duplicate email → "email exists" error
3. Network error → network error message
4. Success → auto-hide after 3 seconds
5. Manual close → alert disappears

## Future Enhancements

- Toast notifications for alerts
- Sound notifications for critical alerts
- Message history/log
- Undo functionality for reversible actions
- Localization support
